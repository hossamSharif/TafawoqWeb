# Tasks: GAT Exam Platform v3.0 - Advanced Diagrams & Quality Improvements

**Feature Branch**: `1-gat-exam-v3`
**Input**: Design documents from `/specs/1-gat-exam-v3/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Tests are OPTIONAL and only included where the specification explicitly requests them. This implementation focuses on core functionality first.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Repository root structure (from plan.md):
- `src/` for source code
- `tests/` for test suites
- `specs/1-gat-exam-v3/` for design documents

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for v3.0 features

- [X] T001 Verify TypeScript 5.6.0 and Next.js 14.2.0 configuration in package.json
- [X] T002 [P] Install new dependencies: jsxgraph@^1.11.0, chart.js@^4.4.0, react-chartjs-2@^5.2.0, zod@^3.23.0 via npm/pnpm
- [X] T003 [P] Update @anthropic-ai/sdk to 0.71.2 for prompt caching support
- [X] T004 [P] Create src/skills/ directory structure with subdirectories for qudurat-quant, qudurat-verbal, qudurat-diagrams, qudurat-schema, qudurat-quality
- [X] T005 [P] Create src/services/skills/ directory for SkillLoader.ts and SkillValidator.ts
- [X] T006 [P] Create src/services/generation/ directory for QuduratGenerator.ts, PromptBuilder.ts, ResponseParser.ts, QuestionValidator.ts
- [X] T007 [P] Create src/services/diagrams/ directory for DiagramRenderer.tsx, SVGRenderer.tsx, JSXGraphRenderer.tsx, ChartRenderer.tsx
- [X] T008 [P] Create src/services/cache/ directory for PromptCacheManager.ts
- [X] T009 [P] Create src/components/diagrams/ directory for DiagramContainer.tsx and AccessibleDiagram.tsx
- [X] T010 Add ANTHROPIC_API_KEY environment variable to .env.example

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema

- [X] T011 Run Migration 1: Extend questions table with shape_type, pattern_id, diagram_config, comparison_values, relationship_type, generation_metadata, quality_flags, corrected_at, error_count columns using base schema migration
- [X] T012 Run Migration 2: Create question_errors table with RLS policies using base schema migration
- [X] T013 Run Migration 3: Create review_queue table with RLS policies using base schema migration
- [X] T014 Run Migration 4: Create exam_configs table with RLS policies using base schema migration
- [X] T015 Generate TypeScript types from Supabase schema (manually generated from base schema)
- [X] T016 Verify all new tables and indexes created successfully (verified via Supabase dashboard)

### Skills Architecture Foundation

- [X] T017 Implement SkillLoader.ts in src/services/skills/ with methods to read SKILL.md files and concatenate with references/ subdirectories
- [X] T018 Implement SkillValidator.ts in src/services/skills/ with validation for skill file format and token count estimation
- [X] T019 Create topic hierarchy constants in src/lib/constants/topics.ts with QUANTITATIVE_TOPICS and VERBAL_TOPICS structures from data-model.md
- [X] T020 Create analogy relationship constants in src/lib/constants/analogy-relationships.ts with all 22 relationship types from data-model.md

### AI Generation Core Services

- [X] T021 Implement PromptCacheManager.ts in src/services/cache/ with cache control configuration for Claude API ephemeral caching
- [X] T022 Implement PromptBuilder.ts in src/services/generation/ with methods to build system prompts from Skills and user prompts for question generation
- [X] T023 Implement ResponseParser.ts in src/services/generation/ with JSON parsing and validation for Claude API responses
- [X] T024 Implement QuestionValidator.ts in src/services/generation/ with Zod schema validation from data-model.md and LLM-based grammar validation
- [X] T025 Implement QuduratGenerator.ts in src/services/generation/ with generateWithRetry method using exponential backoff (max 3 retries, 1s/2s/4s delays)

### Diagram Rendering Foundation

- [X] T026 Implement SVGRenderer.tsx in src/services/diagrams/ for simple shapes (18 types) with Arabic RTL text support
- [X] T027 Implement JSXGraphRenderer.tsx in src/services/diagrams/ with lazy loading for overlapping shapes (8 patterns) including shading and intersection calculations
- [X] T028 Implement ChartRenderer.tsx in src/services/diagrams/ with lazy loading for Chart.js statistical charts (9 types) with Arabic i18n
- [X] T029 Implement DiagramRenderer.tsx in src/services/diagrams/ with routing logic based on renderHint field (SVG/JSXGraph/Chart.js)
- [X] T030 Implement DiagramContainer.tsx in src/components/diagrams/ with responsive scaling (320px-1920px), clamp-based font sizing, and aspect ratio support
- [X] T031 Implement AccessibleDiagram.tsx in src/components/diagrams/ with figure/figcaption semantic HTML, ARIA labels, and WCAG 2.1 AA contrast validation

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Practice Overlapping Shapes Questions (Priority: P1) 🎯 MVP

**Goal**: Enable students to practice geometry questions with 8 overlapping shape patterns, proper shading, Arabic labels, and solution formulas

**Independent Test**: Generate a geometry question with "square with quarter circles at corners" pattern, verify diagram renders with shaded region at 0.3-0.6 opacity, Arabic labels on vertices, and formula displayed after answer submission

### Skills Content for User Story 1

- [ ] T032 [P] [US1] Create src/skills/qudurat-diagrams/SKILL.md with diagram generation rules, renderHint selection logic, and accessibility requirements (FR-018, FR-019)
- [ ] T033 [P] [US1] Create src/skills/qudurat-diagrams/references/overlapping-shapes.md with all 8 overlapping patterns, formulas, coordinate calculations, and distractor examples
- [ ] T034 [P] [US1] Create src/skills/qudurat-diagrams/references/simple-shapes.md with 18 simple shape types and their JSON configurations
- [ ] T035 [P] [US1] Create src/skills/qudurat-schema/SKILL.md with required/conditional field rules for diagram questions from data-model.md
- [ ] T036 [P] [US1] Create src/skills/qudurat-schema/references/full-schema.md with complete TypeScript interfaces for DiagramConfig and shape-specific data types

### Overlapping Shapes Implementation

- [ ] T037 [US1] Add overlapping shape pattern configurations to src/lib/constants/diagram-patterns.ts with 8 pattern definitions including shading operations and formulas
- [ ] T038 [US1] Implement pre-calculation logic in src/services/diagrams/shape-calculations.ts for intersection points, shaded regions, and SVG/JSXGraph path generation
- [ ] T039 [US1] Add overlapping shape rendering support to JSXGraphRenderer.tsx with shading configuration (fillColor: #e74c3c, fillOpacity: 0.3-0.6)
- [ ] T040 [US1] Implement formula display component in src/components/diagrams/FormulaDisplay.tsx to show mathematical formula after answer submission (FR-013)
- [ ] T041 [US1] Add Arabic label positioning logic to DiagramContainer.tsx with RTL text direction and vertex/center labeling

### Integration & Testing

- [ ] T042 [US1] Update QuduratGenerator.ts to load qudurat-diagrams and qudurat-schema skills for geometry questions with overlapping patterns
- [ ] T043 [US1] Create Server Action generateOverlappingShapesQuestionAction in src/app/actions/generation-actions.ts that calls QuduratGenerator with diagram parameters
- [ ] T044 [US1] Add diagram rendering to question display page in src/app/practice/quantitative/[questionId]/page.tsx with DiagramRenderer component
- [ ] T045 [US1] Test all 8 overlapping patterns render correctly on mobile (320px) and desktop (1920px) widths with <500ms rendering time (FR-016, FR-017)

**Checkpoint**: User Story 1 complete - Students can practice overlapping shapes questions with proper diagrams

---

## Phase 4: User Story 2 - Receive High-Quality AI-Generated Questions (Priority: P1)

**Goal**: Ensure all generated questions have correct calculations, proper Arabic grammar, realistic difficulty, and topic distribution matching GAT standards

**Independent Test**: Generate batch of 20 questions, verify topic distribution within ±5% of target (40% arithmetic, 24% geometry, 23% algebra, 13% statistics for quantitative), validate Arabic grammar passes LLM validation, confirm difficulty distribution is ~30% easy, 50% medium, 20% hard

### Skills Content for User Story 2

- [ ] T046 [P] [US2] Create src/skills/qudurat-quant/SKILL.md with topic distribution rules (FR-001), difficulty distribution (FR-006), mental calculation constraints (FR-007), and question type distribution
- [ ] T047 [P] [US2] Create src/skills/qudurat-quant/references/topics.md with 29 quantitative subtopics, formulas, and mental-math-friendly number ranges
- [ ] T048 [P] [US2] Create src/skills/qudurat-quant/references/examples.md with 2-3 complete JSON examples for each question type (mcq, comparison, diagram)
- [ ] T049 [P] [US2] Create src/skills/qudurat-verbal/SKILL.md with topic distribution rules (FR-002) and verbal question type specifications
- [ ] T050 [P] [US2] Create src/skills/qudurat-verbal/references/topics.md with verbal topics and subtopics structure
- [ ] T051 [P] [US2] Create src/skills/qudurat-quality/SKILL.md with 10 quality criteria checklist, Arabic فصحى grammar requirements, distractor generation rules (FR-005), and difficulty calibration guidelines

### Quality Validation Implementation

- [ ] T052 [US2] Implement LLM-based grammar validation in QuestionValidator.ts using Claude API with specialized grammar checking prompt for formal Arabic
- [ ] T053 [US2] Add automatic flagging logic to QuestionValidator.ts to insert flagged questions into review_queue table with flag_type='grammar' (FR-003)
- [ ] T054 [US2] Implement topic distribution validation in QuestionValidator.ts to verify generated batches match FR-001 and FR-002 percentages within ±5%
- [ ] T055 [US2] Implement difficulty distribution validation in QuestionValidator.ts to verify 30%±5% easy, 50%±5% medium, 20%±5% hard (FR-006)
- [ ] T056 [US2] Add distractor quality check to QuestionValidator.ts to verify answer choices reflect common errors from Skills examples (FR-005)

### Batch Generation & Error Reporting

- [ ] T057 [US2] Update QuduratGenerator.ts to generate batches of 20 questions with consistent quality across all batches (FR-008)
- [ ] T058 [US2] Implement batch retry logic in QuduratGenerator.ts to preserve successful questions and retry only failed portion with exponential backoff (FR-009b)
- [ ] T059 [US2] Create Server Action reportQuestionErrorAction in src/app/actions/error-actions.ts to insert into question_errors table (FR-009a)
- [ ] T060 [US2] Create error reporting UI component in src/components/questions/ErrorReportButton.tsx with error type selection (mathematical/grammatical/diagram/other)
- [ ] T061 [US2] Create admin review queue page in src/app/admin/review-queue/page.tsx to display flagged questions with approve/reject actions

**Checkpoint**: User Story 2 complete - All questions meet quality standards with validation and error reporting

---

## Phase 5: User Story 3 - Practice Comparison Questions (Priority: P2)

**Goal**: Enable students to practice comparison questions (المقارنة) with two values and four standard Arabic answer choices

**Independent Test**: Generate comparison question, verify two values labeled "القيمة الأولى" and "القيمة الثانية", confirm four answer choices are "القيمة الأولى أكبر", "القيمة الثانية أكبر", "القيمتان متساويتان", "المعطيات غير كافية للمقارنة", validate correct answer matches mathematical relationship

### Implementation for User Story 3

- [ ] T062 [P] [US3] Add comparison question examples to src/skills/qudurat-quant/references/examples.md with JSON structure showing comparison_values field and four fixed answer choices
- [ ] T063 [P] [US3] Update src/skills/qudurat-quant/SKILL.md to include comparison question format rules and when to use "المعطيات غير كافية للمقارنة" answer
- [ ] T064 [US3] Add comparison_values field validation to QuestionValidator.ts Zod schema requiring value1 and value2 fields (FR-020)
- [ ] T065 [US3] Create ComparisonQuestion.tsx component in src/components/questions/ to display two values with Arabic labels and four standard answer choices (FR-021)
- [ ] T066 [US3] Update QuduratGenerator.ts to support question_type='comparison' with proper answer choice generation
- [ ] T067 [US3] Add comparison questions to topic distribution in src/lib/constants/topics.ts as 15% of quantitative questions
- [ ] T068 [US3] Test comparison question generation and display with all four answer scenarios (value1 larger, value2 larger, equal, insufficient data)

**Checkpoint**: User Story 3 complete - Students can practice comparison questions with correct format

---

## Phase 6: User Story 4 - Practice Word Problems (Priority: P2)

**Goal**: Enable students to practice word problems in five categories (speed-distance, work, age, profit-loss, mixture) with realistic Arabic contexts and step-by-step solutions

**Independent Test**: Generate word problems for each of 5 categories, verify realistic Arabic names (أحمد، فاطمة), confirm mental-math-friendly numbers, validate step-by-step Arabic solution explanations

### Implementation for User Story 4

- [ ] T069 [P] [US4] Create word problem templates in src/skills/qudurat-quant/references/word-problems.md with 5 categories, realistic Arabic names, and culturally appropriate contexts (FR-022, FR-023)
- [ ] T070 [P] [US4] Add word problem examples to src/skills/qudurat-quant/references/examples.md showing step-by-step solution format in Arabic (FR-024)
- [ ] T071 [US4] Update src/skills/qudurat-quant/SKILL.md with word problem generation rules including name lists and context appropriateness guidelines
- [ ] T072 [US4] Add word problem category constants to src/lib/constants/word-problem-categories.ts with 5 categories and their subtypes
- [ ] T073 [US4] Create WordProblemSolution.tsx component in src/components/questions/ to display step-by-step explanation with Arabic formatting
- [ ] T074 [US4] Update QuduratGenerator.ts to generate word problems across 5 categories with balanced distribution
- [ ] T075 [US4] Test word problem generation for all 5 categories with verification of realistic contexts and step-by-step solutions

**Checkpoint**: User Story 4 complete - Students can practice word problems with culturally appropriate contexts

---

## Phase 7: User Story 5 - Practice Analogy Questions with Relationship Types (Priority: P3)

**Goal**: Enable students to encounter analogy questions covering all 22 relationship types with correct relationship identification in explanations

**Independent Test**: Generate 22 analogy questions each demonstrating different relationship type, verify relationship correctly labeled in solution explanation (e.g., "ترادف", "تضاد"), confirm Arabic word pairs appropriately demonstrate each relationship pattern

### Implementation for User Story 5

- [ ] T076 [P] [US5] Create src/skills/qudurat-verbal/references/analogy-relations.md with all 22 relationship types, definitions, and 3-5 Arabic word pair examples per type (FR-025)
- [ ] T077 [P] [US5] Update src/skills/qudurat-verbal/SKILL.md with analogy question generation rules and relationship type selection logic
- [ ] T078 [US5] Add relationship_type field validation to QuestionValidator.ts for analogy questions
- [ ] T079 [US5] Create AnalogyExplanation.tsx component in src/components/questions/ to display relationship type label in explanation (FR-026)
- [ ] T080 [US5] Update QuduratGenerator.ts to generate analogy questions with balanced distribution across 22 relationship types
- [ ] T081 [US5] Add analogy relationship type tracking to ensure diverse coverage over multiple practice sessions
- [ ] T082 [US5] Test analogy generation for all 22 relationship types with verification of correct Arabic word pairs and relationship identification

**Checkpoint**: User Story 5 complete - Students can practice comprehensive analogy relationship types

---

## Phase 8: User Story 6 - Generate Practice Exams Efficiently (Priority: P3)

**Goal**: Enable generation of full 120-question exams in <3 minutes and 20-question batches in ~30 seconds with 70% cost reduction through prompt caching

**Independent Test**: Request full 120-question exam generation, measure total time to completion (target <3 minutes), verify all 120 questions meet quality standards, confirm cost shows ~75% reduction vs single-question generation through cache hit tracking in generation_metadata

### Implementation for User Story 6

- [ ] T083 [US6] Update PromptCacheManager.ts to implement cache_control: {type: "ephemeral"} for system prompts with 5-minute TTL
- [ ] T084 [US6] Modify PromptBuilder.ts to mark concatenated Skills system prompt (~15,000 tokens) with cache control header
- [ ] T085 [US6] Update QuduratGenerator.ts to generate 6 batches sequentially (not parallel) to maximize cache reuse within 5-minute window
- [ ] T086 [US6] Add cache hit tracking to generation_metadata field storing {cacheHit: boolean, cost: number, model: string, batch_id: string, generated_at: timestamp}
- [ ] T087 [US6] Create Server Action generateFullExamAction in src/app/actions/generation-actions.ts that orchestrates 6-batch sequential generation
- [ ] T088 [US6] Create exam generation progress UI in src/components/admin/ExamGenerationProgress.tsx showing batch progress, cache hits, and cost savings
- [ ] T089 [US6] Implement exam config creation in src/app/admin/exam-configs/page.tsx allowing selection of track (scientific/literary), total questions, difficulty distribution
- [ ] T090 [US6] Test full 120-question exam generation measuring time (<3 minutes target), cost reduction (70%+ target), and quality consistency across all batches (FR-009, SC-006, SC-007)

**Checkpoint**: User Story 6 complete - Efficient batch generation with prompt caching operational

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

### Documentation & Validation

- [ ] T091 [P] Update quickstart.md with actual environment setup steps verified against implementation
- [ ] T092 [P] Create Skills module documentation in src/skills/README.md explaining architecture and how to extend
- [ ] T093 [P] Document diagram rendering system in src/services/diagrams/README.md with library selection guide
- [ ] T094 Run through quickstart.md validation end-to-end to verify all setup steps work correctly

### Performance & Accessibility

- [ ] T095 [P] Performance testing: Verify diagram rendering <500ms on minimum device specs (iPhone 8, Galaxy S8) using Chrome MCP browser_performance tools
- [ ] T096 [P] Accessibility audit: Verify all diagrams have captions, WCAG 2.1 AA contrast ratios (4.5:1), and screen reader compatibility with NVDA/JAWS/VoiceOver
- [ ] T097 [P] Responsive testing: Verify diagrams display correctly at 320px, 640px, 1024px, 1920px widths using Chrome MCP browser_resize

### Admin Tools & Monitoring

- [ ] T098 [P] Create admin metrics dashboard in src/app/admin/metrics/page.tsx showing cache hit rate, cost savings, error rates, and generation statistics
- [ ] T099 [P] Create error correction workflow page in src/app/admin/errors/page.tsx for reviewing and fixing reported question errors
- [ ] T100 [P] Add generation logging to track batch performance, API costs, and quality metrics in database

### Code Quality

- [ ] T101 Run TypeScript type checking: npm run type-check and fix any type errors
- [ ] T102 Run linting: npm run lint and address any issues
- [ ] T103 Code cleanup: Remove commented code, add JSDoc comments to public APIs, ensure consistent formatting
- [ ] T104 Security review: Verify ANTHROPIC_API_KEY and Supabase credentials only in environment variables, no hard-coded secrets in Skills files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T001-T010) - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion (T011-T031) - MVP target
- **User Story 2 (Phase 4)**: Depends on Foundational completion (T011-T031) - Can run parallel with US1
- **User Story 3 (Phase 5)**: Depends on Foundational completion (T011-T031) - Can run parallel with US1/US2
- **User Story 4 (Phase 6)**: Depends on Foundational completion (T011-T031) - Can run parallel with US1/US2/US3
- **User Story 5 (Phase 7)**: Depends on Foundational completion (T011-T031) - Can run parallel with other user stories
- **User Story 6 (Phase 8)**: Depends on Foundational completion and should come after at least US1/US2 for testing efficiency
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - No dependencies on other stories (relies only on Foundational)
- **User Story 2 (P1)**: Independent - No dependencies on other stories (relies only on Foundational)
- **User Story 3 (P2)**: Independent - No dependencies on other stories (relies only on Foundational)
- **User Story 4 (P2)**: Independent - No dependencies on other stories (relies only on Foundational)
- **User Story 5 (P3)**: Independent - No dependencies on other stories (relies only on Foundational)
- **User Story 6 (P3)**: Should come after US1/US2 to validate efficiency gains with real questions

### Within Each User Story

- Skills content creation (SKILL.md files) can be done in parallel [P] before implementation
- Schema validation additions depend on Skills content being defined
- UI components depend on validation logic being implemented
- Integration tests come after all components are implemented

### Parallel Opportunities

**Setup Phase (All can run in parallel):**
- T002, T003, T004, T005, T006, T007, T008, T009 (dependency installation and directory creation)

**Foundational Phase (Within constraints):**
- T011-T016 (database migrations - must run sequentially via Supabase MCP)
- T017-T020 (skills foundation - can run in parallel)
- T021-T025 (AI services - can run in parallel after T017-T020)
- T026-T031 (diagram rendering - can run in parallel)

**User Story 1:**
- T032-T036 (all Skills files can be created in parallel)

**User Story 2:**
- T046-T051 (all Skills files can be created in parallel)

**All User Stories 1-5:**
- Can proceed in parallel after Foundational phase if team capacity allows

---

## Parallel Example: Foundational Phase

```bash
# After Setup complete, launch Skills foundation together:
Task T017: "Implement SkillLoader.ts in src/services/skills/"
Task T018: "Implement SkillValidator.ts in src/services/skills/"
Task T019: "Create topic hierarchy constants in src/lib/constants/topics.ts"
Task T020: "Create analogy relationship constants in src/lib/constants/analogy-relationships.ts"

