# Research: Tafawoq - Saudi Aptitude Exam Preparation Platform

**Branch**: `001-tafawoq-exam-platform` | **Date**: 2025-12-11

This document consolidates research findings for all technology decisions and implementation patterns.

---

## 1. Next.js App Router Configuration for Arabic RTL

### Decision
Use Next.js 14+ App Router with built-in RTL support via `dir="rtl"` on the `<html>` element and Tailwind CSS RTL utilities.

### Rationale
- Next.js App Router provides server components for optimal initial load performance
- Built-in font optimization for Google Fonts (Noto Kufi Arabic)
- Native support for `dir="rtl"` attribute in root layout
- Tailwind CSS 3.3+ includes RTL utilities (`rtl:` and `ltr:` variants)

### Alternatives Considered
1. **Pages Router**: Rejected - App Router provides better server component support and streaming
2. **Custom CSS-in-JS RTL solution**: Rejected - Tailwind RTL utilities are simpler and sufficient
3. **i18n libraries for RTL**: Rejected - Overkill since we only support Arabic

### Implementation Pattern
```tsx
// app/layout.tsx
import { Noto_Kufi_Arabic } from 'next/font/google'

const font = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700']
})

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={font.className}>{children}</body>
    </html>
  )
}
```

---

## 2. Supabase Database Schema and Auth Strategy

### Decision
Use Supabase PostgreSQL with Row Level Security (RLS) policies. Auth via Supabase Auth with email/password + OTP magic link for verification.

### Rationale
- Supabase provides combined auth + database with minimal setup
- RLS policies enforce subscription-based access at database level
- Real-time subscriptions available for exam progress sync
- Built-in OTP/magic link support reduces custom email infrastructure
- Direct client SDK access eliminates need for custom backend API

### Alternatives Considered
1. **Custom PostgreSQL + Auth0**: Rejected - More infrastructure to manage, Supabase provides both
2. **Firebase**: Rejected - PostgreSQL better for complex relational data (exams, questions, analytics)
3. **Prisma ORM**: Rejected - Constitution mandates Supabase MCP tools; direct Supabase client is simpler

### Key Tables
- `users` (extends auth.users with academic_track, subscription_tier)
- `subscriptions` (stripe_customer_id, status, current_period_end)
- `exam_sessions` (user_id, track, start_time, status, scores)
- `practice_sessions` (user_id, sections, categories, difficulty, question_count)
- `questions` (session_id, content JSONB, user_answer, is_correct)
- `performance_records` (user_id, category_scores, trends)

### RLS Policy Pattern
```sql
-- Users can only access their own exam sessions
CREATE POLICY "Users can view own sessions" ON exam_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Premium users have full access, free users have limits
CREATE POLICY "Subscription check for exams" ON exam_sessions
  FOR INSERT WITH CHECK (
    (SELECT subscription_tier FROM users WHERE id = auth.uid()) = 'premium'
    OR (SELECT COUNT(*) FROM exam_sessions
        WHERE user_id = auth.uid()
        AND created_at > now() - interval '7 days') < 3
  );
```

---

## 3. Google Gemini API for Question Generation

### Decision
Use Google Generative AI SDK (`@google/generative-ai`) with `gemini-1.5-pro` model for structured JSON output of exam questions.

### Rationale
- Gemini has strong Arabic language support (spec requirement)
- Structured output mode guarantees valid JSON responses
- Multimodal capabilities support potential future image-based questions
- Cost-effective compared to GPT-4 for high-volume generation

### Alternatives Considered
1. **OpenAI GPT-4**: Rejected - Higher cost, Gemini specified in planning docs
2. **Anthropic Claude**: Rejected - Gemini specified in planning docs
3. **Pre-generated question bank**: Rejected - Spec requires dynamic generation for variety

### Implementation Pattern
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.7  // Balance creativity and accuracy
  }
})

