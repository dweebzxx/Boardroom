export type AgentRole = 'analyst' | 'strategist' | 'professor' | 'ceo';

export interface Course {
  id: string;
  code: string;
  name: string;
  instructor: string;
  term: string;
  created_at: string;
}

export interface ScheduleItem {
  id: string;
  course_id: string;
  date: string;
  type: 'Quiz' | 'Group Research';
  title: string;
  due_time: string;
  is_major: boolean;
  created_at: string;
}

export interface DebateSession {
  id: string;
  course_id: string;
  topic: string;
  created_at: string;
}

export interface DebateMessage {
  id: string;
  session_id: string;
  role: AgentRole;
  content: string;
  created_at: string;
}

export interface Memo {
  id: string;
  course_id: string;
  topic: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  role: AgentRole;
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

export const AGENT_CONFIG = {
  analyst: {
    name: 'The Analyst',
    color: '#005960',
    bgClass: 'bg-vintage-teal/20',
    textClass: 'text-vintage-teal',
    borderClass: 'border-vintage-teal',
  },
  strategist: {
    name: 'The Strategist',
    color: '#CC5500',
    bgClass: 'bg-vintage-orange/20',
    textClass: 'text-vintage-orange',
    borderClass: 'border-vintage-orange',
  },
  professor: {
    name: 'The Professor',
    color: '#43B3AE',
    bgClass: 'bg-vintage-sage/20',
    textClass: 'text-vintage-sage',
    borderClass: 'border-vintage-sage',
  },
  ceo: {
    name: 'CEO (You)',
    color: '#F4E3C1',
    bgClass: 'bg-vintage-charcoal',
    textClass: 'text-vintage-cream',
    borderClass: 'border-vintage-cream/30',
  },
} as const;
