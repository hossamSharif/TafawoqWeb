# Architecture Corrections - GAT Exam Platform v3.0

**Date**: 2026-01-05
**Status**: CORRECTED
**Issue**: Initial planning incorrectly designed a REST API for question generation

---

## Problem Identified

The initial `/speckit.plan` execution incorrectly created:
- ❌ `question-generation-api.yaml` - Full OpenAPI REST API specification
- ❌ curl examples in `quickstart.md` for fake REST endpoints
- ❌ References to `/api/v3/questions/generate` and other REST endpoints

**Root Cause**: Misunderstanding of architecture - we use **Claude API from Anthropic** for generation, not expose our own public REST API.

---

## Correct Architecture

### What Actually Happens

```
┌─────────────────────────────────────────────────────────────┐
│                  Admin UI (React Client)                    │
│  - Admin panel: /admin/generate                             │
│  - Student UI: /practice/quantitative                       │
└────────────┬────────────────────────────────────────────────┘
             │
             │ Server Actions (Type-safe RPC)
             │ generateQuestionsAction()
             ▼
┌─────────────────────────────────────────────────────────────┐
│           Next.js Backend (Server-Side Only)                │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  QuduratGenerator Service                          │    │
│  │  - Loads Skills modules from src/skills/           │    │
│  │  - Builds system prompt (~15K tokens)              │    │
│  │  - Builds user prompt with batch params            │    │
│  └────────────┬───────────────────────────────────────┘    │
│               │                                             │
│               │ @anthropic-ai/sdk                           │
│               ▼                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Claude API (Anthropic)                            │    │
│  │  - URL: https://api.anthropic.com/v1/messages      │    │
│  │  - Model: claude-sonnet-4-20250514                 │    │
│  │  - System: Skills modules (CACHED)                 │    │
│  │  - User: Batch parameters                          │    │
│  │  - Response: JSON array of questions               │    │
│  └────────────┬───────────────────────────────────────┘    │
│               │                                             │
│               │ Parsed Questions                            │
│               ▼                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  QuestionValidator Service                         │    │
│  │  - Validates structure (Zod)                       │    │
│  │  - Checks grammar (LLM validation)                 │    │
│  │  - Flags for review queue                          │    │
│  └────────────┬───────────────────────────────────────┘    │
└───────────────┼─────────────────────────────────────────────┘
                │
                │ Validated Questions
                ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase PostgreSQL Database                   │
│  - questions table (INSERT validated questions)             │
│  - review_queue table (INSERT flagged questions)            │
└─────────────────────────────────────────────────────────────┘
```

### Key Points

1. **No Public REST API**: We do NOT expose `/api/v3/questions/generate`
2. **Server Actions**: Frontend calls `generateQuestionsAction()` - Next.js Server Action
3. **Claude API**: Backend calls Claude API directly via `@anthropic-ai/sdk`
4. **Server-Side Only**: Claude API key never exposed to client
5. **Type-Safe**: TypeScript end-to-end (no HTTP request/response overhead)

---

## Corrections Made

### 1. Deleted Incorrect Files

- ❌ **DELETED**: `contracts/question-generation-api.yaml`
  - Reason: We don't have a REST API for question generation
  - Replaced with TypeScript service interfaces

### 2. Created Correct Contract Files

✅ **CREATED**: `contracts/generation-service.ts`
- **Purpose**: TypeScript interfaces for server-side generation service
- **Contains**:
  - `IQuduratGenerator` - Main service interface
  - `ISkillLoader` - Skills loading interface
  - `IPromptBuilder` - Prompt building interface
  - `IResponseParser` - Response parsing interface
  - `IQuestionValidator` - Validation interface
  - `IPromptCacheManager` - Cache management interface
  - Error types and retry logic
- **Used By**: Implementation in `src/services/generation/`

✅ **CREATED**: `contracts/claude-api-contracts.ts`
- **Purpose**: Types for Claude API requests/responses using `@anthropic-ai/sdk`
- **Contains**:
  - `ClaudeConfig` - API configuration
  - `SystemPromptWithCache` - Cached prompt structure (75% cost savings)
  - `QuestionGenerationRequest` - Message request format
  - `buildGenerationRequest()` - Helper to build API requests
  - `calculateCost()` - Cost calculation from usage
  - `wasCacheHit()` - Check if prompt cache was used
- **Used By**: `QuduratGenerator` service

✅ **CREATED**: `contracts/server-actions.ts`
- **Purpose**: Next.js Server Actions connecting frontend to backend
- **Contains**:
  - `generateQuestionsAction()` - Generate batch (called from admin UI)
  - `generateFullExamAction()` - Generate full exam
  - `getGenerationStatusAction()` - Poll job status
  - `reportQuestionErrorAction()` - Report errors
  - `getReviewQueueAction()` - Get review queue (admin)
  - `reviewQueueItemAction()` - Review flagged questions (admin)
  - Rate limiting configuration
- **Used By**: Admin UI React components

✅ **CREATED**: `contracts/README.md`
- **Purpose**: Architecture documentation
- **Explains**: Why we use Server Actions instead of REST API
- **Includes**: Usage examples, migration guide, testing patterns

