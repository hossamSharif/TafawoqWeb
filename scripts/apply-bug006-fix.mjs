/**
 * Apply BUG-006 fix - notification target_type constraint violation
 * This script uses postgres package to run DDL directly
 */
import postgres from 'postgres'

// Get connection string from environment
const connectionString = process.env.DATABASE_URL ||
  'postgresql://postgres.fvstedbsjiqvryqpnmzl:Ameen12Ameen@aws-0-eu-central-1.pooler.supabase.com:6543/postgres'

const sql = postgres(connectionString, {
  ssl: 'require',
  idle_timeout: 20,
  max_lifetime: 60 * 30
})

async function applyFix() {
  console.log('Connecting to database...')

  try {
    // Test connection
    const result = await sql`SELECT current_database() as db, current_user as user`
    console.log('Connected to:', result[0].db, 'as', result[0].user)

    // First, check if the trigger exists
    console.log('\nChecking current trigger...')
    const triggers = await sql`
      SELECT tgname, tgrelid::regclass as table_name
      FROM pg_trigger
      WHERE tgname = 'trg_grant_reward_on_completion'
    `

    if (triggers.length > 0) {
      console.log('Found trigger:', triggers[0].tgname, 'on', triggers[0].table_name)
    } else {
      console.log('Trigger not found')
    }

    // Check current function definition
    console.log('\nChecking function definition...')
    const funcDef = await sql`
      SELECT prosrc
      FROM pg_proc
      WHERE proname = 'grant_reward_on_completion'
    `

    if (funcDef.length > 0) {
      const src = funcDef[0].prosrc
      if (src.includes("target_type)") && src.includes("v_content_type")) {
        console.log('BUG DETECTED: Function uses v_content_type as target_type')
      } else if (src.includes("'post'")) {
        console.log('Function already uses post as target_type - fix may already be applied')
      }
    }

    // Apply the fix
    console.log('\nApplying fix...')

    // Drop and recreate the function
    await sql`DROP FUNCTION IF EXISTS public.grant_reward_on_completion() CASCADE`
    console.log('Dropped old function and triggers')

    // Create the fixed function
    await sql.unsafe(`
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
      $$ LANGUAGE plpgsql SECURITY DEFINER
    `)
    console.log('Created fixed function')

    // Recreate the trigger
    await sql.unsafe(`
      CREATE TRIGGER trg_grant_reward_on_completion
      AFTER INSERT ON public.shared_exam_completions
      FOR EACH ROW EXECUTE FUNCTION public.grant_reward_on_completion()
    `)
    console.log('Created trigger')

    console.log('\n✅ BUG-006 fix applied successfully!')
    console.log('The trigger now uses target_type=\'post\' instead of \'exam\'/\'practice\'')

  } catch (error) {
    console.error('Error:', error.message)
    if (error.code) console.error('Code:', error.code)
  } finally {
    await sql.end()
  }
}

applyFix()
