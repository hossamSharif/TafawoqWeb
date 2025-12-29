# 🚀 Your Deployment Steps - START HERE!

**Everything is ready! Follow these steps exactly.**

---

## ✅ What You Have (All Set!)

- ✅ All API keys ready
- ✅ Supabase database ready
- ✅ Stripe test mode configured
- ✅ `.env.production` file created
- ✅ Code is deployment-ready

---

## 📋 Step-by-Step Deployment (30 minutes)

### Step 1: Deploy to Vercel (10 minutes)

**1.1 Go to Vercel**
- Open browser: https://vercel.com/new
- Sign in with GitHub (if not already signed in)

**1.2 Import Your Repository**
- Click "Import Project"
- Find repository: `hossamSharif/TafawoqWeb`
- Click "Import"

**1.3 Configure Project**
- **Framework Preset**: Next.js (auto-detected) ✅
- **Root Directory**: `./` (default) ✅
- **Build Command**: `npm run build` (default) ✅
- Leave all build settings as default

**1.4 Add Environment Variables**

Click "Environment Variables" and add these **EXACTLY** (copy from `.env.production`):

```bash
# Copy ALL variables from your .env.production file
# Go to your .env.production file and copy all the values exactly as they appear there

NEXT_PUBLIC_SUPABASE_URL=<from .env.production>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from .env.production>
SUPABASE_SERVICE_ROLE_KEY=<from .env.production>

# Stripe (TEST MODE)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<from .env.production>
STRIPE_SECRET_KEY=<from .env.production>
STRIPE_PREMIUM_PRICE_ID=<from .env.production>

# Anthropic (AI)
ANTHROPIC_API_KEY=<from .env.production>

# Gemini (Backup AI)
GEMINI_API_KEY=<from .env.production>

# OpenRouter (Alternative AI)
OPENROUTER_API_KEY=<from .env.production>

# Resend (Email)
RESEND_API_KEY=<from .env.production>
ADMIN_REVIEW_EMAIL=<from .env.production>

# App Config (temporary - will update after deployment)
NEXT_PUBLIC_APP_URL=https://tafawoqweb.vercel.app
NODE_ENV=production
```

**IMPORTANT**:
- Mark these as **Sensitive** (hide from logs):
  - All SUPABASE_* keys
  - All STRIPE_* keys
  - All API keys (ANTHROPIC, GEMINI, OPENROUTER, RESEND)
- Apply to: **Production**, **Preview**, **Development**

**DO NOT add STRIPE_WEBHOOK_SECRET yet** - you'll add it in Step 2!

**1.5 Deploy!**
- Click "Deploy" button
- Wait 5-10 minutes (watch the build logs)
- ☕ Grab coffee while it builds

**1.6 Save Your Deployment URL**
Once deployed, you'll see something like:
```
🎉 Your project is live at:
https://tafawoqweb.vercel.app
```

**Copy this URL - you'll need it next!**

---

### Step 2: Configure Stripe Webhook (5 minutes)

**2.1 Create New Webhook**
- Go to: https://dashboard.stripe.com/test/webhooks
- Click "Add endpoint"

**2.2 Configure Webhook**
- **Endpoint URL**: `https://your-vercel-url.vercel.app/api/webhooks/stripe`
  - Example: `https://tafawoqweb.vercel.app/api/webhooks/stripe`
- **Description**: "TafawqoqWeb Production Webhook"

**2.3 Select Events** (click "Select events" button):
Select these **6 events exactly**:
- [x] `checkout.session.completed`
- [x] `customer.subscription.created`
- [x] `customer.subscription.updated`
- [x] `customer.subscription.deleted`
- [x] `invoice.payment_succeeded`
- [x] `invoice.payment_failed`

**2.4 Save Webhook**
- Click "Add endpoint"
- You'll see your new webhook in the list

**2.5 Get Webhook Secret**
- Click on the webhook you just created
- Click "Reveal" under "Signing secret"
- Copy the secret (starts with `whsec_...`)

**2.6 Add to Vercel**
- Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
- Click "Add New"
- Key: `STRIPE_WEBHOOK_SECRET`
- Value: `whsec_...` (paste the secret you copied)
- Environments: **Production**, **Preview**, **Development**
- Click "Save"

**2.7 CRITICAL: Redeploy**
- Go to: Deployments tab
- Click "..." on latest deployment
- Click "Redeploy"
- Wait 3-5 minutes

**Why redeploy?** New environment variables only take effect after redeployment!

---

### Step 3: Update App URL (2 minutes)

**3.1 Update Environment Variable**
- Vercel Dashboard → Settings → Environment Variables
- Find `NEXT_PUBLIC_APP_URL`
- Click "Edit"
- Change from `https://tafawoqweb.vercel.app` to your **actual URL**
- Click "Save"

**3.2 Redeploy Again**
- Deployments → ... → Redeploy
- Wait 3-5 minutes

---

### Step 4: Test Everything! (15 minutes)

**4.1 Visit Your Site**
- Open: `https://your-vercel-url.vercel.app`
- Should see TafawqoqWeb homepage
- Arabic text should display correctly

**4.2 Test User Registration (Email)**
- Click "Register" or go to `/register`
- Register with test email: `test@example.com`
- Password: anything (e.g., `Test123456!`)
- Check Supabase for OTP email (or check spam)
- Enter OTP to verify
- Complete phone number (Saudi format: 966xxxxxxxxx)
- Select academic track
- Should land on `/dashboard`

**4.3 Test Google OAuth**
- Logout (if logged in)
- Go to `/login`
- Click "Continue with Google"
- **EXPECTED**: Will fail because Google OAuth not configured yet
- **This is OK!** We'll configure it in Step 5

