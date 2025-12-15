# Implementation Plan: Platform Upgrade V2 - Rebranding, Exam Library & Subscription Overhaul

**Branch**: `003-platform-upgrade-v2` | **Date**: 2025-12-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-platform-upgrade-v2/spec.md`

## Summary

Major platform upgrade introducing: (1) Exam Library for community content sharing with free/premium access tiers, (2) Overhauled subscription plans with reward system where sharing earns credits, (3) App rebranding to "Qudratak - قدراتك", (4) Admin features for JSON content upload and maintenance mode, (5) Enhanced notification system for rewards. Built on existing Next.js 14 + Supabase + Stripe stack with RLS-enforced security.

## Technical Context

**Language/Version**: TypeScript 5.6.0 with Next.js 14.2.0 (App Router)
**Primary Dependencies**: React 18.3.0, @supabase/supabase-js 2.49.0, @supabase/ssr 0.5.2, Stripe 17.4.0, shadcn/ui, Tailwind CSS 3.4.14, @anthropic-ai/sdk 0.71.2
**Storage**: Supabase PostgreSQL with RLS policies, existing tables: exam_sessions, practice_sessions, user_subscriptions, user_credits, forum_posts, notifications
**Testing**: Jest/Vitest (tests/ directory structure exists: unit/, integration/, e2e/)
**Target Platform**: Web (responsive, RTL Arabic support)
**Project Type**: Web application (Next.js monorepo with API routes)
**Performance Goals**: Library browsing <30s (SC-001), Notification delivery <10s (SC-005), Checkout flow <2min (SC-003)
**Constraints**: Existing Supabase RLS infrastructure, Stripe webhook integration, Arabic RTL UI patterns
**Scale/Scope**: ~10 new API endpoints, 4-5 new database tables, 8+ UI components, landing page redesign

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Compliance Notes |
|-----------|--------|------------------|
| I. MCP Tooling (Documentation) | ✅ PASS | Will use Ref MCP tools for SDK/library documentation lookup |
| II. MCP Tooling (Database) | ✅ PASS | All schema changes via Supabase MCP tools (apply_migration, list_tables, generate_typescript_types) |
| III. MCP Tooling (Payments) | ✅ PASS | Stripe integration uses existing webhook handler; any new payment logic via Stripe MCP tools |
| IV. Security & Configuration | ✅ PASS | No hardcoded secrets; admin auth via existing Supabase RLS with is_admin flag (per spec clarification) |
| V. Technology Stack Alignment | ✅ PASS | Uses approved stack: TypeScript, Next.js 14, React 18, Supabase, Stripe |
| VI. Git Commit Discipline | ✅ PASS | Commits after each /speckit.implement task completion |
| VII. Chrome MCP Manual Testing | ✅ PASS | UI validation and manual testing via Chrome MCP tools |

**Gate Result**: ✅ ALL GATES PASS - Proceed to Phase 0

### Post-Design Re-evaluation (Phase 1 Complete)

| Principle | Status | Verification |
|-----------|--------|--------------|
| I. MCP Tooling (Documentation) | ✅ PASS | Design references existing types/patterns from codebase exploration |
| II. MCP Tooling (Database) | ✅ PASS | Data model specifies Supabase migrations via MCP; type generation via MCP |
| III. MCP Tooling (Payments) | ✅ PASS | Grace period uses Stripe webhook events; no custom payment bypass |
| IV. Security & Configuration | ✅ PASS | Admin auth via Supabase RLS + is_admin flag; no hardcoded secrets |
| V. Technology Stack Alignment | ✅ PASS | Uses TypeScript 5.6, Next.js 14.2, React 18.3, Supabase, Stripe |
| VI. Git Commit Discipline | ✅ PASS | Plan ready for task-by-task implementation with commits |
| VII. Chrome MCP Manual Testing | ✅ PASS | Quickstart includes manual testing steps for Chrome MCP |

**Post-Design Gate Result**: ✅ ALL GATES PASS - Ready for task generation

## Project Structure

### Documentation (this feature)

```text
specs/003-platform-upgrade-v2/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (login, register)
│   ├── (main)/                   # Main app routes
│   │   ├── dashboard/            # User dashboard
│   │   ├── exam/                 # Exam taking interface
│   │   ├── practice/             # Practice sessions
│   │   ├── forum/                # Forum/community
│   │   ├── library/              # [NEW] Exam library
│   │   ├── profile/              # User profile
│   │   ├── subscription/         # Subscription management
│   │   └── admin/                # Admin panel
│   ├── api/                      # API routes
│   │   ├── auth/                 # Auth endpoints
│   │   ├── exams/                # Exam endpoints
│   │   ├── practice/             # Practice endpoints
│   │   ├── forum/                # Forum endpoints
│   │   ├── library/              # [NEW] Library endpoints
│   │   ├── subscription/         # Subscription endpoints
│   │   ├── rewards/              # Rewards endpoints
│   │   ├── notifications/        # Notification endpoints
│   │   ├── admin/                # Admin endpoints
│   │   └── webhooks/             # Stripe webhooks
│   └── page.tsx                  # Landing page (to be updated)
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── admin/                    # Admin components
│   ├── exam/                     # Exam components
│   ├── forum/                    # Forum components
│   ├── library/                  # [NEW] Library components
│   ├── notifications/            # Notification components
│   ├── rewards/                  # Rewards components
│   ├── subscription/             # Subscription components
│   └── shared/                   # Shared components
├── contexts/                     # React contexts
├── hooks/                        # Custom hooks
├── lib/
│   ├── supabase/                 # Supabase client & types
│   ├── stripe/                   # Stripe integration
│   ├── anthropic/                # Claude AI integration
│   ├── forum/                    # Forum utilities
│   ├── library/                  # [NEW] Library utilities
│   ├── rewards/                  # Rewards system
│   └── notifications/            # Notification system
└── types/                        # TypeScript type definitions

tests/
├── unit/
├── integration/
└── e2e/
```

**Structure Decision**: Next.js 14 App Router monorepo with API routes. New features (library, admin JSON upload, maintenance mode) follow existing patterns in `src/app/`, `src/components/`, and `src/lib/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - all gates pass. No complexity justification needed.
