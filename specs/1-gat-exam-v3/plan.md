# Implementation Plan: GAT Exam Platform v3.0 - Advanced Diagrams & Quality Improvements

**Branch**: `1-gat-exam-v3` | **Date**: 2026-01-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/1-gat-exam-v3/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

GAT Exam Platform v3.0 introduces advanced diagram rendering for 8 overlapping geometric shape patterns, comprehensive AI question generation quality improvements, and cost optimization through prompt caching. The technical approach uses a multi-library diagram rendering system (SVG for simple shapes, JSXGraph for overlapping patterns, Chart.js for statistics), a modular Skills architecture for AI prompts with Claude API prompt caching achieving 75% cost reduction, and hybrid database schema (indexed columns + JSONB) for flexible diagram data storage.

## Technical Context

**Language/Version**: TypeScript 5.6.0 with Next.js 14.2.0 (App Router)
**Primary Dependencies**:
- Frontend: React 18.3.0, shadcn/ui, Tailwind CSS 3.4.14
- Backend: @anthropic-ai/sdk 0.71.2 (Claude API), @supabase/supabase-js 2.49.0, @supabase/ssr 0.5.2
- Diagram Rendering: jsxgraph@^1.11.0, chart.js@^4.4.0, react-chartjs-2@^5.2.0
- Validation: zod@^3.23.0
- Payments: Stripe 17.4.0

**Storage**: Supabase PostgreSQL with RLS policies
- Existing tables: exam_sessions, practice_sessions, user_subscriptions, user_credits
- New schema: Hybrid approach with indexed columns (shape_type, pattern_id) + JSONB for complex diagram data

**Testing**: npm test (unit), integration tests for diagram rendering and AI generation
**Target Platform**: Web (Next.js App Router), Mobile Web (iOS 14+, Android 9+)
**Project Type**: Web application (frontend + backend services)
**Performance Goals**:
- Diagram rendering: <500ms per diagram
- Full exam generation: <3 minutes for 120 questions
- Batch generation: ~30 seconds for 20 questions

**Constraints**:
- All text in formal Arabic (فصحى)
- Mental calculation only (no calculator needed)
- WCAG 2.1 AA accessibility (4.5:1 contrast ratio)
- Screen width support: 320px to 1920px
- Cost reduction: 70% through prompt caching

**Scale/Scope**:
- 8 overlapping shape patterns + 18 simple shapes + 9 chart types
- 5 Skills modules for AI generation
- 22 analogy relationship types
- Backward compatible with v2.x questions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. MCP Tooling Mandate (Documentation & Reference) ✅
- **Status**: PASS
- **Application**: Will use `mcp__Ref__ref_search_documentation` for JSXGraph, Chart.js, Claude API documentation
- **Application**: Will use `mcp__Ref__ref_read_url` for specific library implementation details

### II. MCP Tooling Mandate (Database & Backend) ✅
- **Status**: PASS
- **Application**: Will use `mcp__supabase__apply_migration` for schema changes (diagram tables)
- **Application**: Will use `mcp__supabase__generate_typescript_types` for type generation
- **Application**: Will use `mcp__supabase__list_tables` to verify existing schema
- **Application**: All database operations through Supabase MCP tools exclusively

### III. MCP Tooling Mandate (Payments) ⚠️
- **Status**: NOT APPLICABLE (No payment operations in this feature)
- **Note**: Feature focuses on exam generation and diagram rendering, not payment/subscription changes

### IV. Security & Configuration ✅
- **Status**: PASS
- **Application**: Claude API keys stored in environment variables (ANTHROPIC_API_KEY)
- **Application**: Supabase credentials via environment variables
- **Application**: No hard-coded secrets in Skills files or generation services
- **Validation**: All environment variables documented in quickstart.md

### V. Technology Stack Alignment ✅
- **Status**: PASS
- **Platform**: Web (Next.js 14.2.0 with App Router) - confirmed by package.json
- **Frontend**: React 18.3.0, shadcn/ui, Tailwind CSS - aligned
- **Backend**: Supabase PostgreSQL, @anthropic-ai/sdk - aligned
- **TypeScript**: 5.6.0 - aligned
- **Project Structure**: src/ for source code, tests/ for test suites - aligned

### VI. Git Commit Discipline ✅
- **Status**: PASS (will be enforced during `/speckit.implement`)
- **Plan**: Each task completion will trigger immediate commit
- **Format**: `feat([task-id]): [description]` with bullet points
- **Verification**: Agent will run `git log --oneline -n 10` after each session

### VII. Chrome MCP Manual Testing Mandate ⚠️
- **Status**: PARTIALLY APPLICABLE
- **Application**: Will use Chrome MCP tools for diagram rendering verification
- **Application**: Will use `chrome_screenshot` to capture diagram test states
- **Application**: Will use `chrome_navigate` + `chrome_evaluate` for visual regression testing
- **Note**: Primary testing through automated unit/integration tests, Chrome MCP for visual validation

### Constitution Compliance Summary (Initial Check)
- **PASS**: 5/5 applicable principles
- **WARNINGS**: 2 principles not applicable or partially applicable (no blockers)
- **BLOCKERS**: None
- **Action Required**: ✅ Proceed to Phase 0

