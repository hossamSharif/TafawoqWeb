# Tasks: Forum & Exam Sharing Platform

**Input**: Design documents from `/specs/002-forum-exam-sharing/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Tests**: Not explicitly requested in the feature specification. Tests are NOT included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: Next.js App Router at `src/`
- Paths follow plan.md structure: `src/app/`, `src/components/`, `src/lib/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, database schema, and base types

- [x] T001 Create forum TypeScript types in src/lib/forum/types.ts
- [x] T002 [P] Create notifications TypeScript types in src/lib/notifications/types.ts
- [x] T003 [P] Create rewards TypeScript types in src/lib/rewards/types.ts
- [x] T004 [P] Create admin TypeScript types in src/lib/admin/types.ts
- [x] T005 Apply migration: Create forum_posts table via mcp__supabase__apply_migration
- [x] T006 Apply migration: Create comments table via mcp__supabase__apply_migration
- [x] T007 Apply migration: Create reactions table via mcp__supabase__apply_migration
- [x] T008 Apply migration: Create notifications table via mcp__supabase__apply_migration
- [x] T009 Apply migration: Create shared_exam_completions table via mcp__supabase__apply_migration
- [x] T010 Apply migration: Create user_credits table via mcp__supabase__apply_migration
- [x] T011 Apply migration: Create reports table via mcp__supabase__apply_migration
- [x] T012 Apply migration: Create admin_audit_log table via mcp__supabase__apply_migration
- [x] T013 Apply migration: Create feature_toggles table via mcp__supabase__apply_migration
- [x] T014 Apply migration: Extend user_profiles with is_admin, is_banned, is_disabled columns via mcp__supabase__apply_migration
- [x] T015 Apply migration: Add forum notification preferences to user_profiles via mcp__supabase__apply_migration

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T016 Apply migration: Create RLS policies for forum_posts table via mcp__supabase__apply_migration
- [x] T017 Apply migration: Create RLS policies for comments table via mcp__supabase__apply_migration
- [x] T018 Apply migration: Create RLS policies for reactions table via mcp__supabase__apply_migration
- [x] T019 Apply migration: Create RLS policies for notifications table via mcp__supabase__apply_migration
- [x] T020 Apply migration: Create RLS policies for reports table via mcp__supabase__apply_migration
- [x] T021 Apply migration: Create RLS policies for admin_audit_log and feature_toggles via mcp__supabase__apply_migration
- [x] T022 Apply migration: Create database indexes for forum_posts, comments, reactions via mcp__supabase__apply_migration
- [x] T023 Apply migration: Create trigger functions increment_reaction_count, decrement_reaction_count via mcp__supabase__apply_migration
- [x] T024 Apply migration: Create trigger function increment_comment_count via mcp__supabase__apply_migration
- [x] T025 Apply migration: Create trigger function check_reward_milestone via mcp__supabase__apply_migration
- [x] T026 Apply migration: Seed default feature_toggles (forum_enabled, rewards_enabled, etc.) via mcp__supabase__apply_migration
- [x] T027 [P] Create forum Supabase queries helper in src/lib/forum/queries.ts
- [x] T028 [P] Create notifications service in src/lib/notifications/service.ts
- [x] T029 [P] Create rewards calculator in src/lib/rewards/calculator.ts
- [x] T030 [P] Create admin queries helper in src/lib/admin/queries.ts
- [x] T031 [P] Create admin audit logging utility in src/lib/admin/audit.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Share Exam/Practice with Community (Priority: P1)

**Goal**: Users can share completed exams/practices with the community, removing their answers so others can take the exam fresh.

**Independent Test**: Select an exam to share, confirm sharing settings, verify the exam appears as shareable content without the original user's answers.

### Implementation for User Story 1

- [x] T032 [P] [US1] Create ShareExamModal component in src/components/forum/ShareExamModal.tsx
- [x] T033 [P] [US1] Create auto-description generator utility for exam metadata in src/lib/forum/description-generator.ts
- [x] T034 [US1] Create POST /api/forum/posts route for creating exam share posts in src/app/api/forum/posts/route.ts
- [x] T035 [US1] Add share button to exam/practice history (extend existing exam history component)
- [x] T036 [US1] Create shared content dashboard showing completion stats in src/components/forum/SharingStats.tsx
- [x] T037 [US1] Create POST /api/forum/posts/[id]/start-exam route to start a shared exam in src/app/api/forum/posts/[id]/start-exam/route.ts
- [x] T038 [US1] Track shared exam completions and update completion_count via database trigger

