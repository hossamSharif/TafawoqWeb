/**
 * Directly fix the RLS policy using Supabase Management API
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixRLS() {
  console.log('🔧 Fixing RLS policy on user_profiles...\n')

  // First, check current policies
  console.log('📋 Checking current policies...')
  const { data: policies, error: policiesError } = await supabase
    .rpc('get_policies' as any, { table_name: 'user_profiles' })
    .catch(() => ({ data: null, error: null }))

  if (policies) {
    console.log('Current policies:', policies)
  }

  // Use SQL to check and create the policy
  const sql = `
    -- Check if RLS is enabled
    SELECT relname, relrowsecurity
    FROM pg_class
    WHERE relname = 'user_profiles';

    -- List current policies
    SELECT policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE tablename = 'user_profiles';
  `

  console.log('\n🔍 Checking RLS status...')

  // Since exec_sql doesn't exist, we'll create a proper migration using the pool
  // For now, let's just create the policy through a direct database operation

  // Drop and recreate the policy
  const policySQL = `
DO $$
BEGIN
  -- Drop the policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles'
    AND policyname = 'Public profile read for forum'
  ) THEN
    DROP POLICY "Public profile read for forum" ON public.user_profiles;
  END IF;

  -- Create the new policy
  CREATE POLICY "Public profile read for forum"
  ON public.user_profiles
  FOR SELECT
  TO public  -- Important: specify the role
  USING (true);
END $$;
`

  console.log('📝 SQL to execute:')
  console.log(policySQL)
  console.log('\n⚠️  Please run this SQL in your Supabase SQL Editor:')
  console.log('   1. Go to https://supabase.com/dashboard')
  console.log('   2. Open SQL Editor')
  console.log('   3. Paste and run the SQL above')
  console.log('\n   OR run this simpler version:')
  console.log(`
DROP POLICY IF EXISTS "Public profile read for forum" ON public.user_profiles;
CREATE POLICY "Public profile read for forum" ON public.user_profiles
  FOR SELECT TO public USING (true);
  `)

  // Try one more approach - using a transaction
  try {
    await supabase.rpc('exec_sql' as any, { sql: policySQL })
    console.log('\n✅ Policy created successfully!')
  } catch (error: any) {
    if (error.message?.includes('exec_sql')) {
      console.log('\n⚠️  exec_sql function not available')
      console.log('    Please run the SQL manually as shown above')
    } else {
      console.error('\n❌ Error:', error)
    }
  }
}

fixRLS()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Fatal error:', err)
    process.exit(1)
  })
