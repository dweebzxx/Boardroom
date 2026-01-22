import 'server-only';

import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const EMBEDDING_BATCH_SIZE = 50;
const MAX_RETRIES = 4;
const RETRY_BASE_MS = 500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getEmbeddingModel = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing required environment variable: OPENAI_API_KEY');
  }
  return process.env.OPENAI_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL;
};

const decodePdfText = (pdfBytes: Uint8Array) => {
  const decoder = new TextDecoder('latin1');
  return decoder.decode(pdfBytes);
};

const unescapePdfText = (value: string) =>
  value
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')');

const extractTextFromOperators = (source: string) => {
  const chunks: string[] = [];
  const tjMatches = Array.from(
    source.matchAll(/\(([^()]|\\\(|\\\))*\)\s*Tj/g)
  );
  for (const match of tjMatches) {
    const raw = match[0];
    const inner = raw.slice(1, raw.lastIndexOf(')'));
    chunks.push(unescapePdfText(inner));
  }

  const tjArrayMatches = Array.from(source.matchAll(/\[(.*?)\]\s*TJ/g));
  for (const match of tjArrayMatches) {
    const arrayContent = match[1] ?? '';
    const parts = arrayContent.match(/\(([^()]|\\\(|\\\))*\)/g) ?? [];
    const combined = parts
      .map((part: string) => part.slice(1, part.lastIndexOf(')')))
      .map(unescapePdfText)
      .join('');
    if (combined) {
      chunks.push(combined);
    }
  }

  return chunks.join(' ');
};

const extractPages = (pdfBytes: Uint8Array) => {
  const raw = decodePdfText(pdfBytes);
  const pageSections = raw.split(/\/Type\s*\/Page\b/).slice(1);
  if (pageSections.length === 0) {
    return null;
  }

  return pageSections.map((section, index) => ({
    pageNumber: index + 1,
    text: extractTextFromOperators(section),
  }));
};

const extractDocumentText = (pdfBytes: Uint8Array) => {
  const raw = decodePdfText(pdfBytes);
  return extractTextFromOperators(raw).trim();
};

const chunkText = (text: string) => {
  if (!text) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    const slice = text.slice(start, end).trim();
    if (slice) {
      chunks.push(slice);
    }
    if (end === text.length) break;
    start = Math.max(end - CHUNK_OVERLAP, 0);
  }

  return chunks;
};

const withRetry = async <T>(fn: () => Promise<T>) => {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt += 1;
      if (attempt > MAX_RETRIES) {
        throw error;
      }
      const delay = RETRY_BASE_MS * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
};

export interface IngestProgress {
  processedChunks: number;
  totalChunks: number;
}

export interface IngestPdfOptions {
  supabase: SupabaseClient<Database>;
  documentId: string;
  pdfBytes: Uint8Array;
  onProgress?: (progress: IngestProgress) => Promise<void> | void;
}

// PDF text extraction is best-effort without a full PDF parser. Some PDFs may
// yield empty text or lack reliable page mapping, in which case page_number is null.
export const ingestPdfDocument = async ({
  supabase,
  documentId,
  pdfBytes,
  onProgress,
}: IngestPdfOptions) => {
  const pages = extractPages(pdfBytes);
  const fallbackText = pages
    ? pages.map((page) => page.text).join('\n')
    : extractDocumentText(pdfBytes);

  const contentSegments = pages?.length
    ? pages
    : [{ pageNumber: null as number | null, text: fallbackText }];

  const entries: Array<{
    chunkText: string;
    pageNumber: number | null;
  }> = [];

  for (const segment of contentSegments) {
    const chunks = chunkText(segment.text);
    for (const chunk of chunks) {
      entries.push({ chunkText: chunk, pageNumber: segment.pageNumber });
    }
  }

  if (entries.length === 0) {
    return { inserted: 0 };
  }

  const embeddingModel = getEmbeddingModel();
  let processed = 0;
  let chunkIndex = 0;

  for (let i = 0; i < entries.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = entries.slice(i, i + EMBEDDING_BATCH_SIZE);
    const batchTexts = batch.map((entry) => entry.chunkText);

    const embeddingResponse = await withRetry(() =>
      embedMany({
        model: openai.embedding(embeddingModel),
        values: batchTexts,
      })
    );

    const rows = batch.map((entry, index) => ({
      document_id: documentId,
      chunk_index: chunkIndex + index,
      content: entry.chunkText,
      embedding: embeddingResponse.embeddings[index],
      metadata: {
        page_number: entry.pageNumber,
        modality: 'text',
      },
    }));

    const { error } = await withRetry(async () => {
      const response = await supabase.from('document_chunks').insert(rows);
      return response;
    });

    if (error) {
      throw error;
    }

    chunkIndex += batch.length;
    processed += batch.length;
    await onProgress?.({ processedChunks: processed, totalChunks: entries.length });
  }

  return { inserted: entries.length };
};
