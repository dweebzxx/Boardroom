'use client';

import { z } from 'zod';
import type { ChatMessage } from '@/lib/types';

const citationSchema = z.object({
  chunk_id: z.string(),
  document_id: z.string(),
  page_number: z.number().nullable().optional(),
  quote: z.string().optional(),
});

const debateResponseSchema = z.object({
  debateId: z.string(),
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.string(),
      content: z.string(),
      citations: z.array(citationSchema).optional(),
      created_at: z.string().nullable().optional(),
    })
  ),
});

const normalizeRole = (role: string): ChatMessage['role'] => {
  const normalized = role.toLowerCase();
  if (normalized === 'analyst' || normalized === 'strategist' || normalized === 'professor') {
    return normalized;
  }
  if (normalized === 'ceo') {
    return 'ceo';
  }
  return 'system';
};

export async function runDebateTurn(params: {
  courseId: string;
  debateId?: string | null;
  userPrompt: string;
}) {
  const response = await fetch('/api/debate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      courseId: params.courseId,
      debateId: params.debateId ?? undefined,
      userPrompt: params.userPrompt,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to run debate turn.');
  }

  const payload = debateResponseSchema.parse(await response.json());
  const messages: ChatMessage[] = payload.messages.map((message) => ({
    id: message.id,
    role: normalizeRole(message.role),
    content: message.content,
    citations: message.citations ?? [],
  }));

  return { debateId: payload.debateId, messages };
}
