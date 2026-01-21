'use client';

import { ScheduleCard } from './ScheduleCard';
import { MemoWorkspace } from './MemoWorkspace';
import type { ScheduleItem, Memo } from '@/lib/types';

interface ContextPanelProps {
  courseId: string;
  scheduleItems: ScheduleItem[];
  selectedTopic: string | null;
  onSelectTopic: (topic: string) => void;
  memo: Memo | null;
  onMemoUpdate: (memo: Memo) => void;
}

export function ContextPanel({
  courseId,
  scheduleItems,
  selectedTopic,
  onSelectTopic,
  memo,
  onMemoUpdate,
}: ContextPanelProps) {
  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-hidden">
      <div className="flex-shrink-0">
        <ScheduleCard
          items={scheduleItems}
          onSelectTopic={onSelectTopic}
          selectedTopic={selectedTopic}
        />
      </div>
      <div className="flex-1 min-h-0">
        <MemoWorkspace
          courseId={courseId}
          scheduleItems={scheduleItems}
          memo={memo}
          onMemoUpdate={onMemoUpdate}
        />
      </div>
    </div>
  );
}
