# Feature: Claude Sonnet 4.5 Streaming Generation with Prompt Caching

**Feature ID**: `002-claude-streaming-generation`
**Status**: Draft
**Created**: 2025-12-14

---

## Clarifications

### Session 2025-12-14
- Q: When the prefetch fails (network error, API error other than rate limit), what should the user experience be? → A: Block navigation with retry button
- Q: If a user resumes a partially-generated exam session, should the system re-generate or resume? → A: Resume from last generated batch (use existing questions)
- Q: When both Claude API and OpenRouter fallback fail, what should happen? → A: Show error, allow exam cancellation/retry later
- Q: Should concurrent batch generation requests from the same session be allowed? → A: Block concurrent requests (return 409 Conflict)
- Q: What is the maximum retry count for a failed batch before showing the final error? → A: 3 retries with exponential backoff

---

## Summary

Migrate exam and practice question generation from OpenRouter to Claude Sonnet 4.5 API with:
- **Batched streaming generation**: Generate questions in batches of 10 instead of all 96 at once
- **Prompt caching**: Leverage Anthropic's prompt caching for 90% cost reduction on cache reads
- **Conversational context**: Maintain generation context across batches to prevent duplicate questions
- **Smart pre-fetching**: Background generation while user answers current questions
- **Graceful fallback**: OpenRouter as backup when Claude rate limits

---

## Problem Statement

### Current Issues
1. **High Generation Costs**: Generating 96 questions at once requires large prompts and outputs (~$0.15/exam)
2. **Slow Initial Load**: Users wait 15+ seconds for all questions before starting
3. **Wasted Resources**: Users who abandon exams still incur full generation cost (~30% abandon rate)
4. **No Context Continuity**: Each generation is independent, risking duplicate questions
5. **Single Point of Failure**: OpenRouter outage blocks all generation

### Business Impact
- Average exam generation cost: ~$0.15-0.20
- ~30% of users abandon exams before completion
- Estimated waste: ~$0.05 per abandoned exam

---

## Solution Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │ ExamContext.tsx │  │useExamSession.ts│  │  QuestionCard.tsx   │  │
│  │ - questions[]   │  │- prefetchBatch()│  │  - loading state    │  │
│  │ - currentIndex  │  │- loadedBatches  │  │  - skeleton UI      │  │
│  └────────┬────────┘  └────────┬────────┘  └─────────────────────┘  │
└───────────┼────────────────────┼────────────────────────────────────┘
            │                    │
            ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          API LAYER                                   │
│  POST /api/exams              → Create session, generate first batch │
│  POST /api/exams/[id]/questions → Generate next batch of 10         │
│  GET /api/exams/[id]          → Return session with loaded questions │
└─────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        AI CLIENT LAYER                               │
│  src/lib/anthropic/client.ts   → Claude API with prompt caching     │
│  src/lib/anthropic/prompts.ts  → Cached system prompts              │
│  src/lib/gemini/client.ts      → OpenRouter fallback (existing)     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Prompt Caching Strategy

Anthropic's prompt caching caches the **prefix** of messages. Cost: cache writes are 1.25x base, cache reads are 0.1x base (90% savings).

### Cache Structure

```
┌─────────────────────────────────────────────────────────────┐
│ CACHED (paid once per session, reused across all batches)   │
│                                                             │
│ Block 1: System Rules (~800 tokens)                         │
│   - Exam format, Arabic requirements, quality standards     │
│   [cache_control: { type: "ephemeral" }]                    │
│                                                             │
│ Block 2: Categories & Examples (~700 tokens)                │
│   - Question types, difficulties, category definitions      │
│   [cache_control: { type: "ephemeral" }]                    │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ NOT CACHED (changes each batch)                             │
│                                                             │
│ Conversation History: Previously generated question IDs     │
│ User Request: "Generate batch 3 of 10 questions..."         │
└─────────────────────────────────────────────────────────────┘
```

### Cache Performance
- **Minimum cacheable**: 1,024 tokens (Claude Sonnet 4.5)
- **Cache TTL**: 5 minutes (auto-refreshed on each use)
- **Expected hit rate**: >90% for batches 2-10

---

## Cost Analysis

