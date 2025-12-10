# Data Model: Tafawoq - Saudi Aptitude Exam Preparation Platform

**Branch**: `001-tafawoq-exam-platform` | **Date**: 2025-12-11

This document defines the database schema, entity relationships, validation rules, and state transitions.

---

## Entity Relationship Diagram

```
┌─────────────┐      1:N       ┌─────────────────┐
│    users    │───────────────▶│  subscriptions  │
└─────────────┘                └─────────────────┘
       │                              │
       │ 1:N                          │
       ▼                              │
┌─────────────────┐                   │
│  user_profiles  │                   │
└─────────────────┘                   │
       │                              │
       │ 1:N                          │
       ▼                              │
┌─────────────────┐      1:N       ┌──────────────┐
│  exam_sessions  │───────────────▶│   answers    │
└─────────────────┘                └──────────────┘
       │                              │
       │                              │
       ▼                              ▼
┌───────────────────┐           ┌──────────────┐
│ practice_sessions │──────────▶│   answers    │
└───────────────────┘   1:N     └──────────────┘
       │
       │
       ▼
┌─────────────────────┐
│ performance_records │
└─────────────────────┘
```

---

## Entities

### 1. users (extends auth.users)

The core user entity, extending Supabase Auth's built-in `auth.users` table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, FK to auth.users | Supabase Auth user ID |
| `email` | `text` | NOT NULL, UNIQUE | User email (from auth.users) |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Registration timestamp |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | Last update timestamp |

**Note**: This is a view/reference to `auth.users`. Additional profile data stored in `user_profiles`.

---

### 2. user_profiles

Extended user information and preferences.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Profile ID |
| `user_id` | `uuid` | FK to auth.users, UNIQUE, NOT NULL | Link to auth user |
| `academic_track` | `text` | NOT NULL, CHECK (value IN ('scientific', 'literary')) | Selected academic track |
| `subscription_tier` | `text` | NOT NULL, DEFAULT 'free', CHECK (value IN ('free', 'premium')) | Current subscription level |
| `onboarding_completed` | `boolean` | NOT NULL, DEFAULT false | Tutorial completion status |
| `total_practice_hours` | `decimal(10,2)` | NOT NULL, DEFAULT 0 | Accumulated practice time |
| `last_exam_scores` | `jsonb` | DEFAULT NULL | Latest exam scores {verbal, quantitative, overall} |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Profile creation time |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | Last update time |

**Validation Rules**:
- `academic_track` must be selected during onboarding before dashboard access
- `total_practice_hours` increments only on practice session completion
- `last_exam_scores` updated only on full exam completion (not practice)

**State Transitions**:
- `subscription_tier`: free → premium (on payment), premium → free (on cancellation/expiry)

---

### 3. subscriptions

