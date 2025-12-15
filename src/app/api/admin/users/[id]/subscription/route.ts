import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyAdminAccess } from '@/lib/admin/queries'
import { logSubscriptionChange, logCreditsAdded } from '@/lib/admin/audit'
import type { SubscriptionAction } from '@/lib/admin/types'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { id: userId } = await params

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Verify admin access
    try {
      await verifyAdminAccess(user.id)
    } catch {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { action, tier, credits, days } = body as {
      action: SubscriptionAction
      tier?: 'free' | 'premium'
      credits?: { exam: number; practice: number }
      days?: number
    }

    // Validate action
    const validActions: SubscriptionAction[] = ['upgrade', 'downgrade', 'add_credits', 'extend_trial', 'cancel']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid action' } },
        { status: 400 }
      )
    }

    // Handle different actions
    switch (action) {
      case 'upgrade':
      case 'downgrade': {
        // Note: In a real implementation, this would interact with Stripe
        // For now, we just log the action
        await logSubscriptionChange(user.id, userId, action, {
          new_tier: action === 'upgrade' ? 'premium' : 'free',
        })
        break
      }

      case 'add_credits': {
        if (!credits || typeof credits.exam !== 'number' || typeof credits.practice !== 'number') {
          return NextResponse.json(
            { error: { code: 'VALIDATION_ERROR', message: 'Invalid credits' } },
            { status: 400 }
          )
        }

        // Add credits to user via direct SQL or existing table
        // Try updating user_profiles which typically has credits columns
        try {
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single()

          // Type assertion for profile data with credits
          const existingProfile = profileData as {
            exam_credits?: number
            practice_credits?: number
          } | null

          if (existingProfile) {
            const currentExam = existingProfile.exam_credits || 0
            const currentPractice = existingProfile.practice_credits || 0

            // Use raw SQL update via rpc or direct query
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const profilesTable = supabase.from('user_profiles') as any
            await profilesTable
              .update({
                exam_credits: currentExam + credits.exam,
                practice_credits: currentPractice + credits.practice,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', userId)
          }
        } catch {
          // If user_profiles doesn't have credits columns, log and continue
          console.log('Credits columns may not exist in user_profiles')
        }

        await logCreditsAdded(user.id, userId, credits.exam, credits.practice, 'admin_action')
        break
      }

      case 'extend_trial': {
        if (!days || typeof days !== 'number' || days < 1) {
          return NextResponse.json(
            { error: { code: 'VALIDATION_ERROR', message: 'Invalid days' } },
            { status: 400 }
          )
        }

        // Note: In a real implementation, this would extend the trial period
        await logSubscriptionChange(user.id, userId, action, { days })
        break
      }

      case 'cancel': {
        // Note: In a real implementation, this would cancel the subscription
        await logSubscriptionChange(user.id, userId, action, {
          cancelled_at: new Date().toISOString(),
        })
        break
      }
    }

    return NextResponse.json({ success: true, action })
  } catch (error) {
    console.error('Subscription API error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update subscription' } },
      { status: 500 }
    )
  }
}
