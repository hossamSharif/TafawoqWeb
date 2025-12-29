import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fvstedbsjiqvryqpnmzl.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2c3RlZGJzamlxdnJ5cXBubXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODEzNTI3OSwiZXhwIjoyMDczNzExMjc5fQ.KWmtmoPziqWBGMKzknqbA9K6zVnf6J5iQmu8HdbGnHY'

const email = 'halabija@gmail.com'
const userId = 'dc92cefa-b9f2-40ca-b794-418bf26fb29b'

async function testOnboardingFix() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log('🔍 Testing Onboarding Fix...\n')

  // Test 1: Check user profile can be queried with correct columns
  console.log('Test 1: Query user profile with correct columns')
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('onboarding_completed, email, academic_track, display_name')
    .eq('user_id', userId)
    .single()

  if (profileError) {
    console.log('❌ FAILED: Could not query profile')
    console.log('Error:', profileError.message)
    return
  }

  console.log('✅ PASSED: Profile queried successfully')
  console.log('Profile:', JSON.stringify(profile, null, 2))
  console.log('')

  // Test 2: Check subscription exists
  console.log('Test 2: Check user subscription')
  const { data: subscription, error: subError } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (subError) {
    console.log('❌ WARNING: Subscription not found (will be created on onboarding)')
    console.log('Error:', subError.message)
  } else {
    console.log('✅ PASSED: Subscription exists')
    console.log('Subscription Tier:', subscription.tier)
    console.log('Subscription Status:', subscription.status)
  }
  console.log('')

  // Test 3: Check user credits
  console.log('Test 3: Check user credits')
  const { data: credits, error: creditsError } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (creditsError) {
    console.log('❌ WARNING: Credits not found')
  } else {
    console.log('✅ PASSED: Credits exist')
    console.log('Exam Credits:', credits.exam_credits)
    console.log('Practice Credits:', credits.practice_credits)
  }
  console.log('')

  // Test 4: Check user analytics table exists
  console.log('Test 4: Check user analytics')
  const { data: analytics, error: analyticsError } = await supabase
    .from('user_analytics')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (analyticsError) {
    console.log('❌ WARNING: Analytics query failed')
    console.log('Error:', analyticsError.message)
  } else if (!analytics) {
    console.log('⚠️  Analytics record does not exist (will be created on onboarding)')
  } else {
    console.log('✅ PASSED: Analytics exist')
  }
  console.log('')

  console.log('📋 Summary:')
  console.log('- Profile: ✅ Ready')
  console.log('- Onboarding Status:', profile.onboarding_completed ? '✅ Completed' : '⚠️  Pending')
  console.log('- Academic Track:', profile.academic_track || 'Not set')
  console.log('')
  console.log('🎯 Next Steps:')
  console.log('1. Login at http://localhost:3000')
  console.log('2. You should be redirected to onboarding (if not completed)')
  console.log('3. Select academic track (Scientific/Literary)')
  console.log('4. Select subscription plan (Free/Premium)')
  console.log('5. Click "البدء بالخطة المجانية" or "بدء التجربة المجانية"')
  console.log('')
  console.log('Expected Result: Should redirect to /dashboard without errors')
}

testOnboardingFix().catch(console.error)
