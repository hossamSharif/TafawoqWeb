# Critical Subscription System Issues Found

**Date**: 2025-12-18
**User Email**: husameldeenh@gmail.com
**Testing Target**: $49 Premium Plan Subscription Flow

## Issues Identified

### 🔴 CRITICAL Issue #1: Missing Database Columns for Grace Period

**Location**: `public.user_subscriptions` table

**Problem**: The grace period functionality code (in `src/lib/subscription/grace-period.ts` and `src/app/api/webhooks/stripe/route.ts`) references database columns that **DO NOT EXIST**:

- `grace_period_end` (timestamp with time zone)
- `payment_failed_at` (timestamp with time zone)
- `downgrade_scheduled` (boolean)

**Impact**:
- Stripe webhook will FAIL when handling `invoice.payment_failed` events
- Stripe webhook will FAIL when handling `invoice.payment_succeeded` events (when clearing grace period)
- Payment failure recovery will NOT work
- Grace period functionality is completely broken
- Users will experience failed subscription renewals without proper notifications

**Error that will occur**:
```
ERROR: column "grace_period_end" of relation "user_subscriptions" does not exist
ERROR: column "payment_failed_at" of relation "user_subscriptions" does not exist
ERROR: column "downgrade_scheduled" of relation "user_subscriptions" does not exist
```

**Affected Code**:
- `src/app/api/webhooks/stripe/route.ts` (lines 196, 202, 218, 230)
- `src/lib/subscription/grace-period.ts` (lines 39, 84-90, 112-116, 147-152)

---

### 🟡 MODERATE Issue #2: Missing Notification Type in Database

**Location**: `public.notifications` table

**Problem**: The notifications table has a check constraint on the `type` field that only allows specific types. The grace period code tries to insert notification types that are NOT in the allowed list:

- `payment_failed` - **NOT ALLOWED** (referenced in grace-period.ts:184)
- `payment_success` - **NOT ALLOWED** (referenced in grace-period.ts:128)
- `grace_period_warning` - **NOT ALLOWED** (referenced in grace-period.ts:206)

**Current Allowed Types** (from database schema):
- `exam_completed`
- `new_comment`
- `comment_reply`
- `report_resolved`
- `reward_earned`

**Impact**:
- Notification inserts will FAIL with constraint violation
- Users will NOT receive payment failure notifications
- Users will NOT receive payment success notifications
- Users will NOT receive grace period warnings

**Error that will occur**:
```
ERROR: new row for relation "notifications" violates check constraint "notifications_type_check"
DETAIL: Failing row contains (payment_failed, ...)
```

---

## Database State Analysis

### Current User Status
```sql
Email: husameldeenh@gmail.com
Tier: free
Status: active
Stripe Customer ID: NULL
Stripe Subscription ID: NULL
Created: 2025-12-16 23:45:54
```

### Current user_subscriptions Schema
```
- id: uuid
- user_id: uuid
- stripe_customer_id: text (nullable)
- stripe_subscription_id: text (nullable)
- tier: text (default: 'free')
- status: text (default: 'active')
- trial_end_at: timestamptz (nullable)
- current_period_start: timestamptz (nullable)
- current_period_end: timestamptz (nullable)
- canceled_at: timestamptz (nullable)
- created_at: timestamptz
- updated_at: timestamptz

MISSING:
- grace_period_end: timestamptz
- payment_failed_at: timestamptz
- downgrade_scheduled: boolean
```

---

## Subscription Data Flow

### Expected Flow:
1. User clicks "ابدأ التجربة المجانية" on `/subscription` page
2. POST request to `/api/subscription/checkout`
3. Creates Stripe customer (if needed) ✅
4. Creates Stripe checkout session with price_1SdeIOF88fPc2FrW4HpIyKAF ✅
5. Redirects to Stripe hosted checkout page ✅
6. User enters test card: 4242 4242 4242 4242
7. Stripe processes payment
8. Stripe sends webhook `checkout.session.completed` ✅
9. Webhook handler updates user_subscriptions table ✅
10. User is redirected to `/dashboard?subscription=success` ✅

