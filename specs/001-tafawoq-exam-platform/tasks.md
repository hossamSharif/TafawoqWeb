# Tasks: Tafawoq - Saudi Aptitude Exam Preparation Platform

**Input**: Design documents from `/specs/001-tafawoq-exam-platform/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the feature specification - test tasks are excluded.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root (Next.js App Router structure)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize Next.js 14+ project with TypeScript and App Router at repository root
- [X] T002 [P] Configure Tailwind CSS with RTL support and Arabic font (Noto Kufi Arabic) in tailwind.config.ts
- [X] T003 [P] Configure ESLint and Prettier with TypeScript rules in .eslintrc.json and .prettierrc
- [X] T004 [P] Create environment configuration with .env.example and src/lib/env.ts for type-safe env vars
- [X] T005 [P] Install and configure shadcn/ui with RTL-ready components in src/components/ui/
- [X] T006 Create root layout with RTL direction, Arabic font, and global styles in src/app/layout.tsx and src/app/globals.css
- [X] T007 [P] Create TypeScript type definitions for exam, question, user, and subscription in src/types/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

### Database Setup

- [X] T008 Create Supabase project and configure connection in src/lib/supabase/client.ts
- [X] T009 Apply migration 001_create_user_profiles.sql via Supabase MCP tools
- [X] T010 Apply migration 002_create_subscriptions.sql via Supabase MCP tools
- [X] T011 Apply migration 003_create_exam_sessions.sql via Supabase MCP tools
- [X] T012 Apply migration 004_create_practice_sessions.sql via Supabase MCP tools
- [X] T013 Apply migration 005_create_answers.sql via Supabase MCP tools
- [X] T014 Apply migration 006_create_performance_records.sql via Supabase MCP tools
- [X] T015 Apply migration 007_create_reading_passages.sql via Supabase MCP tools
- [X] T016 Apply migration 008_create_functions_triggers.sql (including handle_new_user trigger) via Supabase MCP tools
- [X] T017 Apply migration 009_create_rls_policies.sql for all tables via Supabase MCP tools
- [X] T018 Apply migration 010_create_indexes.sql for query optimization via Supabase MCP tools
- [X] T019 Generate TypeScript types from Supabase schema using MCP tools into src/lib/supabase/types.ts

### Core Authentication Infrastructure

- [X] T020 Implement Supabase Auth client initialization in src/lib/supabase/auth.ts
- [X] T021 Create AuthContext provider with session management in src/contexts/AuthContext.tsx
- [X] T022 Implement auth middleware for protected routes in src/middleware.ts

### Stripe Infrastructure

- [X] T023 Initialize Stripe client in src/lib/stripe/client.ts with environment variables
- [X] T024 Create Stripe products and prices (Premium Monthly SAR 49) using Stripe MCP tools
- [X] T025 Implement subscription helpers in src/lib/stripe/subscriptions.ts

### Gemini AI Infrastructure

- [X] T026 Initialize Gemini AI client with structured JSON output in src/lib/gemini/client.ts
- [X] T027 Create JSON schema validators for question generation in src/lib/gemini/validators.ts

### Shared Components

- [X] T028 Create RTLWrapper component for RTL-aware layouts in src/components/shared/RTLWrapper.tsx
- [X] T029 Create LoadingSkeleton component with Arabic text support in src/components/shared/LoadingSkeleton.tsx
- [X] T030 Create SubscriptionGate component for feature gating in src/components/shared/SubscriptionGate.tsx

### Error Tracking

- [X] T031 Configure Sentry for Next.js with anonymized user context in sentry.client.config.ts and sentry.server.config.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - New User Registration & Onboarding (Priority: P1)

**Goal**: Enable new Arabic-speaking students to create an account, verify email with OTP, select academic track, choose subscription plan, and access the dashboard with onboarding tutorial.

**Independent Test**: Complete the registration flow from welcome screen through dashboard access.

### Auth API Routes for User Story 1

- [X] T032 [P] [US1] Create POST /api/auth/register route for email/password registration in src/app/api/auth/register/route.ts
- [X] T033 [P] [US1] Create POST /api/auth/verify-otp route for OTP verification in src/app/api/auth/verify-otp/route.ts
- [X] T034 [P] [US1] Create POST /api/auth/resend-otp route with 60-second cooldown in src/app/api/auth/resend-otp/route.ts
- [X] T035 [P] [US1] Create POST /api/auth/login route for returning users in src/app/api/auth/login/route.ts
- [X] T036 [P] [US1] Create POST /api/auth/logout route for session invalidation in src/app/api/auth/logout/route.ts
- [X] T037 [P] [US1] Create GET /api/auth/session route for session retrieval in src/app/api/auth/session/route.ts

### Profile API Routes for User Story 1

- [X] T038 [P] [US1] Create GET /api/profile route for user profile retrieval in src/app/api/profile/route.ts
- [X] T039 [P] [US1] Create PATCH /api/profile/onboarding route for completing onboarding in src/app/api/profile/onboarding/route.ts

### Auth UI Pages for User Story 1

- [X] T040 [P] [US1] Create welcome/landing page with "Create Account" CTA in src/app/page.tsx
- [X] T041 [P] [US1] Create registration form page with email, password, Terms & Privacy checkboxes in src/app/(auth)/register/page.tsx
- [X] T042 [P] [US1] Create OTP verification page with 6-digit input and resend button in src/app/(auth)/verify/page.tsx
- [X] T043 [P] [US1] Create login page for returning users in src/app/(auth)/login/page.tsx

### Onboarding UI Components for User Story 1

- [X] T044 [P] [US1] Create academic track selection screen with Scientific/Literary options in src/app/(auth)/onboarding/track/page.tsx
- [X] T045 [P] [US1] Create subscription plan selection screen with Free/Premium comparison in src/app/(auth)/onboarding/plan/page.tsx

### Dashboard Shell for User Story 1

- [X] T046 [US1] Create main dashboard layout with navigation in src/app/(main)/layout.tsx
- [X] T047 [US1] Create dashboard page showing "Start Full Exam" and "Customized Practice" options in src/app/(main)/dashboard/page.tsx

### Onboarding Tutorial for User Story 1

- [X] T048 [P] [US1] Create OnboardingTutorial component with 3 screens explaining platform in src/components/shared/OnboardingTutorial.tsx
- [X] T049 [US1] Integrate tutorial display on first dashboard access in src/app/(main)/dashboard/page.tsx

### Auth Form Components for User Story 1

- [X] T050 [P] [US1] Create password strength validator utility in src/lib/utils/password.ts
- [X] T051 [P] [US1] Create PasswordInput component with visibility toggle in src/components/ui/password-input.tsx
- [X] T052 [P] [US1] Create OTPInput component for 6-digit code entry in src/components/ui/otp-input.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently - users can register, verify, onboard, and access dashboard.

---

## Phase 4: User Story 2 - Full Integrated Exam Experience (Priority: P1)

**Goal**: Enable registered students to take a complete 96-question, 120-minute exam with immediate feedback on each answer and comprehensive results.

**Independent Test**: Start a full exam, answer questions, see feedback, and view final results with section scores.

### Exam API Routes for User Story 2

- [X] T053 [P] [US2] Create POST /api/exams route for exam session creation in src/app/api/exams/route.ts
- [X] T054 [P] [US2] Create GET /api/exams/[sessionId] route for session retrieval in src/app/api/exams/[sessionId]/route.ts
- [X] T055 [P] [US2] Create PATCH /api/exams/[sessionId] route for status updates in src/app/api/exams/[sessionId]/route.ts
- [X] T056 [P] [US2] Create POST /api/exams/[sessionId]/answers route for answer submission in src/app/api/exams/[sessionId]/answers/route.ts
- [X] T057 [P] [US2] Create GET /api/exams/[sessionId]/answers/[questionIndex]/explanation route in src/app/api/exams/[sessionId]/answers/[questionIndex]/explanation/route.ts
- [X] T058 [P] [US2] Create GET /api/exams/[sessionId]/results route for results retrieval in src/app/api/exams/[sessionId]/results/route.ts
- [X] T059 [P] [US2] Create PATCH /api/exams/[sessionId]/timer route for pause/resume in src/app/api/exams/[sessionId]/timer/route.ts

### Gemini Question Generation for User Story 2

- [X] T060 [US2] Create exam prompt builder for 96-question generation with track-based distribution in src/lib/gemini/prompts.ts
- [X] T061 [US2] Implement examGeneration function with retry logic and JSON validation in src/lib/gemini/client.ts

### Exam UI Components for User Story 2

- [X] T062 [P] [US2] Create QuestionCard component with Arabic RTL text display in src/components/exam/QuestionCard.tsx
- [X] T063 [P] [US2] Create AnswerOptions component with 4-option MCQ layout in src/components/exam/AnswerOptions.tsx
- [X] T064 [P] [US2] Create ExamTimer component with 120-minute countdown in src/components/exam/ExamTimer.tsx
- [X] T065 [P] [US2] Create ProgressIndicator component showing question progress in src/components/exam/ProgressIndicator.tsx
- [X] T066 [P] [US2] Create ExplanationPanel component for answer explanations in src/components/exam/ExplanationPanel.tsx

### Exam Session Hooks for User Story 2

- [X] T067 [US2] Create useExamSession hook for session state management in src/hooks/useExamSession.ts
- [X] T068 [US2] Create useAutoSave hook for answer auto-saving with offline queue in src/hooks/useAutoSave.ts

### Exam Context for User Story 2

- [X] T069 [US2] Create ExamContext provider for exam state in src/contexts/ExamContext.tsx

### Exam Pages for User Story 2

- [X] T070 [US2] Create exam confirmation modal on dashboard "Start Full Exam" click in src/components/exam/ExamConfirmModal.tsx
- [X] T071 [US2] Create active exam taking page with question navigation in src/app/(main)/exam/[id]/page.tsx
- [X] T072 [US2] Create exam results page with three percentage scores in src/app/(main)/exam/results/[id]/page.tsx

### Scoring Logic for User Story 2

- [X] T073 [US2] Implement scoring calculation utilities (verbal, quantitative, overall) in src/lib/utils/scoring.ts
- [X] T074 [US2] Implement score color coding logic (gold/green/grey/warm) in src/lib/utils/scoring.ts

### Subscription Limit Check for User Story 2

- [X] T075 [US2] Add weekly exam limit check (3/week for free) to exam creation route in src/app/api/exams/route.ts

**Checkpoint**: At this point, User Story 2 should be fully functional - users can take full exams with immediate feedback and view results.

---

## Phase 5: User Story 3 - Customized Practice Session (Priority: P2)

**Goal**: Enable students to create targeted practice sessions by selecting sections, categories, difficulty level, and question count.

**Independent Test**: Create a practice session with custom parameters and complete it to see practice-specific results.

### Practice API Routes for User Story 3

- [X] T076 [P] [US3] Create POST /api/practice route for practice session creation in src/app/api/practice/route.ts
- [X] T077 [P] [US3] Create GET /api/practice/[sessionId] route for session retrieval in src/app/api/practice/[sessionId]/route.ts
- [X] T078 [P] [US3] Create PATCH /api/practice/[sessionId] route for status updates in src/app/api/practice/[sessionId]/route.ts
- [X] T079 [P] [US3] Create POST /api/practice/[sessionId]/answers route for answer submission in src/app/api/practice/[sessionId]/answers/route.ts
- [X] T080 [P] [US3] Create GET /api/practice/[sessionId]/results route for results in src/app/api/practice/[sessionId]/results/route.ts
- [X] T081 [P] [US3] Create GET /api/practice/categories route for available categories in src/app/api/practice/categories/route.ts
- [X] T082 [P] [US3] Create GET /api/practice/history route for practice history in src/app/api/practice/history/route.ts

### Gemini Practice Generation for User Story 3

- [X] T083 [US3] Create practice prompt builder with category, difficulty, and count params in src/lib/gemini/prompts.ts

### Practice UI Components for User Story 3

- [X] T084 [P] [US3] Create SectionSelector component for Quantitative/Verbal selection in src/components/practice/SectionSelector.tsx
- [X] T085 [P] [US3] Create CategorySelector component with section-filtered categories in src/components/practice/CategorySelector.tsx
- [X] T086 [P] [US3] Create DifficultySelector component (Easy/Medium/Hard) in src/components/practice/DifficultySelector.tsx
- [X] T087 [P] [US3] Create QuestionCountSelector component with preset and custom options in src/components/practice/QuestionCountSelector.tsx

### Practice Session Hook for User Story 3

- [X] T088 [US3] Create usePracticeSession hook for practice state management in src/hooks/usePracticeSession.ts

### Practice Pages for User Story 3

- [X] T089 [US3] Create practice creation wizard page (3-step flow) in src/app/(main)/practice/new/page.tsx
- [X] T090 [US3] Create active practice session page with elapsed timer in src/app/(main)/practice/[id]/page.tsx
- [X] T091 [US3] Create practice results page with single percentage score in src/app/(main)/practice/results/[id]/page.tsx

### Practice Hour Tracking for User Story 3

- [X] T092 [US3] Implement practice hours increment on session completion in src/app/api/practice/[sessionId]/route.ts

### Free Tier Restrictions for User Story 3

- [X] T093 [US3] Enforce max 2 categories and fixed 5 questions for free users in src/app/api/practice/route.ts

**Checkpoint**: At this point, User Story 3 should be fully functional - users can create and complete customized practice sessions.

---

## Phase 6: User Story 4 - Exam Results & Performance Analytics (Priority: P2)

**Goal**: Enable students to review performance, understand strengths/weaknesses, and receive personalized improvement recommendations.

**Independent Test**: View results after completing any exam or practice session and verify all analytics display correctly.

### Analytics UI Components for User Story 4

- [X] T094 [P] [US4] Create ScoreDisplay component with percentage and color coding in src/components/analytics/ScoreDisplay.tsx
- [X] T095 [P] [US4] Create StrengthsWeaknesses component showing top 3 each in src/components/analytics/StrengthsWeaknesses.tsx
- [X] T096 [P] [US4] Create TrendChart component using Chart.js for historical trends in src/components/analytics/TrendChart.tsx
- [X] T097 [P] [US4] Create RecommendationsList component for improvement advice in src/components/analytics/RecommendationsList.tsx
- [X] T098 [P] [US4] Create PracticeShortcut component linking weak areas to practice in src/components/analytics/PracticeShortcut.tsx

### Results Calculation for User Story 4

- [X] T099 [US4] Implement strengths/weaknesses calculation based on category performance in src/lib/utils/scoring.ts
- [X] T100 [US4] Implement personalized recommendation generation in src/lib/utils/recommendations.ts

### Profile Analytics Integration for User Story 4

- [X] T101 [US4] Update profile page to show last exam scores and practice hours in src/app/(main)/profile/page.tsx
- [X] T102 [US4] Add historical exam history to performance records on exam completion in src/app/api/exams/[sessionId]/route.ts

### Premium Analytics for User Story 4

- [X] T103 [US4] Implement historical comparison and peer percentile (premium only) in results API routes
- [X] T104 [US4] Add premium-only TrendChart visibility gating in src/app/(main)/exam/results/[id]/page.tsx

**Checkpoint**: At this point, User Story 4 should be fully functional - users see comprehensive results with analytics.

---

## Phase 7: User Story 5 - Question Display & Multimedia Support (Priority: P2)

**Goal**: Enable proper question presentation with Arabic RTL layout and support for text-only questions, geometric diagrams, charts, and tables.

**Independent Test**: View different question types and verify proper Arabic rendering, image display, and responsive layouts.

### Diagram Rendering Components for User Story 5

- [X] T105 [P] [US5] Create DiagramRenderer dispatcher component in src/components/diagrams/DiagramRenderer.tsx
- [X] T106 [P] [US5] Create SVGDiagram component for geometry shapes (circle, triangle, rectangle, composite) in src/components/diagrams/SVGDiagram.tsx
- [X] T107 [P] [US5] Create ChartDiagram component wrapping Chart.js (bar, pie, line) in src/components/diagrams/ChartDiagram.tsx
- [X] T108 [P] [US5] Create individual shape components in src/components/diagrams/shapes/ directory

### Question Type Components for User Story 5

- [X] T109 [P] [US5] Create TextOnlyQuestion component with Arabic line height in src/components/exam/TextOnlyQuestion.tsx
- [X] T110 [P] [US5] Create ImageQuestion component with responsive scaling and zoom in src/components/exam/ImageQuestion.tsx
- [X] T111 [P] [US5] Create ReadingPassageQuestion component for comprehension passages in src/components/exam/ReadingPassageQuestion.tsx

### Question Header for User Story 5

- [X] T112 [US5] Create QuestionHeader component with number, section indicator, difficulty badge in src/components/exam/QuestionHeader.tsx

### Image Loading for User Story 5

- [X] T113 [US5] Implement skeleton loading state for images in QuestionCard component
- [X] T114 [US5] Add click-to-zoom modal for diagram inspection in src/components/exam/DiagramZoomModal.tsx

**Checkpoint**: At this point, User Story 5 should be fully functional - all question types render correctly with RTL support.

---

## Phase 8: User Story 6 - Subscription Management & Payments (Priority: P3)

**Goal**: Enable users to manage subscriptions, upgrade from free to premium, view subscription status, and modify plan settings.

**Independent Test**: Check subscription status, initiate upgrades, process payments, and view billing information.

### Subscription API Routes for User Story 6

- [X] T115 [P] [US6] Create GET /api/subscription route for current subscription details in src/app/api/subscription/route.ts
- [X] T116 [P] [US6] Create POST /api/subscription/checkout route for Stripe checkout session in src/app/api/subscription/checkout/route.ts
- [X] T117 [P] [US6] Create POST /api/subscription/portal route for Stripe customer portal in src/app/api/subscription/portal/route.ts
- [X] T118 [P] [US6] Create POST /api/subscription/cancel route for cancellation in src/app/api/subscription/cancel/route.ts
- [X] T119 [P] [US6] Create POST /api/subscription/reactivate route for reactivation in src/app/api/subscription/reactivate/route.ts
- [X] T120 [P] [US6] Create GET /api/subscription/invoices route for billing history in src/app/api/subscription/invoices/route.ts
- [X] T121 [P] [US6] Create GET /api/subscription/usage route for usage limits in src/app/api/subscription/usage/route.ts

### Stripe Webhook Handler for User Story 6

- [X] T122 [US6] Create POST /api/webhooks/stripe route handling subscription events in src/app/api/webhooks/stripe/route.ts
- [X] T123 [US6] Implement subscription status sync to Supabase on webhook events in src/lib/stripe/subscriptions.ts

### Subscription UI Components for User Story 6

- [X] T124 [P] [US6] Create SubscriptionBadge component (Free/Premium/Trial) in src/components/subscription/SubscriptionBadge.tsx
- [X] T125 [P] [US6] Create UpgradePrompt component shown on feature restrictions in src/components/subscription/UpgradePrompt.tsx
- [X] T126 [P] [US6] Create TrialCountdown component showing days remaining in src/components/subscription/TrialCountdown.tsx
- [X] T127 [P] [US6] Create PricingComparison component for plan features in src/components/subscription/PricingComparison.tsx

### Subscription Hook for User Story 6

- [X] T128 [US6] Create useSubscription hook for subscription state in src/hooks/useSubscription.ts
- [X] T129 [US6] Create SubscriptionContext provider in src/contexts/SubscriptionContext.tsx

### Subscription Pages for User Story 6

- [X] T130 [US6] Add subscription status to profile page with upgrade button in src/app/(main)/profile/page.tsx
- [X] T131 [US6] Create settings page with subscription management section in src/app/(main)/settings/page.tsx
- [X] T132 [US6] Add Stripe payment form integration for premium upgrade flow

**Checkpoint**: At this point, User Story 6 should be fully functional - users can upgrade, manage, and view subscription status.

---

## Phase 9: User Story 7 - Profile & Academic Track Management (Priority: P3)

**Goal**: Enable users to view/update profile, change academic track, and track overall progress.

**Independent Test**: View profile, update academic track, and verify content recommendations change accordingly.

### Profile API Routes for User Story 7

- [X] T133 [P] [US7] Create PATCH /api/profile route for profile updates in src/app/api/profile/route.ts
- [X] T134 [P] [US7] Create PATCH /api/profile/track route for track changes in src/app/api/profile/track/route.ts
- [X] T135 [P] [US7] Create POST /api/profile/delete route for account deletion in src/app/api/profile/delete/route.ts
- [X] T136 [P] [US7] Create GET /api/profile/export route for data export (premium) in src/app/api/profile/export/route.ts

### Profile UI Components for User Story 7

- [X] T137 [P] [US7] Create ProfileHeader component with email and track display in src/components/profile/ProfileHeader.tsx
- [X] T138 [P] [US7] Create LastExamScores component with three percentages in src/components/profile/LastExamScores.tsx
- [X] T139 [P] [US7] Create PracticeHoursDisplay component in src/components/profile/PracticeHoursDisplay.tsx
- [X] T140 [P] [US7] Create AcademicTrackSwitcher component in src/components/profile/AcademicTrackSwitcher.tsx
- [X] T141 [P] [US7] Create ExamHistory component with historical trends in src/components/profile/ExamHistory.tsx

### Profile Page for User Story 7

- [X] T142 [US7] Complete profile page with all profile components in src/app/(main)/profile/page.tsx

### Account Deletion for User Story 7

- [X] T143 [US7] Create DeleteAccountModal with confirmation flow in src/components/profile/DeleteAccountModal.tsx
- [X] T144 [US7] Implement 30-day deletion scheduling (PDPL compliance) in deletion route

**Checkpoint**: At this point, User Story 7 should be fully functional - users can manage profile and track.

---

## Phase 10: User Story 8 - Onboarding Tutorial Experience (Priority: P3)

**Goal**: Enable new users to understand platform through educational tutorial explaining full exams vs. practices, academic track benefits, and performance tracking.

**Independent Test**: View all three tutorial screens and verify clear explanations and navigation.

### Tutorial Content for User Story 8

- [X] T145 [P] [US8] Create tutorial screen 1 content: Full Exams vs. Customized Practice in src/components/shared/OnboardingTutorial.tsx
- [X] T146 [P] [US8] Create tutorial screen 2 content: Academic Track explanation in src/components/shared/OnboardingTutorial.tsx
- [X] T147 [P] [US8] Create tutorial screen 3 content: Three-score system and practice hours in src/components/shared/OnboardingTutorial.tsx

### Tutorial Navigation for User Story 8

- [X] T148 [US8] Implement tutorial navigation with progress indicators in src/components/shared/OnboardingTutorial.tsx
- [X] T149 [US8] Add "Start Preparing" button completing tutorial and navigating to dashboard

### Tutorial Replay for User Story 8

- [X] T150 [US8] Add tutorial replay option in Settings > Help in src/app/(main)/settings/page.tsx

**Checkpoint**: At this point, User Story 8 should be fully functional - new users see and can replay onboarding.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Password Reset Flow

- [X] T151 [P] Create POST /api/auth/password/reset route in src/app/api/auth/password/reset/route.ts
- [X] T152 [P] Create POST /api/auth/password/update route in src/app/api/auth/password/update/route.ts
- [X] T153 [P] Create password reset request page in src/app/(auth)/forgot-password/page.tsx
- [X] T154 Create password update page in src/app/(auth)/reset-password/page.tsx

### RTL Validation

- [X] T155 Validate RTL layout across all pages using Chrome MCP tools
- [X] T156 Fix any RTL alignment issues in exam and practice components

### Performance Optimization

- [X] T157 [P] Add dynamic imports for Chart.js components to reduce bundle size
- [X] T158 [P] Implement server components where possible in app router pages

### Edge Case Handling

- [X] T159 Implement network disconnect detection and timer pause in exam session
- [X] T160 Implement exam session resume within same calendar day
- [X] T161 Add error handling for Gemini API failures with retry logic

### Security Hardening

- [X] T162 [P] Audit all API routes for proper authentication checks
- [X] T163 [P] Validate Stripe webhook signatures in webhook handler
- [X] T164 Review and test RLS policies for all database operations

### Quickstart Validation

- [X] T165 Run through quickstart.md steps to verify development setup
- [X] T166 Update quickstart.md if any steps are outdated or unclear

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - May reuse auth components from US1
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - May reuse exam components from US2
- **User Story 4 (P2)**: Depends on US2 (results) and US3 (results) for viewing analytics
- **User Story 5 (P2)**: Can start after Foundational - May integrate into US2/US3 question display
- **User Story 6 (P3)**: Can start after Foundational - Required for premium feature gating in other stories
- **User Story 7 (P3)**: Can start after Foundational - Profile components reused across stories
- **User Story 8 (P3)**: Can start after Foundational - Integrates with US1 onboarding flow

### Within Each User Story

- API routes can be built in parallel (different files)
- UI components can be built in parallel (different files)
- Pages depend on their API routes and components
- Hooks depend on API routes being available

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tasks marked [P] within a user story can run in parallel

---

## Parallel Example: User Story 2

```bash
# Launch all API routes in parallel:
Task: "Create POST /api/exams route in src/app/api/exams/route.ts"
Task: "Create GET /api/exams/[sessionId] route in src/app/api/exams/[sessionId]/route.ts"
Task: "Create PATCH /api/exams/[sessionId] route in src/app/api/exams/[sessionId]/route.ts"
Task: "Create POST /api/exams/[sessionId]/answers route in src/app/api/exams/[sessionId]/answers/route.ts"