### 3. Updated Existing Files

✅ **UPDATED**: `quickstart.md`
- **Section 6.1**: Added architecture overview diagram
- **Section 6.1**: Removed curl examples for fake REST endpoints
- **Section 6.1**: Added note: "No public REST API - All generation uses Next.js Server Actions"
- **Section 7.1-7.3**: Replaced curl examples with admin UI workflows
- **Section 7.1-7.3**: Added references to Server Actions used

✅ **UPDATED**: `plan.md`
- **Project Structure**: Added contracts/ subdirectory details
- **Note Added**: "Contracts are TypeScript interfaces, NOT REST API specs"
- **Constitution Check**: Verified no issues with corrected architecture

### 4. Kept Correct Files (No Changes Needed)

✅ **KEPT**: `contracts/diagram-types.ts`
- Already correct - TypeScript types for diagram configurations
- No REST API assumptions

✅ **KEPT**: `data-model.md`
- Already correct - Pure database schema, no REST API references
- Properly describes entities and migrations

✅ **KEPT**: `research.md`
- Already correct - Technology decisions, no REST API assumptions
- Correctly describes Claude API usage with prompt caching

✅ **KEPT**: `plan.md` (Technical Context)
- Already correct - Describes server-side services, not REST API
- Correctly lists `@anthropic-ai/sdk` as backend dependency

---

## Why Server Actions > REST API

### ❌ Problems with REST API Approach

1. **Security Risk**: Exposes generation endpoint to public internet
2. **Authentication Overhead**: Requires JWT middleware, CORS, etc.
3. **Type Safety Loss**: HTTP request/response = JSON (no compile-time checks)
4. **API Key Exposure Risk**: Could accidentally leak ANTHROPIC_API_KEY
5. **More Code**: Need to write endpoint handlers, error middleware, etc.
6. **Harder Testing**: Need to mock HTTP requests, setup test server

### ✅ Benefits of Server Actions

1. **Secure by Default**: Server-side only, no public endpoints
2. **Zero Auth Overhead**: Uses Next.js session automatically
3. **Type-Safe**: TypeScript end-to-end (compile-time checks)
4. **API Key Safe**: Claude API key stays in server environment
5. **Less Code**: Just export async function with 'use server'
6. **Easy Testing**: Import and call directly in tests

---

## Migration Guide (If v2.x Had REST API)

If your codebase had v2.x REST API endpoints for generation:

### Step 1: Remove REST API Routes
```bash
# Delete these files (if they exist)
rm app/api/v3/questions/generate/route.ts
rm app/api/v3/questions/[id]/route.ts
rm app/api/v3/review-queue/route.ts
```

### Step 2: Create Server Actions File
```typescript
// app/actions/generation.ts
'use server';

import { QuduratGenerator } from '@/services/generation/QuduratGenerator';

export async function generateQuestionsAction(params) {
  const generator = new QuduratGenerator();
  await generator.initialize();
  return await generator.generateQuestions(params);
}
```

### Step 3: Update Frontend Components
```typescript
// Before (REST API)
const response = await fetch('/api/v3/questions/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(params),
});
const data = await response.json();

// After (Server Action)
import { generateQuestionsAction } from '@/actions/generation';

const result = await generateQuestionsAction(params);
if (result.success) {
  const data = result.data;
}
```

---

## Testing Examples

### Unit Test (Service)
```typescript
import { QuduratGenerator } from '@/services/generation/QuduratGenerator';

test('generates 20 questions', async () => {
  const generator = new QuduratGenerator();
  await generator.initialize();

  const result = await generator.generateQuestions({
    examType: 'quant-only',
    section: 'quantitative',
    track: 'scientific',
    batchSize: 20,
    difficulty: 'mixed',
  });

  expect(result.questions).toHaveLength(20);
});
```

### Integration Test (Server Action)
```typescript
import { generateQuestionsAction } from '@/actions/generation';

test('server action calls service', async () => {
  const result = await generateQuestionsAction({
    examType: 'quant-only',
    section: 'quantitative',
    track: 'scientific',
    batchSize: 20,
    difficulty: 'mixed',
  });

  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.questions.length).toBeGreaterThan(0);
  }
});
```

---

## Summary

### Before Correction
- ❌ Designed full OpenAPI REST API
- ❌ curl examples for fake endpoints
- ❌ Confused architecture (exposing Claude API as REST API)

### After Correction
- ✅ TypeScript service interfaces
- ✅ Claude API contracts using `@anthropic-ai/sdk`
- ✅ Next.js Server Actions for frontend-backend communication
- ✅ Clear architecture: Client → Server Action → Generation Service → Claude API
- ✅ Secure, type-safe, efficient

### Files Changed
- **Deleted**: 1 (question-generation-api.yaml)
- **Created**: 4 (generation-service.ts, claude-api-contracts.ts, server-actions.ts, contracts/README.md)
- **Updated**: 2 (quickstart.md, plan.md)
- **Kept Correct**: 4 (diagram-types.ts, data-model.md, research.md, plan.md Technical Context)

---

**Status**: ✅ **ARCHITECTURE CORRECTED** - Ready for Phase 2 (tasks.md generation)
