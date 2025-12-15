# Data Model: Claude Sonnet 4.5 Streaming Generation

**Date**: 2025-12-14
**Feature**: 002-claude-streaming-generation

---

## Entity Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      exam_sessions                               │
│  (MODIFIED - add batch generation fields)                        │
├─────────────────────────────────────────────────────────────────┤
│  id: uuid [PK]                                                   │
│  user_id: uuid [FK → users]                                      │
│  track: 'scientific' | 'literary'                                │
│  status: 'in_progress' | 'completed' | 'abandoned'               │
│  questions: jsonb (Question[])                                   │
│  answers: jsonb                                                  │
│  score: integer                                                  │
│  created_at: timestamp                                           │
│  updated_at: timestamp                                           │
│  ──────────────────── NEW FIELDS ────────────────────           │
│  generated_batches: integer DEFAULT 0                            │
│  generation_context: jsonb DEFAULT '{}'                          │
│  total_questions: integer DEFAULT 96                             │
│  generation_in_progress: boolean DEFAULT false                   │
└─────────────────────────────────────────────────────────────────┘
          │
          │ 1:N (questions stored as JSONB array)
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Question                                  │
│  (Embedded in exam_sessions.questions JSONB)                     │
├─────────────────────────────────────────────────────────────────┤
│  id: string (format: section_batch_number, e.g., "quant_2_05")  │
│  section: 'quantitative' | 'verbal'                              │
│  topic: string (category key)                                    │
│  difficulty: 'easy' | 'medium' | 'hard'                          │
│  questionType: 'mcq'                                             │
│  stem: string (Arabic question text)                             │
│  choices: [string, string, string, string]                       │
│  answerIndex: 0 | 1 | 2 | 3                                      │
│  explanation: string (Arabic explanation)                        │
│  tags?: string[]                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    practice_sessions                             │
│  (MODIFIED - add batch generation fields)                        │
├─────────────────────────────────────────────────────────────────┤
│  id: uuid [PK]                                                   │
│  user_id: uuid [FK → users]                                      │
│  section: 'quantitative' | 'verbal'                              │
│  topic: string                                                   │
│  questions: jsonb (Question[])                                   │
│  answers: jsonb                                                  │
│  created_at: timestamp                                           │
│  ──────────────────── NEW FIELDS ────────────────────           │
│  generated_batches: integer DEFAULT 0                            │
│  generation_context: jsonb DEFAULT '{}'                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## New Fields Detail

### exam_sessions Table

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `generated_batches` | integer | 0 | Count of successfully generated batches (0-10) |
| `generation_context` | jsonb | `{}` | Stores `GenerationContext` for deduplication |
| `total_questions` | integer | 96 | Total questions for this exam |
| `generation_in_progress` | boolean | false | Lock flag to prevent concurrent generation |

### practice_sessions Table

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `generated_batches` | integer | 0 | Count of successfully generated batches |
| `generation_context` | jsonb | `{}` | Stores `GenerationContext` for deduplication |

---

## TypeScript Interfaces

### GenerationContext (stored in JSONB)

```typescript
interface GenerationContext {
  /**
   * IDs of all questions generated so far.
   * Used to instruct Claude to avoid duplicates.
   */
  generatedIds: string[]

  /**
   * Index of the last successfully generated batch (0-indexed).
   * Next batch to generate = lastBatchIndex + 1
   */
  lastBatchIndex: number
}
```

### BatchConfig (API request context)

```typescript
interface BatchConfig {
  /** Session ID for this generation */
  sessionId: string

  /** 0-indexed batch number to generate */
  batchIndex: number

  /** Number of questions per batch (default: 10) */
  batchSize: number

  /** Section for this batch */
  section: 'quantitative' | 'verbal'

  /** Student track affects question distribution */
  track: 'scientific' | 'literary'
}
```

### Question (existing, embedded in JSONB)

```typescript
interface Question {
  /** Unique ID format: section_batch_number (e.g., "quant_2_05") */
  id: string

  /** Exam section */
  section: 'quantitative' | 'verbal'

  /** Category key (e.g., "algebra", "reading-comprehension") */
  topic: string

  /** Difficulty level */
  difficulty: 'easy' | 'medium' | 'hard'

  /** Question format (always MCQ for this platform) */
  questionType: 'mcq'

  /** Arabic question text */
  stem: string

  /** Four answer choices in Arabic */
  choices: [string, string, string, string]

  /** Index of correct answer (0-3) */
  answerIndex: 0 | 1 | 2 | 3

  /** Arabic explanation of the answer */
  explanation: string

  /** Optional categorization tags */
  tags?: string[]
}
```