**Checkpoint**: User Story 1 complete - users can share exams and others can start them

---

## Phase 4: User Story 2 - Browse and Engage with Forum Posts (Priority: P1)

**Goal**: Users can discover shared exams and engage with community through a Reddit-inspired forum interface with likes and loves.

**Independent Test**: Navigate to forum, view posts, perform like/love interactions on content.

### Implementation for User Story 2

- [ ] T039 [P] [US2] Create PostCard component in src/components/forum/PostCard.tsx
- [ ] T040 [P] [US2] Create PostList component with infinite scroll in src/components/forum/PostList.tsx
- [ ] T041 [P] [US2] Create ReactionButtons component in src/components/forum/ReactionButtons.tsx
- [ ] T042 [US2] Create GET /api/forum/posts route with cursor pagination, sorting, search in src/app/api/forum/posts/route.ts
- [ ] T043 [US2] Create forum feed page in src/app/(main)/forum/page.tsx
- [ ] T044 [US2] Create POST /api/forum/posts/[id]/reactions route for adding reactions in src/app/api/forum/posts/[id]/reactions/route.ts
- [ ] T045 [US2] Create DELETE /api/forum/posts/[id]/reactions/[type] route for removing reactions in src/app/api/forum/posts/[id]/reactions/[type]/route.ts
- [ ] T046 [US2] Create GET /api/forum/posts/[id] route for single post detail in src/app/api/forum/posts/[id]/route.ts
- [ ] T047 [US2] Create post detail page in src/app/(main)/forum/post/[id]/page.tsx

**Checkpoint**: User Story 2 complete - users can browse forum and react to posts

---

## Phase 5: User Story 3 - Create Text Posts in Forum (Priority: P1)

**Goal**: Users can create text-only posts to share thoughts, ask questions, or discuss exam preparation strategies.

**Independent Test**: Create a new text post, submit it, verify it appears in the forum feed.

### Implementation for User Story 3

- [ ] T048 [P] [US3] Create CreatePostForm component in src/components/forum/CreatePostForm.tsx
- [ ] T049 [US3] Extend POST /api/forum/posts to handle text post type in src/app/api/forum/posts/route.ts
- [ ] T050 [US3] Create create post page in src/app/(main)/forum/create/page.tsx
- [ ] T051 [US3] Create PUT /api/forum/posts/[id] route for editing posts in src/app/api/forum/posts/[id]/route.ts
- [ ] T052 [US3] Create DELETE /api/forum/posts/[id] route for deleting posts in src/app/api/forum/posts/[id]/route.ts
- [ ] T053 [US3] Add edit/delete options to PostCard for author's own posts

**Checkpoint**: User Story 3 complete - users can create, edit, and delete text posts

---

## Phase 6: User Story 4 - Comment on Forum Posts (Priority: P2)

**Goal**: Users can participate in discussions by adding comments and threaded replies (max 2 levels).

**Independent Test**: View a post, add a comment, verify comment appears with correct attribution.

### Implementation for User Story 4

- [ ] T054 [P] [US4] Create CommentItem component in src/components/forum/CommentItem.tsx
- [ ] T055 [P] [US4] Create CommentSection component with replies in src/components/forum/CommentSection.tsx
- [ ] T056 [US4] Create GET /api/forum/posts/[id]/comments route in src/app/api/forum/posts/[id]/comments/route.ts
- [ ] T057 [US4] Create POST /api/forum/posts/[id]/comments route in src/app/api/forum/posts/[id]/comments/route.ts
- [ ] T058 [US4] Create PUT /api/forum/comments/[id] route for editing comments in src/app/api/forum/comments/[id]/route.ts
- [ ] T059 [US4] Create DELETE /api/forum/comments/[id] route for deleting comments in src/app/api/forum/comments/[id]/route.ts
- [ ] T060 [US4] Create POST /api/forum/comments/[id]/like route in src/app/api/forum/comments/[id]/like/route.ts
- [ ] T061 [US4] Create DELETE /api/forum/comments/[id]/like route in src/app/api/forum/comments/[id]/like/route.ts
- [ ] T062 [US4] Integrate CommentSection into post detail page src/app/(main)/forum/post/[id]/page.tsx

