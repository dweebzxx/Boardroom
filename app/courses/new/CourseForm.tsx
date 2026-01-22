'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { createCourse, processIngestionNow } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

interface UploadFileState {
  file: File;
  error?: string;
}

export function CourseForm() {
  const [title, setTitle] = useState('');
  const [semester, setSemester] = useState('');
  const [professor, setProfessor] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<UploadFileState[]>([]);
  const [result, setResult] = useState<Awaited<ReturnType<typeof createCourse>> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isProcessing, startProcessing] = useTransition();

  const hasProcessingJobs = useMemo(
    () => result?.documents.some((doc) => doc.ingestionJobId) ?? false,
    [result]
  );

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    const nextFiles = selected.map((file) => {
      if (file.type !== 'application/pdf') {
        return { file, error: 'Only PDF files are supported.' };
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return { file, error: 'File exceeds 20MB limit.' };
      }
      return { file };
    });

    setFiles(nextFiles);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const hasInvalidFiles = files.some((item) => item.error);
    if (hasInvalidFiles) {
      setError('Please remove unsupported files before continuing.');
      return;
    }

    if (!files.length) {
      setError('Please upload at least one syllabus PDF.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('semester', semester);
    formData.append('professor', professor);
    formData.append('notes', notes);
    files.forEach((item) => formData.append('syllabus', item.file));

    startTransition(async () => {
      try {
        const response = await createCourse(formData);
        setResult(response);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create course.';
        setError(message);
      }
    });
  };

  const handleProcessIngestion = () => {
    if (!result) return;
    const jobIds = result.documents
      .map((doc) => doc.ingestionJobId)
      .filter((jobId): jobId is string => Boolean(jobId));
    if (!jobIds.length) return;

    startProcessing(async () => {
      try {
        await processIngestionNow(jobIds);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to trigger ingestion.';
        setError(message);
      }
    });
  };

  return (
    <Card className="bg-vintage-slate-blue/10 border-vintage-slate-blue/20">
      <CardHeader>
        <CardTitle className="text-vintage-cream font-serif text-xl">
          Add a New Course
        </CardTitle>
        <p className="text-sm text-vintage-cream/60">
          Upload syllabus PDFs to kick off ingestion for your boardroom context.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-vintage-cream">
                Course title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Marketing Strategy"
                className="bg-vintage-charcoal/50 border-vintage-slate-blue/30 text-vintage-cream"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester" className="text-vintage-cream">
                Semester
              </Label>
              <Input
                id="semester"
                value={semester}
                onChange={(event) => setSemester(event.target.value)}
                placeholder="Fall 2025"
                className="bg-vintage-charcoal/50 border-vintage-slate-blue/30 text-vintage-cream"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="professor" className="text-vintage-cream">
                Professor
              </Label>
              <Input
                id="professor"
                value={professor}
                onChange={(event) => setProfessor(event.target.value)}
                placeholder="Professor Chen"
                className="bg-vintage-charcoal/50 border-vintage-slate-blue/30 text-vintage-cream"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-vintage-cream">
                Notes (optional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Important course context or expectations..."
                className="min-h-[90px] bg-vintage-charcoal/50 border-vintage-slate-blue/30 text-vintage-cream"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="syllabus" className="text-vintage-cream">
              Syllabus PDFs
            </Label>
            <Input
              id="syllabus"
              type="file"
              multiple
              accept="application/pdf"
              onChange={handleFilesChange}
              className="bg-vintage-charcoal/50 border-vintage-slate-blue/30 text-vintage-cream file:text-vintage-cream"
              required
            />
            {files.length > 0 && (
              <ul className="text-xs text-vintage-cream/60 space-y-1">
                {files.map((item) => (
                  <li key={item.file.name}>
                    {item.file.name} ({Math.ceil(item.file.size / 1024)} KB)
                    {item.error && (
                      <span className="text-vintage-orange"> — {item.error}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <div className="text-sm text-vintage-orange bg-vintage-orange/10 border border-vintage-orange/30 rounded px-3 py-2">
              {error}
            </div>
          )}

          {result ? (
            <div className="space-y-3 border border-vintage-slate-blue/30 rounded-lg p-4 bg-vintage-charcoal/50">
              <p className="text-sm text-vintage-cream">
                Course created. {result.documents.length} document(s) uploaded.
              </p>
              <ul className="text-xs text-vintage-cream/60 space-y-1">
                {result.documents.map((doc) => (
                  <li key={doc.documentId}>
                    {doc.filename} — {doc.status}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                {hasProcessingJobs && (
                  <Button
                    type="button"
                    onClick={handleProcessIngestion}
                    disabled={isProcessing}
                    className="bg-vintage-mustard/80 hover:bg-vintage-mustard text-vintage-charcoal"
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Triggering...
                      </span>
                    ) : (
                      'Process ingestion now'
                    )}
                  </Button>
                )}
                <Button
                  asChild
                  variant="outline"
                  className="border-vintage-slate-blue/40 text-vintage-cream"
                >
                  <Link href="/">Back to dashboard</Link>
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="submit"
              disabled={isPending}
              className="bg-vintage-mustard/80 hover:bg-vintage-mustard text-vintage-charcoal"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating course...
                </span>
              ) : (
                'Create course'
              )}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