### Current (96 questions at once)
```
Input: ~15,000 tokens × $3/MTok = $0.045
Output: ~20,000 tokens × $15/MTok = $0.30
Total: ~$0.35 per exam
```

### New (Batched with Caching)
```
Batch 1 (cache write):
  System prompt: 1,500 tokens × $3.75/MTok = $0.0056
  User message: 200 tokens × $3/MTok = $0.0006
  Output: 2,500 tokens × $15/MTok = $0.0375
  Subtotal: ~$0.044

Batches 2-10 (cache read):
  Cache read: 1,500 tokens × $0.30/MTok × 9 = $0.00405
  User messages: 200 tokens × $3/MTok × 9 = $0.0054
  Output: 2,500 tokens × $15/MTok × 9 = $0.3375
  Subtotal: ~$0.35

Total for full exam: ~$0.39
```

### Real Savings
- **Early abandonment**: Only pay for batches generated
- **30% abandon at question 30**: Cost = $0.13 (vs $0.35)
- **Average completion (70 questions)**: Cost = $0.28 (vs $0.35)

---

## Implementation Details

### Phase 1: Claude API Client

#### New Files

**`src/lib/anthropic/client.ts`**
```typescript
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface ContentBlock {
  type: 'text'
  text: string
  cache_control?: { type: 'ephemeral'; ttl?: '5m' | '1h' }
}

interface UsageMetrics {
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheCreationTokens: number
}

export async function callClaudeWithCaching(
  systemBlocks: ContentBlock[],
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  options?: { maxTokens?: number; temperature?: number }
): Promise<{ content: string; usage: UsageMetrics }> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: options?.maxTokens ?? 8192,
    temperature: options?.temperature ?? 0.7,
    system: systemBlocks,
    messages,
  })

  return {
    content: response.content[0].type === 'text' ? response.content[0].text : '',
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
    },
  }
}

export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    return msg.includes('rate limit') || msg.includes('429') || msg.includes('quota')
  }
  return false
}
```

**`src/lib/anthropic/prompts.ts`**
```typescript
import { callClaudeWithCaching, isRateLimitError } from './client'
import { callOpenRouter } from '@/lib/gemini/client'
import type { Question } from '@/types/question'

// Cached system prompts (>1024 tokens combined for caching)
const SYSTEM_RULES_PROMPT = `أنت خبير في إعداد أسئلة اختبار القدرات العامة السعودي.

القواعد الأساسية:
1. جميع الأسئلة والخيارات يجب أن تكون باللغة العربية الفصحى
2. كل سؤال يجب أن يحتوي على 4 خيارات بالضبط (أ، ب، ج، د)
3. يجب أن يكون هناك إجابة صحيحة واحدة فقط
4. الشرح يجب أن يكون مفصلاً وواضحاً
5. تجنب الأسئلة المكررة أو المتشابهة جداً
6. أنشئ معرف فريد لكل سؤال بصيغة: section_batch_number

توزيع الصعوبة: 30% سهل، 50% متوسط، 20% صعب`

const CATEGORIES_PROMPT = `التصنيفات المتاحة للقسم الكمي:
- algebra (الجبر): معادلات، متباينات، تبسيط عبارات
- geometry (الهندسة): مساحات، محيطات، زوايا
- statistics (الإحصاء): المتوسط، الوسيط، المنوال
- ratio-proportion (النسب والتناسب): النسب المئوية، التناسب
- probability (الاحتمالات): احتمال بسيط ومركب
- speed-time-distance (السرعة والمسافة والزمن)

التصنيفات المتاحة للقسم اللفظي:
- reading-comprehension (استيعاب المقروء)
- sentence-completion (إكمال الجمل)
- context-error (الخطأ السياقي)
- analogy (التناظر اللفظي)
- association-difference (الارتباط والاختلاف)
- vocabulary (المفردات)

