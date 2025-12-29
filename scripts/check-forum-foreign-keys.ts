/**
 * Check foreign key constraints on forum_posts table
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

async function checkForeignKeys() {
  console.log('🔍 Checking forum_posts foreign keys...\n')

  // Query to get foreign key constraints
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'forum_posts'
        AND tc.table_schema = 'public';
    `
  })

  if (error) {
    console.error('Error:', error)

    // Try alternative method
    console.log('\n📊 Trying alternative query...\n')
    const { data: posts, error: postsError } = await supabase
      .from('forum_posts')
      .select(`
        id,
        author_id,
        title,
        author:user_profiles(user_id, display_name, profile_picture_url)
      `)
      .limit(5)

    if (postsError) {
      console.error('❌ Query with join failed:', postsError)
    } else {
      console.log('✅ Query successful with simple join:')
      console.log(JSON.stringify(posts, null, 2))
    }

    // Try with specific FK name
    console.log('\n📊 Trying with explicit FK name...\n')
    const { data: posts2, error: posts2Error } = await supabase
      .from('forum_posts')
      .select(`
        id,
        author_id,
        title,
        author:user_profiles!forum_posts_author_profile_fkey(user_id, display_name, profile_picture_url)
      `)
      .limit(5)

    if (posts2Error) {
      console.error('❌ Query with explicit FK failed:', posts2Error)
    } else {
      console.log('✅ Query successful with explicit FK:')
      console.log(JSON.stringify(posts2, null, 2))
    }

    // Try with author_id FK
    console.log('\n📊 Trying with author_id FK...\n')
    const { data: posts3, error: posts3Error } = await supabase
      .from('forum_posts')
      .select(`
        id,
        author_id,
        title,
        author:user_profiles!forum_posts_author_id_fkey(user_id, display_name, profile_picture_url)
      `)
      .limit(5)

    if (posts3Error) {
      console.error('❌ Query with author_id FK failed:', posts3Error)
    } else {
      console.log('✅ Query successful with author_id FK:')
      console.log(JSON.stringify(posts3, null, 2))
    }
  } else {
    console.log('Foreign keys:', data)
  }
}

checkForeignKeys()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
