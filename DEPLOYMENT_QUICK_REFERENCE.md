# TafawqoqWeb - Quick Deployment Reference

**For when you need answers fast during deployment.**

---

## 🔥 Critical URLs

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Google Cloud Console**: https://console.cloud.google.com
- **Sentry Dashboard**: https://sentry.io

---

## 🔑 Environment Variables Cheat Sheet

### Must Have (Deployment Will Fail Without These)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PREMIUM_PRICE_ID=price_...
ANTHROPIC_API_KEY=sk-ant-api03-...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

### Add After First Deployment
```bash
STRIPE_WEBHOOK_SECRET=whsec_...  # Get from Stripe after creating webhook
```

### Optional (But Recommended)
```bash
GEMINI_API_KEY=...
RESEND_API_KEY=re_...
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...
SENTRY_ORG=...
SENTRY_PROJECT=tafawoq
```

---

## 🚀 Deployment Sequence (30-Minute Express)

### 1. Deploy to Vercel (10 min)
```
1. Visit vercel.com/new
2. Import hossamSharif/TafawoqWeb
3. Add environment variables (copy from .env.production.template)
4. Deploy
5. Copy deployment URL: https://xxx.vercel.app
```

### 2. Configure Stripe Webhook (5 min)
```
1. Stripe Dashboard → Webhooks → Add endpoint
2. URL: https://xxx.vercel.app/api/webhooks/stripe
3. Events: checkout.session.completed, customer.subscription.*,
   invoice.payment_succeeded, invoice.payment_failed
4. Copy webhook secret (whsec_...)
5. Add to Vercel: STRIPE_WEBHOOK_SECRET
6. Redeploy
```

### 3. Enable Google OAuth (5 min)
```
1. Supabase → Authentication → Providers → Google → Enable
2. Add Client ID and Secret
3. Google Cloud Console → Credentials → Add redirect URI:
   https://[supabase-ref].supabase.co/auth/v1/callback
```

### 4. Test (10 min)
```
1. Register new user (email or Google)
2. Create practice session
3. Upgrade to Premium (test card: 4242 4242 4242 4242)
4. Check Stripe webhook processed (Dashboard → Webhooks → Recent)
5. Verify Premium features unlocked
```

---

## 🧪 Test Card Numbers

### Successful Payments
```
Card: 4242 4242 4242 4242
Exp: 12/34 (any future date)
CVC: 123 (any 3 digits)
ZIP: 12345 (any 5 digits)
```

### Payment Failures (for testing grace period)
```
Card: 4000 0000 0000 0341  (Generic decline)
Card: 4000 0000 0000 9995  (Insufficient funds)
```

### 3D Secure (for testing authentication)
```
Card: 4000 0025 0000 3155  (Requires authentication)
```

---

## 🔍 Where to Check When Things Go Wrong

### "Webhook not working"
```
1. Stripe Dashboard → Webhooks → Your endpoint → Recent deliveries
2. Look for red X (failed events)
3. Click failed event → View response
4. Common fixes:
   - Wrong URL (check webhook endpoint URL)
   - Missing STRIPE_WEBHOOK_SECRET in Vercel
   - Redeploy after adding webhook secret
```

### "Google OAuth not working"
```
1. Check browser console for errors
2. Verify Supabase → Authentication → Providers → Google is ENABLED
3. Google Cloud Console → Check redirect URIs match Supabase callback
4. Try incognito mode (cookie issues)
```

### "AI generation timing out"
```
1. Check Vercel logs (Deployments → Latest → View Function Logs)
2. If timeout (>10s):
   - Option A: Upgrade to Vercel Pro ($20/mo, 60s timeout)
   - Option B: Reduce batch sizes (EXAM_BATCH_SIZE=5 instead of 10)
3. If Anthropic error:
   - Check API quota at console.anthropic.com
```

### "User paid but still sees free tier"
```
1. Check Stripe Dashboard → Customers → Find customer → View events
2. Check if webhook was sent (look for checkout.session.completed)
3. Check Vercel logs for webhook processing
4. Check database:
   SELECT * FROM user_subscriptions WHERE user_id='xxx';
   Should have: tier='premium', status='active'
```

---

## 📊 Quick Database Queries

### Check User Subscription Status
```sql
SELECT
  user_id,
  tier,
  status,
  stripe_customer_id,
  stripe_subscription_id,
  current_period_end
FROM user_subscriptions
WHERE user_id = 'user-id-here';
```

### Check Recent Webhook Processing
```sql
-- Check if subscriptions are being created
SELECT
  created_at,
  tier,
  status,
  stripe_subscription_id
FROM user_subscriptions
ORDER BY created_at DESC
LIMIT 10;
```

