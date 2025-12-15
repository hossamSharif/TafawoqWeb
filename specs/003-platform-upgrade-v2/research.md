# Research: Platform Upgrade V2

**Branch**: `003-platform-upgrade-v2` | **Date**: 2025-12-15

## Research Tasks

Based on Technical Context analysis, the following research areas were identified and resolved.

---

### 1. Exam Library Architecture

**Decision**: Extend existing `forum_posts` table with `is_library_visible` flag + create `library_access` table

**Rationale**:
- The forum already supports `exam_share` post type with full exam data
- Library is a curated view of shared exams, not a separate data store
- Adding `is_library_visible` boolean allows filtering shared exams for library display
- `library_access` table tracks which free users have accessed library content (permanent tracking per spec)

**Alternatives Considered**:
- Separate `exam_library` table: Rejected - would duplicate data already in `forum_posts` with `exam_share` type
- Using `shared_exam_completions` for access tracking: Rejected - tracks completions, not initial access; free users need access tracked before they even start the exam

---

### 2. Subscription Plan Restructuring

**Decision**: Modify existing `user_subscriptions` table + update `user_credits` to track new limits

**Rationale**:
- Current `user_subscriptions` already tracks tier (free/premium) and Stripe integration
- New limits (2/10 exams, 3/15 practices, 2/10 shares) fit existing credit tracking pattern
- `user_credits` table already exists with `exam_credits` and `practice_credits` columns
- Need to add `share_credits_exam` and `share_credits_practice` columns

**Alternatives Considered**:
- New subscription plans in Stripe: Not needed - limits are enforced application-side, not by Stripe
- Separate limits table: Rejected - over-engineering; credits table already serves this purpose

---

### 3. Reward System Enhancement

**Decision**: Use existing `reward_transactions` pattern with trigger-based credit increment

**Rationale**:
- `user_credits` and reward tracking already exist in codebase
- `shared_exam_completions` table already tracks when users complete shared content
- Need database trigger: on `shared_exam_completions` INSERT → increment owner's credits
- Notification already integrated via `notifications` table

**Alternatives Considered**:
- API-level credit increment: Rejected - race conditions if two users complete simultaneously
- Background job polling: Rejected - adds latency; triggers are immediate and atomic

---

### 4. Admin JSON Upload Implementation

**Decision**: Create `/api/admin/content/upload` endpoint with JSON validation against existing exam schema

**Rationale**:
- Spec clarification: JSON must match existing internal exam data structure
- `exam_sessions` table schema is well-defined in `src/types/exam.ts`
- Admin uploads should create entries in `forum_posts` with `is_admin_upload: true` flag
- RLS policy checks `is_admin` flag in user profile (per spec clarification)

**Alternatives Considered**:
- Separate admin content table: Rejected - library should show unified content regardless of source
- QTI or external format: Rejected per spec clarification - internal format only

---

### 5. Maintenance Mode Implementation

**Decision**: Use existing `feature_toggles` table with `maintenance_mode` key

**Rationale**:
- `feature_toggles` table already exists for feature flag management
- Admin APIs already have toggle endpoints (`PATCH /api/admin/settings/[feature_name]`)
- Middleware can check `maintenance_mode` toggle before allowing write operations

**Alternatives Considered**:
- Environment variable: Rejected - requires redeploy to change
- Separate maintenance table: Rejected - over-engineering; feature_toggles handles this

---

### 6. Navigation Structure for Library

**Decision**: Add "Library" as 5th main navigation tab between "Forum" and "Profile"

**Rationale**:
- Spec clarification: Library must be main nav tab alongside Dashboard, Exams, Practice, Forum
- Current nav structure in `src/components/shared/Navigation.tsx`
- Library icon: `Library` from lucide-react (book icon)

**Alternatives Considered**:
- Sub-menu under Exams: Rejected per spec clarification
- Floating button: Rejected per spec clarification

---

### 7. Payment Failure Handling

**Decision**: Implement 3-day grace period with Stripe webhook handling for `invoice.payment_failed`

**Rationale**:
- Spec clarification: 3-day grace period then auto-downgrade
- Stripe webhooks already handled at `/api/webhooks/stripe`
- Need to add: `grace_period_end` column to `user_subscriptions`
- Need to add: scheduled check or Stripe automatic retry handling

**Alternatives Considered**:
- Immediate downgrade: Rejected per spec clarification
- Manual admin intervention: Rejected per spec clarification

---

### 8. Branding Update Strategy

**Decision**: Create brand configuration file + update all hardcoded references

**Rationale**:
- App name changes to "Qudratak - قدراتك"
- Need centralized brand config in `src/lib/brand.ts`
- Landing page requires full redesign to feature new value proposition
- Onboarding flow needs update to explain rewards and library

**Alternatives Considered**:
- Environment variable for name: Partially useful but not for logo/styling
- i18n only: Insufficient - this is branding not just translation

---

## Technology Best Practices Applied

### Supabase RLS for Library Access
- `library_access` table needs RLS policy: users can only INSERT their own access records
- `forum_posts` with `is_library_visible` needs SELECT policy allowing all authenticated users

### Stripe Grace Period
- Use Stripe's built-in dunning management where possible
- Track `grace_period_end` timestamp for UI messaging
- Webhook events: `invoice.payment_failed`, `customer.subscription.updated`

### Real-time Notifications
- Leverage Supabase Realtime for instant notification delivery (<10s requirement)
- Subscribe to `notifications` table changes for authenticated user

---

## Unresolved Items

None - all research questions resolved through codebase analysis and spec clarifications.

---

## References

- Existing types: `src/types/exam.ts`, `src/types/subscription.ts`, `src/lib/forum/types.ts`
- Existing tables: `src/lib/supabase/types.ts`
- Existing APIs: `src/app/api/` directory structure
- Constitution: `.specify/memory/constitution.md` v1.2.0
