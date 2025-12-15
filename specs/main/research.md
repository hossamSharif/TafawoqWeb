# Research: Claude Sonnet 4.5 Streaming Generation with Prompt Caching

**Date**: 2025-12-14
**Feature**: 002-claude-streaming-generation

---

## 1. Anthropic Prompt Caching Implementation

### Decision
Use Anthropic's native prompt caching with `cache_control: { type: "ephemeral" }` on system message blocks.

### Rationale
- **90% cost reduction** on cache reads (0.1x base input token price)
- **5-minute TTL** that auto-refreshes on each use - perfect for exam sessions where batches are generated within minutes
- **No beta prefix required** - prompt caching is now GA in the SDK
- **Minimum 1,024 tokens** for Claude Sonnet 4.5 - our system prompts (~1,500 tokens combined) exceed this threshold

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| 1-hour cache TTL | More expensive (2x base vs 1.25x), unnecessary since batches generate within 5 minutes |
| No caching | Would cost ~$0.35/exam vs ~$0.15 with caching |
| Client-side prompt storage | Doesn't reduce API costs, only network transfer |

### Implementation Details
```typescript
// System blocks with cache_control
const systemBlocks = [
  {
    type: 'text',
    text: SYSTEM_RULES_PROMPT,  // ~800 tokens
    cache_control: { type: 'ephemeral' }  // 5-min TTL, auto-refresh
  },
  {
    type: 'text',
    text: CATEGORIES_PROMPT,    // ~700 tokens
    cache_control: { type: 'ephemeral' }
  },
]
```

### Key Constraints
- Up to 4 cache breakpoints allowed per request
- Cache keys are organization-specific (isolated between orgs)
- 100% identical prompt segments required for cache hits
- Concurrent requests: cache entry only available after first response begins

---

## 2. Anthropic TypeScript SDK Integration

### Decision
Use `@anthropic-ai/sdk` package with direct `messages.create()` API (no beta prefix).

### Rationale
- Official Anthropic SDK with full TypeScript support
- Prompt caching is GA - no need for `client.beta.promptCaching`
- Clean response typing including usage metrics for cache tracking

### Implementation Pattern
```typescript
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250514',
  max_tokens: 8192,
  temperature: 0.7,
  system: systemBlocks,  // Array of content blocks with cache_control
  messages: [{ role: 'user', content: userPrompt }],
})

// Cache tracking from response
const usage = {
  inputTokens: response.usage.input_tokens,
  outputTokens: response.usage.output_tokens,
  cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
  cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
}
```

### Model Selection
- **Model ID**: `claude-sonnet-4-5-20250514` (Claude Sonnet 4.5)
- **Min cacheable tokens**: 1,024 (our prompts: ~1,500 - sufficient)

---

## 3. Batch Generation Strategy

### Decision
Generate questions in batches of 10, prefetch at 70% completion of current batch.

### Rationale
- **Reduced initial wait**: First batch (~10 questions) loads in <5s vs 15s+ for all 96
- **Cost efficiency**: Only pay for batches actually used (30% abandon rate → significant savings)
- **Seamless UX**: Prefetch at question 7 of each batch gives ~3-4 questions buffer time

### Batch Distribution (96 total questions)
| Track | Quantitative | Verbal | Total Batches |
|-------|--------------|--------|---------------|
| Scientific | 57 (6 batches) | 39 (4 batches) | 10 |
| Literary | 29 (3 batches) | 67 (7 batches) | 10 |

### Prefetch Timing
```
Batch 1: Questions 0-9   → Prefetch batch 2 at question 7
Batch 2: Questions 10-19 → Prefetch batch 3 at question 17
...
Batch 9: Questions 80-89 → Prefetch batch 10 at question 87
Batch 10: Questions 90-95 (final, 6 questions)
```

---

## 4. Error Handling & Fallback Strategy

### Decision
3 retries with exponential backoff, then OpenRouter fallback, then user error with cancel/retry options.

### Rationale
- **Exponential backoff** (1s, 2s, 4s) handles transient failures without overwhelming the API
- **OpenRouter fallback** ensures generation continues if Claude is rate-limited
- **User control** on total failure - can cancel exam or retry later

