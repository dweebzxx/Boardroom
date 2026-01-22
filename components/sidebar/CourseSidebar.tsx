'use client';

import Link from 'next/link';
import { BookOpen, GraduationCap, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Course } from '@/lib/types';

interface CourseSidebarProps {
  courses: Course[];
  selectedCourseId: string | null;
  onSelectCourse: (courseId: string) => void;
}

export function CourseSidebar({
  courses,
  selectedCourseId,
  onSelectCourse,
}: CourseSidebarProps) {
  return (
    <aside className="h-full bg-vintage-slate-blue/10 border-r border-vintage-slate-blue/20 flex flex-col">
      <div className="p-6 border-b border-vintage-slate-blue/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-vintage-mustard/20 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-vintage-mustard" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-semibold text-vintage-cream">
              The Boardroom
            </h1>
            <p className="text-xs text-vintage-cream/60">Executive Dashboard</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-vintage py-4">
        <div className="px-4 mb-3">
          <span className="text-xs font-medium text-vintage-cream/50 uppercase tracking-wider">
            Courses
          </span>
        </div>

        <nav className="space-y-1 px-2">
          {courses.map((course) => {
            const isSelected = course.id === selectedCourseId;
            return (
              <button
                key={course.id}
                onClick={() => onSelectCourse(course.id)}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-lg transition-all duration-200',
                  'hover:bg-vintage-slate-blue/20',
                  'focus:outline-none focus:ring-2 focus:ring-vintage-mustard/50',
                  isSelected && 'bg-vintage-slate-blue/30 border-l-2 border-vintage-mustard'
                )}
              >
                <div className="flex items-start gap-3">
                  <BookOpen
                    className={cn(
                      'w-4 h-4 mt-0.5 flex-shrink-0',
                      isSelected ? 'text-vintage-mustard' : 'text-vintage-cream/50'
                    )}
                  />
                  <div className="min-w-0">
                    <p
                      className={cn(
                        'font-medium text-sm',
                        isSelected ? 'text-vintage-mustard' : 'text-vintage-cream'
                      )}
                    >
                      {course.code}
                    </p>
                    <p className="text-xs text-vintage-cream/60 truncate mt-0.5">
                      {course.name}
                    </p>
                    <p className="text-xs text-vintage-cream/40 mt-1">
                      {course.instructor}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-vintage-slate-blue/20">
        <Link
          href="/courses/new"
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-2.5',
            'text-sm text-vintage-cream/60 hover:text-vintage-cream',
            'border border-dashed border-vintage-slate-blue/30 rounded-lg',
            'hover:border-vintage-mustard/50 hover:bg-vintage-slate-blue/10',
            'transition-all duration-200'
          )}
        >
          <Plus className="w-4 h-4" />
          Add Course
        </Link>
      </div>
    </aside>
  );
}
