# Subscription Testing Guide - $49 Premium Plan

**Date**: 2025-12-18
**Test Account**: husameldeenh@gmail.com
**Password**: Hossam1990@
**Application URL**: http://localhost:3000
**Stripe Price ID**: price_1SdeIOF88fPc2FrW4HpIyKAF

---

## Pre-Testing Checklist

✅ Development server is running on http://localhost:3000
✅ Database migrations applied successfully:
- `20241218000003_add_grace_period_columns.sql` ✅
- `20241218000004_update_notification_types.sql` ✅

✅ Database schema verified:
- `user_subscriptions.grace_period_end` column exists ✅
- `user_subscriptions.payment_failed_at` column exists ✅
- `user_subscriptions.downgrade_scheduled` column exists ✅
- `notifications.type` accepts payment notification types ✅
- `notifications.metadata` column exists ✅
- `notifications.read` column exists ✅

---

## Test Case 1: Successful Premium Subscription Flow

### Objective
Verify that a user can successfully subscribe to the $49 premium plan using Stripe test cards.

### Prerequisites
- User is logged in as husameldeenh@gmail.com
- User currently has free tier subscription

### Steps

1. **Navigate to Subscription Page**
   - URL: http://localhost:3000/subscription
   - Expected: See two pricing cards (Free and Premium)
   - Expected: Premium plan shows "49 ر.س/شهر"
   - Expected: Premium plan has "ابدأ التجربة المجانية" button

2. **Initiate Checkout**
   - Click "ابدأ التجربة المجانية" button
   - Expected: Loading state appears
   - Expected: Redirect to Stripe hosted checkout page
   - Expected: URL contains `checkout.stripe.com`

3. **Complete Payment on Stripe**
   - **Email**: husameldeenh@gmail.com (should be pre-filled)
   - **Card Number**: 4242 4242 4242 4242
   - **Expiry**: Any future date (e.g., 12/25)
   - **CVC**: Any 3 digits (e.g., 123)
   - **Name**: Husam Eldeen
   - Click "Subscribe"
   - Expected: Processing animation
   - Expected: Redirect to http://localhost:3000/dashboard?subscription=success

4. **Verify Subscription in Application**
   - Navigate to /subscription page
   - Expected: See "أنت مشترك في الخطة المميزة" or "أنت في فترة التجربة المجانية"
   - Expected: "إدارة الاشتراك" button appears
   - Navigate to /dashboard
   - Expected: Premium features are accessible
   - Expected: No exam limit warnings

5. **Verify Database State**
   ```sql
   SELECT
     tier, status, stripe_customer_id, stripe_subscription_id,
     trial_end_at, current_period_end, grace_period_end
   FROM user_subscriptions
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'husameldeenh@gmail.com');
   ```
   - Expected tier: `premium`
   - Expected status: `trialing` or `active`
   - Expected stripe_customer_id: `cus_XXXXX` (populated)
   - Expected stripe_subscription_id: `sub_XXXXX` (populated)
   - Expected trial_end_at: Set to 3 days from now (if trialing)
   - Expected grace_period_end: `NULL`

### Success Criteria
- ✅ User successfully redirected to Stripe checkout
- ✅ Payment processed without errors
- ✅ User redirected back to application
- ✅ Database updated with premium tier and active/trialing status
- ✅ Stripe customer and subscription IDs populated
- ✅ Premium features accessible in application

---

## Test Case 2: Stripe Customer Portal Access

### Objective
Verify that users can access the Stripe Customer Portal to manage their subscription.

### Prerequisites
- User has active premium subscription (from Test Case 1)

### Steps

1. **Navigate to Subscription Page**
   - URL: http://localhost:3000/subscription

2. **Open Customer Portal**
   - Click "إدارة الاشتراك" button
   - Expected: Redirect to Stripe Customer Portal
   - Expected: URL contains `billing.stripe.com`

3. **Verify Portal Features**
   - Expected: See current subscription details
   - Expected: See payment method
   - Expected: See option to update payment method
   - Expected: See option to cancel subscription
   - Expected: See billing history

4. **Return to Application**
   - Click "Back to [App Name]" or similar
   - Expected: Redirect back to application

### Success Criteria
- ✅ Portal opens without errors
- ✅ Subscription details match application state
- ✅ User can view payment method
- ✅ User can return to application

---

## Test Case 3: Subscription Cancellation

### Objective
Verify that users can cancel their subscription through the Customer Portal.

### Prerequisites
- User has active premium subscription

### Steps

1. **Open Customer Portal**
   - Navigate to /subscription
   - Click "إدارة الاشتراك"

2. **Cancel Subscription**
   - Click "Cancel plan" or similar
   - Confirm cancellation
   - Expected: Cancellation confirmation message
   - Expected: Subscription status shows "Cancels on [date]"

3. **Verify in Application**
   - Return to application
   - Navigate to /subscription
   - Expected: See cancellation notice
   - Expected: Premium access continues until period end