async function generateExam(track: 'scientific' | 'literary') {
  const prompt = buildExamPrompt(track)
  const result = await model.generateContent(prompt)
  return JSON.parse(result.response.text())
}
```

### Error Handling
- Implement retry with exponential backoff (3 attempts)
- Validate JSON schema before storing
- Log failures to Sentry with prompt context
- Fallback: Show user-friendly error and allow retry

---

## 4. Stripe Subscription Integration

### Decision
Use Stripe Checkout for payment collection, Stripe Billing for subscription management, and webhooks for status synchronization.

### Rationale
- Stripe supports Saudi Arabia merchants
- Checkout provides hosted payment page (PCI compliance)
- Billing portal for self-service subscription management
- Webhooks ensure server-side subscription status accuracy

### Alternatives Considered
1. **PayPal**: Rejected - Less developer-friendly, weaker subscription features
2. **Custom payment integration**: Rejected - PCI compliance burden
3. **Tap Payments (local)**: Rejected - Stripe has broader feature set and MCP tools available

### Subscription Products
- **Free Tier**: No Stripe product (default state)
- **Premium Monthly**: SAR 49/month with 3-day trial

### Implementation Pattern
```typescript
// Create checkout session
const session = await stripe.checkout.sessions.create({
  customer_email: user.email,
  line_items: [{ price: 'price_premium_monthly', quantity: 1 }],
  mode: 'subscription',
  subscription_data: { trial_period_days: 3 },
  success_url: `${baseUrl}/dashboard?success=true`,
  cancel_url: `${baseUrl}/pricing?canceled=true`,
})

// Webhook handler
app.post('/api/webhooks/stripe', async (req, res) => {
  const event = stripe.webhooks.constructEvent(...)
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await syncSubscriptionToSupabase(event.data.object)
  }
})
```

---

## 5. Diagram and Chart Rendering

### Decision
Use a hybrid approach: SVG for geometric shapes (custom React components), Chart.js for statistical charts.

### Rationale
- SVG provides pixel-perfect geometry rendering with RTL text support
- Chart.js is mature, well-documented, handles all chart types needed
- Both are client-side, no server rendering required
- Structured JSON from Gemini maps directly to component props

### Alternatives Considered
1. **D3.js for everything**: Rejected - Overkill for simple shapes, steeper learning curve
2. **Canvas-only**: Rejected - Accessibility issues with text-in-canvas
3. **Image generation on server**: Rejected - Adds latency, storage costs, harder to maintain

### Diagram Type Mapping
| Gemini `type` | Render Technology | Component |
|---------------|-------------------|-----------|
| `circle`, `triangle`, `rectangle`, `composite-shape` | SVG | `<SVGDiagram />` |
| `bar-chart`, `pie-chart`, `line-graph` | Chart.js | `<ChartDiagram />` |

### Implementation Pattern
```tsx
// DiagramRenderer.tsx - Dispatcher component
export function DiagramRenderer({ diagram }: { diagram: DiagramData }) {
  const chartTypes = ['bar-chart', 'pie-chart', 'line-graph']

  if (chartTypes.includes(diagram.type)) {
    return <ChartDiagram data={diagram.data} type={diagram.type} />
  }
  return <SVGDiagram type={diagram.type} data={diagram.data} />
}

// SVGDiagram.tsx - Geometry shapes
export function SVGDiagram({ type, data }) {
  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-sm">
      {type === 'circle' && (
        <circle cx={data.center[0]} cy={data.center[1]} r={data.radius} />
      )}
      {/* Additional shapes */}
    </svg>
  )
}
```

---

## 6. Exam Progress Auto-Save Strategy

### Decision
Optimistic UI updates with Supabase real-time sync. Save after each answer with local state as source of truth.

### Rationale
- Immediate feedback improves UX (spec requires <500ms response)
- Supabase real-time handles offline/reconnection gracefully
- No complex conflict resolution needed (single-user sessions)

### Alternatives Considered
1. **Periodic batch saves**: Rejected - Risk of data loss if browser closes
2. **IndexedDB offline-first**: Rejected - Adds complexity, spec says offline is out of scope
3. **Server-sent events**: Rejected - Supabase real-time already provides this

### Implementation Pattern
```typescript
// useAutoSave.ts
function useAutoSave(sessionId: string) {
  const { isOnline } = useNetworkStatus()
  const saveQueue = useRef<Answer[]>([])

  const saveAnswer = useCallback(async (answer: Answer) => {
    // Optimistic update
    updateLocalState(answer)

    if (isOnline) {
      await supabase.from('answers').upsert(answer)
    } else {
      saveQueue.current.push(answer)
    }
  }, [isOnline])

  // Flush queue on reconnection
  useEffect(() => {
    if (isOnline && saveQueue.current.length) {
      supabase.from('answers').upsert(saveQueue.current)
      saveQueue.current = []
    }
  }, [isOnline])
}
```

---

## 7. Error Tracking and Monitoring

### Decision
Use Sentry for error tracking with contextual metadata (user ID anonymized, browser info, API errors).

### Rationale
- Sentry specified in spec assumptions
- Supports Next.js with server and client error capture
- Source map upload for meaningful stack traces
- Performance monitoring available for future optimization

### Alternatives Considered
1. **LogRocket**: Rejected - Overkill, session recording not needed
2. **Custom error logging**: Rejected - Sentry is more feature-complete
3. **Vercel Analytics**: Rejected - Good for performance but limited error context

### Implementation Pattern
```typescript
// sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  beforeSend(event) {
    // Scrub sensitive data
    if (event.user) {
      delete event.user.email
    }
    return event
  }
})

