/**
 * Apply trigger fix directly using Supabase service role
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fvstedbsjiqvryqpnmzl.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2c3RlZGJzamlxdnJ5cXBubXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODEzNTI3OSwiZXhwIjoyMDczNzExMjc5fQ.KWmtmoPziqWBGMKzknqbA9K6zVnf6J5iQmu8HdbGnHY'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

async function applyFix() {
  console.log('Testing connection...')

  // Test connection by checking notifications table constraint
  const { data: testData, error: testError } = await supabase
    .from('notifications')
    .select('id')
    .limit(1)

  if (testError) {
    console.error('Connection test failed:', testError.message)
    return
  }

  console.log('Connection OK. Checking current trigger...')

  // We can't execute raw DDL through the JS client
  // But we can at least verify the issue exists by checking the constraint

  // Let's test by inserting a notification with target_type='post' (should work)
  console.log('\nTo fix the trigger, run this SQL in Supabase Dashboard > SQL Editor:\n')
  console.log(`
DROP FUNCTION IF EXISTS public.grant_reward_on_completion() CASCADE;

CREATE OR REPLACE FUNCTION public.grant_reward_on_completion()
RETURNS TRIGGER AS $$
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
    'post'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_grant_reward_on_completion
AFTER INSERT ON public.shared_exam_completions
FOR EACH ROW EXECUTE FUNCTION public.grant_reward_on_completion();
  `)
}

applyFix().catch(console.error)
