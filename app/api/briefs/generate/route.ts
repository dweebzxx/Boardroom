import { NextResponse } from 'next/server';
import { z } from 'zod';
import { runExecutiveBriefGraph } from '@/lib/briefs/executive_brief_graph';
import { supabaseServer } from '@/lib/supabase/server';

const requestSchema = z.object({
  debateId: z.string().uuid(),
});

export async function POST(request: Request) {
  const payload = requestSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { debateId } = payload.data;

  const result = await runExecutiveBriefGraph(debateId);

  const { data: brief, error } = await supabaseServer
    .from('executive_briefs')
    .insert({
      debate_id: result.debateId,
      course_id: result.courseId,
      content: result.markdown ?? '',
      content_markdown: result.markdown ?? '',
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to save executive brief.' }, { status: 500 });
  }

  return NextResponse.json({ briefId: brief.id, content: result.markdown });
}
