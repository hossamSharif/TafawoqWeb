# Quickstart: Tafawoq - Saudi Aptitude Exam Preparation Platform

**Branch**: `001-tafawoq-exam-platform` | **Date**: 2025-12-11

This guide provides step-by-step instructions to set up the development environment and run the Tafawoq platform locally.

---

## Prerequisites

- **Node.js**: v18.17.0 or later (LTS recommended)
- **npm**: v9.x or later (comes with Node.js)
- **Git**: For version control
- **Supabase CLI**: For local database development
- **Stripe CLI**: For webhook testing

### Install Prerequisites

```bash
# Install Supabase CLI
npm install -g supabase

# Install Stripe CLI (macOS)
brew install stripe/stripe-cli/stripe

# Install Stripe CLI (Windows via Scoop)
scoop install stripe
```

---

## 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd TafawqoqWeb

# Switch to feature branch
git checkout 001-tafawoq-exam-platform

# Install dependencies
npm install
```

---

## 2. Environment Setup

Create a `.env.local` file in the project root:

```bash
# Copy example environment file
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Obtaining API Keys

#### Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy the Project URL and anon/public key
4. Copy the service_role key (keep this secret!)

#### Stripe
1. Create an account at [stripe.com](https://stripe.com)
2. Go to Developers > API keys
3. Use test mode keys for development

#### Google Gemini
1. Go to [Google AI Studio](https://aistudio.google.com)
2. Create an API key
3. Enable the Generative AI API

#### Sentry
1. Create a project at [sentry.io](https://sentry.io)
2. Select Next.js as the platform
3. Copy the DSN from project settings

---

## 3. Database Setup

### Option A: Using Supabase Cloud (Recommended for quick start)

1. Create a new Supabase project
2. Run migrations using Supabase MCP tools or dashboard

### Option B: Local Supabase (Full development setup)

```bash
# Start local Supabase
supabase start

# This will output local URLs and keys
# Update .env.local with local values

# Apply migrations
supabase db push
```

### Run Database Migrations

Migrations are located in `supabase/migrations/`. Apply them in order:

```bash
# Using Supabase CLI
supabase db push

# Or via dashboard SQL editor, run each migration file
```

### Generate TypeScript Types

```bash
# Generate types from database schema
supabase gen types typescript --local > src/lib/supabase/types.ts

# Or from cloud project
supabase gen types typescript --project-id your-project-id > src/lib/supabase/types.ts
```

---

## 4. Stripe Setup

### Create Products and Prices

1. Go to Stripe Dashboard > Products
2. Create a product called "Tafawoq Premium"
3. Add a recurring price: SAR 49/month
4. Note the Price ID (starts with `price_`)
5. Update the Price ID in your subscription configuration

### Configure Customer Portal

1. Go to Stripe Dashboard > Settings > Billing > Customer portal
2. Enable the customer portal
3. Configure allowed actions:
   - Update payment methods
   - Cancel subscriptions
   - View invoices

### Set Up Webhook Endpoint

```bash
# Start Stripe webhook listener (development)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the webhook signing secret (starts with whsec_)
# Add it to .env.local as STRIPE_WEBHOOK_SECRET
```

---

## 5. Run Development Server

```bash
# Start Next.js development server
npm run dev

# The app will be available at http://localhost:3000
```

### Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run type checking
npm run type-check

# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

---

## 6. Testing Stripe Payments

### Test Card Numbers

Use these test cards in development:

| Scenario | Card Number | Expiry | CVC |
|----------|-------------|--------|-----|
| Success | 4242 4242 4242 4242 | Any future date | Any 3 digits |
| Decline | 4000 0000 0000 0002 | Any future date | Any 3 digits |
| Requires auth | 4000 0025 0000 3155 | Any future date | Any 3 digits |

### Trigger Webhook Events

```bash
# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_succeeded
```

---

## 7. Testing Gemini Integration

### Verify API Connection

```bash
# Test Gemini API (add to scripts or run in Node REPL)
node -e "
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
model.generateContent('Say hello in Arabic').then(r => console.log(r.response.text()));
"
```

### Sample Exam Generation Test

The exam generation can be tested by:
1. Registering a new user
2. Completing onboarding with academic track selection
3. Starting a full exam from the dashboard
4. Verifying 96 questions are generated with proper distribution

---

## 8. Project Structure Overview

```
TafawqoqWeb/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── (auth)/           # Auth routes (login, register, verify)
│   │   ├── (main)/           # Main app routes (dashboard, exam, practice)
│   │   ├── api/              # API routes
│   │   ├── layout.tsx        # Root layout with RTL/fonts
│   │   └── globals.css       # Global styles
│   ├── components/           # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── exam/             # Exam-specific components
│   │   ├── practice/         # Practice-specific components
│   │   ├── diagrams/         # Visual rendering
│   │   ├── analytics/        # Performance display
│   │   └── shared/           # Shared components
│   ├── lib/                  # Library code
│   │   ├── supabase/         # Supabase client and helpers
│   │   ├── stripe/           # Stripe integration
│   │   ├── gemini/           # Gemini API client
│   │   └── utils/            # Utility functions
│   ├── hooks/                # Custom React hooks
│   ├── contexts/             # React contexts
│   └── types/                # TypeScript types
├── tests/                    # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── public/                   # Static assets
├── supabase/                 # Supabase config and migrations
│   └── migrations/
├── specs/                    # Feature specifications
└── .specify/                 # Project configuration
```

---

## 9. Common Development Tasks

### Add a New shadcn/ui Component

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
```

### Create a Database Migration

```bash
# Create new migration
supabase migration new migration_name

# Edit the migration file in supabase/migrations/
# Apply migration
supabase db push
```

### Update TypeScript Types After Schema Changes

```bash
supabase gen types typescript --local > src/lib/supabase/types.ts
```

---

## 10. Troubleshooting

### "supabase" command not found
```bash
npm install -g supabase
```

### Supabase local not starting
```bash
# Ensure Docker is running
docker info

# Reset local Supabase
supabase stop
supabase start
```

### Stripe webhook events not received
1. Ensure `stripe listen` is running
2. Verify webhook URL matches: `localhost:3000/api/webhooks/stripe`
3. Check webhook signing secret is correct in `.env.local`

### Gemini API rate limit errors
- Add retry logic with exponential backoff
- Consider caching generated content
- Check quota at Google Cloud Console

### RTL layout issues
- Ensure `dir="rtl"` is on `<html>` element
- Use Tailwind RTL utilities (`rtl:`, `ltr:`)
- Test in Chrome DevTools with RTL mode

---

## 11. Deployment Checklist

Before deploying to production:

- [ ] Set all environment variables in hosting platform
- [ ] Configure Stripe webhook endpoint for production URL
- [ ] Enable Sentry error tracking
- [ ] Run production build: `npm run build`
- [ ] Test critical flows: registration, exam, payment
- [ ] Verify RTL rendering on all pages
- [ ] Check mobile responsiveness
- [ ] Review security headers

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Google Gemini API](https://ai.google.dev/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS RTL](https://tailwindcss.com/docs/hover-focus-and-other-states#rtl-support)
