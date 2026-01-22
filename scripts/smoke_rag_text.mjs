import { createClient } from '@supabase/supabase-js';
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openAiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase env vars for smoke test.');
  process.exit(1);
}

if (!openAiKey) {
  console.error('Missing OPENAI_API_KEY for smoke test.');
  process.exit(1);
}

const embeddingModel = process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const { data: document } = await supabase
  .from('documents')
  .select('id, course_id')
  .limit(1)
  .maybeSingle();

if (!document) {
  console.log('No documents found, skipping retrieval smoke test.');
  process.exit(0);
}

const embeddingResponse = await embed({
  model: openai.embedding(embeddingModel),
  value: 'overview of the syllabus',
});

const { data: matches, error } = await supabase.rpc('match_documents', {
  query_embedding: embeddingResponse.embedding,
  match_threshold: 0.2,
  match_count: 5,
});

if (error) {
  console.error('Retrieval failed.');
  process.exit(1);
}

console.log(
  `Retrieved ${matches?.length ?? 0} chunks for document ${document.id}.`
);
