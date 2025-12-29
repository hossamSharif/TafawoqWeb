/**
 * Script to apply counter fix migrations to Supabase
 * Run with: npx tsx scripts/apply-counter-fix-migrations.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function applyMigration(name: string, filePath: string) {
  console.log(`\n📝 Applying migration: ${name}`)

  try {
    const sql = readFileSync(filePath, 'utf-8')

    const { data, error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      // Try direct query if rpc doesn't exist
      const { error: queryError } = await (supabase as any).rpc('query', {
        query: sql
      })

      if (queryError) {
        throw queryError
      }
    }

    console.log(`✅ Successfully applied: ${name}`)
  } catch (error) {
    console.error(`❌ Failed to apply ${name}:`, error)
    throw error
  }
}

async function main() {
  console.log('🚀 Starting migration application...')
  console.log(`📍 Target: ${supabaseUrl}`)

  const migrations = [
    {
      name: '20241223000001_create_get_monthly_usage_function',
      path: join(__dirname, '../supabase/migrations/20241223000001_create_get_monthly_usage_function.sql'),
    },
    {
      name: '20241223000002_update_check_exam_eligibility_monthly',
      path: join(__dirname, '../supabase/migrations/20241223000002_update_check_exam_eligibility_monthly.sql'),
    },
    {
      name: '20241223000003_add_monthly_usage_indexes',
      path: join(__dirname, '../supabase/migrations/20241223000003_add_monthly_usage_indexes.sql'),
    },
  ]

  for (const migration of migrations) {
    await applyMigration(migration.name, migration.path)
  }

  console.log('\n✨ All migrations applied successfully!')
  console.log('\n📊 Testing get_monthly_usage function...')

  // Test the function
  const { data: testData, error: testError } = await supabase.rpc('get_monthly_usage', {
    p_user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
  })

  if (testError) {
    console.error('❌ Test failed:', testError)
  } else {
    console.log('✅ Function test successful:', testData)
  }
}

main()
  .then(() => {
    console.log('\n🎉 Migration script completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Migration script failed:', error)
    process.exit(1)
  })
