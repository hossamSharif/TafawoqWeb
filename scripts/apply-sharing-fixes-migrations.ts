import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function runMigrations() {
  console.log('Applying sharing functionality fixes migrations...')
  console.log('Supabase URL:', supabaseUrl)

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Migration 1: Create decrement_share_credit function
  console.log('\n1. Creating decrement/increment share credit functions...')
  const migration1Path = join(
    process.cwd(),
    'supabase/migrations/20241224000001_create_decrement_share_credit_function.sql'
  )
  const migration1SQL = readFileSync(migration1Path, 'utf-8')

  try {
    const { error: error1 } = await supabase.rpc('exec_sql' as any, {
      sql_query: migration1SQL,
    } as any)

    if (error1) {
      console.log('⚠️  Could not use RPC exec_sql. Trying direct execution...')

      // Try executing directly
      const response1 = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: migration1SQL }),
      })

      if (!response1.ok) {
        console.log('❌ Migration 1 failed via API')
        console.log('\nPlease run this SQL manually in Supabase Dashboard SQL Editor:')
        console.log('\n--- Migration 1: Create Functions ---')
        console.log(migration1SQL)
        console.log('\n')
      } else {
        console.log('✅ Migration 1 applied successfully!')
      }
    } else {
      console.log('✅ Migration 1 applied successfully!')
    }
  } catch (error) {
    console.log('❌ Error applying Migration 1:', error)
    console.log('\nPlease run this SQL manually in Supabase Dashboard SQL Editor:')
    console.log('\n--- Migration 1: Create Functions ---')
    console.log(migration1SQL)
    console.log('\n')
  }

  // Migration 2: Add credit reset tracking
  console.log('\n2. Adding monthly credit reset tracking...')
  const migration2Path = join(
    process.cwd(),
    'supabase/migrations/20241224000002_add_credit_reset_tracking.sql'
  )
  const migration2SQL = readFileSync(migration2Path, 'utf-8')

  try {
    const { error: error2 } = await supabase.rpc('exec_sql' as any, {
      sql_query: migration2SQL,
    } as any)

    if (error2) {
      console.log('⚠️  Could not use RPC exec_sql. Trying direct execution...')

      const response2 = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: migration2SQL }),
      })

      if (!response2.ok) {
        console.log('❌ Migration 2 failed via API')
        console.log('\nPlease run this SQL manually in Supabase Dashboard SQL Editor:')
        console.log('\n--- Migration 2: Credit Reset Tracking ---')
        console.log(migration2SQL)
        console.log('\n')
      } else {
        console.log('✅ Migration 2 applied successfully!')
      }
    } else {
      console.log('✅ Migration 2 applied successfully!')
    }
  } catch (error) {
    console.log('❌ Error applying Migration 2:', error)
    console.log('\nPlease run this SQL manually in Supabase Dashboard SQL Editor:')
    console.log('\n--- Migration 2: Credit Reset Tracking ---')
    console.log(migration2SQL)
    console.log('\n')
  }

  console.log('\n=== Migration Summary ===')
  console.log('If any migrations failed, please:')
  console.log('1. Go to Supabase Dashboard → SQL Editor')
  console.log('2. Copy and paste the SQL shown above')
  console.log('3. Execute the queries manually')
  console.log('\nMigration files are located in:')
  console.log('- supabase/migrations/20241224000001_create_decrement_share_credit_function.sql')
  console.log('- supabase/migrations/20241224000002_add_credit_reset_tracking.sql')
}

runMigrations().catch(console.error)
