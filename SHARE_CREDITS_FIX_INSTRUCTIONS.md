# Share Credits Balance Fix - Implementation Instructions

## Problem Summary

The sharing counter in the sub-header shows incorrect values when:
1. Monthly limits tracking columns don't exist in the database
2. User changes tier mid-month (was showing incorrect "used" count)

## Root Cause

The API was calculating `shares_used = current_tier_limit - remaining_credits`, but this fails when:
- User was free tier at month start (got 2 shares)
- User upgraded to premium mid-month (tier limit becomes 10)
- Calculation becomes: `shares_used = 10 - 2 = 8` (WRONG!)

The fix tracks the actual monthly limit that was set during the monthly reset.

## Files Changed

1. **src/app/(main)/dashboard/page.tsx** - Dashboard practice hours and last result display
2. **src/app/api/profile/performance/route.ts** - Enhanced to return practice hours and last result
3. **src/app/api/subscription/limits/route.ts** - Fixed sharing counter calculation
4. **supabase/migrations/20241224000003_track_monthly_share_limits.sql** - New migration

## Migration Steps

### Step 1: Apply Database Migration

Go to Supabase Dashboard → SQL Editor and run the following SQL:

```sql
-- =====================================================
-- Step 1: Add columns to track monthly limits
-- =====================================================
ALTER TABLE public.user_credits
ADD COLUMN IF NOT EXISTS share_credits_exam_monthly_limit integer,
ADD COLUMN IF NOT EXISTS share_credits_practice_monthly_limit integer;

COMMENT ON COLUMN public.user_credits.share_credits_exam_monthly_limit IS
'The monthly limit for exam shares that was set at the last reset. Used to calculate shares used.';

COMMENT ON COLUMN public.user_credits.share_credits_practice_monthly_limit IS
'The monthly limit for practice shares that was set at the last reset. Used to calculate shares used.';

-- =====================================================
-- Step 2: Backfill monthly limits for existing users
-- =====================================================
UPDATE public.user_credits uc
SET
  share_credits_exam_monthly_limit = COALESCE(uc.share_credits_exam, 2),
  share_credits_practice_monthly_limit = COALESCE(uc.share_credits_practice, 3)
WHERE share_credits_exam_monthly_limit IS NULL;

-- =====================================================
-- Step 3: Update the reset function to track limits
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_and_reset_monthly_credits(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_last_reset timestamptz;
  v_month_start date;
  v_tier text;
  v_tier_status text;
  v_exam_limit integer;
  v_practice_limit integer;
  v_did_reset boolean := false;
  v_current_exam_credits integer;
  v_current_practice_credits integer;
BEGIN
  -- Get current month start (UTC)
  v_month_start := date_trunc('month', CURRENT_DATE)::date;

  -- Get last reset time, current tier, and tier status
  SELECT
    uc.share_credits_last_reset_at,
    COALESCE(us.tier, 'free'),
    COALESCE(us.status, 'inactive')
  INTO v_last_reset, v_tier, v_tier_status
  FROM public.user_credits uc
  LEFT JOIN public.user_subscriptions us ON us.user_id = uc.user_id
  WHERE uc.user_id = p_user_id;

  -- If user not found, return error
  IF v_last_reset IS NULL THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;

  -- Check if we're in a new month (reset needed)
  IF date_trunc('month', v_last_reset) < v_month_start THEN
    -- Determine limits based on tier and subscription status
    IF v_tier = 'premium' AND v_tier_status IN ('active', 'trialing') THEN
      v_exam_limit := 10;
      v_practice_limit := 15;
    ELSE
      v_exam_limit := 2;
      v_practice_limit := 3;
    END IF;

    -- Reset credits AND track the monthly limits
    UPDATE public.user_credits
    SET share_credits_exam = v_exam_limit,
        share_credits_practice = v_practice_limit,
        share_credits_exam_monthly_limit = v_exam_limit,
        share_credits_practice_monthly_limit = v_practice_limit,
        share_credits_last_reset_at = now(),
        updated_at = now()
    WHERE user_id = p_user_id;

    v_did_reset := true;
    v_current_exam_credits := v_exam_limit;
    v_current_practice_credits := v_practice_limit;

    RAISE NOTICE 'Monthly credits reset for user % (tier: %, exam: %, practice: %)',
      p_user_id, v_tier, v_exam_limit, v_practice_limit;
  ELSE
    -- No reset needed, get current credits
    SELECT share_credits_exam, share_credits_practice
    INTO v_current_exam_credits, v_current_practice_credits
    FROM public.user_credits
    WHERE user_id = p_user_id;
  END IF;

  -- Return current state
  RETURN jsonb_build_object(
    'reset_performed', v_did_reset,
    'exam_credits', v_current_exam_credits,
    'practice_credits', v_current_practice_credits,
    'last_reset_at', (SELECT share_credits_last_reset_at FROM user_credits WHERE user_id = p_user_id),
    'tier', v_tier
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_and_reset_monthly_credits IS
'Checks if share credits need monthly reset and performs it. Now also tracks monthly limits for accurate usage calculation.';
```

### Step 2: Deploy Code Changes

The code changes are already committed. Just deploy them:

```bash
# If using Vercel
vercel --prod

# Or rebuild/restart your Next.js app
npm run build
```

### Step 3: Verify the Fix

1. Check the sub-header displays correct sharing counters
2. Verify practice hours show calculated values from database
3. Confirm last result shows the most recent exam score

## Testing

Run the diagnostic script to verify for specific users:

```bash
node scripts/diagnose-share-credits.mjs
```

This will show:
- Current share credits in database
- Actual shares created in forum
- Whether there's a mismatch
- Recommended fixes if needed

## Key Changes Explained

### Before Fix
```typescript
const examSharesUsed = defaultExamShares - examSharesRemaining
// Problem: defaultExamShares could be different from the limit set at reset
```

### After Fix
```typescript
const examMonthlyLimit = credits.share_credits_exam_monthly_limit ?? limits.examSharesPerMonth
const examSharesUsed = Math.max(0, examMonthlyLimit - examSharesRemaining)
// Solution: Use the tracked monthly limit from the last reset
```

## Additional Fixes

### Practice Hours & Last Result
- Enhanced `/api/profile/performance` to calculate total practice hours from all sessions
- Added `lastResult` field showing most recent exam score
- Updated dashboard to display these dynamic values instead of hardcoded `--` and `0`

## Rollback Plan

If issues occur, you can temporarily revert the API changes:

```typescript
// In src/app/api/subscription/limits/route.ts
// Comment out the monthly reset call and use fallback logic
const examMonthlyLimit = limits.examSharesPerMonth
const practiceMonthlyLimit = limits.practiceSharesPerMonth
```

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify migration was applied successfully in Supabase
3. Run diagnostic script to check user data
4. Review server logs for API errors
