import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

async function applyMigration() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('📦 Applying library optimization migrations...\n')

  // Read the library count optimization migration
  const libraryMigrationPath = join(
    __dirname,
    '..',
    'supabase',
    'migrations',
    '20241222000002_optimize_library_count.sql'
  )
  const libraryMigrationSQL = readFileSync(libraryMigrationPath, 'utf-8')

  console.log('Applying library count optimization migration...')

  try {
    // Try using RPC if available
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: libraryMigrationSQL,
    })

    if (error) {
      throw error
    }

    console.log('✅ Library count optimization applied successfully!')
    console.log('The get_library_exams_with_count function is now available.\n')
  } catch (error: any) {
    console.error('❌ Could not apply migration automatically:', error.message)
    console.log('\n📋 Please apply the following SQL in your Supabase Dashboard > SQL Editor:\n')
    console.log('=' .repeat(80))
    console.log(libraryMigrationSQL)
    console.log('=' .repeat(80))
    console.log('\nOr run it directly using psql or another database client.')
  }
}

applyMigration().catch(console.error)