**Checkpoint**: User Story 4 complete - users can comment and reply on posts

---

## Phase 7: User Story 5 - Receive Notifications for Sharing Activity (Priority: P2)

**Goal**: Users receive in-app notifications when others complete their exam, comment on their post, or react to their content.

**Independent Test**: Trigger a notification event, verify notification appears in notification center.

### Implementation for User Story 5

- [ ] T063 [P] [US5] Create NotificationBadge component in src/components/notifications/NotificationBadge.tsx
- [ ] T064 [P] [US5] Create NotificationItem component in src/components/notifications/NotificationItem.tsx
- [ ] T065 [P] [US5] Create NotificationList component in src/components/notifications/NotificationList.tsx
- [ ] T066 [US5] Create GET /api/notifications route with pagination in src/app/api/notifications/route.ts
- [ ] T067 [US5] Create GET /api/notifications/count route in src/app/api/notifications/count/route.ts
- [ ] T068 [US5] Create POST /api/notifications/[id]/read route in src/app/api/notifications/[id]/read/route.ts
- [ ] T069 [US5] Create POST /api/notifications/read-all route in src/app/api/notifications/read-all/route.ts
- [ ] T070 [US5] Create notifications center page in src/app/(main)/notifications/page.tsx
- [ ] T071 [US5] Add NotificationBadge to main navigation layout
- [ ] T072 [US5] Trigger exam_completed notification when shared exam is completed (update start-exam route)
- [ ] T073 [US5] Trigger new_comment notification when comment is added (update comments POST route)
- [ ] T074 [US5] Trigger comment_reply notification when reply is added (update comments POST route)

**Checkpoint**: User Story 5 complete - users receive and view notifications

---

## Phase 8: User Story 6 - Earn Rewards for Sharing (Priority: P3)

**Goal**: Users earn exam/practice credits when others complete their shared exams (milestone: 5, 10, 15... completions).

**Independent Test**: Share exams, have users complete them, verify credits are awarded and can be redeemed.

### Implementation for User Story 6

- [ ] T075 [P] [US6] Create CreditBalance component in src/components/rewards/CreditBalance.tsx
- [ ] T076 [P] [US6] Create RewardProgress component in src/components/rewards/RewardProgress.tsx
- [ ] T077 [US6] Create GET /api/rewards route in src/app/api/rewards/route.ts
- [ ] T078 [US6] Create POST /api/rewards/redeem route in src/app/api/rewards/redeem/route.ts
- [ ] T079 [US6] Extend user profile page with rewards section showing credits and progress
- [ ] T080 [US6] Integrate credit check with existing subscription feature checks for exam access
- [ ] T081 [US6] Trigger reward_earned notification when milestone is reached

**Checkpoint**: User Story 6 complete - users earn and redeem credits

---

## Phase 9: User Story 7 - Report Inappropriate Content (Priority: P3)

**Goal**: Users can report posts/comments that violate community guidelines for moderator review.

**Independent Test**: Report a post/comment, verify it appears in admin moderation queue.

### Implementation for User Story 7

- [ ] T082 [P] [US7] Create ReportModal component in src/components/forum/ReportModal.tsx
- [ ] T083 [US7] Create POST /api/reports route in src/app/api/reports/route.ts
- [ ] T084 [US7] Add report button to PostCard and CommentItem components
- [ ] T085 [US7] Trigger report_resolved notification when report is resolved (admin action)

**Checkpoint**: User Story 7 complete - users can report content

---

## Phase 10: User Story 8 - Admin Full Platform Control (Priority: P3)

**Goal**: Admins have dedicated panel at /admin for managing users, content moderation, subscriptions, and feature settings.

**Independent Test**: Login to admin panel at /admin, perform CRUD operations on users, posts, and settings.

### Implementation for User Story 8

