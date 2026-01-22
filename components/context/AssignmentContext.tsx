'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface ContextChunk {
  chunk_id: string;
  document_id: string;
  document_title: string;
  page_number: number | null;
  snippet: string;
  content: string;
}

interface ScaffoldSection {
  title: string;
  bullets: string[];
}

interface ScaffoldResponse {
  thesis: string;
  sections: ScaffoldSection[];
  citations: Array<{ chunk_id: string }>;
}

interface AssignmentContextProps {
  courseId: string;
}

export function AssignmentContext({ courseId }: AssignmentContextProps) {
  const [assignmentName, setAssignmentName] = useState('');
  const [assignmentDescription, setAssignmentDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [chunks, setChunks] = useState<ContextChunk[]>([]);
  const [expandedChunks, setExpandedChunks] = useState<Record<string, boolean>>({});
  const [scaffold, setScaffold] = useState<ScaffoldResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canQuery = assignmentName.trim().length > 0;

  useEffect(() => {
    if (!canQuery) {
      setChunks([]);
      return;
    }

    const timeout = setTimeout(() => {
      setIsLoading(true);
      setError(null);

      fetch('/api/assignments/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          assignmentName,
          assignmentDescription,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load context.');
          return res.json();
        })
        .then((data) => setChunks(data.chunks ?? []))
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to load context.');
        })
        .finally(() => setIsLoading(false));
    }, 500);

    return () => clearTimeout(timeout);
  }, [assignmentName, assignmentDescription, courseId, canQuery]);

  const citationsByChunkId = useMemo(() => {
    const map = new Set(scaffold?.citations.map((citation) => citation.chunk_id) ?? []);
    return map;
  }, [scaffold]);

  const handleToggleChunk = (chunkId: string) => {
    setExpandedChunks((prev) => ({ ...prev, [chunkId]: !prev[chunkId] }));
  };

  const handleGenerateScaffold = async () => {
    if (!canQuery) return;
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/assignments/scaffold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          assignmentName,
          assignmentDescription,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate scaffold.');
      }

      const data = await response.json();
      setScaffold(data.scaffold ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate scaffold.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-vintage-slate-blue/10 border-vintage-slate-blue/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-vintage-cream font-serif text-lg">
            Assignment Context
          </CardTitle>
          <p className="text-xs text-vintage-cream/60">
            Provide assignment details to pull the most relevant syllabus sources.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="assignmentName" className="text-vintage-cream">
              Assignment name
            </Label>
            <Input
              id="assignmentName"
              value={assignmentName}
              onChange={(event) => setAssignmentName(event.target.value)}
              placeholder="Market entry analysis"
              className="bg-vintage-charcoal/50 border-vintage-slate-blue/30 text-vintage-cream"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignmentDescription" className="text-vintage-cream">
              Description
            </Label>
            <Textarea
              id="assignmentDescription"
              value={assignmentDescription}
              onChange={(event) => setAssignmentDescription(event.target.value)}
              placeholder="Summarize the assignment prompt and requirements."
              className="min-h-[80px] bg-vintage-charcoal/50 border-vintage-slate-blue/30 text-vintage-cream"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignmentNotes" className="text-vintage-cream">
              Notes (optional)
            </Label>
            <Textarea
              id="assignmentNotes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Specific angle, constraints, or thesis ideas."
              className="min-h-[60px] bg-vintage-charcoal/50 border-vintage-slate-blue/30 text-vintage-cream"
            />
          </div>
          <Button
            type="button"
            onClick={handleGenerateScaffold}
            disabled={!canQuery || isGenerating}
            className="bg-vintage-mustard/80 hover:bg-vintage-mustard text-vintage-charcoal"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating scaffold...
              </span>
            ) : (
              'Generate draft scaffold'
            )}
          </Button>
          {error && (
            <div className="text-xs text-vintage-orange bg-vintage-orange/10 border border-vintage-orange/30 rounded px-3 py-2">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-vintage-slate-blue/10 border-vintage-slate-blue/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-vintage-cream font-serif text-lg">Top Sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-vintage-cream/60">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading context...
            </div>
          ) : chunks.length === 0 ? (
            <p className="text-xs text-vintage-cream/50">
              No sources yet. Enter assignment details to retrieve context.
            </p>
          ) : (
            chunks.map((chunk) => (
              <div
                key={chunk.chunk_id}
                className="border border-vintage-slate-blue/30 rounded-lg p-3 bg-vintage-charcoal/40"
              >
                <div className="flex items-center justify-between text-xs text-vintage-cream/60">
                  <div>
                    <span className="font-semibold text-vintage-cream">
                      {chunk.document_title}
                    </span>
                    {chunk.page_number !== null && (
                      <span className="ml-2 text-vintage-cream/40">
                        p.{chunk.page_number}
                      </span>
                    )}
                  </div>
                  {citationsByChunkId.has(chunk.chunk_id) && (
                    <span className="text-vintage-mustard">Used in scaffold</span>
                  )}
                </div>
                <p className="text-xs text-vintage-cream/70 mt-2">{chunk.snippet}...</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleChunk(chunk.chunk_id)}
                  className="text-xs text-vintage-cream/60 hover:text-vintage-cream"
                >
                  {expandedChunks[chunk.chunk_id] ? 'Hide' : 'View more'}
                </Button>
                {expandedChunks[chunk.chunk_id] && (
                  <p className="text-xs text-vintage-cream/70 mt-2 whitespace-pre-wrap">
                    {chunk.content}
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="bg-vintage-slate-blue/10 border-vintage-slate-blue/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-vintage-cream font-serif text-lg">Draft Scaffold</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!scaffold ? (
            <p className="text-xs text-vintage-cream/50">
              Generate a scaffold to see a structured outline here.
            </p>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-vintage-cream/40">
                  Thesis
                </p>
                <p className="text-sm text-vintage-cream mt-1">{scaffold.thesis}</p>
              </div>
              {scaffold.sections.map((section, index) => (
                <div key={`${section.title}-${index}`}>
                  <p className="text-xs uppercase tracking-widest text-vintage-cream/40">
                    {section.title}
                  </p>
                  <ul className="list-disc list-inside text-sm text-vintage-cream/80 mt-1 space-y-1">
                    {section.bullets.map((bullet, bulletIndex) => (
                      <li key={`${section.title}-${bulletIndex}`}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
              {scaffold.citations.length > 0 && (
                <div className="text-xs text-vintage-cream/50">
                  Cited chunks: {scaffold.citations.map((c) => c.chunk_id).join(', ')}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