# Then launch AI services together:
Task T021: "Implement PromptCacheManager.ts in src/services/cache/"
Task T022: "Implement PromptBuilder.ts in src/services/generation/"
Task T023: "Implement ResponseParser.ts in src/services/generation/"
Task T024: "Implement QuestionValidator.ts in src/services/generation/"

# Separately launch diagram renderers in parallel:
Task T026: "Implement SVGRenderer.tsx in src/services/diagrams/"
Task T027: "Implement JSXGraphRenderer.tsx in src/services/diagrams/"
Task T028: "Implement ChartRenderer.tsx in src/services/diagrams/"
```

---

## Parallel Example: User Story 1

```bash
# Launch all Skills content creation for User Story 1 together:
Task T032: "Create src/skills/qudurat-diagrams/SKILL.md"
Task T033: "Create src/skills/qudurat-diagrams/references/overlapping-shapes.md"
Task T034: "Create src/skills/qudurat-diagrams/references/simple-shapes.md"
Task T035: "Create src/skills/qudurat-schema/SKILL.md"
Task T036: "Create src/skills/qudurat-schema/references/full-schema.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2 Only)

**Recommended minimum for initial deployment:**

1. Complete Phase 1: Setup (T001-T010)
2. Complete Phase 2: Foundational (T011-T031) - **CRITICAL CHECKPOINT**
3. Complete Phase 3: User Story 1 (T032-T045) - **Overlapping shapes functionality**
4. Complete Phase 4: User Story 2 (T046-T061) - **Quality assurance**
5. **STOP and VALIDATE**:
   - Generate 20 overlapping shapes questions
   - Verify quality validation catches grammar issues
   - Test error reporting workflow
   - Confirm diagrams render on mobile and desktop
