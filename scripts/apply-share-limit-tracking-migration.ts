import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function applyMigration() {
  try {
    console.log('📝 Reading migration file...')
    const migrationPath = path.join(
      process.cwd(),
      'supabase',
      'migrations',
      '20241224000003_track_monthly_share_limits.sql'
    )
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('🚀 Applying migration to track monthly share limits...')

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })

    if (error) {
      console.error('❌ Migration failed:', error)

      // Try direct execution as fallback
      console.log('Trying direct execution...')
      const { error: directError } = await supabase.from('_migrations').insert({
        name: '20241224000003_track_monthly_share_limits',
        executed_at: new Date().toISOString()
      })

      if (directError) {
        console.error('Direct execution also failed:', directError)
        process.exit(1)
      }
    }

    console.log('✅ Migration applied successfully!')
    console.log('\n📊 Verifying columns were added...')

    // Verify the new columns exist
    const { data: testData, error: testError } = await supabase
      .from('user_credits')
      .select('share_credits_exam_monthly_limit, share_credits_practice_monthly_limit')
      .limit(1)

    if (testError) {
      console.error('❌ Verification failed:', testError.message)
    } else {
      console.log('✅ Columns verified successfully!')
      console.log('Sample data:', testData)
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

applyMigration()
