# Boardroom

## Overview
Boardroom is an AI project built with:
* Next.js / React
* Supabase
* Tailwind CSS
* TypeScript

## Components
* Agent Avatars
* Debate Engine
* Context Panel

## Local setup
* Copy `.env.example` to `.env.local` and fill in values for your Supabase project.
* Follow the Supabase setup guide in `docs/SUPABASE_SETUP.md` to apply migrations and set up storage buckets.

## RAG ingestion workflow
1. Upload a PDF to the `course_docs` bucket and create a `documents` row with `storage_path` pointing to the file path (optionally set `metadata.bucket` if using a different bucket).
2. Insert an `ingestion_jobs` row with `status = 'queued'` and `document_id` set to the uploaded document.
3. Trigger processing with the internal endpoint:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-ingestion-token: $INGESTION_WEBHOOK_SECRET" \
  -d '{"jobId":"<job-uuid>"}' \
  http://localhost:3000/api/ingest/process
```

The ingestion pipeline uses `OPENAI_API_KEY` (and optional `OPENAI_EMBEDDING_MODEL`) to embed chunked text, stores chunks in `document_chunks`, and updates `documents.metadata.ingestion_progress` as it runs.

## Development
1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

Note: `npm run build` (and `npm run test:build`) require outbound network access because the app uses `next/font/google`.

3. Visit `http://localhost:3000` to view the app.

## Testing
Run the standard checks:

```bash
npm run test
```

Run a build locally (requires full environment variables):

```bash
npm run test:build
```