Stripe subscription tracking and status synchronization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Subscription record ID |
| `user_id` | `uuid` | FK to auth.users, NOT NULL | Link to user |
| `stripe_customer_id` | `text` | UNIQUE | Stripe customer reference |
| `stripe_subscription_id` | `text` | UNIQUE | Stripe subscription reference |
| `status` | `text` | NOT NULL, CHECK (value IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')) | Subscription status |
| `price_id` | `text` | | Stripe price ID for current plan |
| `current_period_start` | `timestamptz` | | Billing period start |
| `current_period_end` | `timestamptz` | | Billing period end |
| `trial_end` | `timestamptz` | | Trial expiration (if trialing) |
| `cancel_at_period_end` | `boolean` | DEFAULT false | Scheduled cancellation flag |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Record creation time |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | Last update time |

**Validation Rules**:
- `stripe_customer_id` created on first payment attempt
- `trial_end` set to 3 days from creation for new premium subscribers

**State Transitions**:
```
(none) → trialing (new premium with trial)
(none) → active (new premium without trial)
trialing → active (trial ends, payment succeeds)
trialing → canceled (trial ends, payment fails)
active → past_due (payment fails)
active → canceled (user cancels or payment fails repeatedly)
past_due → active (payment recovered)
past_due → canceled (recovery fails)
```

---

### 4. exam_sessions

Full integrated exam attempts (96 questions, 120 minutes).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Session ID |
| `user_id` | `uuid` | FK to auth.users, NOT NULL | Link to user |
| `track` | `text` | NOT NULL, CHECK (value IN ('scientific', 'literary')) | Academic track for this exam |
| `status` | `text` | NOT NULL, DEFAULT 'in_progress', CHECK (value IN ('in_progress', 'completed', 'abandoned')) | Session status |
| `questions` | `jsonb` | NOT NULL | Array of generated questions (full Gemini response) |
| `start_time` | `timestamptz` | NOT NULL, DEFAULT now() | Exam start time |
| `end_time` | `timestamptz` | | Exam completion time |
| `time_paused_seconds` | `integer` | DEFAULT 0 | Total time paused (offline) |
| `verbal_score` | `decimal(5,2)` | | Verbal section percentage (0-100) |
| `quantitative_score` | `decimal(5,2)` | | Quantitative section percentage (0-100) |
| `overall_score` | `decimal(5,2)` | | Overall average percentage (0-100) |
| `strengths` | `jsonb` | | Top 3 strength categories |
| `weaknesses` | `jsonb` | | Top 3 weakness categories |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Record creation time |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | Last update time |

**Validation Rules**:
- `questions` array must contain exactly 96 items for full exams
- Scientific track: ~57 quantitative, ~39 verbal questions
- Literary track: ~29 quantitative, ~67 verbal questions
- Session expires same calendar day if not completed
- Free users limited to 3 sessions per 7-day period

**State Transitions**:
```
in_progress → completed (all questions answered OR time expires)
in_progress → abandoned (user exits without completing, session expires)
```

---

### 5. practice_sessions

Customized practice sessions with user-selected parameters.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Session ID |
| `user_id` | `uuid` | FK to auth.users, NOT NULL | Link to user |
| `track` | `text` | NOT NULL, CHECK (value IN ('scientific', 'literary')) | User's academic track |
| `sections` | `text[]` | NOT NULL | Selected sections ['quantitative', 'verbal'] |
| `categories` | `text[]` | NOT NULL | Selected categories |
| `difficulty` | `text` | NOT NULL, CHECK (value IN ('easy', 'medium', 'hard')) | Selected difficulty |
| `question_count` | `integer` | NOT NULL, CHECK (value BETWEEN 5 AND 100) | Number of questions |
| `status` | `text` | NOT NULL, DEFAULT 'in_progress', CHECK (value IN ('in_progress', 'completed', 'abandoned')) | Session status |
| `questions` | `jsonb` | NOT NULL | Array of generated questions |
| `start_time` | `timestamptz` | NOT NULL, DEFAULT now() | Practice start time |
| `end_time` | `timestamptz` | | Practice completion time |
| `elapsed_seconds` | `integer` | DEFAULT 0 | Total time spent (not countdown) |
| `score` | `decimal(5,2)` | | Final percentage score (0-100) |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Record creation time |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | Last update time |

**Validation Rules**:
- Free users: `question_count` fixed at 5, `categories` max 2 items
- Premium users: `question_count` up to 100, unlimited categories
- Practice scores do NOT affect `user_profiles.last_exam_scores`
- Elapsed time is counted up (not countdown like full exams)

**Valid Categories**:
- Quantitative: `algebra`, `geometry`, `statistics`, `ratio-proportion`, `probability`, `speed-time-distance`
- Verbal: `reading-comprehension`, `sentence-completion`, `context-error`, `analogy`, `association-difference`, `vocabulary`

---

### 6. answers

User responses to individual questions within sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Answer ID |
| `user_id` | `uuid` | FK to auth.users, NOT NULL | Link to user |
| `session_id` | `uuid` | NOT NULL | Link to exam or practice session |
| `session_type` | `text` | NOT NULL, CHECK (value IN ('exam', 'practice')) | Session type discriminator |
| `question_id` | `text` | NOT NULL | Question ID from generated JSON |
| `question_index` | `integer` | NOT NULL | Position in question list (0-based) |
| `selected_answer` | `integer` | CHECK (value BETWEEN 0 AND 3) | User's selected choice index |
| `is_correct` | `boolean` | NOT NULL | Whether answer matches correct answer |
| `time_spent_seconds` | `integer` | DEFAULT 0 | Time spent on this question |
| `explanation_viewed` | `boolean` | DEFAULT false | Whether user viewed explanation |
| `explanation_viewed_at` | `timestamptz` | | When explanation was first viewed |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Answer submission time |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | Last update time |

**Validation Rules**:
- `selected_answer` can be NULL if question skipped
- `is_correct` computed on insert by comparing with question data
- Free users: `explanation_viewed_at` must be ≥24 hours after session completion

**Indexes**:
- Composite index on `(session_id, question_index)` for ordered retrieval
- Index on `(user_id, session_type)` for history queries

---

### 7. performance_records

Aggregated performance metrics for analytics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Record ID |
| `user_id` | `uuid` | FK to auth.users, UNIQUE, NOT NULL | Link to user |
| `category_scores` | `jsonb` | NOT NULL, DEFAULT '{}' | Per-category average scores |
| `exam_history` | `jsonb` | NOT NULL, DEFAULT '[]' | Array of historical exam scores with dates |
| `practice_stats` | `jsonb` | NOT NULL, DEFAULT '{}' | Practice session statistics by category |
| `total_questions_answered` | `integer` | NOT NULL, DEFAULT 0 | Lifetime question count |
| `total_correct_answers` | `integer` | NOT NULL, DEFAULT 0 | Lifetime correct count |
| `weekly_exam_count` | `integer` | NOT NULL, DEFAULT 0 | Exams taken in current week |
| `week_start_date` | `date` | | Current tracking week start |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Record creation time |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | Last update time |

**JSONB Schemas**:

```typescript
// category_scores
{
  "algebra": 75.5,
  "geometry": 82.0,
  "reading-comprehension": 68.3,
  // ... other categories
}

// exam_history (last 10 exams)
[
  {
    "date": "2025-01-15",
    "verbal": 78.5,
    "quantitative": 82.0,
    "overall": 80.25
  }
]

// practice_stats
{
  "algebra": { "total": 50, "correct": 42, "avgTime": 45 },
  "geometry": { "total": 30, "correct": 25, "avgTime": 60 }
}
```

**Validation Rules**:
- `weekly_exam_count` resets when `week_start_date` is older than 7 days
- `exam_history` maintains rolling window of last 10 exams

---

### 8. reading_passages

Shared passages for reading comprehension questions (deduplicated).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | PK | Passage ID (e.g., "PASS-001") |
| `content` | `text` | NOT NULL | Full passage text in Arabic |
| `word_count` | `integer` | NOT NULL | Word count for difficulty estimation |
| `topic` | `text` | | Subject area (literary, scientific, social) |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Creation time |

**Usage**: Questions with `passage_id` reference this table. Multiple questions can share the same passage.

---

## Question JSON Schema

Questions stored in `exam_sessions.questions` and `practice_sessions.questions` follow this schema:

```typescript
interface Question {
  id: string;                    // Unique ID, e.g., "QGEO-001"
  section: 'quantitative' | 'verbal';
  topic: QuestionTopic;
  difficulty: 'easy' | 'medium' | 'hard';
  question_type: 'mcq' | 'diagram' | 'chart' | 'text-only' | 'reading-passage';
  stem: string;                  // Question text in Arabic
  choices: [string, string, string, string];  // Exactly 4 choices
  answer_index: 0 | 1 | 2 | 3;   // Correct answer position
  explanation: string;           // Answer explanation
  solving_strategy?: string;     // Step-by-step strategy (practice only)
  tip?: string;                  // Quick tip (practice only)
  passage?: string;              // Reading passage text
  passage_id?: string;           // Reference to shared passage
  diagram?: DiagramData;         // Visual data if applicable
  tags: string[];                // Classification tags
}

interface DiagramData {
  type: 'circle' | 'triangle' | 'rectangle' | 'composite-shape' |
        'bar-chart' | 'pie-chart' | 'line-graph' | 'custom';
  data: Record<string, unknown>;  // Type-specific rendering parameters
  render_hint: 'SVG' | 'Canvas' | 'Chart.js';
  caption?: string;              // Arabic description
}

type QuestionTopic =
  // Quantitative
  | 'algebra'
  | 'geometry'
  | 'statistics'
  | 'ratio-proportion'
  | 'probability'
  | 'speed-time-distance'
  // Verbal
  | 'reading-comprehension'
  | 'sentence-completion'
  | 'context-error'
  | 'analogy'
  | 'association-difference'
  | 'vocabulary';
```

---

## Row Level Security (RLS) Policies

### user_profiles

```sql
-- Users can read their own profile
CREATE POLICY "Users read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- System can insert on user creation (via trigger)
CREATE POLICY "System insert profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### exam_sessions

```sql
-- Users can read their own sessions
CREATE POLICY "Users read own exam sessions" ON exam_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create sessions with subscription check
CREATE POLICY "Users create exam sessions" ON exam_sessions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (
      -- Premium users: unlimited
      (SELECT subscription_tier FROM user_profiles WHERE user_id = auth.uid()) = 'premium'
      OR
      -- Free users: max 3 per week
      (SELECT weekly_exam_count FROM performance_records WHERE user_id = auth.uid()) < 3
    )
  );

