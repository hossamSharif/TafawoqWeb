# Contracts Directory - GAT Exam Platform v3.0

## Overview

This directory contains **TypeScript contract definitions** for the question generation system. These are **NOT REST API specs** - the system uses Claude API from Anthropic for generation, not a custom REST API.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Client)                       │
│  - Admin UI for generation                                  │
│  - Student UI for practice                                  │
│  - React components                                         │
└────────────┬────────────────────────────────────────────────┘
             │
             │ Next.js Server Actions
             │ (server-actions.ts)
             ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js Backend (Server)                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  QuduratGenerator Service                           │   │
│  │  (generation-service.ts)                            │   │
│  │                                                      │   │
│  │  ┌──────────────┐  ┌────────────────┐              │   │
│  │  │ SkillLoader  │  │ PromptBuilder  │              │   │
│  │  └──────────────┘  └────────────────┘              │   │
│  │  ┌──────────────┐  ┌────────────────┐              │   │
│  │  │  Validator   │  │ ResponseParser │              │   │
│  │  └──────────────┘  └────────────────┘              │   │
│  └─────────────┬───────────────────────────────────────┘   │
│                │                                            │
│                │ @anthropic-ai/sdk                          │
│                │ (claude-api-contracts.ts)                  │
│                ▼                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Claude API (Anthropic)                             │   │
│  │  - System prompt with Skills modules (cached)       │   │
│  │  - User prompt with batch parameters                │   │
│  │  - Structured JSON output                           │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────┬────────────────────────────────────────────────┘
             │
             │ Generated Questions
             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase PostgreSQL                       │
│  - questions table (with v3.0 fields)                       │
│  - question_errors table                                    │
│  - review_queue table                                       │
└─────────────────────────────────────────────────────────────┘
```

## Contract Files

### 1. `generation-service.ts` ✅

**Purpose**: TypeScript interfaces for the server-side question generation service

**Contains**:
- `IQuduratGenerator` - Main generation service interface
- `ISkillLoader` - Skills module loading interface
- `IPromptBuilder` - User prompt building interface
- `IResponseParser` - Claude response parsing interface
- `IQuestionValidator` - Quality validation interface
- `IPromptCacheManager` - Cache management interface
- Error types and retry logic

**Used by**: Implementation of generation service in `src/services/generation/`

### 2. `claude-api-contracts.ts` ✅

**Purpose**: Types for Claude API requests and responses using `@anthropic-ai/sdk`

**Contains**:
- `ClaudeConfig` - API configuration
- `SystemPromptWithCache` - Cached system prompt structure
- `QuestionGenerationRequest` - Message request format
- `UserPromptParams` - User prompt template parameters
- Helper functions: `buildGenerationRequest()`, `extractTextContent()`, `calculateCost()`
- Caching strategy and savings calculations

**Used by**: `QuduratGenerator` service when calling Claude API

### 3. `server-actions.ts` ✅

**Purpose**: Next.js Server Actions that connect frontend to backend generation service

**Contains**:
- `generateQuestionsAction()` - Generate batch of questions
- `generateFullExamAction()` - Generate full 120-question exam
- `getGenerationStatusAction()` - Poll for job status
- `reportQuestionErrorAction()` - Report question error
- `getReviewQueueAction()` - Get review queue (admin)
- `reviewQueueItemAction()` - Review flagged question (admin)
- Rate limiting configuration
- Permission checking helpers

**Used by**: Admin UI components to trigger generation

### 4. `diagram-types.ts` ✅

**Purpose**: TypeScript types for diagram configurations (all 35 types)

**Contains**:
- `DiagramConfig` - Main diagram configuration interface
- Shape data types: `CircleData`, `TriangleData`, `QuadrilateralData`, etc.
- Overlapping shapes: `OverlappingShapesData` with 8 patterns
- Chart data types: `BarChartData`, `LineChartData`, `PieChartData`, etc.
- Validation functions
- Accessibility features
- Color constants (colorblind-safe palette)

**Used by**: Frontend diagram rendering components and generation service

## Why No REST API?

### ❌ Incorrect Approach (REST API)
```
Client → POST /api/v3/questions/generate
         ↓
      REST API Endpoint
         ↓
      Generation Service
         ↓
      Claude API