---

### Constitution Re-evaluation (Post-Design, Phase 1 Complete)

**Date**: 2026-01-05
**Status**: All principles validated against design artifacts

#### I. MCP Tooling Mandate (Documentation & Reference) ✅
- **Re-validated**: PASS
- **Evidence**:
  - research.md documents use of `mcp__Ref__ref_search_documentation` for JSXGraph, Chart.js, Claude API docs
  - quickstart.md includes references to official documentation sources
- **No changes required**

#### II. MCP Tooling Mandate (Database & Backend) ✅
- **Re-validated**: PASS
- **Evidence**:
  - data-model.md includes 4 migrations using `mcp__supabase__apply_migration` format
  - All database operations designed for Supabase MCP tools
  - Schema changes documented for MCP execution
- **No changes required**

#### III. MCP Tooling Mandate (Payments) ⚠️
- **Re-validated**: NOT APPLICABLE
- **Confirmed**: Feature has no payment operations
- **No changes required**

#### IV. Security & Configuration ✅
- **Re-validated**: PASS
- **Evidence**:
  - quickstart.md documents all environment variables
  - No hard-coded secrets in contracts/ or data model
  - ANTHROPIC_API_KEY properly documented as environment variable
  - Supabase credentials via environment variables
- **No changes required**

#### V. Technology Stack Alignment ✅
- **Re-validated**: PASS
- **Evidence**:
  - All contracts use TypeScript 5.6.0 types
  - API schema aligns with Next.js 14.2.0 App Router patterns
  - Supabase PostgreSQL with RLS policies (data-model.md)
  - New dependencies documented: jsxgraph, chart.js, react-chartjs-2, zod
- **Agent context updated**: ✅ CLAUDE.md updated with new technologies
- **No changes required**

#### VI. Git Commit Discipline ✅
- **Re-validated**: PASS
- **Enforcement Plan**: Implementation phase will commit after each task
- **No changes required**

#### VII. Chrome MCP Manual Testing Mandate ⚠️
- **Re-validated**: PARTIALLY APPLICABLE
- **Evidence**: quickstart.md includes visual regression testing section
- **Plan**: Chrome MCP tools will be used for diagram rendering visual verification
- **No changes required**

### Final Constitution Compliance (Post-Design)
- **PASS**: 5/5 applicable principles ✅
- **WARNINGS**: 2 principles not applicable or partially applicable (no blockers)
- **BLOCKERS**: None
- **READY FOR PHASE 2**: ✅ Yes - tasks.md generation can proceed

## Project Structure

### Documentation (this feature)

```text
specs/1-gat-exam-v3/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── README.md                 # Architecture overview
│   ├── generation-service.ts     # TypeScript service interfaces
│   ├── claude-api-contracts.ts   # Claude API types (@anthropic-ai/sdk)
│   ├── server-actions.ts         # Next.js Server Actions
│   └── diagram-types.ts          # Diagram configuration types
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

**Note**: Contracts are **TypeScript interfaces**, NOT REST API specs. Question generation uses Claude API via Next.js Server Actions (server-side only).

### Source Code (repository root)

```text
src/
├── skills/                      # NEW: AI generation Skills modules
│   ├── qudurat-quant/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── topics.md
│   │       └── examples.md
│   ├── qudurat-verbal/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── topics.md
│   │       └── analogy-relations.md
│   ├── qudurat-diagrams/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── simple-shapes.md
│   │       ├── overlapping-shapes.md
│   │       └── charts.md
│   ├── qudurat-schema/
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── full-schema.md
│   └── qudurat-quality/
│       └── SKILL.md
│
├── services/
│   ├── skills/                  # NEW: Skill loading & caching
│   │   ├── SkillLoader.ts
│   │   └── SkillValidator.ts
│   ├── generation/              # NEW: AI question generation
│   │   ├── QuduratGenerator.ts
│   │   ├── PromptBuilder.ts
│   │   ├── ResponseParser.ts
│   │   └── QuestionValidator.ts
│   ├── diagrams/                # NEW: Diagram rendering
│   │   ├── DiagramRenderer.tsx
│   │   ├── SVGRenderer.tsx
│   │   ├── JSXGraphRenderer.tsx
│   │   └── ChartRenderer.tsx
│   └── cache/                   # NEW: Prompt caching management
│       └── PromptCacheManager.ts
│
├── components/
│   └── diagrams/                # NEW: React components
│       ├── DiagramContainer.tsx
│       └── AccessibleDiagram.tsx
│
└── lib/
    └── supabase/                # EXISTING: Database client
        └── client.ts

tests/
├── integration/
│   ├── diagram-rendering.test.ts    # NEW
│   └── ai-generation.test.ts        # NEW
└── unit/
    ├── skills/                      # NEW
    ├── diagrams/                    # NEW
    └── generation/                  # NEW
```

**Structure Decision**: Web application structure (Next.js App Router). New directories created under `src/` for Skills-based AI generation system and multi-library diagram rendering. Existing Supabase client and services extended with new generation and diagram capabilities. Tests organized by integration (end-to-end workflows) and unit (individual modules).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: No constitutional violations identified. All complexity justified by functional requirements.
