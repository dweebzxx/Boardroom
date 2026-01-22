import 'server-only';

import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { supabaseServer } from '@/lib/supabase/server';

const summarySchema = z.object({ summary: z.string() });
const decisionsSchema = z.object({ decisions: z.array(z.string()) });
const risksSchema = z.object({ risks: z.array(z.string()) });
const nextActionsSchema = z.object({ next_actions: z.array(z.string()) });

const parsedMessageSchema = z.object({
  answer: z.string(),
  citations: z
    .array(
      z.object({
        chunk_id: z.string(),
        document_id: z.string().optional(),
        page_number: z.number().nullable().optional(),
        quote: z.string().optional(),
      })
    )
    .optional(),
});

export interface ExecutiveBriefState {
  debateId: string;
  courseId: string;
  transcript: string;
  citations: Array<{
    chunk_id: string;
    document_id?: string;
    page_number?: number | null;
    quote?: string;
  }>;
  summary?: string;
  decisions?: string[];
  risks?: string[];
  nextActions?: string[];
  markdown?: string;
}

const parseMessageContent = (content: string) => {
  const parsed = parsedMessageSchema.safeParse(JSON.parse(content));
  if (parsed.success) {
    return parsed.data;
  }
  return { answer: content, citations: [] };
};

export const collectInputs = async (debateId: string): Promise<ExecutiveBriefState> => {
  const { data: debate, error: debateError } = await supabaseServer
    .from('debates')
    .select('id, course_id')
    .eq('id', debateId)
    .maybeSingle();

  if (debateError) throw debateError;
  if (!debate) {
    throw new Error('Debate not found.');
  }

  const { data: messages, error: messagesError } = await supabaseServer
    .from('debate_messages')
    .select('role, content, created_at')
    .eq('debate_id', debateId)
    .order('created_at', { ascending: true });

  if (messagesError) throw messagesError;

  const citations: ExecutiveBriefState['citations'] = [];
  const transcriptLines = (messages ?? []).map((message) => {
    const parsed = parseMessageContent(message.content);
    parsed.citations?.forEach((citation) => citations.push(citation));
    return `${message.role.toUpperCase()}: ${parsed.answer}`;
  });

  return {
    debateId,
    courseId: debate.course_id,
    transcript: transcriptLines.join('\n'),
    citations,
  };
};

export const synthesizeSummary = async (state: ExecutiveBriefState) => {
  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: summarySchema,
    temperature: 0,
    prompt: `Summarize the debate transcript in 3-5 sentences.\n\nTranscript:\n${state.transcript}`,
  });

  return { ...state, summary: result.object.summary };
};

export const extractDecisions = async (state: ExecutiveBriefState) => {
  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: decisionsSchema,
    temperature: 0,
    prompt: `Extract the key decisions implied by this debate. Return concise bullet points.\n\nTranscript:\n${state.transcript}`,
  });

  return { ...state, decisions: result.object.decisions };
};

export const extractRisks = async (state: ExecutiveBriefState) => {
  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: risksSchema,
    temperature: 0,
    prompt: `List the major risks or concerns discussed. Return concise bullet points.\n\nTranscript:\n${state.transcript}`,
  });

  return { ...state, risks: result.object.risks };
};

export const extractNextActions = async (state: ExecutiveBriefState) => {
  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: nextActionsSchema,
    temperature: 0,
    prompt: `List the next actions suggested by the debate. Return concise bullet points.\n\nTranscript:\n${state.transcript}`,
  });

  return { ...state, nextActions: result.object.next_actions };
};

const formatSources = (citations: ExecutiveBriefState['citations']) => {
  const unique = Array.from(
    new Map(citations.map((citation) => [citation.chunk_id, citation])).values()
  );

  if (unique.length === 0) {
    return ['- No cited sources available from this debate.'];
  }

  return unique.map((citation) => {
    const page = citation.page_number ? `p.${citation.page_number}` : 'page n/a';
    const quote = citation.quote ? ` — "${citation.quote}"` : '';
    return `- ${citation.chunk_id} (${page})${quote}`;
  });
};

export const finalizeMarkdown = async (state: ExecutiveBriefState) => {
  const markdown = [
    '# Executive Brief',
    '',
    '## Summary',
    state.summary ?? 'Summary unavailable.',
    '',
    '## Key Decisions',
    ...(state.decisions?.map((item) => `- ${item}`) ?? ['- None identified.']),
    '',
    '## Risks',
    ...(state.risks?.map((item) => `- ${item}`) ?? ['- None identified.']),
    '',
    '## Next Actions',
    ...(state.nextActions?.map((item) => `- ${item}`) ?? ['- None identified.']),
    '',
    '## Sources',
    ...formatSources(state.citations),
  ].join('\n');

  return { ...state, markdown };
};

export const runExecutiveBriefGraph = async (debateId: string) => {
  const collected = await collectInputs(debateId);
  const summarized = await synthesizeSummary(collected);
  const decisions = await extractDecisions(summarized);
  const risks = await extractRisks(decisions);
  const nextActions = await extractNextActions(risks);
  const finalized = await finalizeMarkdown(nextActions);

  return finalized;
};
