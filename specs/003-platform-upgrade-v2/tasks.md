# Tasks: Platform Upgrade V2 - Rebranding, Exam Library & Subscription Overhaul

**Input**: Design documents from `/specs/003-platform-upgrade-v2/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md
**Constitution**: v1.3.0 - All tasks comply with `.specify/memory/constitution.md`

**Tests**: Tests are NOT included as they were not explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**⚠️ MANDATORY: Git Commit After Each Task**
Per Constitution VI, after completing each task via `/speckit.implement`, the agent MUST:
1. Run `git add` for all changed files
2. Run `git commit` with message format: `feat([task-id]): [description]`
3. Report the commit hash before proceeding to the next task
4. HALT if commit fails and wait for user resolution

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database migrations, type generation, and branding foundation

- [x] T001 Apply database migration for `is_admin` column in `user_profiles` via Supabase MCP
- [x] T002 Apply database migration for `forum_posts` library columns (`is_library_visible`, `is_admin_upload`, `library_access_count`) via Supabase MCP
- [x] T003 Apply database migration for `user_credits` sharing columns (`share_credits_exam`, `share_credits_practice`, `library_access_used`) via Supabase MCP
- [x] T004 Apply database migration for `user_subscriptions` grace period columns (`grace_period_end`, `payment_failed_at`, `downgrade_scheduled`) via Supabase MCP
- [x] T005 Apply database migration to create `library_access` table via Supabase MCP
- [x] T006 Apply database migration to create `maintenance_log` table via Supabase MCP
- [x] T007 Apply database migration for database functions (`check_library_access_limit`, `grant_reward_on_completion`, `get_library_exams`) via Supabase MCP
- [x] T008 Apply database migration for triggers (`trg_grant_reward_on_completion`) via Supabase MCP
- [x] T009 Apply database migration for RLS policies (library_access, forum_posts library policies) via Supabase MCP
- [x] T010 Generate TypeScript types from updated schema via Supabase MCP and update src/lib/supabase/types.ts
- [x] T011 [P] Create brand configuration in src/lib/brand.ts with app name "Qudratak - قدراتك" and branding constants

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T012 [P] Create library types in src/types/library.ts (LibraryExam, LibraryAccess, LibraryAccessStatus)
- [x] T013 [P] Create rewards types in src/types/rewards.ts (RewardTransaction, RewardNotification)
- [x] T014 [P] Create maintenance types in src/types/maintenance.ts (MaintenanceConfig, MaintenanceLog)
- [x] T015 [P] Update subscription types in src/types/subscription.ts (add sharing limits, grace period fields)
- [x] T016 Create library queries in src/lib/library/queries.ts (getLibraryExams, getLibraryExamById, checkLibraryAccess)
- [x] T017 [P] Create library actions in src/lib/library/actions.ts (grantLibraryAccess, startLibraryExam, completeLibraryExam)
- [x] T018 [P] Create rewards utilities in src/lib/rewards/index.ts (getRewardHistory, checkRewardEligibility)
- [x] T019 [P] Create maintenance utilities in src/lib/maintenance/index.ts (getMaintenanceStatus, isMaintenanceModeActive)
- [x] T020 Update middleware.ts to add maintenance mode check for write operations (exam generation, practice creation, subscription)
- [x] T021 Add "Library" navigation item to src/components/shared/Navigation.tsx (between Forum and Profile)
- [x] T022 Backfill default values for existing users' share credits based on subscription tier

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Exam Library Access and Usage (Priority: P1) 🎯 MVP

**Goal**: Users can browse a library of shared exams, access them based on subscription tier, and complete them

**Independent Test**: Browse library, select an exam, complete it, verify it appears in exam history

### Implementation for User Story 1

- [x] T023 [P] [US1] Create LibraryExamCard component in src/components/library/LibraryExamCard.tsx (displays title, section, question count, creator)
- [x] T024 [P] [US1] Create LibraryExamList component in src/components/library/LibraryExamList.tsx (grid/list view of exams)
- [x] T025 [P] [US1] Create LibraryAccessButton component in src/components/library/LibraryAccessButton.tsx (handles free/premium access flow)
- [x] T026 [P] [US1] Create LibraryEmptyState component in src/components/library/LibraryEmptyState.tsx (message when library is empty)
- [x] T027 [P] [US1] Create LibraryUpgradePrompt component in src/components/library/LibraryUpgradePrompt.tsx (shown when free user exceeds limit)
- [x] T028 [US1] Create library listing page in src/app/(main)/library/page.tsx (displays LibraryExamList with pagination)
- [x] T029 [US1] Create library exam detail page in src/app/(main)/library/[postId]/page.tsx (exam preview and access button)
- [x] T030 [US1] Create GET /api/library route in src/app/api/library/route.ts (fetches library exams using get_library_exams function)
- [x] T031 [US1] Create GET /api/library/[postId] route in src/app/api/library/[postId]/route.ts (fetches single library exam)
- [x] T032 [US1] Create POST /api/library/[postId]/access route in src/app/api/library/[postId]/access/route.ts (grants access with tier check)
- [x] T033 [US1] Create POST /api/library/[postId]/start route in src/app/api/library/[postId]/start/route.ts (starts exam session)
- [x] T034 [US1] Update exam completion flow to record library exam completions and prevent re-sharing of library exams
- [x] T035 [US1] Add library exam indicator to exam history in src/components/profile/ExamHistory.tsx

**Checkpoint**: User Story 1 complete - users can browse library, access exams based on tier, and complete them

---

## Phase 4: User Story 2 - Subscription Plans with Reward System (Priority: P1)

**Goal**: Users see plan limits, earn rewards when others complete their shared content

**Independent Test**: Create users on each plan, verify limits, test reward mechanism when content is shared and completed

### Implementation for User Story 2

- [x] T036 [P] [US2] Create CreditsDisplay component in src/components/subscription/CreditsDisplay.tsx (shows remaining exam/practice/share credits)
- [x] T037 [P] [US2] Create RewardBadge component in src/components/rewards/RewardBadge.tsx (displays reward notification badge)
- [x] T038 [P] [US2] Create ShareLimitIndicator component in src/components/subscription/ShareLimitIndicator.tsx (shows remaining share quota)
- [x] T039 [US2] Update PlanCard component in src/components/subscription/PlanCard.tsx (display 49 SAR with 100 SAR strikethrough)
- [x] T040 [US2] Update dashboard to display current plan limits and credits in src/app/(main)/dashboard/page.tsx
- [x] T041 [US2] Create GET /api/subscription/limits route in src/app/api/subscription/limits/route.ts (returns user's current limits and usage)
- [x] T042 [US2] Create POST /api/rewards/claim route in src/app/api/rewards/claim/route.ts (manually claim pending rewards if needed)
- [x] T043 [US2] Update exam sharing flow to decrement share_credits_exam and check limits in src/app/api/forum/posts/route.ts
- [x] T044 [US2] Update practice sharing flow to decrement share_credits_practice and check limits in src/app/api/forum/posts/route.ts
- [x] T045 [US2] Add upgrade prompt when user hits generation or sharing limits
- [x] T046 [US2] Verify reward trigger works: when user completes shared content, owner receives credit and notification

**Checkpoint**: User Story 2 complete - plan limits enforced, rewards credited automatically

---

## Phase 5: User Story 3 - Practice Session Limits (Priority: P2)

**Goal**: Practice sessions limited to half the exam section's question count

**Independent Test**: Create practice session, verify max questions = floor(section_question_count / 2)

### Implementation for User Story 3

- [ ] T047 [US3] Create utility function to calculate practice limit in src/lib/practice/calculateLimit.ts
- [ ] T048 [US3] Update practice creation API in src/app/api/practice/route.ts to enforce half-question limit
- [ ] T049 [US3] Update practice creation UI in src/app/(main)/practice/page.tsx to display and enforce max question limit
- [ ] T050 [US3] Add explanatory tooltip/message when user tries to select more than allowed questions

**Checkpoint**: User Story 3 complete - practice limits enforced at half exam section count

---

## Phase 6: User Story 4 - App Rebranding and Landing Page (Priority: P2)

**Goal**: New branding "Qudratak - قدراتك" applied, landing page showcases all features

**Independent Test**: Visit landing page, verify new branding, verify all features highlighted

### Implementation for User Story 4

- [ ] T051 [P] [US4] Update page metadata with new brand name in src/app/layout.tsx
- [ ] T052 [P] [US4] Create new logo component in src/components/shared/Logo.tsx using brand.ts config
- [ ] T053 [P] [US4] Create HeroSection component for landing page in src/components/landing/HeroSection.tsx
- [ ] T054 [P] [US4] Create FeatureSection component for landing page in src/components/landing/FeatureSection.tsx (exam sharing, library, forum, practice)
- [ ] T055 [P] [US4] Create PricingSection component for landing page in src/components/landing/PricingSection.tsx
- [ ] T056 [US4] Redesign landing page in src/app/page.tsx with Hero, Features, Pricing sections
- [ ] T057 [US4] Update all hardcoded app name references to use brand.ts configuration
- [ ] T058 [US4] Update onboarding tutorial to explain rewards, forum, and library features in src/components/onboarding/

**Checkpoint**: User Story 4 complete - new branding applied throughout, landing page updated

---

## Phase 7: User Story 5 - Reward Notification System (Priority: P2)

**Goal**: Users receive in-app notifications when they earn rewards

**Independent Test**: Complete another user's shared exam, verify owner receives notification

### Implementation for User Story 5

- [ ] T059 [P] [US5] Create RewardNotificationCard component in src/components/notifications/RewardNotificationCard.tsx
- [ ] T060 [P] [US5] Create NotificationBanner component in src/components/notifications/NotificationBanner.tsx (shows pending rewards summary)
- [ ] T061 [US5] Update notifications context/hook to subscribe to real-time reward notifications via Supabase Realtime
- [ ] T062 [US5] Create GET /api/notifications/rewards route in src/app/api/notifications/rewards/route.ts (fetch reward notifications)
- [ ] T063 [US5] Add notification preferences for reward alerts in src/app/(main)/profile/settings/page.tsx
- [ ] T064 [US5] Display notification badge in navigation when new rewards pending

**Checkpoint**: User Story 5 complete - users receive instant notifications for rewards

---

## Phase 8: User Story 6 - Admin Exam/Practice Management (Priority: P3)

**Goal**: Admins can upload exam/practice content via JSON

**Independent Test**: Admin uploads JSON, content appears in library for users

### Implementation for User Story 6

- [ ] T065 [P] [US6] Create AdminContentUploader component in src/components/admin/AdminContentUploader.tsx (JSON file input with preview)
- [ ] T066 [P] [US6] Create AdminContentPreview component in src/components/admin/AdminContentPreview.tsx (renders exam preview before saving)
- [ ] T067 [P] [US6] Create AdminContentList component in src/components/admin/AdminContentList.tsx (lists admin-uploaded content)
- [ ] T068 [US6] Create admin content upload page in src/app/(main)/admin/content/page.tsx
- [ ] T069 [US6] Create POST /api/admin/content/validate route in src/app/api/admin/content/validate/route.ts (validates JSON against exam schema)
- [ ] T070 [US6] Create POST /api/admin/content/upload route in src/app/api/admin/content/upload/route.ts (stores validated content as forum_post with is_admin_upload=true)
- [ ] T071 [US6] Create GET /api/admin/content route in src/app/api/admin/content/route.ts (lists admin-uploaded content)
- [ ] T072 [US6] Create DELETE /api/admin/content/[id] route in src/app/api/admin/content/[id]/route.ts (removes admin content)
- [ ] T073 [US6] Add admin content section to admin dashboard in src/app/(main)/admin/page.tsx

**Checkpoint**: User Story 6 complete - admins can upload and manage JSON content

---

## Phase 9: User Story 7 - Maintenance Mode (Priority: P3)

**Goal**: Admins can enable maintenance mode to block write operations

**Independent Test**: Enable maintenance mode, verify exam generation blocked, verify browsing still works

### Implementation for User Story 7

- [ ] T074 [P] [US7] Create MaintenanceToggle component in src/components/admin/MaintenanceToggle.tsx
- [ ] T075 [P] [US7] Create MaintenanceBanner component in src/components/shared/MaintenanceBanner.tsx (displays maintenance message to users)
- [ ] T076 [US7] Create PATCH /api/admin/maintenance route in src/app/api/admin/maintenance/route.ts (enable/disable maintenance mode)
- [ ] T077 [US7] Create GET /api/admin/maintenance route in src/app/api/admin/maintenance/route.ts (get current maintenance status)
- [ ] T078 [US7] Add maintenance mode toggle to admin settings in src/app/(main)/admin/settings/page.tsx
- [ ] T079 [US7] Update middleware.ts to show MaintenanceBanner and block write operations when maintenance mode active
- [ ] T080 [US7] Update exam generation page to show maintenance message when blocked
- [ ] T081 [US7] Update practice creation page to show maintenance message when blocked
- [ ] T082 [US7] Update subscription page to show maintenance message when blocked

**Checkpoint**: User Story 7 complete - maintenance mode fully functional

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T083 [P] Handle edge case: premium user downgrades (excess content remains, cannot create new until under limits)
- [ ] T084 [P] Handle edge case: deleted shared content (rewards already earned remain valid)
- [ ] T085 [P] Handle edge case: simultaneous completions (both count, owner gets multiple rewards)
- [ ] T086 Implement Stripe webhook handling for payment failures in src/app/api/webhooks/stripe/route.ts using Stripe MCP tools (handle invoice.payment_failed event, set grace_period_end)
- [ ] T087 Implement grace period expiry handling using Stripe MCP tools for subscription management (auto-downgrade after 3 days via Stripe dunning or scheduled check)
- [ ] T088 Add payment failure and grace period notifications to user using Stripe MCP tools to retrieve payment status and Supabase for notification creation
- [ ] T089 Run quickstart.md validation - test all features end-to-end
- [ ] T090 Security review: verify RLS policies prevent unauthorized library access
- [ ] T091 Performance review: verify library browsing meets <30s requirement (SC-001)
- [ ] T092 Verify notification delivery meets <10s requirement (SC-005)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - must complete migrations in order (T001-T010 sequential, T011 parallel)
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-9)**: All depend on Foundational phase completion
  - US1 and US2 are both P1 priority - can proceed in parallel or sequentially
  - US3, US4, US5 are P2 priority - can proceed after US1/US2 MVP validated
  - US6, US7 are P3 priority - can proceed last
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - No dependencies on other stories (rewards trigger integrates with US1 but can be tested independently)
- **User Story 3 (P2)**: Can start after Foundational - No dependencies on other stories
- **User Story 4 (P2)**: Can start after Foundational - No dependencies on other stories
- **User Story 5 (P2)**: Can start after Foundational - Enhances US2 notifications but independently testable
- **User Story 6 (P3)**: Can start after Foundational - Uploads to library (US1) but independently testable
- **User Story 7 (P3)**: Can start after Foundational - No dependencies on other stories

### Within Each User Story

- Models/types before services
- Services before API routes
- API routes before UI components
- UI components before pages
- Core implementation before integration

### Parallel Opportunities

- T011 can run parallel with migrations (T001-T010)
- T012-T015 can all run in parallel (different type files)
- T016-T019 can all run in parallel (different lib files)
- Within US1: T023-T027 can all run in parallel (different components)
- Within US2: T036-T038 can all run in parallel (different components)
- Within US4: T051-T055 can all run in parallel (different components)
- Within US5: T059-T060 can run in parallel (different components)
- Within US6: T065-T067 can run in parallel (different components)
- Within US7: T074-T075 can run in parallel (different components)
- T083-T085 in Polish phase can all run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all component tasks for User Story 1 together:
Task: "Create LibraryExamCard component in src/components/library/LibraryExamCard.tsx"
Task: "Create LibraryExamList component in src/components/library/LibraryExamList.tsx"
Task: "Create LibraryAccessButton component in src/components/library/LibraryAccessButton.tsx"
Task: "Create LibraryEmptyState component in src/components/library/LibraryEmptyState.tsx"
Task: "Create LibraryUpgradePrompt component in src/components/library/LibraryUpgradePrompt.tsx"

# Then sequentially:
# T028 → T029 → T030 → T031 → T032 → T033 → T034 → T035
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (database migrations, types generation, branding config)
2. Complete Phase 2: Foundational (types, queries, actions, middleware, navigation)
3. Complete Phase 3: User Story 1 (Exam Library)
4. Complete Phase 4: User Story 2 (Subscription/Rewards)
5. **STOP and VALIDATE**: Test library access + rewards independently
6. Deploy/demo if ready - this is the MVP!

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (Library MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (Rewards MVP!)
4. Add User Stories 3-5 → Test independently → Deploy/Demo (P2 features)
5. Add User Stories 6-7 → Test independently → Deploy/Demo (Admin features)
6. Polish phase → Final validation → Production release

### Suggested MVP Scope

**MVP = User Story 1 + User Story 2** (both P1 priority)
- Library browsing and access
- Subscription limits enforcement
- Reward system for shared content
- This delivers core value proposition: community content sharing with incentives

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Use Supabase MCP tools for all database operations per constitution
- Use Chrome MCP tools for manual UI testing per constitution
