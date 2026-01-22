import 'server-only';

import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { supabaseServer } from '@/lib/supabase/server';

const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';
const DEFAULT_MATCH_THRESHOLD = 0.2;
const DEFAULT_TOP_K = 5;

const getEmbeddingModel = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing required environment variable: OPENAI_API_KEY');
  }
  return process.env.OPENAI_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL;
};

export interface RetrieveContextParams {
  courseId?: string | null;
  query: string;
  topK?: number;
  includeVision?: boolean;
}

export interface RetrievedChunk {
  chunk_id: string;
  document_id: string;
  chunk_text: string;
  similarity: number;
  page_number: number | null;
  modality: 'text' | 'vision';
}

export const retrieveContext = async ({
  courseId,
  query,
  topK = DEFAULT_TOP_K,
  includeVision = true,
}: RetrieveContextParams): Promise<RetrievedChunk[]> => {
  if (!query.trim()) {
    return [];
  }

  const embeddingModel = getEmbeddingModel();
  const embeddingResponse = await embed({
    model: openai.embedding(embeddingModel),
    value: query,
  });

  let courseDocumentIds: Set<string> | null = null;
  if (courseId) {
    const { data, error } = await supabaseServer
      .from('documents')
      .select('id')
      .eq('course_id', courseId);

    if (error) throw error;
    courseDocumentIds = new Set((data ?? []).map((doc) => doc.id));
    if (courseDocumentIds.size === 0) {
      return [];
    }
  }

  const matchCount = Math.max(topK * 4, topK);
  const { data, error } = await supabaseServer.rpc('match_documents', {
    query_embedding: embeddingResponse.embedding,
    match_threshold: DEFAULT_MATCH_THRESHOLD,
    match_count: matchCount,
  });

  if (error) throw error;

  const filtered = (data ?? []).filter((row) =>
    courseDocumentIds ? courseDocumentIds.has(row.document_id) : true
  );

  const topMatches = filtered.slice(0, topK);
  if (topMatches.length === 0) return [];

  const { data: chunkRows, error: chunkError } = await supabaseServer
    .from('document_chunks')
    .select('id, metadata')
    .in(
      'id',
      topMatches.map((row) => row.id)
    );

  if (chunkError) throw chunkError;

  const metadataById = new Map(
    (chunkRows ?? []).map((row) => [
      row.id,
      row.metadata as { page_number?: number | null; modality?: 'text' | 'vision' },
    ])
  );

  const normalized = topMatches.map((row) => ({
    chunk_id: row.id,
    document_id: row.document_id,
    chunk_text: row.content,
    similarity: row.similarity,
    page_number: metadataById.get(row.id)?.page_number ?? null,
    modality: metadataById.get(row.id)?.modality ?? 'text',
  }));

  return includeVision ? normalized : normalized.filter((chunk) => chunk.modality === 'text');
};