4. **Verify Database State**
   ```sql
   SELECT status, canceled_at, current_period_end
   FROM user_subscriptions
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'husameldeenh@gmail.com');
   ```
   - Expected status: `canceled` (after webhook processed)
   - Expected canceled_at: Timestamp of cancellation
   - Expected current_period_end: Original end date (access continues until then)

5. **Verify Webhook Processing**
   - Check Stripe Dashboard → Developers → Webhooks → Events
   - Expected: `customer.subscription.deleted` event sent
   - Expected: Webhook response status 200

### Success Criteria
- ✅ Cancellation completes successfully
- ✅ Webhook updates database status to canceled
- ✅ User retains access until period end
- ✅ Application shows correct status

---

## Test Case 4: Payment Failure and Grace Period

### Objective
Verify that payment failures trigger grace period and proper notifications.

### Prerequisites
- User has active premium subscription
- Need to simulate payment failure

### Setup for Payment Failure
**Option A: Use Stripe Test Card for Declined Payment**
- Card: 4000 0000 0000 0341 (payment fails after initial success)
- Or use Stripe Dashboard to manually fail the next invoice

**Option B: Use Stripe Dashboard**
1. Go to Stripe Dashboard → Subscriptions
2. Find the test subscription
3. Click "Actions" → "Fail next invoice"

### Steps

1. **Trigger Payment Failure**
   - Use one of the setup methods above
   - Or wait for natural renewal (if testing in test mode, you can advance subscription period)

2. **Verify Webhook Received**
   - Stripe sends `invoice.payment_failed` webhook
   - Check application logs for webhook processing
   - Expected log: `[Stripe Webhook] Started grace period for user...`

3. **Verify Grace Period in Database**
   ```sql
   SELECT
     status, grace_period_end, payment_failed_at,
     downgrade_scheduled, tier
   FROM user_subscriptions
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'husameldeenh@gmail.com');
   ```
   - Expected status: `past_due`
   - Expected grace_period_end: 3 days from now
   - Expected payment_failed_at: Current timestamp
   - Expected downgrade_scheduled: `true`
   - Expected tier: Still `premium`

4. **Verify Notification Created**
   ```sql
   SELECT type, title, message, read, metadata
   FROM notifications
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'husameldeenh@gmail.com')
     AND type = 'payment_failed'
   ORDER BY created_at DESC
   LIMIT 1;
   ```
   - Expected type: `payment_failed`
   - Expected message contains: "فشلت عملية الدفع" and "3 أيام"
   - Expected metadata: `{"days_remaining": 3}`

5. **Verify Premium Access Retained**
   - Login as user
   - Navigate to /dashboard
   - Expected: Premium features still accessible
   - Expected: Warning banner about payment failure (if implemented)

### Success Criteria
- ✅ Webhook processes payment_failed event
- ✅ Grace period set correctly (3 days)
- ✅ Database status updated to past_due
- ✅ Notification created successfully
- ✅ User retains premium access during grace period

---

## Test Case 5: Payment Recovery During Grace Period

### Objective
Verify that successful payment during grace period clears grace period and restores full access.

### Prerequisites
- User is in grace period (from Test Case 4)

### Steps

1. **Update Payment Method**
   - Navigate to /subscription
   - Click "إدارة الاشتراك"
   - Update to valid payment method (4242 4242 4242 4242)
   - Or manually trigger payment retry in Stripe Dashboard

2. **Trigger Payment Retry**
   - In Stripe Dashboard: Subscriptions → [Subscription] → "Retry payment"
   - Expected: Payment succeeds

3. **Verify Webhook Received**
   - Stripe sends `invoice.payment_succeeded` webhook
   - Check logs for: `[Stripe Webhook] Cleared grace period for user...`

4. **Verify Grace Period Cleared**
   ```sql
   SELECT
     status, grace_period_end, payment_failed_at,
     downgrade_scheduled
   FROM user_subscriptions
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'husameldeenh@gmail.com');
   ```
   - Expected status: `active`
   - Expected grace_period_end: `NULL`
   - Expected payment_failed_at: `NULL`
   - Expected downgrade_scheduled: `false`

5. **Verify Success Notification**
   ```sql
   SELECT type, title, message
   FROM notifications
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'husameldeenh@gmail.com')
     AND type = 'payment_success'
   ORDER BY created_at DESC
   LIMIT 1;
   ```
   - Expected type: `payment_success`
   - Expected message: Contains "تم استلام الدفعة"

### Success Criteria
- ✅ Payment succeeds on retry
- ✅ Webhook clears grace period
- ✅ Status returns to active
- ✅ Success notification created
- ✅ Premium access continues without interruption

---

## Test Case 6: Subscription Reactivation

### Objective
Verify that cancelled subscriptions can be reactivated.

### Prerequisites
- User has cancelled subscription (from Test Case 3)

### Steps

1. **Navigate to Subscription Page**
   - After subscription cancelled
   - Expected: See option to reactivate or subscribe again

2. **Reactivate Subscription**
   - Click reactivation button
   - Expected: Redirect to Stripe checkout or update subscription
   - Complete payment if needed

