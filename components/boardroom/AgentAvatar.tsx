'use client';

import { BarChart3, Target, GraduationCap, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentRole } from '@/lib/types';
import { AGENT_CONFIG } from '@/lib/types';

interface AgentAvatarProps {
  role: AgentRole;
  size?: 'sm' | 'md' | 'lg';
}

const ICONS = {
  analyst: BarChart3,
  strategist: Target,
  professor: GraduationCap,
  ceo: User,
} as const;

const SIZES = {
  sm: { container: 'w-7 h-7', icon: 'w-3.5 h-3.5' },
  md: { container: 'w-9 h-9', icon: 'w-4 h-4' },
  lg: { container: 'w-11 h-11', icon: 'w-5 h-5' },
} as const;

export function AgentAvatar({ role, size = 'md' }: AgentAvatarProps) {
  const Icon = ICONS[role];
  const config = AGENT_CONFIG[role];
  const sizeClasses = SIZES[size];

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0',
        sizeClasses.container,
        config.bgClass,
        'border',
        config.borderClass
      )}
      style={{ borderColor: `${config.color}40` }}
    >
      <Icon className={cn(sizeClasses.icon)} style={{ color: config.color }} />
    </div>
  );
}