// In API routes
try {
  const exam = await generateExam(track)
} catch (error) {
  Sentry.captureException(error, {
    extra: { track, userId: session.user.id }
  })
  throw new Error('Exam generation failed')
}
```

---

## 8. shadcn/ui Component Library with RTL

### Decision
Use shadcn/ui with Tailwind CSS configured for RTL. Customize components for Arabic typography and spacing.

### Rationale
- shadcn/ui provides accessible, unstyled components
- Full control over styling via Tailwind
- Easy to add RTL variants
- Specified in planning docs

### Alternatives Considered
1. **Radix UI directly**: Rejected - shadcn/ui provides pre-configured Tailwind integration
2. **Material UI**: Rejected - Heavier, less customizable
3. **Custom components**: Rejected - Reinventing the wheel

### RTL Configuration
```javascript
// tailwind.config.js
module.exports = {
  plugins: [require('tailwindcss-rtl')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Noto Kufi Arabic', 'sans-serif']
      },
      colors: {
        primary: '#1E5631',  // Saudi Deep Green
        accent: '#D4AF37',   // Muted Gold
        background: '#F9FAFB' // Warm Light Grey
      }
    }
  }
}
```

---

## 9. Testing Strategy

### Decision
Three-tier testing: Jest for unit tests, React Testing Library for component tests, Playwright for E2E tests.

### Rationale
- Jest is fast for business logic (scoring, validation)
- RTL tests component behavior, not implementation
- Playwright supports cross-browser E2E with good Arabic text handling

### Alternatives Considered
1. **Cypress for E2E**: Rejected - Playwright has better cross-browser support
2. **Vitest**: Rejected - Jest ecosystem more mature
3. **Testing in production only**: Rejected - Spec requires comprehensive testing

### Test Coverage Priorities
1. **Critical Path E2E**: Registration → Exam → Results
2. **Integration**: Gemini API response validation, Stripe webhook handling
3. **Unit**: Scoring algorithm, question distribution by track, subscription limit checks

---

## 10. Performance Optimization

### Decision
Use Next.js server components for initial render, client components for interactivity, dynamic imports for heavy libraries (Chart.js).

### Rationale
- Server components reduce client JS bundle
- Dynamic imports keep initial load fast
- Streaming SSR improves time-to-first-byte

### Implementation Pattern
```tsx
// Lazy load Chart.js only when needed
const ChartDiagram = dynamic(() => import('./ChartDiagram'), {
  loading: () => <Skeleton />,
  ssr: false
})

// Server component for exam layout
async function ExamPage({ params }) {
  const session = await getExamSession(params.id)
  return <ExamClient initialData={session} />
}
```

---

## Summary of Key Decisions

| Area | Decision | Key Library/Service |
|------|----------|---------------------|
| Frontend | Next.js 14+ App Router | Next.js, React 18 |
| Styling | Tailwind CSS + shadcn/ui with RTL | tailwindcss-rtl |
| Database | Supabase PostgreSQL with RLS | @supabase/supabase-js |
| Auth | Supabase Auth (email + OTP) | @supabase/auth-helpers-nextjs |
| Payments | Stripe Checkout + Billing | @stripe/stripe-js |
| AI Generation | Google Gemini 1.5 Pro | @google/generative-ai |
| Charts | Chart.js | react-chartjs-2 |
| Diagrams | Custom SVG components | Native React/SVG |
| Error Tracking | Sentry | @sentry/nextjs |
| Testing | Jest + RTL + Playwright | @playwright/test |
