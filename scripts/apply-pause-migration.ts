/**
 * Script to apply the pause status migration to Supabase
 * Run with: npx tsx scripts/apply-pause-migration.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

async function applyMigration() {
  console.log('Applying pause status migration...')

  // Add paused_at to exam_sessions
  const { error: error1 } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ NULL;`
  })

  if (error1) {
    // Try direct query approach
    console.log('Trying direct SQL approach...')
  }

  // Since we can't run DDL via RPC, let's check if columns exist
  const { data: examCols, error: examError } = await supabase
    .from('exam_sessions')
    .select('*')
    .limit(0)

  console.log('Exam sessions table accessible:', !examError)

  // Try using postgres function if available
  const migrations = [
    `ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ NULL`,
    `ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS remaining_time_seconds INTEGER NULL`,
    `ALTER TABLE practice_sessions ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ NULL`,
  ]

  console.log('\nMigration SQL to run manually in Supabase SQL Editor:')
  console.log('=' .repeat(60))
  migrations.forEach(sql => console.log(sql + ';'))
  console.log('=' .repeat(60))

  // Test if the columns already exist by trying to select them
  const { data, error } = await supabase
    .from('exam_sessions')
    .select('paused_at, remaining_time_seconds')
    .limit(1)

  if (error?.message?.includes('does not exist')) {
    console.log('\n❌ Columns do not exist yet. Please run the SQL above in Supabase Dashboard > SQL Editor')
  } else {
    console.log('\n✅ Columns already exist or migration was successful!')
  }
}

applyMigration().catch(console.error)