3. **Verify Database Update**
   ```sql
   SELECT tier, status, canceled_at
   FROM user_subscriptions
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'husameldeenh@gmail.com');
   ```
   - Expected tier: `premium`
   - Expected status: `active`
   - Expected canceled_at: `NULL`

### Success Criteria
- ✅ User can reactivate subscription
- ✅ Database updated correctly
- ✅ Premium access restored

---

## Common Stripe Test Cards

### Successful Payments
- **4242 4242 4242 4242** - Visa, no authentication required
- **4000 0566 5566 5556** - Visa (debit), no authentication required
- **5555 5555 5555 4444** - Mastercard, no authentication required

### Failed Payments
- **4000 0000 0000 0341** - Attaching fails
- **4000 0000 0000 9995** - Always fails with decline code

### 3D Secure Required
- **4000 0025 0000 3155** - Requires 3D Secure authentication

### Additional Details
- **Expiry**: Use any future date (e.g., 12/25)
- **CVC**: Use any 3 digits (e.g., 123)
- **ZIP**: Use any 5 digits (e.g., 12345)

---

## Database Verification Queries

### Check User Subscription Status
```sql
SELECT
  u.email,
  us.tier,
  us.status,
  us.stripe_customer_id,
  us.stripe_subscription_id,
  us.trial_end_at,
  us.current_period_end,
  us.grace_period_end,
  us.payment_failed_at,
  us.downgrade_scheduled,
  us.created_at,
  us.updated_at
FROM auth.users u
LEFT JOIN public.user_subscriptions us ON us.user_id = u.id
WHERE u.email = 'husameldeenh@gmail.com';
```

### Check Recent Notifications
```sql
SELECT
  type,
  title,
  message,
  read,
  metadata,
  created_at
FROM public.notifications
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'husameldeenh@gmail.com')
ORDER BY created_at DESC
LIMIT 10;
```

### Check Stripe Customer in Database
```sql
SELECT
  stripe_customer_id,
  stripe_subscription_id
FROM public.user_subscriptions
WHERE stripe_customer_id IS NOT NULL;
```

---

## Troubleshooting

### Issue: Webhook not receiving events
**Solution**:
1. Check Stripe Dashboard → Developers → Webhooks
2. Verify webhook URL is correct
3. Check webhook signing secret in .env.local
4. For local testing, use Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### Issue: Payment redirects but subscription not updated
**Solution**:
1. Check webhook events in Stripe Dashboard
2. Look for `checkout.session.completed` event
3. Check application logs for webhook processing errors
4. Verify database connection

### Issue: Grace period columns not found
**Solution**:
1. Verify migrations were applied: Check supabase/migrations
2. Run migration manually if needed
3. Check database schema matches expected structure

### Issue: Notification type constraint violation
**Solution**:
1. Verify migration 20241218000004 was applied
2. Check allowed notification types in database
3. Ensure code uses correct notification type values

---

## Stripe Dashboard URLs

- **Dashboard**: https://dashboard.stripe.com/test/dashboard
- **Subscriptions**: https://dashboard.stripe.com/test/subscriptions
- **Customers**: https://dashboard.stripe.com/test/customers
- **Webhooks**: https://dashboard.stripe.com/test/webhooks
- **Events**: https://dashboard.stripe.com/test/events
- **Logs**: https://dashboard.stripe.com/test/logs

---

## Expected Webhook Events Flow

### Successful Subscription
1. `checkout.session.completed` - Initial checkout
2. `customer.subscription.created` - Subscription created
3. `invoice.payment_succeeded` - First payment (if trial, this comes after trial ends)

### Payment Failure
1. `invoice.payment_failed` - Payment attempt failed
2. Grace period starts automatically

### Payment Recovery
1. `invoice.payment_succeeded` - Payment retry succeeded
2. Grace period clears automatically

### Cancellation
1. `customer.subscription.updated` - Subscription marked for cancellation
2. `customer.subscription.deleted` - Subscription cancelled (at period end)

---

## Post-Testing Cleanup

After testing is complete, you may want to:

1. **Delete test subscriptions** in Stripe Dashboard
2. **Reset user subscription** in database:
   ```sql
   UPDATE public.user_subscriptions
   SET
     tier = 'free',
     status = 'active',
     stripe_customer_id = NULL,
     stripe_subscription_id = NULL,
     trial_end_at = NULL,
     current_period_end = NULL,
     grace_period_end = NULL,
     payment_failed_at = NULL,
     downgrade_scheduled = false
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'husameldeenh@gmail.com');
   ```
3. **Clear test notifications**:
   ```sql
   DELETE FROM public.notifications
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'husameldeenh@gmail.com')
     AND type IN ('payment_failed', 'payment_success', 'grace_period_warning');
   ```

---

## Notes

- Always use Stripe test mode for testing
- Keep webhook signing secret secure
- Monitor webhook events in Stripe Dashboard during testing
- Check application logs for detailed error messages
- Test both successful and failure scenarios
- Verify database state after each major action