أجب بتنسيق JSON فقط.`

export interface BatchConfig {
  sessionId: string
  batchIndex: number
  batchSize: number
  section: 'quantitative' | 'verbal'
  track: 'scientific' | 'literary'
}

export interface GenerationContext {
  generatedIds: string[]
  lastBatchIndex: number
}

// Session resume: Load existing questions from DB, continue generation from lastBatchIndex + 1
// Do NOT re-generate already created batches - use stored questions for cost efficiency

export async function generateQuestionBatch(
  config: BatchConfig,
  context: GenerationContext
): Promise<{ questions: Question[]; updatedContext: GenerationContext }> {

  const systemBlocks = [
    { type: 'text' as const, text: SYSTEM_RULES_PROMPT, cache_control: { type: 'ephemeral' as const } },
    { type: 'text' as const, text: CATEGORIES_PROMPT, cache_control: { type: 'ephemeral' as const } },
  ]

  const userPrompt = `قم بإنشاء ${config.batchSize} سؤال ${config.section === 'quantitative' ? 'كمي' : 'لفظي'} للدفعة رقم ${config.batchIndex}.

${context.generatedIds.length > 0 ? `الأسئلة التي تم إنشاؤها مسبقاً (تجنب التكرار): ${context.generatedIds.join(', ')}` : ''}

أجب بتنسيق JSON:
{
  "questions": [
    {
      "id": "${config.section.slice(0, 5)}_${config.batchIndex}_01",
      "section": "${config.section}",
      "topic": "category_key",
      "difficulty": "easy|medium|hard",
      "questionType": "mcq",
      "stem": "نص السؤال",
      "choices": ["أ", "ب", "ج", "د"],
      "answerIndex": 0,
      "explanation": "شرح مفصل"
    }
  ]
}`

  try {
    // Try Claude first
    const { content, usage } = await callClaudeWithCaching(
      systemBlocks,
      [{ role: 'user', content: userPrompt }],
      { temperature: 0.8 }
    )

    console.log(`[Claude] Batch ${config.batchIndex}: cache_read=${usage.cacheReadTokens}, cache_write=${usage.cacheCreationTokens}`)

    const questions = parseQuestionsFromResponse(content)

    return {
      questions,
      updatedContext: {
        generatedIds: [...context.generatedIds, ...questions.map(q => q.id)],
        lastBatchIndex: config.batchIndex,
      },
    }
  } catch (error) {
    if (isRateLimitError(error)) {
      console.warn('[Claude] Rate limited, falling back to OpenRouter')
      // Fallback to OpenRouter
      try {
        return await generateWithOpenRouter(config, context)
      } catch (fallbackError) {
        // Both providers failed - throw error for UI to handle
        // UI should show error with cancel exam / retry later options
        throw new Error('GENERATION_UNAVAILABLE')
      }
    }
    throw error
  }
}

function parseQuestionsFromResponse(content: string): Question[] {
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No valid JSON found in response')

  const parsed = JSON.parse(jsonMatch[0])
  if (!parsed.questions || !Array.isArray(parsed.questions)) {
    throw new Error('Invalid response structure')
  }

  return parsed.questions.map((q: Partial<Question>, i: number) => ({
    id: q.id || `gen_${Date.now()}_${i}`,
    section: q.section || 'quantitative',
    topic: q.topic,
    difficulty: q.difficulty || 'medium',
    questionType: q.questionType || 'mcq',
    stem: q.stem || '',
    choices: q.choices as [string, string, string, string],
    answerIndex: (q.answerIndex ?? 0) as 0 | 1 | 2 | 3,
    explanation: q.explanation || '',
    tags: q.tags || [],
  }))
}

async function generateWithOpenRouter(
  config: BatchConfig,
  context: GenerationContext
): Promise<{ questions: Question[]; updatedContext: GenerationContext }> {
  // Use existing OpenRouter implementation as fallback
  // ... implementation similar to current src/lib/gemini/prompts.ts
}
```

### Phase 2: API Routes

