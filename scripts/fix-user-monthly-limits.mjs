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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function fixUserLimits() {
  try {
    console.log('🔧 Fixing monthly limits for all users...\n')

    // Get all users with their subscription tiers
    const { data: allCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select(`
        user_id,
        share_credits_exam,
        share_credits_practice,
        share_credits_exam_monthly_limit,
        share_credits_practice_monthly_limit,
        share_credits_last_reset_at
      `)

    if (fetchError) {
      throw fetchError
    }

    console.log(`Found ${allCredits.length} users\n`)

    let updated = 0
    let skipped = 0

    for (const credits of allCredits) {
      // Get user's subscription tier
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('tier, status')
        .eq('user_id', credits.user_id)
        .single()

      // Determine tier limits
      const tier = subscription?.tier === 'premium' && subscription?.status === 'active' ? 'premium' : 'free'
      const examLimit = tier === 'premium' ? 10 : 2
      const practiceLimit = tier === 'premium' ? 15 : 3

      // Get the month of last reset
      const lastResetMonth = credits.share_credits_last_reset_at
        ? new Date(credits.share_credits_last_reset_at).toISOString().slice(0, 7)
        : null

      const currentMonth = new Date().toISOString().slice(0, 7)

      // Calculate what the monthly limit should be
      // If reset was this month, use tier limits
      // If reset was last month or never, we need to infer from remaining credits
      let correctExamLimit = examLimit
      let correctPracticeLimit = practiceLimit

      // If they have credits remaining but no monthly limit, we need to guess
      // The safest assumption is that they started with the tier default
      if (credits.share_credits_exam_monthly_limit === null) {
        // Set to tier default
        correctExamLimit = examLimit
      } else if (credits.share_credits_exam_monthly_limit === credits.share_credits_exam) {
        // Monthly limit equals remaining - likely backfilled incorrectly
        // Set to tier default
        correctExamLimit = examLimit
      } else {
        // Keep existing monthly limit
        correctExamLimit = credits.share_credits_exam_monthly_limit
      }

      if (credits.share_credits_practice_monthly_limit === null) {
        correctPracticeLimit = practiceLimit
      } else if (credits.share_credits_practice_monthly_limit === credits.share_credits_practice) {
        correctPracticeLimit = practiceLimit
      } else {
        correctPracticeLimit = credits.share_credits_practice_monthly_limit
      }

      // Only update if values are different
      const needsUpdate =
        credits.share_credits_exam_monthly_limit !== correctExamLimit ||
        credits.share_credits_practice_monthly_limit !== correctPracticeLimit

      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('user_credits')
          .update({
            share_credits_exam_monthly_limit: correctExamLimit,
            share_credits_practice_monthly_limit: correctPracticeLimit,
          })
          .eq('user_id', credits.user_id)

        if (updateError) {
          console.error(`❌ Failed to update user ${credits.user_id}:`, updateError.message)
        } else {
          updated++
          console.log(`✅ Updated user ${credits.user_id}: exam ${credits.share_credits_exam_monthly_limit} → ${correctExamLimit}, practice ${credits.share_credits_practice_monthly_limit} → ${correctPracticeLimit}`)
        }
      } else {
        skipped++
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`  Updated: ${updated} users`)
    console.log(`  Skipped: ${skipped} users (already correct)`)
    console.log(`  Total: ${allCredits.length} users`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

fixUserLimits()
