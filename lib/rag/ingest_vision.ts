import 'server-only';

import { promises as fs } from 'node:fs';
import { generateObject, embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '@/lib/supabase/database.types';
import { pdfToImages } from './pdf_to_images';

const DEFAULT_VISION_MODEL = 'gpt-4o-mini';
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_CONCURRENCY = 2;
const STORAGE_BUCKET = 'course_doc_images';

const extractionSchema = z.object({
  tables: z
    .array(
      z.object({
        title: z.string().optional(),
        rows: z.array(z.array(z.string())),
      })
    )
    .default([]),
  diagrams: z
    .array(
      z.object({
        description: z.string(),
      })
    )
    .default([]),
  key_points: z.array(z.string()).default([]),
});

const getVisionModel = () => process.env.OPENAI_VISION_MODEL ?? DEFAULT_VISION_MODEL;

const getEmbeddingModel = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing required environment variable: OPENAI_API_KEY');
  }
  return process.env.OPENAI_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL;
};

const serializeExtraction = (extraction: z.infer<typeof extractionSchema>) => {
  const lines: string[] = [];
  if (extraction.tables.length) {
    lines.push('Tables:');
    extraction.tables.forEach((table, index) => {
      lines.push(`- Table ${index + 1}${table.title ? ` (${table.title})` : ''}`);
      table.rows.forEach((row) => lines.push(`  - ${row.join(' | ')}`));
    });
  }
  if (extraction.diagrams.length) {
    lines.push('Diagrams:');
    extraction.diagrams.forEach((diagram, index) => {
      lines.push(`- Diagram ${index + 1}: ${diagram.description}`);
    });
  }
  if (extraction.key_points.length) {
    lines.push('Key Points:');
    extraction.key_points.forEach((point) => lines.push(`- ${point}`));
  }
  return lines.join('\n');
};

const getNextChunkIndex = async (
  supabase: SupabaseClient<Database>,
  documentId: string
) => {
  const { data, error } = await supabase
    .from('document_chunks')
    .select('chunk_index')
    .eq('document_id', documentId)
    .order('chunk_index', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data?.chunk_index ?? -1) + 1;
};

const runWithConcurrency = async <T>(
  items: T[],
  limit: number,
  handler: (item: T) => Promise<void>
) => {
  let index = 0;
  const workers = Array.from({ length: limit }).map(async () => {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      await handler(items[currentIndex]);
    }
  });
  await Promise.all(workers);
};

export interface VisionIngestOptions {
  supabase: SupabaseClient<Database>;
  courseId: string;
  documentId: string;
  pdfBytes: Uint8Array;
}

export const ingestVisionDocument = async ({
  supabase,
  courseId,
  documentId,
  pdfBytes,
}: VisionIngestOptions) => {
  const pages = await pdfToImages(pdfBytes);
  if (!pages.length) {
    return { inserted: 0 };
  }

  let nextChunkIndex = await getNextChunkIndex(supabase, documentId);
  let inserted = 0;

  await runWithConcurrency(pages, MAX_CONCURRENCY, async (page) => {
    const buffer = await fs.readFile(page.filePath);
    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      return;
    }

    const storagePath = `courses/${courseId}/${documentId}/pages/${page.pageNumber}.png`;
    await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, buffer, {
      contentType: 'image/png',
      upsert: true,
    });

    const result = await generateObject({
      model: openai(getVisionModel()),
      schema: extractionSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract tables, diagram descriptions, and key points from this syllabus page. Return structured data.',
            },
            {
              type: 'image',
              image: buffer,
              mediaType: 'image/png',
            },
          ],
        },
      ],
    });

    const text = serializeExtraction(result.object);
    if (!text) {
      return;
    }

    const embeddingResponse = await embed({
      model: openai.embedding(getEmbeddingModel()),
      value: text,
    });

    const { error } = await supabase.from('document_chunks').insert({
      document_id: documentId,
      chunk_index: nextChunkIndex,
      content: text,
      embedding: embeddingResponse.embedding,
      metadata: {
        modality: 'vision',
        page_number: page.pageNumber,
        image_path: storagePath,
      },
    });

    if (!error) {
      nextChunkIndex += 1;
      inserted += 1;
    }
  });

  return { inserted };
};