**`src/app/api/exams/[sessionId]/questions/route.ts`** (NEW)
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateQuestionBatch } from '@/lib/anthropic/prompts'

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const { batchIndex } = await request.json()

  // Get session
  const { data: session } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('id', params.sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 })
  }

  // Validate batch index
  if (batchIndex !== session.generated_batches) {
    return NextResponse.json({ error: 'رقم الدفعة غير صالح' }, { status: 400 })
  }

  // Block concurrent generation requests (e.g., multiple tabs)
  if (session.generation_in_progress) {
    return NextResponse.json({ error: 'جاري توليد الأسئلة بالفعل' }, { status: 409 })
  }

  // Set generation lock
  await supabase
    .from('exam_sessions')
    .update({ generation_in_progress: true })
    .eq('id', params.sessionId)

  // Determine section for this batch
  const distribution = session.track === 'scientific'
    ? { quant: 57, verbal: 39 }
    : { quant: 29, verbal: 67 }

  const questionsGenerated = session.questions?.length || 0
  const section = questionsGenerated < distribution.quant ? 'quantitative' : 'verbal'

  // Generate batch
  const { questions, updatedContext } = await generateQuestionBatch(
    {
      sessionId: params.sessionId,
      batchIndex,
      batchSize: 10,
      section,
      track: session.track,
    },
    session.generation_context || { generatedIds: [], lastBatchIndex: -1 }
  )

  // Update session
  const updatedQuestions = [...(session.questions || []), ...questions]

  await supabase
    .from('exam_sessions')
    .update({
      questions: updatedQuestions,
      generated_batches: batchIndex + 1,
      generation_context: updatedContext,
      generation_in_progress: false, // Release lock
    })
    .eq('id', params.sessionId)

  // Return questions without answers
  const questionsWithoutAnswers = questions.map((q, i) => ({
    ...q,
    index: questionsGenerated + i,
    answerIndex: undefined,
    explanation: undefined,
  }))

  return NextResponse.json({
    questions: questionsWithoutAnswers,
    meta: {
      batchIndex,
      totalLoaded: updatedQuestions.length,
      cacheHit: true, // Would come from actual usage metrics
    },
  })
}
```

### Phase 3: Frontend Integration

**Updates to `src/hooks/useExamSession.ts`**
```typescript
// Add to existing hook
const [loadedBatches, setLoadedBatches] = useState<Set<number>>(new Set([0]))
const [isLoadingNextBatch, setIsLoadingNextBatch] = useState(false)
const [batchError, setBatchError] = useState<string | null>(null)

const BATCH_SIZE = 10
const PREFETCH_THRESHOLD = 7 // Prefetch at 70% through batch

const MAX_RETRIES = 3
const INITIAL_DELAY_MS = 1000