- [ ] T086 [US8] Create admin layout with auth guard in src/app/(admin)/admin/layout.tsx
- [ ] T087 [P] [US8] Create AdminSidebar component in src/components/admin/AdminSidebar.tsx
- [ ] T088 [US8] Create admin dashboard page in src/app/(admin)/admin/page.tsx
- [ ] T089 [US8] Create GET /api/admin/dashboard route in src/app/api/admin/dashboard/route.ts
- [ ] T090 [P] [US8] Create UserTable component in src/components/admin/UserTable.tsx
- [ ] T091 [US8] Create admin users page in src/app/(admin)/admin/users/page.tsx
- [ ] T092 [US8] Create GET /api/admin/users route with search/pagination in src/app/api/admin/users/route.ts
- [ ] T093 [US8] Create PUT /api/admin/users/[id] route for updating user status in src/app/api/admin/users/[id]/route.ts
- [ ] T094 [US8] Create POST /api/admin/users/[id]/reset-password route in src/app/api/admin/users/[id]/reset-password/route.ts
- [ ] T095 [US8] Create DELETE /api/admin/users/[id] route in src/app/api/admin/users/[id]/route.ts
- [ ] T096 [P] [US8] Create ModerationQueue component in src/components/admin/ModerationQueue.tsx
- [ ] T097 [US8] Create admin moderation page in src/app/(admin)/admin/moderation/page.tsx
- [ ] T098 [US8] Create GET /api/admin/moderation route in src/app/api/admin/moderation/route.ts
- [ ] T099 [US8] Create POST /api/admin/moderation/[id]/resolve route in src/app/api/admin/moderation/[id]/resolve/route.ts
- [ ] T100 [P] [US8] Create FeatureToggles component in src/components/admin/FeatureToggles.tsx
- [ ] T101 [US8] Create admin settings page in src/app/(admin)/admin/settings/page.tsx
- [ ] T102 [US8] Create GET /api/admin/settings route in src/app/api/admin/settings/route.ts
- [ ] T103 [US8] Create PUT /api/admin/settings/[feature_name] route in src/app/api/admin/settings/[feature_name]/route.ts
- [ ] T104 [US8] Create admin subscriptions page in src/app/(admin)/admin/subscriptions/page.tsx
- [ ] T105 [US8] Create PUT /api/admin/users/[id]/subscription route in src/app/api/admin/users/[id]/subscription/route.ts
- [ ] T106 [P] [US8] Create AnalyticsCharts component in src/components/admin/AnalyticsCharts.tsx
- [ ] T107 [US8] Create admin analytics page in src/app/(admin)/admin/analytics/page.tsx
- [ ] T108 [US8] Create GET /api/admin/analytics route in src/app/api/admin/analytics/route.ts
- [ ] T109 [US8] Add audit logging to all admin action routes

**Checkpoint**: User Story 8 complete - full admin control panel

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T110 [P] Add Arabic RTL styling to all forum components
- [ ] T111 [P] Add loading states and skeletons to forum feed and notifications
- [ ] T112 [P] Add error boundaries and graceful error handling to forum pages
- [ ] T113 Run npm run lint and fix any linting issues
- [ ] T114 Run npm run type-check and fix any type errors
- [ ] T115 Manual validation via Chrome MCP: Test forum flow (browse, create, react, comment)
- [ ] T116 Manual validation via Chrome MCP: Test notifications flow
- [ ] T117 Manual validation via Chrome MCP: Test admin panel flow
- [ ] T118 Verify RLS policies prevent unauthorized access via Chrome MCP test as different users

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion
  - User Story 1 (P1): Share Exams - can start after Phase 2
  - User Story 2 (P1): Browse Forum - can start after Phase 2
  - User Story 3 (P1): Text Posts - can start after Phase 2
  - User Story 4 (P2): Comments - depends on Phase 4 (post detail page)
  - User Story 5 (P2): Notifications - can start after Phase 2, needs US1/US4 for triggers
  - User Story 6 (P3): Rewards - depends on US1 completion tracking
  - User Story 7 (P3): Reports - can start after Phase 2
  - User Story 8 (P3): Admin Panel - can start after Phase 2
- **Polish (Phase 11)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (Share Exams)**: Independent after Foundational
- **US2 (Browse Forum)**: Independent after Foundational
- **US3 (Text Posts)**: Independent after Foundational
- **US4 (Comments)**: Requires US2 (post detail page) for integration
- **US5 (Notifications)**: Requires US1 (exam completions) and US4 (comments) for trigger events
- **US6 (Rewards)**: Requires US1 (completion tracking) for milestone calculation
- **US7 (Reports)**: Independent after Foundational
- **US8 (Admin)**: Independent after Foundational, but can moderate content from other stories