# Launch all UI components in parallel:
Task: "Create QuestionCard component in src/components/exam/QuestionCard.tsx"
Task: "Create AnswerOptions component in src/components/exam/AnswerOptions.tsx"
Task: "Create ExamTimer component in src/components/exam/ExamTimer.tsx"
Task: "Create ProgressIndicator component in src/components/exam/ProgressIndicator.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Registration & Onboarding)
4. Complete Phase 4: User Story 2 (Full Exam Experience)
5. **STOP and VALIDATE**: Test registration → exam → results flow
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (Registration works!)
3. Add User Story 2 → Test independently → Deploy/Demo (Full exams work!)
4. Add User Story 3 → Test independently → Deploy/Demo (Practice sessions!)
5. Add User Story 4 → Test independently → Deploy/Demo (Analytics!)
6. Add User Story 5 → Enhances exam/practice display
7. Add User Story 6 → Deploy/Demo (Payments work!)
8. Add User Stories 7-8 → Polish release
9. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Registration)
   - Developer B: User Story 2 (Exam)
   - Developer C: User Story 5 (Question Display)
3. After P1 stories complete:
   - Developer A: User Story 3 (Practice)
   - Developer B: User Story 4 (Analytics)
   - Developer C: User Story 6 (Subscription)
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | 166 |
| **Phase 1 (Setup)** | 7 |
| **Phase 2 (Foundational)** | 24 |
| **Phase 3 (US1 - Registration)** | 21 |
| **Phase 4 (US2 - Full Exam)** | 24 |
| **Phase 5 (US3 - Practice)** | 18 |
| **Phase 6 (US4 - Analytics)** | 11 |
| **Phase 7 (US5 - Question Display)** | 10 |
| **Phase 8 (US6 - Subscription)** | 18 |
| **Phase 9 (US7 - Profile)** | 12 |
| **Phase 10 (US8 - Onboarding)** | 6 |
| **Phase 11 (Polish)** | 16 |
| **Parallel Opportunities** | 89 tasks marked [P] |
| **MVP Scope** | Phases 1-4 (US1 + US2) = 76 tasks |

**Independent Test Criteria per Story**:
- US1: Complete registration from welcome → dashboard
- US2: Take full 96-question exam, view results with 3 scores
- US3: Create and complete practice session with custom params
- US4: View comprehensive results with strengths/weaknesses
- US5: View various question types with proper RTL/diagrams
- US6: Upgrade to premium, view billing, manage subscription
- US7: Update profile, change academic track, export data
- US8: Complete 3-screen onboarding tutorial