### Error Flow
```
Request fails
    ↓
Retry 1 (1s delay)
    ↓ fails
Retry 2 (2s delay)
    ↓ fails
Retry 3 (4s delay)
    ↓ fails
Check if rate limit error
    ↓ yes
Fall back to OpenRouter
    ↓ fails
Throw GENERATION_UNAVAILABLE
    ↓
UI shows error with:
  - Cancel exam option
  - Retry later option
```

### Rate Limit Detection
```typescript
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    return msg.includes('rate limit') || msg.includes('429') || msg.includes('quota')
  }
  return false
}
```

---

## 5. Concurrent Request Prevention

### Decision
Use database-level lock (`generation_in_progress` boolean) with 409 Conflict response.

### Rationale
- Prevents duplicate question generation from multiple tabs
- Simple boolean flag vs distributed lock - sufficient for single-user sessions
- 409 status code triggers client-side retry with backoff

### Implementation
```sql
-- Add to exam_sessions table
ADD COLUMN generation_in_progress boolean DEFAULT false;
```

```typescript
// Check lock before generation
if (session.generation_in_progress) {
  return NextResponse.json({ error: 'جاري توليد الأسئلة بالفعل' }, { status: 409 })
}

// Acquire lock
await supabase
  .from('exam_sessions')
  .update({ generation_in_progress: true })
  .eq('id', sessionId)

// ... generate questions ...

// Release lock on completion
await supabase
  .from('exam_sessions')
  .update({ generation_in_progress: false, ... })
  .eq('id', sessionId)
```

---

## 6. Session Resume Behavior

### Decision
Resume from last generated batch using stored questions (no re-generation).

### Rationale
- **Cost efficiency**: Don't re-pay for already generated questions
- **Consistency**: User sees same questions they started with
- **Simplicity**: Just load existing questions from DB, continue from `lastBatchIndex + 1`

### Resume Flow
```
User returns to partially-completed exam
    ↓
Load session from DB
    ↓
questions[] already contains batches 0-3 (40 questions)
generation_context.lastBatchIndex = 3
    ↓
Client loads questions[0-39] immediately
    ↓
When user reaches question 37 (70% of batch 3)
    ↓
Prefetch batch 4 (batchIndex = 4)
```

---

## 7. Database Schema Changes

### Decision
Add 4 new columns to `exam_sessions` and 2 to `practice_sessions`.

### New Columns
```sql
ALTER TABLE exam_sessions
ADD COLUMN generated_batches integer DEFAULT 0,
ADD COLUMN generation_context jsonb DEFAULT '{}',
ADD COLUMN total_questions integer DEFAULT 96,
ADD COLUMN generation_in_progress boolean DEFAULT false;

ALTER TABLE practice_sessions
ADD COLUMN generated_batches integer DEFAULT 0,
ADD COLUMN generation_context jsonb DEFAULT '{}';
```

### Generation Context Structure
```typescript
interface GenerationContext {
  generatedIds: string[]      // IDs of all generated questions (for dedup)
  lastBatchIndex: number      // Last successfully generated batch (0-indexed)
}
```

---

## 8. Cost Analysis Summary

### Pricing (Claude Sonnet 4.5)
| Token Type | Price per MTok |
|------------|----------------|
| Input (base) | $3.00 |
| Cache write | $3.75 (1.25x) |
| Cache read | $0.30 (0.1x) |
| Output | $15.00 |

### Per-Exam Cost Comparison
| Scenario | Old (96 at once) | New (Batched + Cached) |
|----------|------------------|------------------------|
| Full exam (100%) | $0.35 | $0.39 |
| Abandon at Q30 (30%) | $0.35 | $0.13 |
| Average (70 questions) | $0.35 | $0.28 |

### Expected Savings
- **30% abandon rate**: Save ~$0.07/abandoned exam
- **Cache hit rate >90%**: Batches 2-10 use cached system prompts

---

## References

- [Anthropic Prompt Caching Documentation](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
- [Anthropic TypeScript SDK](https://www.npmjs.com/package/@anthropic-ai/sdk)
- [Claude Sonnet 4.5 Pricing](https://www.anthropic.com/pricing)