### Broken Flow (Payment Failure):
1. Stripe charges fail renewal
2. Stripe sends webhook `invoice.payment_failed` ❌
3. Webhook tries to insert `grace_period_end` - **FAILS** ❌
4. Webhook tries to insert notification with type `payment_failed` - **FAILS** ❌
5. User is NOT notified
6. User loses premium access unexpectedly

---

## Recommended Fixes

### Fix #1: Add Missing Columns to user_subscriptions

Create migration: `supabase/migrations/20241218000003_add_grace_period_columns.sql`

```sql
-- Migration: Add grace period columns to user_subscriptions
-- Date: 2025-12-18
-- Description: Add columns needed for payment failure grace period handling

ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS grace_period_end timestamptz,
ADD COLUMN IF NOT EXISTS payment_failed_at timestamptz,
ADD COLUMN IF NOT EXISTS downgrade_scheduled boolean DEFAULT false;

COMMENT ON COLUMN public.user_subscriptions.grace_period_end IS 'End date of grace period after payment failure';
COMMENT ON COLUMN public.user_subscriptions.payment_failed_at IS 'Timestamp when payment failed';
COMMENT ON COLUMN public.user_subscriptions.downgrade_scheduled IS 'Whether downgrade is scheduled after grace period';
```

### Fix #2: Update Notification Type Constraint

Create migration: `supabase/migrations/20241218000004_update_notification_types.sql`

```sql
-- Migration: Update notification types to include payment notifications
-- Date: 2025-12-18
-- Description: Add payment_failed, payment_success, and grace_period_warning to allowed notification types

ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check CHECK (
  type = ANY (ARRAY[
    'exam_completed'::text,
    'new_comment'::text,
    'comment_reply'::text,
    'report_resolved'::text,
    'reward_earned'::text,
    'payment_failed'::text,
    'payment_success'::text,
    'grace_period_warning'::text
  ])
);

COMMENT ON CONSTRAINT notifications_type_check ON public.notifications IS 'Allowed notification types including payment notifications';
```

---

## Testing Plan After Fixes

### Test Case 1: Successful Subscription
1. Navigate to http://localhost:3000
2. Login with husameldeenh@gmail.com / Hossam1990@
3. Navigate to /subscription
4. Click "ابدأ التجربة المجانية"
5. Use test card: 4242 4242 4242 4242, future expiry, any CVC
6. Verify redirect to /dashboard?subscription=success
7. Verify user_subscriptions updated with:
   - tier: 'premium'
   - status: 'trialing' or 'active'
   - stripe_customer_id: populated
   - stripe_subscription_id: populated
8. Verify premium features are accessible

### Test Case 2: Payment Failure (After Fixes)
1. Use Stripe test card: 4000 0000 0000 0341 (payment fails)
2. Trigger renewal in Stripe dashboard
3. Verify webhook handles payment_failed event
4. Verify user_subscriptions updated with:
   - status: 'past_due'
   - grace_period_end: set to +3 days
   - payment_failed_at: set to now
   - downgrade_scheduled: true
5. Verify notification created with type 'payment_failed'
6. Verify user RETAINS premium access during grace period

### Test Case 3: Payment Recovery
1. Update payment method in Stripe
2. Trigger successful payment
3. Verify webhook handles payment_succeeded event
4. Verify user_subscriptions updated with:
   - status: 'active'
   - grace_period_end: NULL
   - payment_failed_at: NULL
   - downgrade_scheduled: false
5. Verify notification created with type 'payment_success'

---

## Priority

**URGENT - MUST FIX BEFORE PRODUCTION**

These issues will cause:
- Complete failure of payment error handling
- User frustration from unexpected premium access loss
- No notifications for payment issues
- Broken webhook processing
- Potential revenue loss from failed renewals

---

## Next Steps

1. ✅ Create database migrations
2. ⏳ Apply migrations to database
3. ⏳ Test subscription flow end-to-end
4. ⏳ Test payment failure scenarios
5. ⏳ Test payment recovery scenarios
6. ⏳ Monitor Stripe webhook logs for errors
