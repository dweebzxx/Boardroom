import { supabase } from './supabase';
import type { Course, ScheduleItem, DebateSession, DebateMessage, Memo, AgentRole } from './types';

export async function getCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getScheduleItems(courseId: string): Promise<ScheduleItem[]> {
  const { data, error } = await supabase
    .from('schedule_items')
    .select('*')
    .eq('course_id', courseId)
    .order('date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createDebateSession(courseId: string, topic: string): Promise<DebateSession> {
  const { data, error } = await supabase
    .from('debate_sessions')
    .insert({ course_id: courseId, topic })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addDebateMessage(
  sessionId: string,
  role: AgentRole,
  content: string
): Promise<DebateMessage> {
  const { data, error } = await supabase
    .from('debate_messages')
    .insert({ session_id: sessionId, role, content })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getDebateMessages(sessionId: string): Promise<DebateMessage[]> {
  const { data, error } = await supabase
    .from('debate_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getMemo(courseId: string): Promise<Memo | null> {
  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .eq('course_id', courseId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function saveMemo(
  courseId: string,
  content: string,
  topic?: string | null,
  existingId?: string
): Promise<Memo> {
  if (existingId) {
    const { data, error } = await supabase
      .from('memos')
      .update({ content, topic, updated_at: new Date().toISOString() })
      .eq('id', existingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('memos')
    .insert({ course_id: courseId, content, topic })
    .select()
    .single();

  if (error) throw error;
  return data;
}
