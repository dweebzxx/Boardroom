'use client';

import { useState, useEffect, useCallback } from 'react';
import { CourseSidebar } from '@/components/sidebar/CourseSidebar';
import { ContextPanel } from '@/components/context/ContextPanel';
import { BoardroomPanel } from '@/components/boardroom/BoardroomPanel';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { ThemeToggle } from '@/components/theme-toggle';
import { getCourses, getScheduleItems, getExecutiveBrief } from '@/lib/queries';
import type { Course, ScheduleItem, ExecutiveBrief } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [executiveBrief, setExecutiveBrief] = useState<ExecutiveBrief | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await getCourses();
        setCourses(data);
        if (data.length > 0) {
          setSelectedCourseId(data[0].id);
        }
      } catch (error) {
        console.error('Failed to load courses:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadCourses();
  }, []);

  useEffect(() => {
    async function loadCourseData() {
      if (!selectedCourseId) return;

      try {
        const [items, briefData] = await Promise.all([
          getScheduleItems(selectedCourseId),
          getExecutiveBrief(selectedCourseId),
        ]);
        setScheduleItems(items);
        setExecutiveBrief(briefData);
        setSelectedTopic(null);
      } catch (error) {
        console.error('Failed to load course data:', error);
      }
    }
    loadCourseData();
  }, [selectedCourseId]);

  const handleSelectCourse = useCallback((courseId: string) => {
    setSelectedCourseId(courseId);
  }, []);

  const handleSelectTopic = useCallback((topic: string) => {
    setSelectedTopic(topic);
  }, []);

  const handleBriefUpdate = useCallback((updatedBrief: ExecutiveBrief) => {
    setExecutiveBrief(updatedBrief);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-vintage-charcoal">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-vintage-mustard animate-spin" />
          <p className="text-vintage-cream/60 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-vintage-charcoal overflow-hidden">
      <header className="flex-shrink-0 h-14 border-b border-vintage-slate-blue/20 flex items-center px-6 bg-vintage-charcoal/95">
        <div className="flex items-center gap-3">
          <span className="font-serif text-xl font-semibold text-vintage-cream">
            The Synthetic Boardroom
          </span>
          <span className="text-xs text-vintage-cream/40 px-2 py-0.5 bg-vintage-slate-blue/20 rounded">
            Executive Dashboard
          </span>
        </div>
        <div className="ml-auto flex items-center gap-4 text-sm text-vintage-cream/60">
          {selectedCourseId && (
            <span>{courses.find((c) => c.id === selectedCourseId)?.term}</span>
          )}
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 min-h-0">
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full"
          autoSaveId="boardroom-layout"
        >
          <ResizablePanel defaultSize={22} minSize={18} maxSize={30}>
            <CourseSidebar
              courses={courses}
              selectedCourseId={selectedCourseId}
              onSelectCourse={handleSelectCourse}
            />
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-vintage-slate-blue/20" />

          <ResizablePanel defaultSize={48} minSize={30}>
            {selectedCourseId ? (
              <BoardroomPanel topic={selectedTopic} courseId={selectedCourseId} />
            ) : (
              <div className="h-full border-l border-vintage-slate-blue/20 bg-vintage-slate-blue/10" />
            )}
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-vintage-slate-blue/20" />

          <ResizablePanel defaultSize={30} minSize={22}>
            {selectedCourseId ? (
              <ContextPanel
                courseId={selectedCourseId}
                scheduleItems={scheduleItems}
                selectedTopic={selectedTopic}
                onSelectTopic={handleSelectTopic}
                executiveBrief={executiveBrief}
                onExecutiveBriefUpdate={handleBriefUpdate}
              />
            ) : (
              <div className="h-full border-l border-vintage-slate-blue/20 bg-vintage-slate-blue/10" />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