### Within Each User Story

- Components before pages
- API routes before page integration
- Core implementation before cross-story integration

### Parallel Opportunities

**Phase 1 - All types can be created in parallel:**
- T001, T002, T003, T004 (all types files)

**Phase 2 - Queries/services can be created in parallel:**
- T027, T028, T029, T030, T031 (all lib utilities)

**User Stories - P1 stories can run in parallel:**
- US1, US2, US3 have no dependencies on each other
- Within each story, components marked [P] can run in parallel

---

## Parallel Example: User Story 2

```bash
# Launch all components for User Story 2 together:
Task: "Create PostCard component in src/components/forum/PostCard.tsx"
Task: "Create PostList component in src/components/forum/PostList.tsx"
Task: "Create ReactionButtons component in src/components/forum/ReactionButtons.tsx"

# Then sequentially: API routes → Page integration
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup (15 tasks)
2. Complete Phase 2: Foundational (16 tasks)
3. Complete Phase 3: User Story 1 - Share Exams (7 tasks)
4. Complete Phase 4: User Story 2 - Browse Forum (9 tasks)
5. Complete Phase 5: User Story 3 - Text Posts (6 tasks)
6. **STOP and VALIDATE**: Test forum core functionality
7. Deploy/demo if ready

**MVP Task Count**: 53 tasks

### Incremental Delivery

1. MVP (US1-3) → Core forum with sharing
2. Add US4 (Comments) → Full engagement features
3. Add US5 (Notifications) → User retention features
4. Add US6 (Rewards) → Incentive system
5. Add US7 (Reports) → Community safety
6. Add US8 (Admin) → Platform management
7. Polish → Production-ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (31 tasks)
2. Once Foundational is done:
   - Developer A: User Stories 1 + 6 (sharing + rewards)
   - Developer B: User Stories 2 + 3 + 4 (forum + comments)
   - Developer C: User Stories 5 + 7 + 8 (notifications + reports + admin)
3. Stories integrate independently

---

## Summary

| Phase | Tasks | Purpose |
|-------|-------|---------|
| Phase 1: Setup | T001-T015 (15) | Types and database tables |
| Phase 2: Foundational | T016-T031 (16) | RLS, triggers, utilities |
| Phase 3: US1 Share Exams | T032-T038 (7) | P1 - Core sharing feature |
| Phase 4: US2 Browse Forum | T039-T047 (9) | P1 - Forum feed and reactions |
| Phase 5: US3 Text Posts | T048-T053 (6) | P1 - User-generated content |
| Phase 6: US4 Comments | T054-T062 (9) | P2 - Discussion threads |
| Phase 7: US5 Notifications | T063-T074 (12) | P2 - User engagement |
| Phase 8: US6 Rewards | T075-T081 (7) | P3 - Incentive system |
| Phase 9: US7 Reports | T082-T085 (4) | P3 - Content moderation input |
| Phase 10: US8 Admin | T086-T109 (24) | P3 - Platform management |
| Phase 11: Polish | T110-T118 (9) | Cross-cutting improvements |

**Total Tasks**: 118

**Task Count by User Story**:
- US1 (Share Exams): 7 tasks
- US2 (Browse Forum): 9 tasks
- US3 (Text Posts): 6 tasks
- US4 (Comments): 9 tasks
- US5 (Notifications): 12 tasks
- US6 (Rewards): 7 tasks
- US7 (Reports): 4 tasks
- US8 (Admin): 24 tasks
- Setup/Foundational: 31 tasks
- Polish: 9 tasks

**Independent Test Criteria per Story**:
- US1: Share an exam, verify it appears without answers
- US2: Browse forum, like/love posts
- US3: Create text post, verify in feed
- US4: Add comment and reply
- US5: Trigger notification, view in center
- US6: Complete shared exams, verify credits
- US7: Report content, verify in queue
- US8: Login to /admin, manage users/content

**Suggested MVP Scope**: User Stories 1-3 (Phase 1-5, 53 tasks)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All migrations must use `mcp__supabase__apply_migration` per constitution
- UI validation via Chrome MCP per constitution requirement
- Arabic RTL layout required throughout
- Cursor-based pagination (20 items/page) per spec
- 2-level comment nesting maximum
