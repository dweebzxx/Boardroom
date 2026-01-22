'use server';

import { revalidatePath } from 'next/cache';
import { supabaseServer } from '@/lib/supabase/server';

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['application/pdf']);
const STORAGE_BUCKET = 'course_docs';

export interface CreateCourseResult {
  courseId: string;
  documents: Array<{
    documentId: string;
    ingestionJobId: string | null;
    filename: string;
    status: 'queued' | 'upload_failed' | 'ingestion_failed';
  }>;
}

const buildCourseCode = (title: string) => {
  const trimmed = title.trim();
  if (!trimmed) return 'COURSE';
  const words = trimmed.split(/\s+/).slice(0, 3);
  const code = words.map((word) => word.slice(0, 4).toUpperCase()).join(' ');
  return code || trimmed.slice(0, 12).toUpperCase();
};

const ensurePdfFile = (file: File) => {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(`Unsupported file type: ${file.type || 'unknown'}`);
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File exceeds ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit.`);
  }
};

export const createCourse = async (formData: FormData): Promise<CreateCourseResult> => {
  const title = String(formData.get('title') ?? '').trim();
  const semester = String(formData.get('semester') ?? '').trim();
  const professor = String(formData.get('professor') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();
  const files = formData.getAll('syllabus') as File[];

  if (!title || !semester || !professor) {
    throw new Error('Missing required course fields.');
  }

  if (!files.length) {
    throw new Error('Please upload at least one syllabus PDF.');
  }

  files.forEach(ensurePdfFile);

  const { data: course, error: courseError } = await supabaseServer
    .from('courses')
    .insert({
      code: buildCourseCode(title),
      name: title,
      instructor: professor,
      term: semester,
    })
    .select('id')
    .single();

  if (courseError) throw courseError;

  const results: CreateCourseResult['documents'] = [];

  for (const file of files) {
    const documentId = crypto.randomUUID();
    const storagePath = `courses/${course.id}/${documentId}.pdf`;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const { error: uploadError } = await supabaseServer.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, arrayBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: document, error: documentError } = await supabaseServer
        .from('documents')
        .insert({
          id: documentId,
          course_id: course.id,
          title: file.name,
          source: 'syllabus',
          storage_path: storagePath,
          metadata: {
            filename: file.name,
            mime_type: file.type,
            status: 'uploaded',
            notes: notes || null,
            size_bytes: file.size,
          },
        })
        .select('id')
        .single();

      if (documentError) {
        await supabaseServer.storage.from(STORAGE_BUCKET).remove([storagePath]);
        throw documentError;
      }

      const { data: job, error: jobError } = await supabaseServer
        .from('ingestion_jobs')
        .insert({
          document_id: document.id,
          status: 'queued',
        })
        .select('id')
        .single();

      if (jobError) {
        await supabaseServer
          .from('documents')
          .update({
            metadata: {
              filename: file.name,
              mime_type: file.type,
              status: 'ingestion_failed',
              notes: notes || null,
              size_bytes: file.size,
            },
          })
          .eq('id', document.id);
        results.push({
          documentId: document.id,
          ingestionJobId: null,
          filename: file.name,
          status: 'ingestion_failed',
        });
        continue;
      }

      results.push({
        documentId: document.id,
        ingestionJobId: job.id,
        filename: file.name,
        status: 'queued',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      await supabaseServer.from('documents').insert({
        id: documentId,
        course_id: course.id,
        title: file.name,
        source: 'syllabus',
        storage_path: storagePath,
        metadata: {
          filename: file.name,
          mime_type: file.type,
          status: 'upload_failed',
          error_message: message,
          notes: notes || null,
          size_bytes: file.size,
        },
      });

      results.push({
        documentId,
        ingestionJobId: null,
        filename: file.name,
        status: 'upload_failed',
      });
    }
  }

  revalidatePath('/');

  return {
    courseId: course.id,
    documents: results,
  };
};

export const processIngestionNow = async (jobIds: string[]) => {
  const secret = process.env.INGESTION_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('Missing ingestion secret.');
  }

  if (!jobIds.length) return;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  await Promise.all(
    jobIds.map((jobId) =>
      fetch(`${baseUrl}/api/ingest/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ingestion-token': secret,
        },
        body: JSON.stringify({ jobId }),
        cache: 'no-store',
      })
    )
  );
};
