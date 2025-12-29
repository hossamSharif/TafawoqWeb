/**
 * Apply the user_profiles RLS fix to allow public profile reading
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function applyMigration() {
  console.log('🔧 Applying user_profiles RLS fix...\n')

  const migrationPath = join(__dirname, '../supabase/migrations/20241222000003_allow_public_profile_read.sql')
  const sql = readFileSync(migrationPath, 'utf-8')

  // Execute the SQL
  const { data, error } = await supabase.rpc('exec_sql', { sql })

  if (error) {
    console.error('❌ Migration failed:', error)

    // Try applying directly
    console.log('\n🔧 Trying direct SQL execution...\n')

    const { error: directError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(0) as any // Just to check connection

    if (directError) {
      console.error('Connection error:', directError)
    }

    // Apply the policy manually
    console.log('📝 Creating policy manually...\n')

    // We'll use a workaround - execute via raw SQL in parts
    const statements = [
      `DROP POLICY IF EXISTS "Public profile read for forum" ON public.user_profiles;`,
      `CREATE POLICY "Public profile read for forum" ON public.user_profiles FOR SELECT USING (true);`
    ]

    for (const stmt of statements) {
      console.log(`Executing: ${stmt}`)

      // Use the Supabase REST API to execute raw SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ sql: stmt })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Failed to execute statement: ${errorText}`)
      } else {
        console.log('✅ Statement executed successfully')
      }
    }
  } else {
    console.log('✅ Migration applied successfully!')
    console.log('Data:', data)
  }

  // Verify the fix
  console.log('\n🔍 Verifying the fix...')

  const { data: posts, error: postsError } = await supabase
    .from('forum_posts')
    .select(`
      id,
      title,
      author:user_profiles(user_id, display_name, profile_picture_url)
    `)
    .limit(3)

  if (postsError) {
    console.error('❌ Verification failed:', postsError)
  } else {
    console.log('✅ Forum posts with author data:')
    console.log(JSON.stringify(posts, null, 2))
  }
}

applyMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Fatal error:', err)
    process.exit(1)
  })