```

**Problems**:
- Exposes generation to public (security risk)
- Requires authentication middleware
- More complex error handling
- HTTP request/response overhead

### ✅ Correct Approach (Server Actions)
```
Client → Server Action (generateQuestionsAction)
         ↓
      Generation Service (server-side only)
         ↓
      Claude API
```

**Benefits**:
- Server-side only (Claude API key never exposed)
- Automatic authentication (Next.js session)
- Type-safe (TypeScript end-to-end)
- Simpler error handling
- No HTTP overhead

## Usage Examples

### Frontend (Admin UI)

```typescript
'use client';

import { generateQuestionsAction } from '@/contracts/server-actions';
import { useState } from 'react';

export function GenerateButton() {
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);

    const result = await generateQuestionsAction({
      examType: 'quant-only',
      section: 'quantitative',
      track: 'scientific',
      batchSize: 20,
      difficulty: 'mixed',
      diagramCount: 3,
    });

    if (result.success) {
      console.log(`Generated ${result.data.questions.length} questions`);
      console.log(`Cost: $${result.data.batchMetadata.cost.toFixed(4)}`);
      console.log(`Cache hit: ${result.data.batchMetadata.cacheHit}`);
    } else {
      console.error(result.error.message);
    }

    setLoading(false);
  }

  return (
    <button onClick={handleGenerate} disabled={loading}>
      {loading ? 'Generating...' : 'Generate Questions'}
    </button>
  );
}
```

### Backend (Generation Service)

```typescript
'use server';

import Anthropic from '@anthropic-ai/sdk';
import { buildGenerationRequest, buildUserPrompt } from '@/contracts/claude-api-contracts';
import { GenerationParams, GenerationResult } from '@/contracts/generation-service';

export async function generateQuestionsAction(
  params: GenerationParams
): Promise<ActionResult<GenerationResult>> {
  try {
    // Initialize Claude API client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Load Skills modules
    const skillLoader = await initializeSkillLoader();
    const systemPrompt = skillLoader.buildSystemPrompt(params.examType);

    // Build user prompt
    const userPrompt = buildUserPrompt({
      batchSize: params.batchSize,
      section: params.section,
      track: params.track,
      difficulty: params.difficulty,
      diagramCount: params.diagramCount,
    });

    // Call Claude API with caching
    const request = buildGenerationRequest(systemPrompt, userPrompt, {
      apiKey: process.env.ANTHROPIC_API_KEY!,
      model: 'claude-sonnet-4-20250514',
      maxTokens: 8000,
      temperature: 1.0,
      enableCaching: true,
    });

    const response = await anthropic.messages.create(request);

    // Parse and validate questions
    const questions = parseAndValidateQuestions(response);

    // Save to database
    await saveQuestions(questions);

    // Return result
    return {
      success: true,
      data: {
        questions,
        batchMetadata: {
          batchId: generateBatchId(),
          cacheHit: wasCacheHit(response),
          generationTime: Date.now() - startTime,
          cost: calculateCost(response),
          model: 'claude-sonnet-4-20250514',
        },
        qualityMetrics: calculateQualityMetrics(questions),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'GENERATION_FAILED',
        message: error.message,
        recoverable: isRetryableError(error),
      },
    };
  }
}
```

## Migration from v2.x

If your codebase had v2.x REST API endpoints, they should be:

1. **Removed**: Delete any `/api/v3/questions/generate` REST endpoints
2. **Replaced**: Use Server Actions (`server-actions.ts`)
3. **Updated**: Frontend components call Server Actions directly
4. **Secured**: Claude API key stays server-side only

## Testing

### Unit Tests
```typescript
// Test generation service interfaces
import { QuduratGenerator } from '@/services/generation/QuduratGenerator';

test('should generate 20 questions', async () => {
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
  expect(result.batchMetadata.cacheHit).toBe(false); // First call
});
```

### Integration Tests
```typescript
// Test Server Actions
import { generateQuestionsAction } from '@/contracts/server-actions';

test('should call generation service via server action', async () => {
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

## References

- **Next.js Server Actions**: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- **Claude API SDK**: https://github.com/anthropics/anthropic-sdk-typescript
- **Prompt Caching**: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
- **TypeScript Best Practices**: https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html

---

**Summary**: These contracts define **TypeScript interfaces** for server-side services, **NOT REST API endpoints**. The system uses Claude API from Anthropic via Next.js Server Actions for secure, type-safe question generation.