6. Deploy/demo if ready - **This provides core value to students**

**Rationale**: US1 addresses the biggest content gap (overlapping shapes), US2 ensures quality across all questions. Together they form a complete, production-ready increment.

### Incremental Delivery

1. **Foundation** (T001-T031) → Core infrastructure ready
2. **MVP** (+ US1 + US2) → Deploy/Demo (Students can practice overlapping shapes with quality assurance)
3. **+ US3** (Comparison questions) → Deploy/Demo
4. **+ US4** (Word problems) → Deploy/Demo
5. **+ US5** (Analogy relationships) → Deploy/Demo
6. **+ US6** (Efficient batch generation) → Deploy/Demo (Cost optimization)
7. **+ Polish** (Phase 9) → Final production release

Each increment adds value without breaking previous functionality.

### Parallel Team Strategy

With multiple developers after Foundational phase:

1. **Team completes Setup + Foundational together** (T001-T031)
2. **Once T031 complete, split work:**
   - Developer A: User Story 1 (T032-T045) - Diagrams
   - Developer B: User Story 2 (T046-T061) - Quality
   - Developer C: User Story 3 (T062-T068) - Comparison
   - Developer D: User Story 4 (T069-T075) - Word problems
3. **Stories integrate independently** - each can be tested and deployed separately

