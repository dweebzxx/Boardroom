export type AgentRole = 'analyst' | 'strategist' | 'professor' | 'ceo';
export type ChatRole = AgentRole | 'system';

export interface Course {
  id: string;
  code: string;
  name: string;
  instructor: string;
  term: string;
  created_at: string | null;
}

export interface ScheduleItem {
  id: string;
  course_id: string;
  date: string;
  type: string;
  title: string;
  due_time: string;
  is_major: boolean;
  created_at: string | null;
}

export interface Debate {
  id: string;
  course_id: string;
  topic: string;
  created_at: string | null;
}

export interface DebateMessage {
  id: string;
  debate_id: string;
  role: AgentRole;
  content: string;
  created_at: string | null;
}

export interface Citation {
  chunk_id: string;
  document_id: string;
  page_number?: number | null;
  modality?: 'text' | 'vision';
  quote?: string;
}

export interface ExecutiveBrief {
  id: string;
  debate_id?: string | null;
  course_id: string;
  topic: string | null;
  content: string;
  content_markdown?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  citations?: Citation[];
  timestamp?: Date;
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