### UsageMetrics (API response tracking)

```typescript
interface UsageMetrics {
  /** Total input tokens (uncached) */
  inputTokens: number

  /** Total output tokens */
  outputTokens: number

  /** Tokens read from cache (cost: 0.1x base) */
  cacheReadTokens: number

  /** Tokens written to cache (cost: 1.25x base) */
  cacheCreationTokens: number
}
```

---

## State Transitions

### Exam Session Generation States

```
┌──────────────────┐
│  Session Created │
│  generated_batches=0
│  generation_in_progress=false
└────────┬─────────┘
         │ POST /api/exams (creates session + first batch)
         ▼
┌──────────────────┐
│  Generating      │
│  generated_batches=0
│  generation_in_progress=true
└────────┬─────────┘
         │ First batch complete
         ▼
┌──────────────────┐
│  Batch 1 Ready   │
│  generated_batches=1
│  generation_in_progress=false
│  questions.length=10
└────────┬─────────┘
         │ User progresses, prefetch triggers
         ▼
┌──────────────────┐
│  Prefetching     │
│  generation_in_progress=true
└────────┬─────────┘
         │ Next batch complete
         ▼
┌──────────────────┐
│  Batch N Ready   │
│  generated_batches=N
│  generation_in_progress=false
└────────┬─────────┘
         │ Repeat until all 10 batches
         ▼
┌──────────────────┐
│  Fully Generated │
│  generated_batches=10
│  questions.length=96
└──────────────────┘
```

### Generation Lock States

```
generation_in_progress: false
    │
    │ POST /api/exams/[id]/questions (acquire lock)
    ▼
generation_in_progress: true
    │
    ├─── Concurrent request arrives → 409 Conflict
    │
    │ Generation completes (success or failure)
    ▼
generation_in_progress: false (lock released)
```

---

## Validation Rules

### BatchConfig Validation

| Field | Rule |
|-------|------|
| `batchIndex` | Must equal `session.generated_batches` (sequential only) |
| `batchSize` | 1-10 (default: 10) |
| `section` | Must match expected section for batch position |

### Question Validation

| Field | Rule |
|-------|------|
| `id` | Unique within session, format: `{section_prefix}_{batch}_{seq}` |
| `choices` | Exactly 4 items |
| `answerIndex` | 0, 1, 2, or 3 |
| `stem` | Non-empty string |

### Session Constraints

| Constraint | Rule |
|------------|------|
| Concurrent generation | Only one `generation_in_progress=true` per session |
| Batch sequence | Must generate batches in order (0, 1, 2, ...) |
| Max batches | 10 for exam (96 questions), varies for practice |

---

## Indexes

```sql
-- Index for finding sessions with pending batches (for admin/monitoring)
CREATE INDEX IF NOT EXISTS idx_exam_sessions_pending
ON exam_sessions(user_id, status)
WHERE generated_batches < 10 AND status = 'in_progress';

-- Index for checking generation lock status
CREATE INDEX IF NOT EXISTS idx_exam_sessions_generating
ON exam_sessions(id)
WHERE generation_in_progress = true;
```

---

## Migration SQL

```sql
-- Migration: 002_add_streaming_generation_columns.sql

-- Add streaming generation columns to exam_sessions
ALTER TABLE exam_sessions
ADD COLUMN IF NOT EXISTS generated_batches integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS generation_context jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS total_questions integer DEFAULT 96,
ADD COLUMN IF NOT EXISTS generation_in_progress boolean DEFAULT false;

-- Add streaming generation columns to practice_sessions
ALTER TABLE practice_sessions
ADD COLUMN IF NOT EXISTS generated_batches integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS generation_context jsonb DEFAULT '{}';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_exam_sessions_pending
ON exam_sessions(user_id, status)
WHERE generated_batches < 10 AND status = 'in_progress';

CREATE INDEX IF NOT EXISTS idx_exam_sessions_generating
ON exam_sessions(id)
WHERE generation_in_progress = true;

-- Add comment for documentation
COMMENT ON COLUMN exam_sessions.generated_batches IS 'Number of question batches generated (0-10)';
COMMENT ON COLUMN exam_sessions.generation_context IS 'JSON with generatedIds[] and lastBatchIndex for deduplication';
COMMENT ON COLUMN exam_sessions.total_questions IS 'Total questions for this exam (default 96)';
COMMENT ON COLUMN exam_sessions.generation_in_progress IS 'Lock flag to prevent concurrent batch generation';
```
