'use client';

import { ScheduleCard } from './ScheduleCard';
import { MemoWorkspace } from './MemoWorkspace';
import { AssignmentContext } from './AssignmentContext';
import type { ScheduleItem, ExecutiveBrief } from '@/lib/types';

interface ContextPanelProps {
  courseId: string;
  scheduleItems: ScheduleItem[];
  selectedTopic: string | null;
  onSelectTopic: (topic: string) => void;
  executiveBrief: ExecutiveBrief | null;
  onExecutiveBriefUpdate: (brief: ExecutiveBrief) => void;
}

export function ContextPanel({
  courseId,
  scheduleItems,
  selectedTopic,
  onSelectTopic,
  executiveBrief,
  onExecutiveBriefUpdate,
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
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-vintage pr-1">
        <div className="space-y-4">
          <AssignmentContext courseId={courseId} />
          <MemoWorkspace
            courseId={courseId}
            scheduleItems={scheduleItems}
            memo={executiveBrief}
            onMemoUpdate={onExecutiveBriefUpdate}
          />
        </div>
      </div>
    </div>
  );
}
