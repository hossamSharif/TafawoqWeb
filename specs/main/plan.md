# Implementation Plan: Claude Sonnet 4.5 Streaming Generation with Prompt Caching

**Branch**: `main` | **Date**: 2025-12-14 | **Spec**: [inhancexmG.md](../../inhancexmG.md)
**Input**: Feature specification from `/inhancexmG.md`

## Summary

Migrate exam and practice question generation from OpenRouter to Claude Sonnet 4.5 API with batched streaming generation (10 questions/batch), prompt caching for 90% cost reduction on cache reads, conversational context for duplicate prevention, smart pre-fetching at 70% batch completion, and OpenRouter fallback for rate limits.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14+ (App Router)
**Primary Dependencies**: Next.js, React 18+, @anthropic-ai/sdk, shadcn/ui, Supabase JS Client
**Storage**: Supabase PostgreSQL (exam_sessions, practice_sessions tables)
**Testing**: Jest/Vitest for unit tests, manual browser testing via Chrome MCP
**Target Platform**: Web (Next.js deployed to Vercel/similar)
**Project Type**: Web application (frontend + backend API routes)
**Performance Goals**: First batch latency <5s, cache hit rate >90%, prefetch success >95%
**Constraints**: 3 retries with exponential backoff, block concurrent requests (409), resume partial sessions
**Scale/Scope**: 96 questions/exam (10 batches), ~30% abandon rate expected

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. MCP Tooling (Documentation) | ✅ PASS | Will use Ref MCP for Anthropic SDK docs |
| II. MCP Tooling (Database) | ✅ PASS | Will use Supabase MCP for migrations |
| III. MCP Tooling (Payments) | N/A | No payment operations in this feature |
| IV. Security & Configuration | ✅ PASS | ANTHROPIC_API_KEY via env vars, no hardcoded secrets |
| V. Technology Stack Alignment | ✅ PASS | TypeScript, React, Next.js - aligns with stack |
| VI. Git Commit Discipline | ✅ PASS | Will commit after each implementation task |
| VII. Chrome MCP Manual Testing | ✅ PASS | Will use Chrome MCP for UI validation |

**Gate Status**: ✅ PASSED - No violations

## Project Structure

### Documentation (this feature)

```text
specs/main/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/
│   │   ├── exams/
│   │   │   ├── route.ts                    # MODIFY: Generate first batch only
│   │   │   └── [sessionId]/
│   │   │       └── questions/
│   │   │           └── route.ts            # NEW: Batch generation endpoint
│   │   └── practice/
│   │       ├── route.ts                    # MODIFY: Batch generation
│   │       └── [sessionId]/
│   │           └── questions/
│   │               └── route.ts            # NEW: Practice batch endpoint
│   └── (main)/
│       └── exam/
│           └── [id]/
│               └── page.tsx                # MODIFY: Loading states
├── lib/
│   ├── anthropic/                          # NEW: Anthropic client module
│   │   ├── client.ts                       # Claude API with caching
│   │   ├── prompts.ts                      # Question generation
│   │   └── index.ts                        # Module exports
│   ├── gemini/
│   │   └── client.ts                       # EXISTING: OpenRouter fallback
│   ├── supabase/
│   │   └── server.ts                       # EXISTING
│   └── env.ts                              # MODIFY: Add ANTHROPIC_API_KEY
├── hooks/
│   └── useExamSession.ts                   # MODIFY: Prefetching logic
├── contexts/
│   └── ExamContext.tsx                     # MODIFY: Batch loading state
└── types/
    └── question.ts                         # EXISTING: Question type

tests/
├── unit/
│   └── anthropic/
│       └── client.test.ts                  # NEW: Claude client tests
└── integration/
    └── batch-generation.test.ts            # NEW: E2E batch tests
```

**Structure Decision**: Web application structure with Next.js App Router. New `src/lib/anthropic/` module for Claude API integration, modifications to existing API routes and hooks.

## Complexity Tracking

> No violations detected - standard Next.js web application pattern

---

## Post-Design Constitution Re-Check

*Re-evaluated after Phase 1 design completion.*

| Principle | Status | Verification |
|-----------|--------|--------------|
| I. MCP Tooling (Documentation) | ✅ VERIFIED | Used `mcp__Ref__ref_search_documentation` and `mcp__Ref__ref_read_url` for Anthropic SDK docs |
| II. MCP Tooling (Database) | ✅ VERIFIED | Migration SQL ready for `mcp__supabase__apply_migration` |
| III. MCP Tooling (Payments) | N/A | No payment operations in design |
| IV. Security & Configuration | ✅ VERIFIED | `ANTHROPIC_API_KEY` documented as env var in quickstart.md |
| V. Technology Stack Alignment | ✅ VERIFIED | TypeScript, Next.js 14+, React 18+, Supabase - all aligned |
| VI. Git Commit Discipline | ✅ PENDING | Will apply during implementation phase |
| VII. Chrome MCP Manual Testing | ✅ PENDING | Testing workflow defined in quickstart.md |

**Post-Design Gate Status**: ✅ PASSED - Ready for task generation

---

## Generated Artifacts

| Artifact | Path | Purpose |
|----------|------|---------|
| Implementation Plan | `specs/main/plan.md` | This file |
| Research | `specs/main/research.md` | Anthropic SDK, caching, patterns |
| Data Model | `specs/main/data-model.md` | Schema changes, TypeScript types |
| API Contracts | `specs/main/contracts/batch-generation-api.yaml` | OpenAPI spec for batch endpoints |
| Quickstart | `specs/main/quickstart.md` | Setup and verification guide |
