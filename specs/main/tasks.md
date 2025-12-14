# Tasks: Claude Sonnet 4.5 Streaming Generation with Prompt Caching

**Input**: Design documents from `/specs/main/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/batch-generation-api.yaml, quickstart.md

**Tests**: Not explicitly requested - test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, etc.)
- Include exact file paths in descriptions

---

## User Stories (Derived from plan.md)

| ID | Priority | Title | Goal |
|----|----------|-------|------|
| US1 | P1 | Fast Exam Start | Student starts exam with <5s first batch load |
| US2 | P2 | Seamless Prefetching | System prefetches next batch at 70% completion |
| US3 | P3 | Session Resume | Student resumes exam with existing questions |
| US4 | P4 | Graceful Fallback | System falls back to OpenRouter on rate limit |
| US5 | P5 | Practice Mode | Practice sessions use batched generation |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and configuration

- [X] T001 Install @anthropic-ai/sdk dependency via `npm install @anthropic-ai/sdk`
- [X] T002 [P] Add ANTHROPIC_API_KEY to environment validation in src/lib/env.ts
- [X] T003 [P] Add environment variables to .env.example (ANTHROPIC_API_KEY, EXAM_BATCH_SIZE, PREFETCH_THRESHOLD)
- [X] T004 Create Anthropic client module directory at src/lib/anthropic/
- [X] T005 [P] Create module exports file at src/lib/anthropic/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema and core Anthropic client that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Apply database migration for exam_sessions columns (generated_batches, generation_context, total_questions, generation_in_progress) via Supabase MCP
- [X] T007 Apply database migration for practice_sessions columns (generated_batches, generation_context) via Supabase MCP
- [X] T008 Create indexes (idx_exam_sessions_pending, idx_exam_sessions_generating) via Supabase MCP
- [X] T009 Implement Claude API client with prompt caching in src/lib/anthropic/client.ts
- [X] T010 Define TypeScript interfaces (GenerationContext, BatchConfig, UsageMetrics) in src/lib/anthropic/types.ts
- [X] T011 Implement system prompt blocks with cache_control in src/lib/anthropic/prompts.ts
- [X] T012 Implement question generation function (generateQuestionBatch) in src/lib/anthropic/prompts.ts
- [X] T013 Implement retry logic with exponential backoff in src/lib/anthropic/client.ts
- [X] T014 Implement rate limit error detection helper (isRateLimitError) in src/lib/anthropic/client.ts

**Checkpoint**: Foundation ready - Anthropic client functional, database schema updated

---

## Phase 3: User Story 1 - Fast Exam Start (Priority: P1) - MVP

**Goal**: Student starts exam and receives first batch of 10 questions in under 5 seconds

**Independent Test**: Create new exam session via POST /api/exams, verify 10 questions returned, verify generated_batches=1 in database

### Implementation for User Story 1

- [X] T015 [US1] Modify POST /api/exams/route.ts to create session with batch generation fields initialized
- [X] T016 [US1] Implement first batch generation call in POST /api/exams/route.ts using generateQuestionBatch
- [X] T017 [US1] Store first batch questions and update generation_context in exam_sessions
- [X] T018 [US1] Return ExamSessionResponse with questions (answers redacted) per API contract
- [X] T019 [US1] Add Arabic error messages for generation failures in /api/exams/route.ts
- [X] T020 [US1] Update ExamContext.tsx to handle batch loading state (isLoadingBatch, batchError)
- [X] T021 [US1] Add loading skeleton UI for initial question load in src/app/(main)/exam/[id]/page.tsx

**Checkpoint**: User Story 1 complete - New exams load with first 10 questions in <5s

---

## Phase 4: User Story 2 - Seamless Prefetching (Priority: P2)

**Goal**: System automatically prefetches next batch when user reaches question 7 of current batch (70% threshold)

**Independent Test**: Progress to question 7, verify network request fires for next batch, verify questions array grows without UI interruption

### Implementation for User Story 2

- [X] T022 [US2] Create batch generation API route at src/app/api/exams/[sessionId]/questions/route.ts
- [X] T023 [US2] Implement batch validation (sequential index, session ownership) in questions/route.ts
- [X] T024 [US2] Implement generation lock acquisition (generation_in_progress=true) in questions/route.ts
- [X] T025 [US2] Call generateQuestionBatch and append to existing questions in questions/route.ts
- [X] T026 [US2] Release generation lock and update generation_context on completion
- [X] T027 [US2] Return 409 Conflict with Arabic error when generation already in progress
- [X] T028 [US2] Implement prefetch trigger logic at 70% threshold in src/hooks/useExamSession.ts
- [X] T029 [US2] Add prefetchNextBatch callback function in useExamSession.ts
- [X] T030 [US2] Handle 409 response with exponential backoff retry in useExamSession.ts
- [X] T031 [US2] Merge prefetched questions into local state without UI disruption

**Checkpoint**: User Story 2 complete - Questions load seamlessly ahead of user progress

---

## Phase 5: User Story 3 - Session Resume (Priority: P3)

**Goal**: Student returning to partially completed exam loads existing questions instantly and continues from last position

**Independent Test**: Create exam, progress to question 15, close browser, return to exam, verify all 20 questions load from DB, prefetch resumes correctly

### Implementation for User Story 3

- [X] T032 [US3] Modify GET /api/exams/[sessionId]/route.ts to return all generated questions
- [X] T033 [US3] Include generatedBatches and generation_context in session response
- [X] T034 [US3] Update useExamSession.ts to initialize from existing questions on mount
- [X] T035 [US3] Calculate correct prefetch batch index from generation_context.lastBatchIndex
- [X] T036 [US3] Resume prefetch logic from current position without re-generating existing batches

**Checkpoint**: User Story 3 complete - Exam resume loads existing questions, continues prefetching

---

## Phase 6: User Story 4 - Graceful Fallback (Priority: P4)

**Goal**: When Claude API is rate-limited, system falls back to OpenRouter without user-visible interruption

**Independent Test**: Simulate rate limit error, verify OpenRouter fallback is called, verify questions generated successfully

### Implementation for User Story 4

- [X] T037 [US4] Implement OpenRouter fallback function in src/lib/anthropic/client.ts
- [X] T038 [US4] Integrate fallback into generateQuestionBatch after 3 Claude retries
- [X] T039 [US4] Add cacheHit: false to BatchResponse meta when using fallback
- [X] T040 [US4] Log fallback usage for monitoring (provider switch event)
- [X] T041 [US4] Handle total failure (both providers) with GENERATION_UNAVAILABLE error
- [X] T042 [US4] Create error UI component with cancel/retry options in src/components/exam/GenerationError.tsx
- [X] T043 [US4] Display GenerationError component when 503 response received

**Checkpoint**: User Story 4 complete - Rate limits handled gracefully with fallback

---

## Phase 7: User Story 5 - Practice Mode (Priority: P5)

**Goal**: Practice sessions use same batched generation pattern with smaller batch size (5 questions)

**Independent Test**: Start practice session, verify 5 questions generated, verify prefetch works at question 3-4

### Implementation for User Story 5

- [X] T044 [P] [US5] Create practice batch API route at src/app/api/practice/[sessionId]/questions/route.ts
- [X] T045 [US5] Implement batch generation with PRACTICE_BATCH_SIZE (default 5) in practice questions route
- [X] T046 [US5] Apply same generation lock pattern (generation_in_progress check) for practice
- [X] T047 [US5] Modify POST /api/practice/route.ts to generate first batch on session creation
- [X] T048 [US5] Update practice session hooks to use prefetch pattern (70% threshold)
- [X] T049 [US5] Store generation_context in practice_sessions table

**Checkpoint**: User Story 5 complete - Practice mode uses batched generation

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Performance optimization, monitoring, and production readiness

- [ ] T050 [P] Add cache performance logging (cacheRead, cacheWrite, hitRate) in src/lib/anthropic/client.ts
- [ ] T051 [P] Add usage metrics tracking (tokens used per batch) for cost monitoring
- [ ] T052 Validate system prompts exceed 1,024 token minimum for caching
- [ ] T053 [P] Add request timing instrumentation for latency monitoring
- [ ] T054 Run quickstart.md test-claude.ts verification script
- [ ] T055 Run quickstart.md test-caching.ts verification script
- [ ] T056 Verify first batch latency <5s target via Chrome MCP manual testing
- [ ] T057 [P] Update TypeScript types in src/types/question.ts if needed for new batch fields
- [ ] T058 Code cleanup: Remove any unused OpenRouter-only code paths superseded by this feature

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup
    │
    ▼
Phase 2: Foundational (BLOCKS ALL USER STORIES)
    │
    ├──────────────────┬──────────────────┬──────────────────┬──────────────────┐
    ▼                  ▼                  ▼                  ▼                  ▼
Phase 3: US1      Phase 4: US2      Phase 5: US3      Phase 6: US4      Phase 7: US5
(Fast Start)      (Prefetch)        (Resume)          (Fallback)        (Practice)
    │                  │                  │                  │                  │
    └──────────────────┴──────────────────┴──────────────────┴──────────────────┘
                                          │
                                          ▼
                                    Phase 8: Polish
```

