import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { retrieveContext } from '@/lib/rag/retrieve';

const requestSchema = z.object({
  courseId: z.string().uuid(),
  debateId: z.string().uuid().optional(),
  userPrompt: z.string().min(1),
});

const citationSchema = z.object({
  chunk_id: z.string(),
  document_id: z.string(),
  page_number: z.number().nullable().optional(),
  modality: z.enum(['text', 'vision']).optional(),
  quote: z.string().min(1).max(200),
});

const responseSchema = z.object({
  answer: z.string().min(1),
  citations: z.array(citationSchema),
});

const roleSystemPrompt: Record<string, string> = {
  analyst:
    'You are The Analyst. Be skeptical, data-focused, and highlight risks and evidence gaps.',
  strategist:
    'You are The Strategist. Be persuasive, pragmatic, and focus on opportunity framing.',
  professor:
    'You are The Professor. Be rigorous, balanced, and emphasize testable hypotheses.',
};

const buildContextBlock = (
  chunks: Array<{
    chunk_id: string;
    document_id: string;
    page_number: number | null;
    chunk_text: string;
  }>
) =>
  chunks
    .map(
      (chunk) =>
        `---\nchunk_id: ${chunk.chunk_id}\ndocument_id: ${chunk.document_id}\npage_number: ${
          chunk.page_number ?? 'null'
        }\ntext: ${chunk.chunk_text}\n---`
    )
    .join('\n');

const normalizeCitations = (
  citations: z.infer<typeof citationSchema>[],
  allowedChunkIds: Set<string>
) => citations.filter((citation) => allowedChunkIds.has(citation.chunk_id));

const serializeMessage = (answer: string, citations: z.infer<typeof citationSchema>[]) =>
  JSON.stringify({ answer, citations });

export async function POST(request: Request) {
  const payload = requestSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { courseId, debateId, userPrompt } = payload.data;

  const { data: course, error: courseError } = await supabaseServer
    .from('courses')
    .select('id, name, instructor, term')
    .eq('id', courseId)
    .maybeSingle();

  if (courseError) {
    return NextResponse.json({ error: 'Failed to load course.' }, { status: 500 });
  }

  if (!course) {
    return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
  }

  let activeDebateId = debateId;
  if (!activeDebateId) {
    const { data: debate, error: debateError } = await supabaseServer
      .from('debates')
      .insert({
        course_id: courseId,
        topic: userPrompt,
      })
      .select('id')
      .single();

    if (debateError) {
      return NextResponse.json({ error: 'Failed to create debate.' }, { status: 500 });
    }

    activeDebateId = debate.id;
  }

  if (!activeDebateId) {
    return NextResponse.json({ error: 'Debate not initialized.' }, { status: 500 });
  }

  const debateIdValue = activeDebateId;

  await supabaseServer.from('debate_messages').insert({
    debate_id: debateIdValue,
    role: 'ceo',
    content: serializeMessage(userPrompt, []),
  });

  const query = `Course: ${course.name} (${course.term})\nInstructor: ${course.instructor}\nPrompt: ${userPrompt}`;
  const retrieved = await retrieveContext({ courseId, query, topK: 6 });
  const allowedChunkIds = new Set(retrieved.map((chunk) => chunk.chunk_id));
  const chunkTextById = new Map(retrieved.map((chunk) => [chunk.chunk_id, chunk.chunk_text]));
  const chunkMetaById = new Map(
    retrieved.map((chunk) => [
      chunk.chunk_id,
      { page_number: chunk.page_number, modality: chunk.modality, document_id: chunk.document_id },
    ])
  );
  const contextBlock = retrieved.length ? buildContextBlock(retrieved) : 'NO_CONTEXT';

  const baseSystemPrompt = `You must respond with JSON only, matching this schema: { "answer": string, "citations": [{ "chunk_id": string, "document_id": string, "page_number": number|null, "quote": string }] }.
Only cite from the provided context chunks. Every claim must be supported by citations. If there is insufficient context, say so and ask for more material. Never fabricate citations.`;

  const roles = ['analyst', 'strategist', 'professor'] as const;

  const responses = await Promise.all(
    roles.map(async (role) => {
      if (!retrieved.length) {
        return {
          role,
          answer:
            'I do not have enough supporting material in the provided documents to answer. Please upload or reference additional course materials.',
          citations: [],
        };
      }

      const result = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: responseSchema,
        system: `${baseSystemPrompt}\n${roleSystemPrompt[role]}\n\nContext:\n${contextBlock}`,
        prompt: `User prompt: ${userPrompt}`,
      });

      const filteredCitations = normalizeCitations(result.object.citations, allowedChunkIds).map(
        (citation) => ({
          ...citation,
          document_id: chunkMetaById.get(citation.chunk_id)?.document_id ?? citation.document_id,
          page_number: chunkMetaById.get(citation.chunk_id)?.page_number ?? citation.page_number ?? null,
          modality: chunkMetaById.get(citation.chunk_id)?.modality ?? 'text',
          quote:
            citation.quote?.slice(0, 200) ??
            chunkTextById.get(citation.chunk_id)?.slice(0, 200) ??
            'Quote unavailable.',
        })
      );

      const answer = filteredCitations.length
        ? result.object.answer
        : 'I do not have enough supporting material in the provided documents to answer. Please upload or reference additional course materials.';

      return {
        role,
        answer,
        citations: filteredCitations,
      };
    })
  );

  const messages = await Promise.all(
    responses.map(async (response) => {
      const { data: message, error } = await supabaseServer
        .from('debate_messages')
        .insert({
          debate_id: debateIdValue,
          role: response.role,
          content: serializeMessage(response.answer, response.citations),
        })
        .select('id, created_at')
        .single();

      if (error) {
        throw error;
      }

      return {
        id: message.id,
        role: response.role,
        content: response.answer,
        citations: response.citations,
        created_at: message.created_at,
      };
    })
  );

  return NextResponse.json({ debateId: activeDebateId, messages });
}
