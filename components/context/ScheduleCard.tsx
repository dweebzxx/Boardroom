'use client';

import { Calendar, Clock, Users, FileText, AlertTriangle, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScheduleItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, formatDistanceToNow, parseISO, isAfter, isBefore, addDays } from 'date-fns';

interface ScheduleCardProps {
  items: ScheduleItem[];
  onSelectTopic: (topic: string) => void;
  selectedTopic: string | null;
}

function groupByDate(items: ScheduleItem[]): Record<string, ScheduleItem[]> {
  return items.reduce((acc, item) => {
    const dateKey = item.date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, ScheduleItem[]>);
}

function getRelativeDate(dateStr: string): string {
  const date = parseISO(dateStr);
  const now = new Date();

  if (isBefore(date, now)) {
    return 'Past due';
  }

  if (isBefore(date, addDays(now, 7))) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  return formatDistanceToNow(date, { addSuffix: true });
}

function isUrgent(dateStr: string): boolean {
  const date = parseISO(dateStr);
  const now = new Date();
  return isBefore(date, addDays(now, 3)) && isAfter(date, now);
}

function isPastDue(dateStr: string): boolean {
  const date = parseISO(dateStr);
  return isBefore(date, new Date());
}

export function ScheduleCard({ items, onSelectTopic, selectedTopic }: ScheduleCardProps) {
  const grouped = groupByDate(items);
  const sortedDates = Object.keys(grouped).sort();

  return (
    <Card className="bg-vintage-slate-blue/10 border-vintage-slate-blue/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-vintage-cream font-serif">
          <Calendar className="w-5 h-5 text-vintage-mustard" />
          Course Schedule & Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[300px] overflow-y-auto scrollbar-vintage pr-2">
        {sortedDates.length === 0 ? (
          <p className="text-sm text-vintage-cream/50 text-center py-8">
            No schedule items found
          </p>
        ) : (
          <div className="space-y-4">
            {sortedDates.map((dateKey) => {
              const dateItems = grouped[dateKey];
              const formattedDate = format(parseISO(dateKey), 'EEE MMM d, yyyy');
              const relativeDate = getRelativeDate(dateKey);
              const urgent = isUrgent(dateKey);
              const pastDue = isPastDue(dateKey);

              return (
                <div key={dateKey}>
                  <div className="flex items-center justify-between mb-2 sticky top-0 bg-vintage-charcoal/95 py-1 -mx-1 px-1">
                    <span className="text-xs font-medium text-vintage-cream/70">
                      {formattedDate}
                    </span>
                    <span
                      className={cn(
                        'text-xs',
                        pastDue && 'text-vintage-red',
                        urgent && !pastDue && 'text-vintage-mustard',
                        !urgent && !pastDue && 'text-vintage-cream/50'
                      )}
                    >
                      {relativeDate}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {dateItems.map((item) => {
                      const isQuiz = item.type === 'Quiz';
                      const isSelected = selectedTopic === item.title;

                      return (
                        <button
                          key={item.id}
                          onClick={() => onSelectTopic(item.title)}
                          className={cn(
                            'w-full text-left p-3 rounded-lg transition-all duration-200',
                            'border hover:border-vintage-mustard/50',
                            'group relative',
                            isSelected
                              ? 'bg-vintage-mustard/20 border-vintage-mustard'
                              : 'bg-vintage-charcoal/50 border-vintage-slate-blue/20',
                            item.is_major && 'ring-1 ring-vintage-red/30'
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              {item.is_major ? (
                                <AlertTriangle className="w-4 h-4 text-vintage-red mt-0.5 flex-shrink-0" />
                              ) : isQuiz ? (
                                <FileText className="w-4 h-4 text-vintage-mustard mt-0.5 flex-shrink-0" />
                              ) : (
                                <Users className="w-4 h-4 text-vintage-sage mt-0.5 flex-shrink-0" />
                              )}
                              <div>
                                <p
                                  className={cn(
                                    'text-sm font-medium',
                                    item.is_major
                                      ? 'text-vintage-red'
                                      : isSelected
                                        ? 'text-vintage-mustard'
                                        : 'text-vintage-cream'
                                  )}
                                >
                                  {item.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span
                                    className={cn(
                                      'text-xs px-1.5 py-0.5 rounded',
                                      isQuiz
                                        ? 'bg-vintage-mustard/20 text-vintage-mustard'
                                        : 'bg-vintage-sage/20 text-vintage-sage'
                                    )}
                                  >
                                    {item.type}
                                  </span>
                                  <span className="text-xs text-vintage-cream/50 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {item.due_time}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div
                              className={cn(
                                'flex items-center gap-1 text-xs transition-opacity',
                                'opacity-0 group-hover:opacity-100',
                                isSelected ? 'text-vintage-mustard' : 'text-vintage-cream/60'
                              )}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              Debate
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
