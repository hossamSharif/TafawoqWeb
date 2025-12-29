import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('Applying migration: add generation_in_progress column to practice_sessions...')

  // Check if column exists
  const { data: columns, error: checkError } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'practice_sessions' AND column_name = 'generation_in_progress';
    `
  })

  if (checkError) {
    console.log('Using direct ALTER TABLE approach...')

    // Execute the migration directly
    const { error } = await supabase.from('practice_sessions').select('id').limit(1)

    if (error) {
      console.error('Failed to access practice_sessions table:', error)
      process.exit(1)
    }
  }

  // Since we can't use exec_sql, let's verify the table structure
  const { data, error } = await supabase
    .from('practice_sessions')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error checking table:', error)
    process.exit(1)
  }

  console.log('Current table structure accessible. Sample columns:', data?.[0] ? Object.keys(data[0]) : 'No data')
  console.log('')
  console.log('NOTE: You need to run the following SQL directly in Supabase SQL Editor:')
  console.log('')
  console.log(`ALTER TABLE practice_sessions ADD COLUMN IF NOT EXISTS generation_in_progress BOOLEAN DEFAULT FALSE;`)
  console.log('')
  console.log('Or use the migration file: supabase/migrations/20241217000001_add_practice_generation_in_progress.sql')
}

applyMigration().catch(console.error)
