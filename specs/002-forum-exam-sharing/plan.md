# Implementation Plan: Forum & Exam Sharing Platform

**Branch**: `002-forum-exam-sharing` | **Date**: 2025-12-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-forum-exam-sharing/spec.md`

## Summary

Build a Reddit-inspired forum system where users can share completed exams/practices, create text posts, engage through likes/love reactions and comments, receive notifications, earn reward credits, and admins have full platform control. The implementation extends the existing Supabase-backed Next.js platform with new tables for forum posts, comments, reactions, notifications, and rewards, plus a complete admin panel at `/admin`.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14+ (App Router)
**Primary Dependencies**: Next.js 14+, React 18+, Supabase JS Client (@supabase/ssr, @supabase/supabase-js), shadcn/ui, Tailwind CSS, Stripe JS, lucide-react
**Storage**: Supabase PostgreSQL with RLS policies
**Testing**: ESLint + TypeScript type checking (npm run lint, npm run type-check)
**Target Platform**: Web (responsive, Arabic RTL layout)
**Project Type**: Web application (Next.js App Router monolith)
**Performance Goals**: Forum feed loads < 2s (SC-002), Notifications appear < 5s (SC-005), Admin dashboard < 3s (SC-008)
**Constraints**: Cursor-based pagination (20 items/page), 2-level comment nesting, Arabic RTL throughout
**Scale/Scope**: Existing user base, extends exam_sessions/practice_sessions tables

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. MCP Tooling Mandate (Documentation) | ✅ PASS | Will use Ref MCP for Supabase/Next.js docs |
| II. MCP Tooling Mandate (Database) | ✅ PASS | All migrations via `mcp__supabase__apply_migration` |
| III. MCP Tooling Mandate (Payments) | ✅ PASS | Credits integrate with existing Stripe subscription checks |
| IV. Security & Configuration | ✅ PASS | No hardcoded secrets; admin flag via RLS |
| V. Technology Stack Alignment | ✅ PASS | TypeScript/Next.js/React as specified |
| VI. Git Commit Discipline | ✅ PASS | Feature branch already created |
| VII. Chrome MCP Manual Testing | ✅ PASS | Will use Chrome MCP for UI validation |

**Gate Result**: PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/002-forum-exam-sharing/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API specifications)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (main)/
│   │   ├── forum/                    # Forum pages
│   │   │   ├── page.tsx              # Forum feed
│   │   │   ├── post/[id]/page.tsx    # Post detail with comments
│   │   │   └── create/page.tsx       # Create post form
│   │   ├── notifications/page.tsx    # Notification center
│   │   └── profile/page.tsx          # Extended with rewards section
│   ├── (admin)/
│   │   ├── admin/
│   │   │   ├── page.tsx              # Admin dashboard
│   │   │   ├── layout.tsx            # Admin layout with auth guard
│   │   │   ├── users/page.tsx        # User management
│   │   │   ├── moderation/page.tsx   # Content moderation queue
│   │   │   ├── subscriptions/page.tsx # Subscription management
│   │   │   ├── settings/page.tsx     # Feature toggles
│   │   │   └── analytics/page.tsx    # Platform analytics
│   │   └── login/page.tsx            # Admin login
│   └── api/
│       ├── forum/
│       │   ├── posts/route.ts        # GET (list), POST (create)
│       │   ├── posts/[id]/route.ts   # GET, PUT, DELETE
│       │   ├── posts/[id]/reactions/route.ts
│       │   ├── posts/[id]/comments/route.ts
│       │   └── comments/[id]/route.ts
│       ├── notifications/
│       │   ├── route.ts              # GET notifications
│       │   └── [id]/read/route.ts    # Mark as read
│       ├── rewards/
│       │   └── route.ts              # GET balance, POST redeem
│       ├── reports/
│       │   └── route.ts              # POST report
│       └── admin/
│           ├── users/route.ts
│           ├── moderation/route.ts
│           ├── settings/route.ts
│           └── analytics/route.ts
├── components/
│   ├── forum/
│   │   ├── PostCard.tsx
│   │   ├── PostList.tsx
│   │   ├── CommentSection.tsx
│   │   ├── CommentItem.tsx
│   │   ├── ReactionButtons.tsx
│   │   ├── ShareExamModal.tsx
│   │   └── CreatePostForm.tsx
│   ├── notifications/
│   │   ├── NotificationBadge.tsx
│   │   ├── NotificationList.tsx
│   │   └── NotificationItem.tsx
│   ├── rewards/
│   │   ├── CreditBalance.tsx
│   │   ├── RewardProgress.tsx
│   │   └── SharingStats.tsx
│   └── admin/
│       ├── AdminSidebar.tsx
│       ├── UserTable.tsx
│       ├── ModerationQueue.tsx
│       ├── FeatureToggles.tsx
│       └── AnalyticsCharts.tsx
└── lib/
    ├── forum/
    │   ├── queries.ts                # Supabase queries for forum
    │   └── types.ts                  # Forum TypeScript types
    ├── notifications/
    │   ├── service.ts                # Notification creation/delivery
    │   └── types.ts
    ├── rewards/
    │   ├── calculator.ts             # Milestone calculation
    │   └── types.ts
    └── admin/
        ├── queries.ts
        └── audit.ts                  # Audit logging
```

**Structure Decision**: Extends existing Next.js App Router monolith structure. Forum, notifications, rewards, and admin are new feature modules under existing `src/` directory pattern. Admin routes use route group `(admin)` for layout isolation.

## Complexity Tracking

> No constitution violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

---

## Post-Design Constitution Re-Check

*Re-evaluated after Phase 1 design completion.*

| Principle | Status | Design Verification |
|-----------|--------|---------------------|
| I. MCP Tooling Mandate (Documentation) | ✅ PASS | Used Ref MCP for Supabase RLS, pagination, realtime docs |
| II. MCP Tooling Mandate (Database) | ✅ PASS | All 9 tables + extensions designed for MCP migration |
| III. MCP Tooling Mandate (Payments) | ✅ PASS | Credits integrate with existing subscription; no new payment flows |
| IV. Security & Configuration | ✅ PASS | RLS policies defined; admin via `is_admin` flag; no secrets in code |
| V. Technology Stack Alignment | ✅ PASS | TypeScript/Next.js 14/React 18/Supabase as specified |
| VI. Git Commit Discipline | ✅ PASS | Feature branch active; tasks will create atomic commits |
| VII. Chrome MCP Manual Testing | ✅ PASS | Quickstart includes Chrome MCP testing workflow |

**Post-Design Gate Result**: ✅ PASS - Ready for task generation

---

## Generated Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Implementation Plan | `specs/002-forum-exam-sharing/plan.md` | ✅ Complete |
| Research | `specs/002-forum-exam-sharing/research.md` | ✅ Complete |
| Data Model | `specs/002-forum-exam-sharing/data-model.md` | ✅ Complete |
| API Contracts | `specs/002-forum-exam-sharing/contracts/api.md` | ✅ Complete |
| Quickstart Guide | `specs/002-forum-exam-sharing/quickstart.md` | ✅ Complete |
| Tasks | `specs/002-forum-exam-sharing/tasks.md` | ⏳ Pending (`/speckit.tasks`) |

---

## Next Steps

Run `/speckit.tasks` to generate the implementation task list based on this plan.
