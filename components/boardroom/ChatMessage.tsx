'use client';

import { useMemo, useState } from 'react';
import { User, BarChart3, Lightbulb, GraduationCap, AlertCircle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType, Citation } from '@/lib/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

const AGENT_CONFIG: Record<
  string,
  { name: string; icon: typeof User; color: string; bgColor: string }
> = {
  analyst: {
    name: 'The Analyst',
    icon: BarChart3,
    color: '#005960',
    bgColor: 'bg-[#005960]/10',
  },
  strategist: {
    name: 'The Strategist',
    icon: Lightbulb,
    color: '#CC5500',
    bgColor: 'bg-[#CC5500]/10',
  },
  professor: {
    name: 'The Professor',
    icon: GraduationCap,
    color: '#43B3AE',
    bgColor: 'bg-[#43B3AE]/10',
  },
  ceo: {
    name: 'Josh (CEO)',
    icon: User,
    color: '#F4E3C1',
    bgColor: 'bg-[#F4E3C1]/5',
  },
  system: {
    name: 'System',
    icon: AlertCircle,
    color: '#F4E3C1',
    bgColor: 'bg-red-500/10',
  },
};

const formatCitationLabel = (citation: Citation, index: number) => {
  const page = citation.page_number ? `p.${citation.page_number}` : 'page n/a';
  return `Source ${index + 1} · ${page}`;
};

export function ChatMessage({ message }: ChatMessageProps) {
  const roleKey = (message.role || 'ceo').toLowerCase();
  const config = AGENT_CONFIG[roleKey] || AGENT_CONFIG.ceo;
  const Icon = config.icon;
  const isCeo = roleKey === 'ceo';

  const citations = useMemo(() => message.citations ?? [], [message.citations]);
  const [activeCitation, setActiveCitation] = useState<number | null>(null);

  const selectedQuote =
    activeCitation !== null ? citations[activeCitation]?.quote ?? null : null;

  return (
    <div
      className={cn(
        'flex gap-4 p-4 rounded-lg mb-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 border',
        config.bgColor,
        isCeo ? 'flex-row-reverse border-vintage-cream/10' : 'flex-row border-transparent'
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm',
          isCeo ? 'bg-vintage-charcoal' : 'bg-vintage-charcoal'
        )}
        style={{ borderColor: config.color, color: config.color }}
      >
        <Icon className="w-4 h-4" />
      </div>

      <div className={cn('flex flex-col gap-1 min-w-0 max-w-[85%]', isCeo ? 'items-end' : 'items-start')}>
        <span
          className="text-xs font-bold uppercase tracking-wider opacity-90"
          style={{ color: config.color }}
        >
          {config.name}
        </span>

        <div
          className={cn(
            'text-sm leading-relaxed text-vintage-cream whitespace-pre-wrap',
            isCeo ? 'text-right opacity-90' : 'text-left'
          )}
        >
          {message.content}
        </div>

        {citations.length > 0 && (
          <div className="mt-3 w-full">
            <div className="flex items-center gap-2 text-xs text-vintage-cream/50">
              <BookOpen className="w-3 h-3" />
              Sources
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {citations.map((citation, index) => (
                <button
                  key={`${citation.chunk_id}-${index}`}
                  type="button"
                  onClick={() =>
                    setActiveCitation(activeCitation === index ? null : index)
                  }
                  className={cn(
                    'text-xs px-2 py-1 rounded-full border transition',
                    activeCitation === index
                      ? 'border-vintage-mustard/70 text-vintage-mustard'
                      : 'border-vintage-slate-blue/30 text-vintage-cream/60'
                  )}
                >
                  {formatCitationLabel(citation, index)}
                </button>
              ))}
            </div>
            {selectedQuote && (
              <div className="mt-2 text-xs text-vintage-cream/70 border-l-2 border-vintage-slate-blue/40 pl-3">
                “{selectedQuote}”
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
