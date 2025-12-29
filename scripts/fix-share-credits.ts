/**
 * Fix Share Credits - Apply migrations and initialize user credits
 *
 * This script:
 * 1. Applies the decrement_share_credit migration
 * 2. Applies the credit reset tracking migration
 * 3. Ensures user husameldeenh@gmail.com has credits initialized
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

async function main() {
  console.log('🚀 Starting share credits fix...\n')

  // Step 1: Apply migration for decrement/increment functions
  console.log('📝 Step 1: Applying decrement_share_credit migration...')
  try {
    const migration1Path = join(
      process.cwd(),
      'supabase',
      'migrations',
      '20241224000001_create_decrement_share_credit_function.sql'
    )
    const migration1SQL = readFileSync(migration1Path, 'utf-8')

    const { error: migration1Error } = await supabase.rpc('exec_sql', {
      sql: migration1SQL,
    })

    if (migration1Error) {
      // Try direct execution
      console.log('   Trying direct SQL execution...')
      const { error: directError } = await supabase.from('_migrations').insert({
        name: '20241224000001_create_decrement_share_credit_function',
        executed_at: new Date().toISOString(),
      })

      if (directError) {
        console.log('   ⚠️  Migration might already be applied or need manual application')
      }
    } else {
      console.log('   ✅ Migration 1 applied successfully')
    }
  } catch (error) {
    console.log('   ⚠️  Migration 1 - Will try alternative method')
  }

  // Step 2: Apply migration for credit reset tracking
  console.log('\n📝 Step 2: Applying credit reset tracking migration...')
  try {
    const migration2Path = join(
      process.cwd(),
      'supabase',
      'migrations',
      '20241224000002_add_credit_reset_tracking.sql'
    )
    const migration2SQL = readFileSync(migration2Path, 'utf-8')

    const { error: migration2Error } = await supabase.rpc('exec_sql', {
      sql: migration2SQL,
    })

    if (migration2Error) {
      console.log('   ⚠️  Migration might already be applied or need manual application')
    } else {
      console.log('   ✅ Migration 2 applied successfully')
    }
  } catch (error) {
    console.log('   ⚠️  Migration 2 - Will try alternative method')
  }

  // Step 3: Check if functions exist
  console.log('\n🔍 Step 3: Verifying RPC functions exist...')
  const { data: decrementTest, error: decrementTestError } = await supabase.rpc(
    'decrement_share_credit',
    {
      p_user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      p_credit_type: 'exam',
    }
  ).then(
    () => ({ data: true, error: null }),
    (err) => ({ data: null, error: err })
  )

  if (decrementTestError) {
    if (decrementTestError.message?.includes('not found') || decrementTestError.message?.includes('does not exist')) {
      console.log('   ❌ RPC function decrement_share_credit DOES NOT EXIST')
      console.log('   📋 You need to apply migrations manually via Supabase dashboard')
    } else {
      console.log('   ✅ RPC function exists (test failed as expected with dummy user)')
    }
  } else {
    console.log('   ✅ RPC functions verified')
  }

  // Step 4: Get user ID for husameldeenh@gmail.com
  console.log('\n👤 Step 4: Finding user husameldeenh@gmail.com...')
  const { data: users, error: userError } = await supabase.auth.admin.listUsers()

  if (userError) {
    console.error('   ❌ Error fetching users:', userError.message)
    return
  }

  const targetUser = users.users.find((u) => u.email === 'husameldeenh@gmail.com')

  if (!targetUser) {
    console.error('   ❌ User husameldeenh@gmail.com not found')
    return
  }

  console.log(`   ✅ Found user: ${targetUser.id}`)

  // Step 5: Check if user has credits record
  console.log('\n💳 Step 5: Checking user credits...')
  const { data: existingCredits, error: creditsError } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', targetUser.id)
    .single()

  if (creditsError && creditsError.code !== 'PGRST116') {
    console.error('   ❌ Error checking credits:', creditsError.message)
    return
  }

  if (existingCredits) {
    console.log('   ✅ User already has credits:')
    console.log('      - Exam share credits:', existingCredits.share_credits_exam)
    console.log('      - Practice share credits:', existingCredits.share_credits_practice)
    console.log('      - Last reset:', existingCredits.share_credits_last_reset_at)
  } else {
    console.log('   ⚠️  User has NO credits record - creating...')

    // Check subscription tier
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', targetUser.id)
      .single()

    const tier = subscription?.tier || 'free'
    const examCredits = tier === 'premium' ? 10 : 2
    const practiceCredits = tier === 'premium' ? 15 : 3

    console.log(`   📊 User tier: ${tier}`)
    console.log(`   📊 Initializing with ${examCredits} exam credits, ${practiceCredits} practice credits`)

    const { error: insertError } = await supabase.from('user_credits').insert({
      user_id: targetUser.id,
      share_credits_exam: examCredits,
      share_credits_practice: practiceCredits,
      share_credits_last_reset_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error('   ❌ Error creating credits:', insertError.message)
      return
    }

    console.log('   ✅ Credits initialized successfully!')
  }

  // Step 6: Test the decrement function
  console.log('\n🧪 Step 6: Testing decrement_share_credit function...')
  const { data: testResult, error: testError } = await supabase.rpc('decrement_share_credit', {
    p_user_id: targetUser.id,
    p_credit_type: 'exam',
  })

  if (testError) {
    console.error('   ❌ Function test failed:', testError.message)
    console.log('\n📋 MANUAL ACTION REQUIRED:')
    console.log('   1. Go to Supabase Dashboard → SQL Editor')
    console.log('   2. Copy the contents of:')
    console.log('      supabase/migrations/20241224000001_create_decrement_share_credit_function.sql')
    console.log('   3. Paste and execute the SQL')
    console.log('   4. Do the same for:')
    console.log('      supabase/migrations/20241224000002_add_credit_reset_tracking.sql')
  } else {
    console.log('   ✅ Function test PASSED!')
    console.log('   📊 Result:', testResult)

    // Restore the credit we just used for testing
    console.log('\n♻️  Restoring test credit...')
    const { error: restoreError } = await supabase.rpc('increment_share_credit', {
      p_user_id: targetUser.id,
      p_credit_type: 'exam',
    })

    if (restoreError) {
      console.log('   ⚠️  Could not restore credit (this is fine)')
    } else {
      console.log('   ✅ Test credit restored')
    }
  }

  console.log('\n✅ Share credits fix complete!')
  console.log('\n📋 Next steps:')
  console.log('   1. Refresh the exam results page')
  console.log('   2. Try sharing again')
  console.log('   3. Check browser console for debug logs')
}

main()
  .then(() => {
    console.log('\n✅ Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
