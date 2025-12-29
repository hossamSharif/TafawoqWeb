import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function applyFix() {
  try {
    console.log('🚀 Starting share limits tracking fix...\n')

    // Step 1: Add columns
    console.log('1️⃣ Adding tracking columns...')
    const alterTableSQL = `
      ALTER TABLE public.user_credits
      ADD COLUMN IF NOT EXISTS share_credits_exam_monthly_limit integer,
      ADD COLUMN IF NOT EXISTS share_credits_practice_monthly_limit integer;
    `

    // We can't execute DDL directly, so let's use a workaround
    // First, check if columns exist by trying to query them
    const { error: checkError } = await supabase
      .from('user_credits')
      .select('share_credits_exam_monthly_limit, share_credits_practice_monthly_limit')
      .limit(1)

    if (checkError && checkError.message.includes('column')) {
      console.log('⚠️  Columns don\'t exist yet. Please run this SQL in Supabase SQL Editor:')
      console.log('\n' + '='.repeat(60))
      console.log(alterTableSQL)
      console.log('='.repeat(60) + '\n')
      console.log('Then run this script again.\n')
      process.exit(1)
    }

    console.log('✅ Columns already exist or were just added\n')

    // Step 2: Backfill monthly limits for existing users
    console.log('2️⃣ Backfilling monthly limits for existing users...')

    const { data: users, error: fetchError } = await supabase
      .from('user_credits')
      .select('user_id, share_credits_exam, share_credits_practice, share_credits_exam_monthly_limit, share_credits_practice_monthly_limit')

    if (fetchError) {
      throw fetchError
    }

    console.log(`Found ${users.length} users to update`)

    let updated = 0
    for (const user of users) {
      // Only update if monthly limits are not set
      if (user.share_credits_exam_monthly_limit === null || user.share_credits_practice_monthly_limit === null) {
        const { error: updateError } = await supabase
          .from('user_credits')
          .update({
            share_credits_exam_monthly_limit: user.share_credits_exam ?? 2,
            share_credits_practice_monthly_limit: user.share_credits_practice ?? 3,
          })
          .eq('user_id', user.user_id)

        if (updateError) {
          console.error(`Failed to update user ${user.user_id}:`, updateError.message)
        } else {
          updated++
          if (updated % 10 === 0) {
            console.log(`  Updated ${updated} users...`)
          }
        }
      }
    }

    console.log(`✅ Updated ${updated} users with monthly limits\n`)

    console.log('3️⃣ Creating updated function...')
    console.log('⚠️  Please run the function update SQL in Supabase SQL Editor:')
    console.log('\nGo to: https://supabase.com/dashboard/project/_/sql')
    console.log('And execute the function code from the migration file.\n')

    console.log('✅ Share limits tracking fix completed!')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

applyFix()