### User Story Dependencies

| Story | Can Start After | Dependencies on Other Stories |
|-------|-----------------|------------------------------|
| US1 | Phase 2 complete | None - fully independent |
| US2 | Phase 2 complete | None - can test with manually created sessions |
| US3 | Phase 2 complete | None - can test with manually created sessions |
| US4 | Phase 2 complete | None - fallback logic is independent |
| US5 | Phase 2 complete | None - practice mode is separate from exams |

### Within Each User Story

- API routes before frontend hooks
- Backend logic before UI components
- Core functionality before error handling

### Parallel Opportunities

**Phase 1 (Setup)**:
- T002 + T003 + T005 can run in parallel (different files)

**Phase 2 (Foundational)**:
- T006 + T007 + T008 can run in parallel (database migrations)
- T009 must complete before T011, T012
- T010 can run in parallel with T009 (type definitions)

**Phase 3+ (User Stories)**:
- All user stories can start in parallel after Phase 2
- Within US5: T044 is parallelizable (different file from exam routes)

**Phase 8 (Polish)**:
- T050 + T051 + T053 + T057 can run in parallel (different concerns)
- T054 + T055 are independent verification scripts

---

## Parallel Example: Foundational Phase

```bash
# Launch database migrations in parallel:
Task: "Apply migration for exam_sessions columns via Supabase MCP" (T006)
Task: "Apply migration for practice_sessions columns via Supabase MCP" (T007)
Task: "Create indexes via Supabase MCP" (T008)

# After migrations complete, launch type definitions in parallel with client:
Task: "Define TypeScript interfaces in src/lib/anthropic/types.ts" (T010)
Task: "Implement Claude API client in src/lib/anthropic/client.ts" (T009)
```

