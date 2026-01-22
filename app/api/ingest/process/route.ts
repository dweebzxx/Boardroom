import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { ingestPdfDocument } from '@/lib/rag/ingest_text';
import { ingestVisionDocument } from '@/lib/rag/ingest_vision';
import {
  getIngestionJob,
  markJobComplete,
  markJobFailed,
  markJobProcessing,
} from '@/lib/rag/jobs';

const isValidUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );

export async function POST(request: Request) {
  const secret = process.env.INGESTION_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'Missing ingestion secret' },
      { status: 500 }
    );
  }

  const headerToken = request.headers.get('x-ingestion-token');
  const bearerToken = request.headers
    .get('authorization')
    ?.replace(/^Bearer\s+/i, '');
  const token = headerToken ?? bearerToken;

  if (!token || token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: { jobId?: string } = {};
  try {
    payload = (await request.json()) as { jobId?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const jobId = payload.jobId;
  if (!jobId || typeof jobId !== 'string' || !isValidUuid(jobId)) {
    return NextResponse.json({ error: 'Invalid jobId' }, { status: 400 });
  }

  const job = await getIngestionJob(supabaseServer, jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (!job.document_id) {
    await markJobFailed(supabaseServer, jobId, 'Job missing document_id');
    return NextResponse.json({ error: 'Job missing document_id' }, { status: 400 });
  }

  await markJobProcessing(supabaseServer, jobId);

  try {
    const { data: document, error: docError } = await supabaseServer
      .from('documents')
      .select('id, course_id, storage_path, metadata')
      .eq('id', job.document_id)
      .maybeSingle();

    if (docError) throw docError;
    if (!document) {
      throw new Error('Document not found');
    }

    if (!document.storage_path) {
      throw new Error('Document storage_path is missing');
    }

    const metadata = document.metadata as { bucket?: string } | null;
    const bucket = metadata?.bucket ?? 'course_docs';

    const { data: fileData, error: storageError } = await supabaseServer.storage
      .from(bucket)
      .download(document.storage_path);

    if (storageError) throw storageError;
    if (!fileData) throw new Error('Failed to download document');

    const arrayBuffer = await fileData.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);

    await ingestPdfDocument({
      supabase: supabaseServer,
      documentId: document.id,
      pdfBytes,
      onProgress: async ({ processedChunks, totalChunks }) => {
        const baseMetadata: Record<string, unknown> =
          document.metadata && typeof document.metadata === 'object'
            ? (document.metadata as Record<string, unknown>)
            : {};
        const progressMetadata = {
          ...baseMetadata,
          ingestion_progress: {
            processed_chunks: processedChunks,
            total_chunks: totalChunks,
            updated_at: new Date().toISOString(),
          },
        };

        await supabaseServer
          .from('documents')
          .update({
            metadata: progressMetadata,
            updated_at: new Date().toISOString(),
          })
          .eq('id', document.id);
      },
    });

    if (document.course_id) {
      try {
        await ingestVisionDocument({
          supabase: supabaseServer,
          courseId: document.course_id,
          documentId: document.id,
          pdfBytes,
        });
      } catch {
        // Fail-soft: vision ingestion is optional.
      }
    }

    await markJobComplete(supabaseServer, jobId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await markJobFailed(supabaseServer, jobId, message);
    return NextResponse.json({ error: 'Ingestion failed' }, { status: 500 });
  }
}
