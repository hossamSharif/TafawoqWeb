/**
 * Final attempt to create the RLS policy using Supabase Management API
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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

async function createPolicy() {
  console.log('🔧 Creating RLS policy for user_profiles...\n')
  console.log(`Project: ${projectRef}`)
  console.log(`URL: ${supabaseUrl}\n`)

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // The SQL we want to run
  const policySQL = `
-- Drop existing policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles'
    AND policyname = 'Public profile read for forum'
  ) THEN
    EXECUTE 'DROP POLICY "Public profile read for forum" ON public.user_profiles';
  END IF;
END $$;

-- Create the new policy
CREATE POLICY "Public profile read for forum"
  ON public.user_profiles
  FOR SELECT
  TO public
  USING (true);

-- Verify the policy was created
SELECT policyname, cmd, qual::text, with_check::text
FROM pg_policies
WHERE tablename = 'user_profiles'
AND policyname = 'Public profile read for forum';
  `.trim()

  console.log('📝 SQL to execute:')
  console.log(policySQL)
  console.log('\n' + '='.repeat(60))

  // Since direct SQL execution isn't available via the client SDK,
  // provide clear instructions for manual execution
  console.log('\n🎯 TO APPLY THIS FIX:\n')
  console.log('1. Open Supabase Dashboard SQL Editor:')
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`)
  console.log('2. Copy and paste this SQL:\n')
  console.log('   ```sql')
  console.log(`   DROP POLICY IF EXISTS "Public profile read for forum" ON public.user_profiles;`)
  console.log(`   CREATE POLICY "Public profile read for forum"`)
  console.log(`     ON public.user_profiles`)
  console.log(`     FOR SELECT`)
  console.log(`     TO public`)
  console.log(`     USING (true);`)
  console.log('   ```\n')
  console.log('3. Click "Run" or press Ctrl+Enter\n')
  console.log('4. You should see: "Success. No rows returned"\n')
  console.log('5. Refresh your forum page - usernames should now appear!\n')
  console.log('='.repeat(60))

  // Test current state
  console.log('\n🔍 Testing current state...\n')

  // Test 1: With service role
  console.log('Test 1: Service role access to user_profiles')
  const { data: serviceProfiles, error: serviceError } = await supabase
    .from('user_profiles')
    .select('user_id, display_name')
    .limit(1)

  if (serviceError) {
    console.log('❌ Service role failed:', serviceError.message)
  } else {
    console.log('✅ Service role works:', serviceProfiles?.length, 'profiles')
  }

  // Test 2: With anon key (simulates unauthenticated users)
  console.log('\nTest 2: Anon key access to user_profiles')
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)
  const { data: anonProfiles, error: anonError } = await supabaseAnon
    .from('user_profiles')
    .select('user_id, display_name')
    .limit(1)

  if (anonError) {
    console.log('❌ Anon key failed:', anonError.message)
    console.log('   This confirms the policy needs to be created!')
  } else {
    console.log('✅ Anon key works:', anonProfiles?.length, 'profiles')
  }

  // Test 3: Forum posts join
  console.log('\nTest 3: Forum posts with author join (anon key)')
  const { data: posts, error: postsError } = await supabaseAnon
    .from('forum_posts')
    .select('id, title, author:user_profiles!forum_posts_author_profile_fkey(user_id, display_name)')
    .limit(1)

  if (postsError) {
    console.log('❌ Join failed:', postsError.message)
  } else if (posts && posts.length > 0) {
    const post = posts[0] as any
    if (post.author && post.author.display_name) {
      console.log('✅ Join works! Author:', post.author.display_name)
      console.log('\n🎉🎉🎉 THE FIX IS ALREADY APPLIED! 🎉🎉🎉')
      console.log('\nJust refresh your browser and clear the cache.')
    } else {
      console.log('❌ Join returns null author')
      console.log('   The policy needs to be applied (see instructions above)')
    }
  }

  console.log('\n' + '='.repeat(60))
}

createPolicy()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Fatal error:', err)
    process.exit(1)
  })
