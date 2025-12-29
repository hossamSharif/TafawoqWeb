/**
 * Apply fix for notification target_type constraint violation
 */

import { createClient } from '@supabase/supabase-js'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
})

async function applyFix() {
  console.log('Applying fix for notification target_type constraint...')

  // First, drop the existing function and trigger
  const dropSQL = `
    DROP FUNCTION IF EXISTS public.grant_reward_on_completion() CASCADE;
  `

  const { error: dropError } = await supabase.rpc('exec_sql', { sql_query: dropSQL }).single()

  if (dropError) {
    console.log('Note: DROP function returned:', dropError.message)
    console.log('Continuing with direct table update approach...')
  }

  // Create the fixed function
  const createSQL = `
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
  `

  const { error: createError } = await supabase.rpc('exec_sql', { sql_query: createSQL }).single()

  if (createError) {
    console.error('Create function error:', createError.message)
    console.log('\n⚠️  The exec_sql function does not exist. Please run the following SQL in Supabase Dashboard > SQL Editor:\n')
    console.log('-- Step 1: Drop existing function')
    console.log('DROP FUNCTION IF EXISTS public.grant_reward_on_completion() CASCADE;')
    console.log('')
    console.log('-- Step 2: Create fixed function')
    console.log(createSQL)
    return
  }

  console.log('✅ Fix applied successfully!')
}

applyFix().catch(console.error)
