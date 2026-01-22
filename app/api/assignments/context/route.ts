import { NextResponse } from 'next/server';
import { z } from 'zod';
import { retrieveContext } from '@/lib/rag/retrieve';
import { supabaseServer } from '@/lib/supabase/server';

const requestSchema = z.object({
  courseId: z.string().uuid(),
  assignmentName: z.string().min(1),
  assignmentDescription: z.string().optional(),
});

export async function POST(request: Request) {
  const payload = requestSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { courseId, assignmentName, assignmentDescription } = payload.data;
  const query = `Assignment: ${assignmentName}\nDescription: ${assignmentDescription ?? 'N/A'}`;

  const chunks = await retrieveContext({ courseId, query, topK: 5 });
  const documentIds = Array.from(new Set(chunks.map((chunk) => chunk.document_id)));

  const { data: documents, error } = await supabaseServer
    .from('documents')
    .select('id, title')
    .in('id', documentIds);

  if (error) {
    return NextResponse.json({ error: 'Failed to load documents.' }, { status: 500 });
  }

  const titleById = new Map((documents ?? []).map((doc) => [doc.id, doc.title]));

  const response = chunks.map((chunk) => ({
    chunk_id: chunk.chunk_id,
    document_id: chunk.document_id,
    document_title: titleById.get(chunk.document_id) ?? 'Untitled document',
    page_number: chunk.page_number,
    snippet: chunk.chunk_text.slice(0, 180),
    content: chunk.chunk_text,
  }));

  return NextResponse.json({ chunks: response });
}