const prefetchNextBatch = useCallback(async (batchIndex: number, retryCount = 0) => {
  if (loadedBatches.has(batchIndex) || isLoadingNextBatch) return

  setIsLoadingNextBatch(true)
  setBatchError(null)
  try {
    const response = await fetch(`/api/exams/${session?.id}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchIndex }),
    })

    if (response.ok) {
      const { questions } = await response.json()
      setQuestions(prev => [...prev, ...questions])
      setLoadedBatches(prev => new Set([...prev, batchIndex]))
    } else if (response.status === 409) {
      // Concurrent request - wait and retry
      if (retryCount < MAX_RETRIES) {
        const delay = INITIAL_DELAY_MS * Math.pow(2, retryCount)
        setTimeout(() => prefetchNextBatch(batchIndex, retryCount + 1), delay)
        return
      }
      setBatchError('فشل تحميل الأسئلة التالية')
    } else {
      // Other errors - retry with exponential backoff
      if (retryCount < MAX_RETRIES) {
        const delay = INITIAL_DELAY_MS * Math.pow(2, retryCount)
        setTimeout(() => prefetchNextBatch(batchIndex, retryCount + 1), delay)
        return
      }
      setBatchError('فشل تحميل الأسئلة التالية')
    }
  } catch (error) {
    // Network errors - retry with exponential backoff
    if (retryCount < MAX_RETRIES) {
      const delay = INITIAL_DELAY_MS * Math.pow(2, retryCount)
      setTimeout(() => prefetchNextBatch(batchIndex, retryCount + 1), delay)
      return
    }
    setBatchError('فشل الاتصال بالخادم')
  } finally {
    setIsLoadingNextBatch(false)
  }
}, [session?.id, loadedBatches, isLoadingNextBatch])

// Retry function for blocked state
const retryBatchLoad = useCallback(() => {
  const nextBatch = Math.floor(currentIndex / BATCH_SIZE) + 1
  prefetchNextBatch(nextBatch)
}, [currentIndex, prefetchNextBatch])

// Prefetch trigger effect
useEffect(() => {
  const currentBatch = Math.floor(currentIndex / BATCH_SIZE)
  const positionInBatch = currentIndex % BATCH_SIZE

  if (positionInBatch >= PREFETCH_THRESHOLD) {
    const nextBatch = currentBatch + 1
    if (!loadedBatches.has(nextBatch) && nextBatch < 10) {
      prefetchNextBatch(nextBatch)
    }
  }
}, [currentIndex, loadedBatches, prefetchNextBatch])
```

---

## Database Changes

```sql
-- Migration: Add streaming generation columns
ALTER TABLE exam_sessions
ADD COLUMN IF NOT EXISTS generated_batches integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS generation_context jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS total_questions integer DEFAULT 96,
ADD COLUMN IF NOT EXISTS generation_in_progress boolean DEFAULT false;

ALTER TABLE practice_sessions
ADD COLUMN IF NOT EXISTS generated_batches integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS generation_context jsonb DEFAULT '{}';

-- Index for finding sessions with pending batches
CREATE INDEX IF NOT EXISTS idx_exam_sessions_pending
ON exam_sessions(user_id, status)
WHERE generated_batches < 10 AND status = 'in_progress';
```

---

## Environment Variables

```bash
# Add to .env.local
ANTHROPIC_API_KEY=sk-ant-api03-...

# Optional configuration
EXAM_BATCH_SIZE=10
PRACTICE_BATCH_SIZE=5
PREFETCH_THRESHOLD=0.7
```

---

## File Changes Summary

### New Files
| File | Purpose |
|------|---------|
| `src/lib/anthropic/client.ts` | Claude API client with prompt caching |
| `src/lib/anthropic/prompts.ts` | Question generation with caching |
| `src/lib/anthropic/index.ts` | Module exports |
| `src/app/api/exams/[sessionId]/questions/route.ts` | Batch generation endpoint |
| `src/app/api/practice/[sessionId]/questions/route.ts` | Practice batch endpoint |

### Modified Files
| File | Changes |
|------|---------|
| `package.json` | Add `@anthropic-ai/sdk` |
| `src/lib/env.ts` | Add `ANTHROPIC_API_KEY` |
| `.env.example` | Document new variables |
| `src/app/api/exams/route.ts` | Generate first batch only |
| `src/app/api/practice/route.ts` | Batch generation for practice |
| `src/hooks/useExamSession.ts` | Prefetching logic |
| `src/contexts/ExamContext.tsx` | Expose batch loading state |
| `src/app/(main)/exam/[id]/page.tsx` | Loading states for transitions |

---

## Tasks Checklist

### Phase 1: Foundation
- [ ] Install `@anthropic-ai/sdk` package
- [ ] Add `ANTHROPIC_API_KEY` to environment config
- [ ] Create `src/lib/anthropic/client.ts`
- [ ] Implement `callClaudeWithCaching()` with cache_control
- [ ] Implement rate limit detection and fallback

### Phase 2: Batch Generation
- [ ] Create cached system prompts (>1024 tokens)
- [ ] Implement `generateQuestionBatch()` function
- [ ] Create conversation context management
- [ ] Add JSON response parsing and validation
- [ ] Run database migration for new columns

### Phase 3: API Routes
- [ ] Create `/api/exams/[sessionId]/questions` endpoint
- [ ] Modify `/api/exams` for first batch only
- [ ] Add concurrent generation prevention
- [ ] Create practice batch endpoint

### Phase 4: Frontend
- [ ] Add batch state to `useExamSession` hook
- [ ] Implement prefetch logic (trigger at 70%)
- [ ] Update `ExamContext` with batch state
- [ ] Add loading states to exam page
- [ ] Update progress indicator

### Phase 5: Testing
- [ ] Test cache hits (check `cache_read_input_tokens > 0`)
- [ ] Test fallback to OpenRouter
- [ ] Test full exam completion (10 batches)
- [ ] Test session resume with partial batches
- [ ] Test practice mode batching

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Cache hit rate (batches 2+) | > 90% |
| Average exam cost | < $0.15 |
| First batch latency | < 5 seconds |
| Prefetch success rate | > 95% |
| Fallback trigger rate | < 5% |

---

## References

- [Anthropic Prompt Caching Documentation](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Claude Sonnet 4.5 Pricing](https://www.anthropic.com/pricing): $3/MTok input, $0.30/MTok cache read, $15/MTok output
- [Anthropic SDK Documentation](https://docs.anthropic.com/en/api/client-sdks)


