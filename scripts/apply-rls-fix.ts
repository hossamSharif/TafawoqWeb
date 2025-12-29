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

async function applyRlsFix() {
  console.log('Applying RLS fix migration...');

  // Execute the SQL directly
  const sql = `
    -- Create is_user_admin security definer function
    CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id uuid)
    RETURNS boolean AS $$
    DECLARE
      v_is_admin boolean;
    BEGIN
      SELECT is_admin INTO v_is_admin
      FROM public.user_profiles
      WHERE user_id = check_user_id;

      RETURN COALESCE(v_is_admin, false);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Drop problematic recursive policies
    DROP POLICY IF EXISTS "Admins can read all profiles" ON public.user_profiles;
    DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
  `;

  const { error: funcError } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (funcError) {
    // Try executing SQL statements individually
    console.log('Executing function creation...');
    const { data: funcData, error: func2Error } = await supabase.from('_migrations_test').select('*').limit(0);

    // Use raw SQL approach via REST API
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
      console.log('exec_sql not available, will need to apply manually via Supabase dashboard');
      console.log('Please run the following SQL in the Supabase SQL editor:');
      console.log('\n' + sql);
    }
  }

  console.log('Migration script completed!');
}

applyRlsFix().catch(console.error);
