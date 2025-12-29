/**
 * Verify the RLS policy on user_profiles
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
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

async function verifyRLS() {
  console.log('🔍 Verifying RLS policies on user_profiles...\n')

  // Test with service role (should work)
  console.log('1. Testing with SERVICE ROLE key...')
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

  const { data: serviceData, error: serviceError } = await supabaseService
    .from('user_profiles')
    .select('user_id, display_name')
    .limit(3)

  if (serviceError) {
    console.error('❌ Service role query failed:', serviceError)
  } else {
    console.log('✅ Service role can read profiles:', serviceData.length, 'profiles')
  }

  // Test with anon key (should work after policy change)
  console.log('\n2. Testing with ANON key (simulates unauthenticated requests)...')
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)

  const { data: anonData, error: anonError } = await supabaseAnon
    .from('user_profiles')
    .select('user_id, display_name')
    .limit(3)

  if (anonError) {
    console.error('❌ Anon key query failed:', anonError)
    console.error('\nThis means the RLS policy is blocking anonymous access.')
    console.error('Attempting to create the policy again...\n')

    // Try to create the policy using service role
    const { error: policyError } = await supabaseService.rpc('exec_sql' as any, {
      sql: `
        DROP POLICY IF EXISTS "Public profile read for forum" ON public.user_profiles;
        CREATE POLICY "Public profile read for forum" ON public.user_profiles
          FOR SELECT USING (true);
      `
    })

    if (policyError) {
      console.error('❌ Failed to create policy:', policyError)
      console.log('\n📝 Please run this SQL manually in Supabase Dashboard:')
      console.log(`
DROP POLICY IF EXISTS "Public profile read for forum" ON public.user_profiles;
CREATE POLICY "Public profile read for forum" ON public.user_profiles
  FOR SELECT USING (true);
      `)
    }
  } else {
    console.log('✅ Anon key can read profiles:', anonData.length, 'profiles')
  }

  // Test forum posts join with anon key
  console.log('\n3. Testing forum posts join with ANON key...')
  const { data: postsData, error: postsError } = await supabaseAnon
    .from('forum_posts')
    .select(`
      id,
      title,
      author:user_profiles(user_id, display_name)
    `)
    .limit(3)

  if (postsError) {
    console.error('❌ Forum posts join failed:', postsError)
  } else {
    console.log('✅ Forum posts with authors:')
    console.log(JSON.stringify(postsData, null, 2))
  }
}

verifyRLS()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Fatal error:', err)
    process.exit(1)
  })
