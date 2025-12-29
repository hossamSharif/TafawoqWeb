import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') })

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

async function diagnose() {
  try {
    const email = 'husameldeenh@gmail.com'
    console.log(`🔍 Diagnosing share credits for: ${email}\n`)

    // Get user ID
    const { data: authData } = await supabase.auth.admin.listUsers()
    const user = authData.users.find(u => u.email === email)

    if (!user) {
      console.error('❌ User not found')
      process.exit(1)
    }

    console.log(`👤 User ID: ${user.id}\n`)

    // Check user credits
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (creditsError) {
      console.error('❌ Error fetching credits:', creditsError.message)
    } else {
      console.log('💳 User Credits:')
      console.log('  Exam shares remaining:', credits.share_credits_exam)
      console.log('  Practice shares remaining:', credits.share_credits_practice)
      console.log('  Exam monthly limit:', credits.share_credits_exam_monthly_limit || 'NOT SET')
      console.log('  Practice monthly limit:', credits.share_credits_practice_monthly_limit || 'NOT SET')
      console.log('  Last reset:', credits.share_credits_last_reset_at || 'NOT SET')
      console.log()
    }

    // Check subscription tier
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier, status')
      .eq('user_id', user.id)
      .single()

    if (subscription) {
      console.log('📊 Subscription:')
      console.log('  Tier:', subscription.tier)
      console.log('  Status:', subscription.status)
      console.log()
    }

    // Check forum posts shared by this user
    const { data: sharedExams, error: examsError } = await supabase
      .from('forum_posts')
      .select('id, post_type, title, shared_exam_id, shared_practice_id, created_at')
      .eq('author_id', user.id)
      .eq('post_type', 'exam_share')
      .order('created_at', { ascending: false })

    if (examsError) {
      console.error('❌ Error fetching shared posts:', examsError.message)
    } else {
      console.log(`📤 Forum Posts (Shares): ${sharedExams.length} total`)
      sharedExams.forEach((post, idx) => {
        console.log(`  ${idx + 1}. ${post.title || 'Untitled'}`)
        console.log(`     Type: ${post.shared_exam_id ? 'Exam' : 'Practice'}`)
        console.log(`     ID: ${post.shared_exam_id || post.shared_practice_id}`)
        console.log(`     Created: ${post.created_at}`)
      })
      console.log()
    }

    // Calculate expected values
    const tier = subscription?.tier === 'premium' && subscription?.status === 'active' ? 'premium' : 'free'
    const defaultExamShares = tier === 'premium' ? 10 : 2
    const defaultPracticeShares = tier === 'premium' ? 15 : 3

    const examMonthlyLimit = credits.share_credits_exam_monthly_limit ?? defaultExamShares
    const practiceMonthlyLimit = credits.share_credits_practice_monthly_limit ?? defaultPracticeShares

    const examSharesUsed = Math.max(0, examMonthlyLimit - (credits.share_credits_exam ?? 0))
    const practiceSharesUsed = Math.max(0, practiceMonthlyLimit - (credits.share_credits_practice ?? 0))

    console.log('📈 Calculated Values:')
    console.log(`  Current tier: ${tier}`)
    console.log(`  Exam monthly limit: ${examMonthlyLimit}`)
    console.log(`  Practice monthly limit: ${practiceMonthlyLimit}`)
    console.log(`  Exam shares used: ${examSharesUsed}`)
    console.log(`  Practice shares used: ${practiceSharesUsed}`)
    console.log()

    // Count actual exam shares
    const examSharesCount = sharedExams.filter(p => p.shared_exam_id).length
    const practiceSharesCount = sharedExams.filter(p => p.shared_practice_id).length

    console.log('🎯 Diagnosis:')
    console.log(`  Actual exam shares in forum: ${examSharesCount}`)
    console.log(`  Calculated exam shares used: ${examSharesUsed}`)
    console.log(`  Mismatch: ${examSharesCount !== examSharesUsed ? '⚠️  YES' : '✅ NO'}`)
    console.log()
    console.log(`  Actual practice shares in forum: ${practiceSharesCount}`)
    console.log(`  Calculated practice shares used: ${practiceSharesUsed}`)
    console.log(`  Mismatch: ${practiceSharesCount !== practiceSharesUsed ? '⚠️  YES' : '✅ NO'}`)
    console.log()

    if (examSharesCount !== examSharesUsed || practiceSharesCount !== practiceSharesUsed) {
      console.log('⚠️  ISSUE DETECTED:')
      console.log('The share credits in the database don\'t match the actual number of shares.')
      console.log('\nPossible causes:')
      console.log('1. Shares were created before the decrement function was implemented')
      console.log('2. Monthly reset happened and reset the credits')
      console.log('3. Database was manually modified')
      console.log('\n💡 Recommended fix:')
      console.log(`Update share credits to reflect actual usage:`)
      console.log(`  exam_shares_remaining = ${examMonthlyLimit} - ${examSharesCount} = ${examMonthlyLimit - examSharesCount}`)
      console.log(`  practice_shares_remaining = ${practiceMonthlyLimit} - ${practiceSharesCount} = ${practiceMonthlyLimit - practiceSharesCount}`)
    } else {
      console.log('✅ Everything looks correct!')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
    process.exit(1)
  }
}

diagnose()
