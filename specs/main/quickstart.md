# Quickstart: Claude Sonnet 4.5 Streaming Generation

**Feature**: 002-claude-streaming-generation
**Date**: 2025-12-14

---

## Prerequisites

1. **Anthropic API Key**: Obtain from [Anthropic Console](https://console.anthropic.com/)
2. **Node.js 18+**: Required for Next.js 14
3. **Existing Tafawoq setup**: Database, Supabase client configured

---

## Setup Steps

### 1. Install Anthropic SDK

```bash
npm install @anthropic-ai/sdk
```

### 2. Configure Environment Variables

Add to `.env.local`:

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-api03-...

# Optional (defaults shown)
EXAM_BATCH_SIZE=10
PRACTICE_BATCH_SIZE=5
PREFETCH_THRESHOLD=0.7
```

### 3. Run Database Migration

Using Supabase MCP (per constitution):

```sql
-- Apply via mcp__supabase__apply_migration
ALTER TABLE exam_sessions
ADD COLUMN IF NOT EXISTS generated_batches integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS generation_context jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS total_questions integer DEFAULT 96,
ADD COLUMN IF NOT EXISTS generation_in_progress boolean DEFAULT false;

ALTER TABLE practice_sessions
ADD COLUMN IF NOT EXISTS generated_batches integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS generation_context jsonb DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_exam_sessions_pending
ON exam_sessions(user_id, status)
WHERE generated_batches < 10 AND status = 'in_progress';
```

### 4. Update Environment Config

In `src/lib/env.ts`:

```typescript
// Add to existing env validation
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
if (!ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is required')
}
```

---

## Quick Verification

### Test Claude API Connection

Create a simple test script:

```typescript
// scripts/test-claude.ts
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

async function testConnection() {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 100,
    messages: [{ role: 'user', content: 'مرحبا، هل يمكنك التحدث بالعربية؟' }],
  })

  console.log('Response:', response.content[0])
  console.log('Usage:', response.usage)
}

testConnection()
```

Run: `npx ts-node scripts/test-claude.ts`

### Test Prompt Caching

```typescript
// scripts/test-caching.ts
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

async function testCaching() {
  const systemBlocks = [
    {
      type: 'text' as const,
      text: 'أنت خبير في الرياضيات. '.repeat(200), // Ensure >1024 tokens
      cache_control: { type: 'ephemeral' as const },
    },
  ]

  // First request - cache write
  const response1 = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 100,
    system: systemBlocks,
    messages: [{ role: 'user', content: 'ما هو 2+2؟' }],
  })

  console.log('Request 1 - Cache creation:', response1.usage.cache_creation_input_tokens)

  // Second request - should hit cache
  const response2 = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 100,
    system: systemBlocks,
    messages: [{ role: 'user', content: 'ما هو 3+3؟' }],
  })

  console.log('Request 2 - Cache read:', response2.usage.cache_read_input_tokens)
}

testCaching()
```

Expected output:
```
Request 1 - Cache creation: ~500 (tokens written to cache)
Request 2 - Cache read: ~500 (tokens read from cache - 90% cheaper!)
```

---

## Key Files to Create

| File | Purpose |
|------|---------|
| `src/lib/anthropic/client.ts` | Claude API client with caching |
| `src/lib/anthropic/prompts.ts` | Question generation logic |
| `src/lib/anthropic/index.ts` | Module exports |
| `src/app/api/exams/[sessionId]/questions/route.ts` | Batch generation endpoint |

---

## Usage Example

### Generate First Batch (Exam Creation)

```typescript
// In /api/exams/route.ts POST handler
import { generateQuestionBatch } from '@/lib/anthropic/prompts'

const { questions, updatedContext } = await generateQuestionBatch(
  {
    sessionId: newSession.id,
    batchIndex: 0,
    batchSize: 10,
    section: 'quantitative',
    track: 'scientific',
  },
  { generatedIds: [], lastBatchIndex: -1 }
)

// Store questions and context in session
await supabase.from('exam_sessions').update({
  questions,
  generated_batches: 1,
  generation_context: updatedContext,
}).eq('id', newSession.id)
```

### Prefetch Next Batch (Client Hook)

```typescript
// In useExamSession.ts
const prefetchNextBatch = useCallback(async (batchIndex: number) => {
  const response = await fetch(`/api/exams/${session.id}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ batchIndex }),
  })

  if (response.ok) {
    const { questions } = await response.json()
    setQuestions(prev => [...prev, ...questions])
  }
}, [session?.id])

// Trigger at 70% through current batch
useEffect(() => {
  const positionInBatch = currentIndex % 10
  if (positionInBatch >= 7) {
    const nextBatch = Math.floor(currentIndex / 10) + 1
    prefetchNextBatch(nextBatch)
  }
}, [currentIndex])
```

---

## Monitoring

### Check Cache Performance

Log cache metrics in generation:

```typescript
console.log(`[Claude] Batch ${batchIndex}:`, {
  cacheRead: usage.cacheReadTokens,
  cacheWrite: usage.cacheCreationTokens,
  hitRate: usage.cacheReadTokens / (usage.cacheReadTokens + usage.cacheCreationTokens)
})
```

### Expected Metrics

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Cache hit rate (batch 2+) | >90% | `cacheReadTokens > 0` in logs |
| First batch latency | <5s | Measure time from request to response |
| Prefetch success | >95% | No "فشل تحميل" errors in console |

---

## Troubleshooting

### "Cache not working"

- Ensure system prompt exceeds 1,024 tokens
- Check `cache_control: { type: 'ephemeral' }` is set
- Verify requests are within 5-minute TTL window

### "Rate limit errors"

- Check Anthropic dashboard for rate limits
- Fallback to OpenRouter should trigger automatically
- If both fail, user sees error with retry option

### "409 Conflict on batch request"

- Expected when multiple tabs try to generate
- Client should retry with exponential backoff
- Check `generation_in_progress` column in DB

---

## Next Steps

After quickstart verification:

1. Implement full `src/lib/anthropic/` module
2. Create batch generation API routes
3. Update frontend hooks with prefetch logic
4. Add error handling UI components
5. Run full integration tests