**4.4 Test Practice Session**
- From dashboard, click "Practice"
- Select 2 categories (free tier limit)
- Select 5 questions (free tier limit)
- Click "Start Practice"
- Wait 10-20 seconds for AI to generate questions
- Should see questions appear
- Answer a few questions
- Check if it works smoothly

**4.5 Test Exam (Critical!)**
- From dashboard, click "Exams"
- Select exam type
- Click "Start Exam"
- Wait for AI generation
- Verify exam starts
- You don't need to complete it - just verify it works

**4.6 Test Stripe Payment (CRITICAL!)**

This is the most important test!

- Go to `/subscription` page
- You should see Free vs Premium plans
- Click "Upgrade to Premium"
- Should redirect to Stripe Checkout
- **Use TEST card**: `4242 4242 4242 4242`
- Expiry: `12/34` (any future date)
- CVC: `123` (any 3 digits)
- Click "Subscribe"

**What should happen**:
1. Redirected back to `/dashboard?subscription=success`
2. Wait 5-10 seconds
3. Check Supabase → `user_subscriptions` table:
   - Your user should have `tier='premium'`
   - `status='active'` or `trialing'`
   - `stripe_customer_id` populated
   - `stripe_subscription_id` populated

**If subscription didn't update**:
- Check Stripe Dashboard → Webhooks → Your endpoint
- Click on recent webhook events
- Look for `checkout.session.completed` event
- Should show green checkmark (200 response)
- If red X (failed), click to see error
- Check Vercel → Deployments → Latest → View Function Logs
- Look for webhook processing logs

**4.7 Test Premium Features**
- Try creating 4th, 5th exam (should work now with Premium)
- Before Premium: limited to 3 exams/month
- After Premium: unlimited exams

**4.8 Test Billing Portal**
- From subscription page, click "Manage Subscription"
- Should redirect to Stripe billing portal
- Verify you can see:
  - Current subscription
  - Payment method
  - Invoices
  - Option to cancel

---

### Step 5: Configure Google OAuth (Optional - 10 minutes)

**You already have Google OAuth credentials, so let's enable it:**

**5.1 Enable in Supabase**
- Go to: Supabase Dashboard (https://supabase.com/dashboard)
- Select your project: `fvstedbsjiqvryqpnmzl`
- Go to: Authentication → Providers
- Find "Google"
- Toggle "Enable Sign in with Google" to **ON**

**5.2 Add Your Google Credentials**
You need to add your Google Client ID and Secret here.

**Do you have these?** If yes:
- Client ID: `xxxxx.apps.googleusercontent.com`
- Client Secret: `GOCSPX-xxxxx`
- Paste them in Supabase
- Click "Save"

**If you don't have them**, skip this for now - you can add later.

**5.3 Update Google Cloud Console** (if you have credentials)
- Go to: https://console.cloud.google.com
- APIs & Services → Credentials
- Click your OAuth 2.0 Client ID
- Under "Authorized redirect URIs", add:
  ```
  https://fvstedbsjiqvryqpnmzl.supabase.co/auth/v1/callback
  https://your-vercel-url.vercel.app/auth/callback
  ```
- Click "Save"

**5.4 Test Google Login**
- Go to your site `/login`
- Click "Continue with Google"
- Should work now!
- Complete onboarding (phone + track)
- Land on dashboard

---

## ✅ Success Checklist

After completing all steps, verify:

- [x] Site is live at Vercel URL
- [x] Homepage loads correctly
- [x] Arabic text displays (RTL)
- [x] Can register with email/password
- [x] Can create practice sessions
- [x] Can create exams (AI generates questions)
- [x] Can upgrade to Premium (test card)
- [x] Subscription updates in database
- [x] Stripe webhook shows 200 responses
- [x] Can access billing portal
- [x] Premium features work (unlimited exams)
- [ ] Google OAuth works (optional)

---

## 🎉 You're Live!

**What you have now**:
- ✅ Production site running on Vercel
- ✅ Using same Supabase database
- ✅ Stripe payments working (TEST MODE)
- ✅ AI exam generation working
- ✅ All features functional

**Next steps** (later):
1. Beta test with 5-10 friends for 1-2 weeks
2. Fix any bugs found
3. When ready for real payments:
   - Complete Stripe business verification
   - Switch to Stripe live mode keys
   - Create new webhook for live mode
4. Public launch!

---

## 🆘 If Something Goes Wrong

### Build Failed
- Check Vercel build logs for errors
- Most common: missing environment variable
- Solution: Add the missing variable, redeploy

### Webhook Not Working
- Go to: Stripe Dashboard → Webhooks → Your endpoint → Recent deliveries
- Look for failed events (red X)
- Click failed event to see error
- Common fix: Redeploy after adding `STRIPE_WEBHOOK_SECRET`

### AI Generation Timeout
- Check Vercel function logs
- If timeout (>10s): Consider upgrading to Vercel Pro ($20/mo for 60s timeout)
- Or reduce batch sizes in environment variables

### Subscription Not Updating
- Verify webhook secret is correct
- Verify webhook events are selected
- Check Vercel logs for webhook processing
- Manually check `user_subscriptions` table in Supabase

---

## 📞 Need Help?

1. Check `DEPLOYMENT_QUICK_REFERENCE.md` for common issues
2. Check Vercel logs: Deployments → Latest → View Function Logs
3. Check Stripe webhook logs: Dashboard → Webhooks → Your endpoint
4. Check Supabase logs: Dashboard → Database → Logs

---

**Ready? Start with Step 1!** 🚀
