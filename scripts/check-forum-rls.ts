// Script to check RLS policies on forum_posts table
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkForumRLS() {
  console.log('Checking RLS policies on forum_posts table...\n')

  // Check if RLS is enabled
  const { data: rlsData, error: rlsError } = await supabase.rpc('check_rls_enabled', {
    table_name: 'forum_posts'
  })

  if (rlsError) {
    console.log('Querying policies directly...')
  }

  // Query policies directly from pg_policies
  const { data: policies, error } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'forum_posts')

  if (error) {
    console.error('Error fetching policies:', error)

    // Try alternative query
    const query = `
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE tablename = 'forum_posts'
    `

    const { data: altPolicies, error: altError } = await supabase.rpc('exec_sql', {
      query: query
    })

    if (altError) {
      console.error('Alternative query error:', altError)
    } else {
      console.log('Policies found:', JSON.stringify(altPolicies, null, 2))
    }
  } else {
    console.log('Policies found:', policies?.length || 0)
    console.log(JSON.stringify(policies, null, 2))
  }
}

checkForumRLS().catch(console.error)
