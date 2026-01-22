# Supabase setup

Before running migrations, ensure your `.env.local` contains the Supabase connection values listed in `.env.example`.

## Storage access model

- Buckets are configured for public read access to support lightweight MVP viewing.
- Inserts are restricted to authenticated users with paths scoped to `courses/` prefixes, while server-side flows using the service role key bypass RLS.
- The Add Course flow uploads PDFs via a server action using the service role client, so client-side anonymous uploads are not required.

## Apply migrations locally

1. Install the Supabase CLI.
2. From the repo root, start Supabase and apply migrations:

```bash
supabase start
supabase db reset
```

This applies all SQL in `supabase/migrations/`, including the boardroom schema from `supabase/001_boardroom_schema.sql` and storage bucket provisioning.

## Storage buckets

The migrations create two buckets:

- `course_docs` for raw course PDFs
- `course_doc_images` for future vision pipeline assets

Bucket policies are set to allow public reads for MVP workflows; inserts require authenticated users and are path-scoped to `courses/`.

## Storage path conventions

Course syllabus PDFs are uploaded to:

```
course_docs/courses/{courseId}/{documentId}.pdf
```

This path is stored in the `documents.storage_path` column for ingestion.

Vision page images are stored at:

```
course_doc_images/courses/{courseId}/{documentId}/pages/{page}.png
```
