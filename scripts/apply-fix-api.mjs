/**
 * Apply BUG-006 fix using Supabase Management API
 */

const SUPABASE_URL = 'https://fvstedbsjiqvryqpnmzl.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2c3RlZGJzamlxdnJ5cXBubXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODEzNTI3OSwiZXhwIjoyMDczNzExMjc5fQ.KWmtmoPziqWBGMKzknqbA9K6zVnf6J5iQmu8HdbGnHY'

const fixSQL = `
-- First check if the trigger exists and what it does
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  pg_get_functiondef(tgfoid) as function_definition
FROM pg_trigger
WHERE tgname = 'trg_grant_reward_on_completion';
`

async function runQuery(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sql_query: sql }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`API error ${response.status}: ${text}`)
  }

  return response.json()
}

async function checkTriggers() {
  console.log('Checking triggers via pg_catalog...')

  // Use the postgrest API to query pg_catalog directly
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/get_trigger_info`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({}),
    }
  )

  if (!response.ok) {
    console.log('get_trigger_info RPC not available, trying alternative...')

    // Try to query notifications table constraint
    const notifResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/notifications?select=id&limit=0`,
      {
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        },
      }
    )

    if (notifResponse.ok) {
      console.log('Successfully connected to database')

      // Try to test the constraint by inserting a valid notification
      console.log('\nTesting notification constraint with target_type=post...')
      const testResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/notifications`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            user_id: '8c826d8b-a2ec-4fd3-971c-a34e2a87fa2f',
            type: 'system',
            title: 'Test',
            message: 'Test notification',
            target_id: 'd8b89722-fce6-4c23-ab9a-8a13624421b4',
            target_type: 'post', // This should work
          }),
        }
      )

      if (testResponse.ok) {
        console.log('✅ Notification with target_type=post works!')
      } else {
        console.log('❌ Notification insert failed:', await testResponse.text())
      }
    }

    return
  }

  const data = await response.json()
  console.log('Triggers:', data)
}

async function main() {
  try {
    console.log('Connecting to Supabase...')
    await checkTriggers()

    console.log('\n--- MANUAL FIX REQUIRED ---')
    console.log('The Supabase JS client cannot run DDL statements.')
    console.log('Please apply this SQL in Supabase Dashboard > SQL Editor:\n')
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
    'post'  -- FIXED: Changed from v_content_type to 'post'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_grant_reward_on_completion
AFTER INSERT ON public.shared_exam_completions
FOR EACH ROW EXECUTE FUNCTION public.grant_reward_on_completion();
`)

  } catch (error) {
    console.error('Error:', error.message)
  }
}

main()
