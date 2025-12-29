/**
 * Apply RLS policy for library exam access
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

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyRLSPolicy() {
  console.log('Applying RLS policy for library exam access...')

  // First, check existing policies
  let existingPolicies = null
  let checkError = null
  try {
    const result = await supabase.rpc('get_policies_for_table', { table_name: 'exam_sessions' })
    existingPolicies = result.data
    checkError = result.error
  } catch (err) {
    // Ignore errors when checking policies
    console.log('Could not check existing policies:', err)
  }

  console.log('Existing policies:', existingPolicies)

  // Apply the policy using raw SQL
  const sql = `
    -- Drop the policy if it exists (to allow re-running)
    DROP POLICY IF EXISTS "Users can read exam_sessions linked to library posts" ON public.exam_sessions;

    -- Create the new policy
    CREATE POLICY "Users can read exam_sessions linked to library posts"
    ON public.exam_sessions
    FOR SELECT
    USING (
      auth.uid() = user_id
      OR
      id IN (
        SELECT shared_exam_id
        FROM public.forum_posts
        WHERE is_library_visible = true
        AND shared_exam_id IS NOT NULL
      )
    );
  `

  let error = null
  try {
    const result = await supabase.rpc('exec_sql', { sql_query: sql })
    error = result.error
  } catch (err) {
    // If exec_sql doesn't exist, try direct query
    console.log('exec_sql not available, trying direct approach...')
    error = { message: 'Need to apply via Supabase dashboard' }
  }

  if (error) {
    console.error('Error applying policy:', error.message)
    console.log('\n⚠️  Please apply the following SQL in Supabase Dashboard > SQL Editor:\n')
    console.log(sql)
    return
  }

  console.log('✅ RLS policy applied successfully!')
}

applyRLSPolicy().catch(console.error)
