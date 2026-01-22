import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

export type IngestionJobStatus = 'queued' | 'processing' | 'complete' | 'failed';

export const getIngestionJob = async (
  supabase: SupabaseClient<Database>,
  jobId: string
) => {
  const { data, error } = await supabase
    .from('ingestion_jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const updateIngestionJobStatus = async (
  supabase: SupabaseClient<Database>,
  jobId: string,
  status: IngestionJobStatus,
  errorMessage?: string | null
) => {
  const updates: Record<string, string | null> = {
    status,
    error_message: errorMessage ?? null,
  };

  if (status === 'processing') {
    updates.started_at = new Date().toISOString();
  }

  if (status === 'complete' || status === 'failed') {
    updates.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('ingestion_jobs')
    .update(updates)
    .eq('id', jobId);

  if (error) throw error;
};

export const markJobProcessing = (
  supabase: SupabaseClient<Database>,
  jobId: string
) => updateIngestionJobStatus(supabase, jobId, 'processing');

export const markJobComplete = (
  supabase: SupabaseClient<Database>,
  jobId: string
) => updateIngestionJobStatus(supabase, jobId, 'complete');

export const markJobFailed = (
  supabase: SupabaseClient<Database>,
  jobId: string,
  errorMessage: string
) => updateIngestionJobStatus(supabase, jobId, 'failed', errorMessage);
