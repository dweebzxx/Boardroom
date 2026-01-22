import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { retrieveContext } from '@/lib/rag/retrieve';

const requestSchema = z.object({
  courseId: z.string().uuid(),
  assignmentName: z.string().min(1),
  assignmentDescription: z.string().optional(),
  notes: z.string().optional(),
});

const scaffoldSchema = z.object({
  thesis: z.string(),
  sections: z.array(
    z.object({
      title: z.string(),
      bullets: z.array(z.string()),
    })
  ),
  citations: z.array(
    z.object({
      chunk_id: z.string(),
    })
  ),
});

export async function POST(request: Request) {
  const payload = requestSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { courseId, assignmentName, assignmentDescription, notes } = payload.data;
  const query = `Assignment: ${assignmentName}\nDescription: ${assignmentDescription ?? 'N/A'}\nNotes: ${
    notes ?? 'N/A'
  }`;

  const chunks = await retrieveContext({ courseId, query, topK: 6 });
  const allowedChunkIds = new Set(chunks.map((chunk) => chunk.chunk_id));

  if (!chunks.length) {
    return NextResponse.json({
      scaffold: {
        thesis:
          'Insufficient source material to draft a scaffold. Please upload or reference additional course documents.',
        sections: [],
        citations: [],
      },
    });
  }

  const contextBlock = chunks
    .map(
      (chunk) =>
        `---\nchunk_id: ${chunk.chunk_id}\npage_number: ${chunk.page_number ?? 'n/a'}\ntext: ${
          chunk.chunk_text
        }\n---`
    )
    .join('\n');

  const systemPrompt = `You must produce JSON only that matches this schema:
{ "thesis": string, "sections": [{ "title": string, "bullets": string[] }], "citations": [{ "chunk_id": string }] }.
Only cite chunk_id values present in the context. Do not fabricate citations. If context is insufficient, set thesis to an explicit insufficiency statement and leave sections empty.`;

  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: scaffoldSchema,
    system: `${systemPrompt}\n\nContext:\n${contextBlock}`,
    prompt: `Assignment: ${assignmentName}\nDescription: ${assignmentDescription ?? 'N/A'}\nNotes: ${
      notes ?? 'N/A'
    }`,
  });

  const filteredCitations = result.object.citations.filter((citation) =>
    allowedChunkIds.has(citation.chunk_id)
  );

  const scaffold = {
    thesis:
      filteredCitations.length > 0
        ? result.object.thesis
        : 'Insufficient source material to draft a scaffold. Please upload or reference additional course documents.',
    sections: filteredCitations.length > 0 ? result.object.sections : [],
    citations: filteredCitations,
  };

  return NextResponse.json({ scaffold });
}
