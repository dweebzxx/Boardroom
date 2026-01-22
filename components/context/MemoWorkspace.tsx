'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileEdit, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ScheduleItem, ExecutiveBrief } from '@/lib/types';
import { saveExecutiveBrief } from '@/lib/queries';

interface MemoWorkspaceProps {
  courseId: string;
  scheduleItems: ScheduleItem[];
  memo: ExecutiveBrief | null;
  onMemoUpdate: (memo: ExecutiveBrief) => void;
}

export function MemoWorkspace({
  courseId,
  scheduleItems,
  memo,
  onMemoUpdate,
}: MemoWorkspaceProps) {
  const [content, setContent] = useState(memo?.content || '');
  const [topic, setTopic] = useState<string>(memo?.topic || '__none__');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(
    memo?.updated_at ? new Date(memo.updated_at) : null
  );

  useEffect(() => {
    setContent(memo?.content || '');
    setTopic(memo?.topic || '__none__');
    setLastSaved(memo?.updated_at ? new Date(memo.updated_at) : null);
  }, [memo]);

  const saveContent = useCallback(
    async (newContent: string, newTopic: string) => {
      if (!courseId) return;

      setIsSaving(true);
      const topicToSave = newTopic === '__none__' ? null : newTopic;
      try {
        const savedMemo = await saveExecutiveBrief(
          courseId,
          newContent,
          topicToSave,
          memo?.id
        );
        onMemoUpdate(savedMemo);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Failed to save executive brief:', error);
      } finally {
        setIsSaving(false);
      }
    },
    [courseId, memo?.id, onMemoUpdate]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const currentMemoTopic = memo?.topic || '__none__';
      if (content !== (memo?.content || '') || topic !== currentMemoTopic) {
        saveContent(content, topic);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [content, topic, memo?.content, memo?.topic, saveContent]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <Card className="bg-vintage-slate-blue/10 border-vintage-slate-blue/20 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-vintage-cream font-serif">
            <FileEdit className="w-5 h-5 text-vintage-mustard" />
            Executive Brief
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-vintage-cream/50">
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </>
            ) : lastSaved ? (
              <>
                <Check className="w-3 h-3 text-vintage-sage" />
                Saved
              </>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger className="bg-vintage-charcoal/50 border-vintage-slate-blue/30 text-vintage-cream">
            <SelectValue placeholder="Link to topic (optional)" />
          </SelectTrigger>
          <SelectContent className="bg-vintage-charcoal border-vintage-slate-blue/30">
            <SelectItem value="__none__" className="text-vintage-cream/70">
              No topic selected
            </SelectItem>
            {scheduleItems.map((item) => (
              <SelectItem
                key={item.id}
                value={item.title}
                className="text-vintage-cream"
              >
                {item.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Draft your executive brief here. Synthesize insights from the boardroom debate, outline key decisions, and document your strategic rationale..."
          className={cn(
            'flex-1 min-h-[150px] resize-none',
            'bg-vintage-charcoal/50 border-vintage-slate-blue/30',
            'text-vintage-cream placeholder:text-vintage-cream/30',
            'focus:border-vintage-mustard/50 focus:ring-vintage-mustard/20'
          )}
        />

        <div className="flex items-center justify-between text-xs text-vintage-cream/50">
          <span>
            {wordCount} words / {charCount} characters
          </span>
          {topic && topic !== '__none__' && (
            <span className="px-2 py-0.5 bg-vintage-mustard/20 text-vintage-mustard rounded">
              {topic}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