## Parallel Example: User Stories After Foundation

```bash
# Multiple developers can work on different stories simultaneously:
Developer A: US1 - Fast Exam Start (T015-T021)
Developer B: US2 - Prefetching (T022-T031)
Developer C: US4 - Fallback (T037-T043)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T014)
3. Complete Phase 3: User Story 1 (T015-T021)
4. **STOP and VALIDATE**: Test exam creation with first batch
5. Deploy/demo - Users can start exams with fast initial load

### Incremental Delivery

| Increment | Includes | User Value |
|-----------|----------|------------|
| 1 | Setup + Foundation + US1 | Fast exam start (MVP) |
| 2 | + US2 | Seamless question loading throughout exam |
| 3 | + US3 | Can resume partially completed exams |
| 4 | + US4 | Reliable generation even under load |
| 5 | + US5 | Practice mode with same UX |
| 6 | + Polish | Production-ready with monitoring |

### Suggested MVP Scope

**Phase 1 + Phase 2 + Phase 3 (US1)** = Tasks T001-T021 (21 tasks)

This delivers:
- Fast exam start (<5s first batch)
- Anthropic integration with prompt caching
- Database schema for batch tracking

Users can start and complete exams (questions load batch-by-batch on demand).

---

## Notes

- All file paths are relative to repository root
- [P] tasks can run in parallel with other [P] tasks in same phase
- [Story] label maps task to specific user story for traceability
- Arabic error messages follow API contract specification
- Supabase MCP should be used for all database migrations per constitution
- Chrome MCP should be used for manual UI testing per constitution
- Commit after each task or logical group per Git Commit Discipline
