import { supabaseBrowser } from './supabase/browser';
import type {
  Course,
  ScheduleItem,
  Debate,
  DebateMessage,
  ExecutiveBrief,
  AgentRole,
} from './types';

export async function getCourses(): Promise<Course[]> {
  const { data, error } = await supabaseBrowser
    .from('courses')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getScheduleItems(courseId: string): Promise<ScheduleItem[]> {
  const { data, error } = await supabaseBrowser
    .from('schedule_items')
    .select('*')
    .eq('course_id', courseId)
    .order('date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createDebate(courseId: string, topic: string): Promise<Debate> {
  const { data, error } = await supabaseBrowser
    .from('debates')
    .insert({ course_id: courseId, topic })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addDebateMessage(
  debateId: string,
  role: AgentRole,
  content: string
): Promise<DebateMessage> {
  const { data, error } = await supabaseBrowser
    .from('debate_messages')
    .insert({ debate_id: debateId, role, content })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getDebateMessages(debateId: string): Promise<DebateMessage[]> {
  const { data, error } = await supabaseBrowser
    .from('debate_messages')
    .select('*')
    .eq('debate_id', debateId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getExecutiveBrief(courseId: string): Promise<ExecutiveBrief | null> {
  const { data, error } = await supabaseBrowser
    .from('executive_briefs')
    .select('*')
    .eq('course_id', courseId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function saveExecutiveBrief(
  courseId: string,
  content: string,
  topic?: string | null,
  existingId?: string
): Promise<ExecutiveBrief> {
  if (existingId) {
    const { data, error } = await supabaseBrowser
      .from('executive_briefs')
      .update({ content, topic, updated_at: new Date().toISOString() })
      .eq('id', existingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabaseBrowser
    .from('executive_briefs')
    .insert({ course_id: courseId, content, topic })
    .select()
    .single();

  if (error) throw error;
  return data;
}