### Check Monthly Exam Usage
```sql
SELECT
  user_id,
  COUNT(*) as exams_this_month
FROM exam_sessions
WHERE created_at >= date_trunc('month', CURRENT_DATE)
GROUP BY user_id
ORDER BY exams_this_month DESC;
```

### Verify RLS Policies Active
```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('exam_sessions', 'practice_sessions', 'user_subscriptions');
```

---

## 🔧 Emergency Fixes

### Manually Grant Premium Access
```sql
-- Only use if webhook failed and you need to fix immediately
UPDATE user_subscriptions
SET
  tier = 'premium',
  status = 'active',
  current_period_end = NOW() + INTERVAL '1 month',
  updated_at = NOW()
WHERE user_id = 'user-id-here';
```

### Clear Grace Period (After Payment Fixed)
```sql
UPDATE user_subscriptions
SET
  grace_period_end = NULL,
  payment_failed_at = NULL,
  downgrade_scheduled = false,
  status = 'active'
WHERE user_id = 'user-id-here';
```

### Reset Monthly Exam Counter (Use Sparingly)
```sql
-- This won't actually delete exams, just allows new ones
-- Better to upgrade user to Premium if they need more
-- Only use for genuine errors
UPDATE user_subscriptions
SET updated_at = NOW()
WHERE user_id = 'user-id-here';
```

---

## 📞 Support Contacts

### Vercel Support
- **Docs**: https://vercel.com/docs
- **Support**: https://vercel.com/support (Pro plan required for priority support)
- **Status**: https://vercel-status.com

### Stripe Support
- **Docs**: https://stripe.com/docs
- **Support**: https://support.stripe.com
- **Status**: https://status.stripe.com

### Supabase Support
- **Docs**: https://supabase.com/docs
- **Discord**: https://discord.supabase.com
- **Status**: https://status.supabase.com

### Anthropic Support
- **Docs**: https://docs.anthropic.com
- **Support**: support@anthropic.com
- **Status**: https://status.anthropic.com

---

## 💰 Cost Tracking (Monthly)

### Expected Costs (1000 Active Users)

| Service | Free Tier | Paid Plan | Expected Cost |
|---------|-----------|-----------|---------------|
| Vercel | 100GB bandwidth | Pro: $20/mo | $0-20 |
| Supabase | 500MB DB, 2GB bandwidth | Pro: $25/mo | $0-25 |
| Anthropic | Pay-per-use | ~$0.01/exam | $50-150 |
| Stripe | Free (2.9% + 30¢ per transaction) | No monthly fee | Transaction fees only |
| Sentry | 5K errors/mo | Team: $26/mo | $0 |
| Resend | 100 emails/day | Pro: $20/mo | $0 |
| Domain | N/A | ~$10-15/year | $1 |

**Total**: $50-200/month depending on usage

### Break-even Analysis
- Premium subscription: 49 SAR/mo ≈ $13/mo
- 10 Premium users = ~$130/mo revenue
- Covers base costs + profit margin

---

## ✅ Pre-Launch Checklist

**Before going live with real payments:**

- [ ] All tests passing (register, login, practice, exam, payment)
- [ ] Stripe webhooks working (test with test card)
- [ ] Google OAuth working (test login flow)
- [ ] Mobile responsive (test on phone)
- [ ] Arabic text correct (RTL layout)
- [ ] Sentry error tracking active
- [ ] Privacy policy page exists
- [ ] Terms of service page exists
- [ ] Support email configured
- [ ] Stripe live mode API keys ready
- [ ] Beta testing completed (5-10 users, 3-5 days)

**Switch to Live Mode:**

- [ ] Stripe: Toggle to Live mode
- [ ] Update Vercel env vars with live Stripe keys
- [ ] Create new webhook for live mode
- [ ] Update STRIPE_WEBHOOK_SECRET
- [ ] Test with real payment (your own card)
- [ ] Refund test payment
- [ ] Monitor closely for 24-48 hours

---

## 🎯 Success Metrics to Track

### Week 1
- Registrations
- Conversion rate (free → premium)
- Error rate (Sentry)
- Average exam generation time
- Webhook success rate

### Month 1
- Monthly Active Users (MAU)
- Premium subscriber count
- Churn rate
- Revenue
- API costs (Anthropic usage)

---

**Last Updated**: December 28, 2024

**Quick Links**:
- Full Guide: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- Plan: [C:\Users\skd\.claude\plans\enumerated-spinning-lynx.md](C:\Users\skd\.claude\plans\enumerated-spinning-lynx.md)