-- Users can update their own in-progress sessions
CREATE POLICY "Users update own exam sessions" ON exam_sessions
  FOR UPDATE USING (auth.uid() = user_id AND status = 'in_progress');
```

### answers

```sql
-- Users can read their own answers
CREATE POLICY "Users read own answers" ON answers
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert answers for their sessions
CREATE POLICY "Users insert answers" ON answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own answers (for explanation_viewed)
CREATE POLICY "Users update own answers" ON answers
  FOR UPDATE USING (auth.uid() = user_id);
```

---

## Database Functions

### Trigger: Create user profile on signup

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id)
  VALUES (NEW.id);

  INSERT INTO performance_records (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### Function: Calculate exam scores

```sql
CREATE OR REPLACE FUNCTION calculate_exam_scores(session_uuid UUID)
RETURNS TABLE(verbal_score DECIMAL, quantitative_score DECIMAL, overall_score DECIMAL)
AS $$
DECLARE
  verbal_correct INT;
  verbal_total INT;
  quant_correct INT;
  quant_total INT;
BEGIN
  -- Count verbal section scores
  SELECT COUNT(*) FILTER (WHERE is_correct), COUNT(*)
  INTO verbal_correct, verbal_total
  FROM answers a
  JOIN exam_sessions e ON e.id = a.session_id
  WHERE a.session_id = session_uuid
  AND (e.questions->>(a.question_index)::text->>'section') = 'verbal';

  -- Count quantitative section scores
  SELECT COUNT(*) FILTER (WHERE is_correct), COUNT(*)
  INTO quant_correct, quant_total
  FROM answers a
  JOIN exam_sessions e ON e.id = a.session_id
  WHERE a.session_id = session_uuid
  AND (e.questions->>(a.question_index)::text->>'section') = 'quantitative';

  RETURN QUERY SELECT
    CASE WHEN verbal_total > 0 THEN (verbal_correct::DECIMAL / verbal_total * 100) ELSE 0 END,
    CASE WHEN quant_total > 0 THEN (quant_correct::DECIMAL / quant_total * 100) ELSE 0 END,
    CASE WHEN (verbal_total + quant_total) > 0
      THEN ((verbal_correct + quant_correct)::DECIMAL / (verbal_total + quant_total) * 100)
      ELSE 0
    END;
END;
$$ LANGUAGE plpgsql;
```

---

## Indexes

```sql
-- User lookups
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

-- Session queries
CREATE INDEX idx_exam_sessions_user_id ON exam_sessions(user_id);
CREATE INDEX idx_exam_sessions_status ON exam_sessions(status);
CREATE INDEX idx_practice_sessions_user_id ON practice_sessions(user_id);

-- Answer retrieval
CREATE INDEX idx_answers_session ON answers(session_id, question_index);
CREATE INDEX idx_answers_user ON answers(user_id, session_type);

-- Performance lookups
CREATE INDEX idx_performance_user_id ON performance_records(user_id);
```

---

## Migration Order

1. `001_create_user_profiles.sql`
2. `002_create_subscriptions.sql`
3. `003_create_exam_sessions.sql`
4. `004_create_practice_sessions.sql`
5. `005_create_answers.sql`
6. `006_create_performance_records.sql`
7. `007_create_reading_passages.sql`
8. `008_create_functions_triggers.sql`
9. `009_create_rls_policies.sql`
10. `010_create_indexes.sql`
