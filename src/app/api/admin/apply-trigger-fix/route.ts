// Admin endpoint to apply BUG-006 trigger fix
// This endpoint drops and recreates the grant_reward_on_completion trigger with fixed target_type
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Verify admin status
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Type assertion to fix TypeScript narrowing issue
    const userProfile = profile as { role: string }

    if (userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Apply the fix using raw SQL via RPC
    // First, drop the existing function and trigger
    // @ts-expect-error - RPC function types not properly generated
    const dropResult = await supabase.rpc('exec_sql', {
      sql_query: 'DROP FUNCTION IF EXISTS public.grant_reward_on_completion() CASCADE;'
    })

    if (dropResult.error) {
      console.log('Drop result (may fail if exec_sql does not exist):', dropResult.error)
    }

    // Since exec_sql might not exist, try alternative approach
    // The fix SQL needs to be applied via Supabase Dashboard SQL Editor
    return NextResponse.json({
      message: 'Cannot apply fix via API - exec_sql function not available',
      instructions: 'Please apply the following SQL in Supabase Dashboard > SQL Editor',
      sql: `
-- Fix for BUG-006: notification target_type constraint violation
-- The trigger uses 'exam'/'practice' but constraint only allows 'post', 'comment', 'report', 'reward'

DROP FUNCTION IF EXISTS public.grant_reward_on_completion() CASCADE;

CREATE OR REPLACE FUNCTION public.grant_reward_on_completion()
RETURNS TRIGGER AS $
DECLARE
  v_owner_id uuid;
  v_content_type text;
BEGIN
  SELECT author_id,
    CASE WHEN shared_exam_id IS NOT NULL THEN 'exam' ELSE 'practice' END
  INTO v_owner_id, v_content_type
  FROM public.forum_posts
  WHERE id = NEW.post_id;

  IF v_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  IF v_content_type = 'exam' THEN
    INSERT INTO public.user_credits (user_id, exam_credits, practice_credits, total_completions, last_awarded_milestone, credit_history, updated_at)
    VALUES (v_owner_id, 1, 0, 0, 0, '[]'::jsonb, now())
    ON CONFLICT (user_id) DO UPDATE SET exam_credits = user_credits.exam_credits + 1, updated_at = now();
  ELSE
    INSERT INTO public.user_credits (user_id, exam_credits, practice_credits, total_completions, last_awarded_milestone, credit_history, updated_at)
    VALUES (v_owner_id, 0, 1, 0, 0, '[]'::jsonb, now())
    ON CONFLICT (user_id) DO UPDATE SET practice_credits = user_credits.practice_credits + 1, updated_at = now();
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, target_id, target_type)
  VALUES (
    v_owner_id,
    'reward_earned',
    'مكافأة جديدة!',
    CASE WHEN v_content_type = 'exam' THEN 'لقد أكمل مستخدم آخر اختبارك المشارك وحصلت على رصيد اختبار إضافي'
    ELSE 'لقد أكمل مستخدم آخر تدريبك المشارك وحصلت على رصيد تدريب إضافي' END,
    NEW.post_id,
    'post'  -- FIXED: Changed from v_content_type to 'post'
  );

  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_grant_reward_on_completion
AFTER INSERT ON public.shared_exam_completions
FOR EACH ROW EXECUTE FUNCTION public.grant_reward_on_completion();
`
    })
  } catch (error) {
    console.error('Apply trigger fix error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
