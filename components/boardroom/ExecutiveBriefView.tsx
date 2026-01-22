'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';

interface ExecutiveBriefViewProps {
  content: string | null;
  isGenerating: boolean;
  canGenerate: boolean;
  onGenerate: () => void;
}

const renderMarkdown = (markdown: string) => {
  const lines = markdown.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    const items = listItems.map((item, index) => (
      <li key={`${item}-${index}`}>{item}</li>
    ));
    elements.push(
      <ul className="list-disc list-inside text-sm text-vintage-cream/80 space-y-1" key={`list-${elements.length}`}>
        {items}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((line, index) => {
    if (line.startsWith('- ')) {
      listItems.push(line.slice(2));
      return;
    }

    flushList();

    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={`h2-${index}`} className="text-vintage-cream font-semibold text-base mt-4">
          {line.replace('## ', '')}
        </h3>
      );
      return;
    }

    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={`h1-${index}`} className="text-vintage-cream font-serif text-lg">
          {line.replace('# ', '')}
        </h2>
      );
      return;
    }

    if (line.trim().length === 0) {
      elements.push(<div key={`spacer-${index}`} className="h-2" />);
      return;
    }

    elements.push(
      <p key={`p-${index}`} className="text-sm text-vintage-cream/80">
        {line}
      </p>
    );
  });

  flushList();

  return elements;
};

export function ExecutiveBriefView({
  content,
  isGenerating,
  canGenerate,
  onGenerate,
}: ExecutiveBriefViewProps) {
  const rendered = useMemo(() => (content ? renderMarkdown(content) : null), [content]);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-vintage-cream font-serif text-lg">Executive Brief</p>
          <p className="text-xs text-vintage-cream/60">
            Generate a structured brief from the debate transcript.
          </p>
        </div>
        <Button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
          className="bg-vintage-mustard/80 hover:bg-vintage-mustard text-vintage-charcoal"
        >
          {isGenerating ? 'Generating...' : 'Generate Brief'}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-vintage pr-1">
        {content ? (
          <div className="space-y-2">{rendered}</div>
        ) : (
          <p className="text-sm text-vintage-cream/50">
            No executive brief yet. Generate one after a debate concludes.
          </p>
        )}
      </div>
    </div>
  );
}
