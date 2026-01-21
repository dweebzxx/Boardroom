'use client';

import { User, BarChart3, Lightbulb, GraduationCap, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/lib/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  // 1. Normalize role to lowercase (Fixes the "Analyst" vs "analyst" crash)
  const roleKey = (message.role || 'ceo').toLowerCase();

  // 2. Define the styling configuration for every possible agent
  const AGENT_CONFIG: Record<string, { name: string; icon: any; color: string; bgColor: string }> = {
    analyst: {
      name: 'The Analyst',
      icon: BarChart3,
      color: '#005960', // Teal
      bgColor: 'bg-[#005960]/10',
    },
    strategist: {
      name: 'The Strategist',
      icon: Lightbulb,
      color: '#CC5500', // Orange
      bgColor: 'bg-[#CC5500]/10',
    },
    professor: {
      name: 'The Professor',
      icon: GraduationCap,
      color: '#43B3AE', // Sage
      bgColor: 'bg-[#43B3AE]/10',
    },
    ceo: {
      name: 'Josh (CEO)',
      icon: User,
      color: '#F4E3C1', // Cream
      bgColor: 'bg-[#F4E3C1]/5',
    },
    // 3. Add a fallback 'system' role just in case
    system: {
      name: 'System',
      icon: AlertCircle,
      color: '#F4E3C1',
      bgColor: 'bg-red-500/10',
    }
  };

  // 4. Safe Lookup: If the role doesn't match, default to 'ceo' to prevent crashing
  const config = AGENT_CONFIG[roleKey] || AGENT_CONFIG.ceo;
  const Icon = config.icon;
  const isCeo = roleKey === 'ceo';

  return (
    <div className={cn(
      "flex gap-4 p-4 rounded-lg mb-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 border",
      config.bgColor,
      isCeo ? "flex-row-reverse border-vintage-cream/10" : "flex-row border-transparent"
    )}>
      {/* Avatar Bubble */}
      <div 
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm",
          isCeo ? "bg-vintage-charcoal" : "bg-vintage-charcoal"
        )} 
        style={{ borderColor: config.color, color: config.color }}
      >
        <Icon className="w-4 h-4" />
      </div>

      {/* Message Content */}
      <div className={cn("flex flex-col gap-1 min-w-0 max-w-[85%]", isCeo ? "items-end" : "items-start")}>
        <span 
          className="text-xs font-bold uppercase tracking-wider opacity-90" 
          style={{ color: config.color }}
        >
          {config.name}
        </span>
        
        <div className={cn(
          "text-sm leading-relaxed text-vintage-cream whitespace-pre-wrap",
          isCeo ? "text-right opacity-90" : "text-left"
        )}>
          {message.content}
        </div>
      </div>
    </div>
  );
}