---

## Task Count Summary

**Total Tasks**: 104 tasks

**By Phase**:
- Phase 1 (Setup): 10 tasks
- Phase 2 (Foundational): 21 tasks (CRITICAL PATH)
- Phase 3 (US1 - Overlapping Shapes): 14 tasks
- Phase 4 (US2 - Quality): 16 tasks
- Phase 5 (US3 - Comparison): 7 tasks
- Phase 6 (US4 - Word Problems): 7 tasks
- Phase 7 (US5 - Analogy): 7 tasks
- Phase 8 (US6 - Batch Efficiency): 8 tasks
- Phase 9 (Polish): 14 tasks

**By User Story**:
- User Story 1 (P1): 14 tasks
- User Story 2 (P1): 16 tasks
- User Story 3 (P2): 7 tasks
- User Story 4 (P2): 7 tasks
- User Story 5 (P3): 7 tasks
- User Story 6 (P3): 8 tasks

**Parallelizable Tasks**: 47 tasks marked [P]

**Suggested MVP Scope**:
- Setup + Foundational + US1 + US2 = 61 tasks
- Estimated time: 3-4 weeks (1 developer) or 1-2 weeks (2+ developers in parallel)

---

## Notes

- All database operations MUST use Supabase MCP tools (mcp__supabase__apply_migration, mcp__supabase__generate_typescript_types)
- Skills files (SKILL.md and references/) must be created before AI generation can work
- Diagram rendering requires JSXGraph and Chart.js lazy loading for performance
- Prompt caching requires sequential batch generation (not parallel) to maximize cache hits
- Each user story delivers independent value and can be tested/deployed separately
- [P] tasks can run in parallel if different files and no dependencies
- Commit after each task or logical group for git discipline
- Test User Story 1 + 2 MVP before proceeding to other stories
- Avoid vague descriptions - all tasks specify exact file paths
- Quality flags in review_queue require human expert review workflow (admin interface)
