# Implementation Plan: Tafawoq - Saudi Aptitude Exam Preparation Platform

**Branch**: `001-tafawoq-exam-platform` | **Date**: 2025-12-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-tafawoq-exam-platform/spec.md`

## Summary

Build a Next.js web application for Arabic-speaking students preparing for Saudi aptitude exams (القدرات). The platform provides AI-generated full exams (96 questions, 120 minutes) and customized practice sessions with visual diagrams/charts, subscription-based access control (Free vs Premium), and detailed performance analytics. Uses Supabase for database and auth, Stripe for payments, and Google Gemini for Arabic question generation with structured JSON output.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14+ (App Router)
**Primary Dependencies**: Next.js, React 18+, shadcn/ui, Supabase JS Client, Stripe JS, Chart.js, Google Generative AI SDK
**Storage**: Supabase (PostgreSQL) via client services; no custom backend API layer
**Testing**: Jest for unit tests, Playwright for E2E, React Testing Library for components
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge) - responsive for desktop and mobile
**Project Type**: Web application (Next.js monorepo structure)
**Performance Goals**:
- Exam start within 10 seconds of request
- Answer feedback within 500ms
- Results display within 3 seconds
- Support 1000+ concurrent exam takers
**Constraints**:
- Full RTL layout for Arabic
- No calculator required for questions
- Auto-save after each answer
- Gemini API rate limits
- PDPL compliance for data handling
**Scale/Scope**:
- 1000+ concurrent users target
- 96-question full exams
- Up to 100 questions per practice session
- Indefinite data retention with user deletion rights

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Compliance Notes |
|-----------|--------|------------------|
| I. MCP Tooling Mandate (Documentation) | ✅ PASS | Use Ref MCP tools for documentation access |
| II. MCP Tooling Mandate (Database) | ✅ PASS | Use Supabase MCP tools for all DB operations, migrations, type generation |
| III. MCP Tooling Mandate (Payments) | ✅ PASS | Use Stripe MCP tools for subscription management and payments |
| IV. Security & Configuration | ✅ PASS | All secrets via environment variables (SUPABASE_URL, SUPABASE_ANON_KEY, STRIPE_SECRET_KEY, GEMINI_API_KEY); no hardcoded credentials |
| V. Technology Stack Alignment | ⚠️ DEVIATION | Constitution specifies React Native (Expo) but spec requires Next.js web app - **Justified**: Spec explicitly requires web-first approach, no native mobile apps |
| VI. Git Commit Discipline | ✅ PASS | Commit after each implementation task completion |
| VII. Chrome MCP Manual Testing | ✅ PASS | Use Chrome MCP for RTL validation, exam rendering tests, user flow verification |

**Deviation Justification**: The constitution's Technology Stack Alignment (V) references React Native/Expo, but this project is explicitly a web application per the feature specification ("Native mobile applications (iOS/Android)" listed as Out of Scope). Next.js with TypeScript is the appropriate technology for this web-first platform.

## Project Structure

### Documentation (this feature)

```text
specs/001-tafawoq-exam-platform/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── exam-api.yaml    # Exam generation and session management
│   ├── practice-api.yaml # Practice session management
│   ├── auth-api.yaml    # Authentication flows
│   └── subscription-api.yaml # Subscription and payment flows
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Auth-related routes (login, register, verify)
│   │   ├── login/
│   │   ├── register/
│   │   └── verify/
│   ├── (main)/                   # Main app routes (authenticated)
│   │   ├── dashboard/
│   │   ├── exam/
│   │   │   ├── [id]/             # Active exam taking
│   │   │   └── results/[id]/     # Exam results view
│   │   ├── practice/
│   │   │   ├── new/              # Practice session creation wizard
│   │   │   ├── [id]/             # Active practice session
│   │   │   └── results/[id]/     # Practice results view
│   │   ├── profile/
│   │   └── settings/
│   ├── layout.tsx                # Root layout with RTL and font config
│   └── globals.css               # Global styles with RTL support
├── components/
│   ├── ui/                       # shadcn/ui components (RTL configured)
│   ├── exam/                     # Exam-specific components
│   │   ├── QuestionCard.tsx
│   │   ├── AnswerOptions.tsx
│   │   ├── ExamTimer.tsx
│   │   ├── ProgressIndicator.tsx
│   │   └── ExplanationPanel.tsx
│   ├── practice/                 # Practice-specific components
│   │   ├── SectionSelector.tsx
│   │   ├── CategorySelector.tsx
│   │   ├── DifficultySelector.tsx
│   │   └── QuestionCountSelector.tsx
│   ├── diagrams/                 # Visual rendering components
│   │   ├── DiagramRenderer.tsx   # Main dispatcher
│   │   ├── SVGDiagram.tsx        # Geometry shapes
│   │   ├── ChartDiagram.tsx      # Chart.js wrapper
│   │   └── shapes/               # Individual shape components
│   ├── analytics/                # Performance display components
│   │   ├── ScoreDisplay.tsx
│   │   ├── StrengthsWeaknesses.tsx
│   │   └── TrendChart.tsx
│   └── shared/                   # Shared UI components
│       ├── RTLWrapper.tsx
│       ├── LoadingSkeleton.tsx
│       └── SubscriptionGate.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Supabase client initialization
│   │   ├── auth.ts               # Auth helpers
│   │   └── types.ts              # Generated TypeScript types
│   ├── stripe/
│   │   ├── client.ts             # Stripe client initialization
│   │   └── subscriptions.ts      # Subscription helpers
│   ├── gemini/
│   │   ├── client.ts             # Gemini API client
│   │   ├── prompts.ts            # Exam and practice prompt builders
│   │   └── validators.ts         # JSON schema validators
│   └── utils/
│       ├── scoring.ts            # Exam scoring logic
│       └── rtl.ts                # RTL utility helpers
├── hooks/
│   ├── useExamSession.ts
│   ├── usePracticeSession.ts
│   ├── useSubscription.ts
│   └── useAutoSave.ts
├── contexts/
│   ├── AuthContext.tsx
│   ├── ExamContext.tsx
│   └── SubscriptionContext.tsx
└── types/
    ├── exam.ts                   # Exam-related types
    ├── question.ts               # Question schema types
    ├── user.ts                   # User and profile types
    └── subscription.ts           # Subscription types

tests/
├── unit/
│   ├── scoring.test.ts
│   ├── validators.test.ts
│   └── prompts.test.ts
├── integration/
│   ├── exam-generation.test.ts
│   └── subscription-flow.test.ts
└── e2e/
    ├── registration.spec.ts
    ├── exam-flow.spec.ts
    └── practice-flow.spec.ts
```

**Structure Decision**: Next.js App Router with `src/` directory, separating app pages, reusable components, library code, hooks, and contexts. Tests organized by type (unit, integration, e2e).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Technology stack deviation (Next.js vs React Native) | Web application explicitly required per spec; mobile apps out of scope | React Native cannot serve web-only requirement with proper SEO and SSR capabilities |
