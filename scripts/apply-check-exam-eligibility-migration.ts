import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔧 Applying check_exam_eligibility function migration...\n');

  const sql = `
-- Function to check if user can create a new exam
CREATE OR REPLACE FUNCTION public.check_exam_eligibility(p_user_id uuid)
RETURNS TABLE (
  is_eligible boolean,
  exams_taken_this_week integer,
  max_exams_per_week integer,
  next_eligible_at timestamptz,
  reason text
) AS $$
DECLARE
  v_tier text;
  v_weekly_count integer;
  v_week_start_date date;
  v_days_since_week_start integer;
  v_max_exams integer;
BEGIN
  -- Get user subscription tier (default to 'free' if no subscription)
  SELECT COALESCE(tier, 'free')
  INTO v_tier
  FROM public.user_subscriptions
  WHERE user_id = p_user_id
  LIMIT 1;

  -- If no subscription record exists, treat as free tier
  IF v_tier IS NULL THEN
    v_tier := 'free';
  END IF;

  -- Premium users have unlimited exams
  IF v_tier = 'premium' THEN
    RETURN QUERY SELECT
      true as is_eligible,
      0 as exams_taken_this_week,
      999999 as max_exams_per_week,
      null::timestamptz as next_eligible_at,
      'Premium user - unlimited exams' as reason;
    RETURN;
  END IF;

  -- Free tier has 3 exams per week
  v_max_exams := 3;

  -- Get weekly exam count and week start date from performance_records
  SELECT
    COALESCE(weekly_exam_count, 0),
    week_start_date
  INTO
    v_weekly_count,
    v_week_start_date
  FROM public.performance_records
  WHERE user_id = p_user_id;

  -- If no performance record exists, user hasn't taken any exams
  IF v_weekly_count IS NULL THEN
    v_weekly_count := 0;
    v_week_start_date := CURRENT_DATE;
  END IF;

  -- Calculate days since week start
  IF v_week_start_date IS NULL THEN
    v_days_since_week_start := 8;
  ELSE
    v_days_since_week_start := CURRENT_DATE - v_week_start_date;
  END IF;

  -- Reset count if more than 7 days have passed
  IF v_days_since_week_start >= 7 THEN
    v_weekly_count := 0;
    v_week_start_date := CURRENT_DATE;

    -- Update performance_records with reset values
    UPDATE public.performance_records
    SET weekly_exam_count = 0, week_start_date = CURRENT_DATE, updated_at = now()
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
      INSERT INTO public.performance_records (user_id, weekly_exam_count, week_start_date, exam_history, category_performance)
      VALUES (p_user_id, 0, CURRENT_DATE, '[]'::jsonb, '{}'::jsonb);
    END IF;
  END IF;

  -- Check if user has reached the limit
  IF v_weekly_count >= v_max_exams THEN
    RETURN QUERY SELECT
      false as is_eligible,
      v_weekly_count as exams_taken_this_week,
      v_max_exams as max_exams_per_week,
      (v_week_start_date + INTERVAL '7 days')::timestamptz as next_eligible_at,
      'Weekly limit reached' as reason;
  ELSE
    RETURN QUERY SELECT
      true as is_eligible,
      v_weekly_count as exams_taken_this_week,
      v_max_exams as max_exams_per_week,
      null::timestamptz as next_eligible_at,
      'Eligible to create exam' as reason;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  const { error: funcError } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (funcError) {
    console.log('exec_sql not available, trying REST API...');

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ sql_query: sql }),
    });

    if (!response.ok) {
      console.log('⚠️  exec_sql not available. Please apply manually via Supabase dashboard SQL editor:');
      console.log('\n' + sql);
      console.log('\n✅ Migration file created at: supabase/migrations/20241218000001_create_check_exam_eligibility_function.sql');
      return;
    }
  }

  console.log('✅ Migration applied successfully!');

  // Verify the function
  console.log('\n🔍 Verifying function...');
  const { data, error } = await supabase.rpc('check_exam_eligibility', {
    p_user_id: '42ca4e44-e668-4c95-86f9-1d9dfd30ee45'
  });

  if (error) {
    console.error('❌ Error calling function:', error);
  } else {
    console.log('✅ Function works! Result:', JSON.stringify(data, null, 2));
  }
}

applyMigration().catch(console.error);
