# Data Model: GAT Exam Platform v3.0

**Feature**: 1-gat-exam-v3
**Date**: 2026-01-05
**Status**: Draft

## Overview

This document describes the data entities, relationships, and storage schema for GAT Exam Platform v3.0. The model extends the existing v2.x schema with new fields for advanced diagram capabilities, AI generation metadata, and quality assurance tracking.

---

## Core Entities

### 1. Question (Extended)

The central entity representing a single exam question. Extended from v2.x with new v3.0 fields.

**Table**: `questions`

**Fields**:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | UUID | ✓ | gen_random_uuid() | Primary key |
| `created_at` | TIMESTAMP | ✓ | now() | Creation timestamp |
| `updated_at` | TIMESTAMP | ✓ | now() | Last update timestamp |
| `version` | TEXT | ✓ | '3.0' | Schema version (v2.x, v3.0) |
| `language` | TEXT | ✓ | 'ar' | Question language (always Arabic) |
| `section` | TEXT | ✓ | - | 'quantitative' or 'verbal' |
| `track` | TEXT | ✓ | - | 'scientific' or 'literary' |
| `question_type` | TEXT | ✓ | - | 'mcq', 'comparison', 'diagram' (quantitative); 'reading', 'analogy', 'completion', 'error', 'odd-word' (verbal) |
| `topic` | TEXT | ✓ | - | Main topic (e.g., 'geometry', 'algebra', 'analogy') |
| `subtopic` | TEXT | ✓ | - | Specific subtopic (e.g., 'triangles', 'linear-equations', 'synonymy') |
| `difficulty` | TEXT | ✓ | - | 'easy', 'medium', 'hard' |
| `question_text` | TEXT | ✓ | - | The question prompt in Arabic |
| `correct_answer` | TEXT | ✓ | - | The correct answer (choice key or value) |
| `explanation` | TEXT | ✓ | - | Solution explanation in Arabic |
| `choices` | JSONB | Conditional | - | Answer choices for MCQ (required for mcq type) |
| `comparison_values` | JSONB | Conditional | - | Two values for comparison questions (NEW v3.0) |
| `shape_type` | TEXT | Conditional | NULL | Shape category (e.g., 'circle', 'triangle', 'overlapping-shapes') (NEW v3.0) |
| `pattern_id` | TEXT | Conditional | NULL | Overlapping pattern identifier (e.g., 'three-tangent-circles') (NEW v3.0) |
| `diagram_config` | JSONB | Conditional | NULL | Full diagram configuration (NEW v3.0) |
| `relationship_type` | TEXT | Conditional | NULL | Analogy relationship type (e.g., 'synonymy', 'antonymy') (NEW v3.0) |
| `generation_metadata` | JSONB | ✓ | '{}' | AI generation metadata (model, batch_id, cache_hit) (NEW v3.0) |
| `quality_flags` | JSONB | ✓ | '[]' | Quality validation flags (grammar, math, distractors) (NEW v3.0) |
| `corrected_at` | TIMESTAMP | - | NULL | Timestamp of last correction (for error reports) (NEW v3.0) |
| `error_count` | INTEGER | ✓ | 0 | Number of times this question was reported as having errors (NEW v3.0) |

**Indexes**:
```sql
CREATE INDEX idx_questions_section ON questions(section);
CREATE INDEX idx_questions_topic ON questions(topic);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_shape_type ON questions(shape_type) WHERE shape_type IS NOT NULL;
CREATE INDEX idx_questions_pattern_id ON questions(pattern_id) WHERE pattern_id IS NOT NULL;
CREATE INDEX idx_questions_diagram_config ON questions USING GIN(diagram_config) WHERE diagram_config IS NOT NULL;
CREATE INDEX idx_questions_version ON questions(version);
```

**Validation Rules**:
- `section` must be 'quantitative' or 'verbal'
- `track` must be 'scientific' or 'literary'
- `difficulty` must be 'easy', 'medium', or 'hard'
- `question_type` must match valid types for section
- `choices` required when `question_type = 'mcq'`
- `comparison_values` required when `question_type = 'comparison'`
- `diagram_config` required when `question_type = 'diagram'`
- `relationship_type` required when `subtopic` is analogy relationship
- If `shape_type IS NOT NULL`, then `diagram_config IS NOT NULL`
- If `pattern_id IS NOT NULL`, then `shape_type = 'overlapping-shapes'`

**State Transitions**:
1. **Generated**: Question created by AI, not yet validated
2. **Flagged**: Quality validation identified potential issues
3. **In Review**: Human expert reviewing flagged question
4. **Published**: Passed all validation, available to students
5. **Corrected**: Was published, error reported, correction made

---

### 2. DiagramConfig (Embedded in Question)

Diagram configuration stored as JSONB within the `diagram_config` field of Question entity.

**Structure** (TypeScript interface):

```typescript
interface DiagramConfig {
  // Routing & Rendering
  type: string;                    // "circle", "triangle", "overlapping-shapes", "bar-chart"
  subtype?: string;                // For overlapping: "three-tangent-circles", etc.
  renderHint: "SVG" | "JSXGraph" | "Chart.js";  // Library to use

  // Shape Data (varies by type)
  data: ShapeData | ChartData;     // Shape-specific parameters

  // Overlapping Shapes Specific (FR-011, FR-013)
  shading?: {
    type: "difference" | "intersection" | "union";
    operation: string;             // "square - 4_quarter_circles"
    shadedRegion: string;          // Description of shaded area
    fillColor: string;             // "#e74c3c"
    fillOpacity: number;           // 0.3-0.6
  };

  overlap?: {
    type: string;                  // "quarter-circle-inside-square"
    angle?: number;                // For sectors
    description: string;           // Arabic description
  };

  formulaUsed?: string;            // "المساحة = مساحة المربع - مساحة الدائرة"

  // Accessibility (FR-018, FR-019)
  caption: string;                 // REQUIRED: Arabic accessibility description
  accessibilityFeatures?: {
    highContrast: boolean;
    patternOverlay: boolean;       // For colorblind users
    textAlternative: string;       // Full text description
  };

  // Rendering Constraints
  aspectRatio?: number;            // Default 1:1
  minWidth?: number;               // Minimum 200px
  maxWidth?: number;               // Maximum 600px
}

// Example shape data types
interface CircleData {
  center: { x: number; y: number };
  radius: number;
  features?: ('diameter' | 'chord' | 'sector' | 'tangent')[];
  labels: { [key: string]: string };  // Arabic labels
}

interface TriangleData {
  type: 'right' | 'isosceles' | 'equilateral' | 'scalene';
  vertices: { x: number; y: number }[];
  angles?: number[];
  sides?: number[];
  labels: { [key: string]: string };
}

interface OverlappingData {
  shapes: Array<{
    type: string;
    position: { x: number; y: number };
    size: number;
    rotation?: number;
  }>;
  intersections: { x: number; y: number }[];  // Pre-calculated
  shadedRegion: {
    path: string;  // SVG path or JSXGraph curve definition
    area: number;  // Pre-calculated area
  };
}

interface ChartData {
  chartType: 'bar' | 'line' | 'pie' | 'histogram' | 'area';
  labels: string[];  // Arabic labels
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
  }>;
  options?: Record<string, any>;  // Chart.js options
}
```

**Validation Rules**:
- `caption` is REQUIRED (accessibility)
- `renderHint` determines which library to load
- If `shading` exists, `overlap` must also exist
- `formulaUsed` required for overlapping shapes questions
- All coordinates pre-calculated server-side

---

### 3. TopicHierarchy (Reference Data)

Classification structure for questions. Stored as static reference data, not a database table.

**Structure** (TypeScript enum/const):

```typescript
const QUANTITATIVE_TOPICS = {
  arithmetic: {
    label: 'الحساب',
    subtopics: {
      'basic-operations': 'العمليات الأساسية',
      'number-properties': 'خصائص الأعداد',
      'fractions': 'الكسور',
      'decimals': 'الأعداد العشرية',
      'exponents-roots': 'الأسس والجذور',
      'ratio-proportion': 'النسبة والتناسب',
      'percentages': 'النسب المئوية'
    },
    weight: 0.40  // 40% of quantitative questions
  },
  geometry: {
    label: 'الهندسة',
    subtopics: {
      'angles': 'الزوايا',
      'triangles': 'المثلثات',
      'circles': 'الدوائر',
      'polygons': 'المضلعات',
      'area-perimeter': 'المساحة والمحيط',
      '3d-shapes': 'الأشكال ثلاثية الأبعاد',
      'coordinate-geometry': 'الهندسة الإحداثية',
      'overlapping-shapes': 'الأشكال المتداخلة'  // NEW v3.0
    },
    weight: 0.24  // 24% of quantitative questions
  },
  algebra: {
    label: 'الجبر',
    subtopics: {
      'linear-equations': 'المعادلات الخطية',
      'quadratic-equations': 'المعادلات التربيعية',
      'inequalities': 'المتباينات',
      'algebraic-expressions': 'العبارات الجبرية',
      'sequences': 'المتتاليات',
      'functions': 'الدوال'
    },
    weight: 0.23  // 23% of quantitative questions
  },
  statistics: {
    label: 'الإحصاء',
    subtopics: {
      'central-tendency': 'مقاييس النزعة المركزية',
      'dispersion': 'مقاييس التشتت',
      'charts': 'الرسوم البيانية',  // NEW v3.0 enhanced
      'probability': 'الاحتمالات',
      'permutations': 'التباديل والتوافيق'
    },
    weight: 0.13  // 13% of quantitative questions
  }
};

const VERBAL_TOPICS = {
  reading: {
    label: 'فهم المقروء',
    subtopics: {
      'main-idea': 'الفكرة الرئيسية',
      'details': 'التفاصيل',
      'inference': 'الاستنتاج',
      'vocabulary': 'المفردات',
      'purpose': 'غرض الكاتب'
    },
    weight: 0.40  // 40% of verbal questions
  },
  analogy: {
    label: 'التناظر اللفظي',
    subtopics: {
      'synonymy': 'ترادف',
      'antonymy': 'تضاد',
      'part-whole': 'جزء من كل',
      'cause-effect': 'سبب ونتيجة',
      // ... 18 more relationship types (FR-025)
    },
    weight: 0.25  // 25% of verbal questions
  },
  completion: {
    label: 'إكمال الجمل',
    subtopics: {
      'single-blank': 'فراغ واحد',
      'double-blank': 'فراغان',
      'contrast': 'تباين',
      'cause-effect': 'سبب ونتيجة'
    },
    weight: 0.15  // 15% of verbal questions
  },
  error: {
    label: 'الخطأ السياقي',
    subtopics: {
      'word-choice': 'اختيار الكلمة',
      'grammatical': 'خطأ نحوي',
      'semantic': 'خطأ دلالي'
    },
    weight: 0.12  // 12% of verbal questions
  },
  'odd-word': {
    label: 'الكلمة الشاذة',
    subtopics: {
      'category': 'تصنيف',
      'semantic-field': 'حقل دلالي'
    },
    weight: 0.08  // 8% of verbal questions
  }
};
```

**Usage**:
- Used by AI generation system to enforce topic distribution
- Used by UI to filter questions by topic
- Used in analytics to track coverage

---

### 4. AnalogyRelationship (Reference Data)

Represents one of 22 relationship types for analogy questions (FR-025).

**Structure** (TypeScript const):

```typescript
const ANALOGY_RELATIONSHIPS = [
  {
    id: 'synonymy',
    nameAr: 'ترادف',
    nameEn: 'Synonymy',
    definition: 'Words with the same or similar meaning',
    exampleAr: 'كبير : ضخم',
    exampleEn: 'Large : Huge'
  },
  {
    id: 'antonymy',
    nameAr: 'تضاد',
    nameEn: 'Antonymy',
    definition: 'Words with opposite meanings',
    exampleAr: 'نور : ظلام',
    exampleEn: 'Light : Darkness'
  },
  {
    id: 'part-whole',
    nameAr: 'جزء من كل',
    nameEn: 'Part-Whole',
    definition: 'One is a component of the other',
    exampleAr: 'إصبع : يد',
    exampleEn: 'Finger : Hand'
  },
  // ... 19 more relationship types
  // See research.md section 8 for full list
];
```

**Usage**:
- Used in qudurat-verbal/references/analogy-relations.md skill file
- Stored in `relationship_type` field of Question when subtopic is analogy
- Used in explanation to identify relationship (FR-026)

---

### 5. PracticeSession (Existing, No Changes)

Represents a student's practice session. No schema changes needed for v3.0.

**Table**: `practice_sessions`

**Fields** (v2.x, unchanged):
- `id`: UUID, primary key
- `user_id`: UUID, foreign key to users table
- `created_at`: TIMESTAMP
- `completed_at`: TIMESTAMP (nullable)
- `question_ids`: JSONB array of UUIDs
- `student_responses`: JSONB object mapping question IDs to answers
- `score`: INTEGER (number correct)
- `total_questions`: INTEGER

**Note**: v3.0 questions with new diagram/comparison fields seamlessly integrate with existing session structure via `question_ids` array.

---

### 6. ExamConfiguration (Existing, Extended)

Represents parameters for generating a practice exam.

**Table**: `exam_configs` (NEW v3.0)

**Fields**:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | UUID | ✓ | gen_random_uuid() | Primary key |
| `created_at` | TIMESTAMP | ✓ | now() | Creation timestamp |
| `name` | TEXT | ✓ | - | Configuration name (e.g., "Scientific Track Full Exam") |
| `total_questions` | INTEGER | ✓ | 120 | Total number of questions |
| `section_split` | JSONB | ✓ | - | Quantitative/verbal distribution (e.g., {"quantitative": 60, "verbal": 60}) |
| `topic_distribution` | JSONB | ✓ | - | Topic weights (FR-001, FR-002) |
| `difficulty_distribution` | JSONB | ✓ | - | Difficulty weights (FR-006) |
| `track` | TEXT | ✓ | - | 'scientific' or 'literary' |
| `batch_size` | INTEGER | ✓ | 20 | Questions per batch |
| `diagram_percentage` | FLOAT | ✓ | 0.15 | Percentage of questions with diagrams |

**Example**:
```json
{
  "id": "uuid-here",
  "name": "Scientific Track Full Exam",
  "total_questions": 120,
  "section_split": {
    "quantitative": 60,
    "verbal": 60
  },
  "topic_distribution": {
    "quantitative": {
      "arithmetic": 0.40,
      "geometry": 0.24,
      "algebra": 0.23,
      "statistics": 0.13
    },
    "verbal": {
      "reading": 0.40,
      "analogy": 0.25,
      "completion": 0.15,
      "error": 0.12,
      "odd-word": 0.08
    }
  },
  "difficulty_distribution": {
    "easy": 0.30,
    "medium": 0.50,
    "hard": 0.20
  },
  "track": "scientific",
  "batch_size": 20,
  "diagram_percentage": 0.15
}
```

---

### 7. QuestionError (NEW v3.0)

Tracks error reports for questions from students and teachers.

**Table**: `question_errors` (NEW v3.0)

**Fields**:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | UUID | ✓ | gen_random_uuid() | Primary key |
| `question_id` | UUID | ✓ | - | Foreign key to questions table |
| `reported_by` | UUID | ✓ | - | User ID of reporter |
| `reported_at` | TIMESTAMP | ✓ | now() | Report timestamp |
| `error_type` | TEXT | ✓ | - | 'mathematical', 'grammatical', 'diagram', 'other' |
| `description` | TEXT | ✓ | - | Reporter's description of the error |
| `status` | TEXT | ✓ | 'pending' | 'pending', 'reviewing', 'confirmed', 'rejected', 'fixed' |
| `reviewed_by` | UUID | - | NULL | Admin/expert who reviewed |
| `reviewed_at` | TIMESTAMP | - | NULL | Review timestamp |
| `resolution_notes` | TEXT | - | NULL | Admin's notes on resolution |

**Indexes**:
```sql
CREATE INDEX idx_question_errors_question_id ON question_errors(question_id);
CREATE INDEX idx_question_errors_status ON question_errors(status);
```

**State Transitions**:
1. **Pending**: Newly reported, not yet reviewed
2. **Reviewing**: Admin/expert is investigating
3. **Confirmed**: Error verified, correction needed
4. **Fixed**: Question corrected, error resolved
5. **Rejected**: Not an actual error, no action needed

**Validation Rules**:
- `error_type` must be 'mathematical', 'grammatical', 'diagram', or 'other'
- `status` must be one of defined states
- If `status = 'reviewing' | 'confirmed' | 'rejected' | 'fixed'`, then `reviewed_by IS NOT NULL`

---

### 8. ReviewQueue (NEW v3.0)

Tracks questions flagged for human expert review (grammar, quality).

**Table**: `review_queue` (NEW v3.0)

**Fields**:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | UUID | ✓ | gen_random_uuid() | Primary key |
| `question_id` | UUID | ✓ | - | Foreign key to questions table |
| `added_at` | TIMESTAMP | ✓ | now() | When added to queue |
| `flag_type` | TEXT | ✓ | - | 'grammar', 'quality', 'cultural' |
| `flag_reason` | TEXT | ✓ | - | Automated validation output |
| `priority` | INTEGER | ✓ | 0 | Higher = more urgent (0-10) |
| `status` | TEXT | ✓ | 'pending' | 'pending', 'in_review', 'approved', 'rejected' |
| `reviewed_by` | UUID | - | NULL | Expert who reviewed |
| `reviewed_at` | TIMESTAMP | - | NULL | Review timestamp |
| `review_notes` | TEXT | - | NULL | Expert's notes |

**Indexes**:
```sql
CREATE INDEX idx_review_queue_status ON review_queue(status);
CREATE INDEX idx_review_queue_priority ON review_queue(priority DESC, added_at ASC);
```

**Validation Rules**:
- `flag_type` must be 'grammar', 'quality', or 'cultural'
- `status` must be 'pending', 'in_review', 'approved', or 'rejected'
- `priority` range: 0-10
- If `status != 'pending'`, then `reviewed_by IS NOT NULL`

---

## Entity Relationships

```
ExamConfiguration
  ├─ 1:N ─> Question (generates)

Question
  ├─ 1:N ─> PracticeSession (included in)
  ├─ 1:N ─> QuestionError (can have errors reported)
  ├─ 1:1 ─> ReviewQueue (may be flagged for review)
  └─ embeds ─> DiagramConfig (when question_type = 'diagram')

PracticeSession
  ├─ N:1 ─> User (belongs to)
  └─ N:M ─> Question (contains)

QuestionError
  ├─ N:1 ─> Question (references)
  ├─ N:1 ─> User (reported by)
  └─ N:1 ─> User (reviewed by, optional)

ReviewQueue
  ├─ 1:1 ─> Question (references)
  └─ N:1 ─> User (reviewed by, optional)
```

---

## Database Migrations

### Migration 1: Extend Questions Table

```sql
-- Add new v3.0 fields to questions table
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS shape_type TEXT,
  ADD COLUMN IF NOT EXISTS pattern_id TEXT,
  ADD COLUMN IF NOT EXISTS diagram_config JSONB,
  ADD COLUMN IF NOT EXISTS comparison_values JSONB,
  ADD COLUMN IF NOT EXISTS relationship_type TEXT,
  ADD COLUMN IF NOT EXISTS generation_metadata JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS quality_flags JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS corrected_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS error_count INTEGER DEFAULT 0;

-- Add indexes for new fields
CREATE INDEX idx_questions_shape_type ON questions(shape_type) WHERE shape_type IS NOT NULL;
CREATE INDEX idx_questions_pattern_id ON questions(pattern_id) WHERE pattern_id IS NOT NULL;
CREATE INDEX idx_questions_diagram_config ON questions USING GIN(diagram_config) WHERE diagram_config IS NOT NULL;
CREATE INDEX idx_questions_version ON questions(version);

-- Update version field default for new questions
ALTER TABLE questions ALTER COLUMN version SET DEFAULT '3.0';
```

### Migration 2: Create QuestionErrors Table

```sql
CREATE TABLE question_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES auth.users(id),
  reported_at TIMESTAMP NOT NULL DEFAULT now(),
  error_type TEXT NOT NULL CHECK (error_type IN ('mathematical', 'grammatical', 'diagram', 'other')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'confirmed', 'rejected', 'fixed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP,
  resolution_notes TEXT
);

CREATE INDEX idx_question_errors_question_id ON question_errors(question_id);
CREATE INDEX idx_question_errors_status ON question_errors(status);

-- RLS policies (assuming existing auth setup)
ALTER TABLE question_errors ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to report errors
CREATE POLICY "Users can report errors" ON question_errors
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reported_by);

-- Allow users to view their own reports
CREATE POLICY "Users can view own reports" ON question_errors
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reported_by);

-- Allow admins to view all reports (requires custom admin role)
CREATE POLICY "Admins can view all reports" ON question_errors
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Allow admins to update reports
CREATE POLICY "Admins can update reports" ON question_errors
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));
```

### Migration 3: Create ReviewQueue Table

```sql
CREATE TABLE review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  added_at TIMESTAMP NOT NULL DEFAULT now(),
  flag_type TEXT NOT NULL CHECK (flag_type IN ('grammar', 'quality', 'cultural')),
  flag_reason TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0 CHECK (priority >= 0 AND priority <= 10),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT
);

CREATE INDEX idx_review_queue_status ON review_queue(status);
CREATE INDEX idx_review_queue_priority ON review_queue(priority DESC, added_at ASC);

-- RLS policies
ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;

-- Only admins/reviewers can access review queue
CREATE POLICY "Reviewers can view queue" ON review_queue
  FOR SELECT
  TO authenticated
  USING (is_reviewer(auth.uid()));

CREATE POLICY "System can insert to queue" ON review_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()) OR is_system());

CREATE POLICY "Reviewers can update queue" ON review_queue
  FOR UPDATE
  TO authenticated
  USING (is_reviewer(auth.uid()));
```

### Migration 4: Create ExamConfigurations Table

```sql
CREATE TABLE exam_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 120,
  section_split JSONB NOT NULL,
  topic_distribution JSONB NOT NULL,
  difficulty_distribution JSONB NOT NULL,
  track TEXT NOT NULL CHECK (track IN ('scientific', 'literary')),
  batch_size INTEGER NOT NULL DEFAULT 20,
  diagram_percentage REAL NOT NULL DEFAULT 0.15
);

-- RLS policies
ALTER TABLE exam_configs ENABLE ROW LEVEL SECURITY;

-- Admins can manage exam configs
CREATE POLICY "Admins can view configs" ON exam_configs
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create configs" ON exam_configs
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update configs" ON exam_configs
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));
```

---

## Data Validation

### Question Validation (Implemented in QuestionValidator.ts)

```typescript
const QuestionSchema = z.object({
  version: z.literal('3.0'),
  section: z.enum(['quantitative', 'verbal']),
  track: z.enum(['scientific', 'literary']),
  question_type: z.enum(['mcq', 'comparison', 'diagram', 'reading', 'analogy', 'completion', 'error', 'odd-word']),
  topic: z.string(),
  subtopic: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  question_text: z.string().min(10),
  correct_answer: z.string(),
  explanation: z.string().min(20),

  // Conditional fields
  choices: z.array(z.string()).min(4).max(4).optional(),
  comparison_values: z.object({
    value1: z.union([z.string(), z.number()]),
    value2: z.union([z.string(), z.number()]),
  }).optional(),

  shape_type: z.string().nullable(),
  pattern_id: z.string().nullable(),
  diagram_config: DiagramConfigSchema.nullable(),
  relationship_type: z.string().nullable(),

  generation_metadata: z.object({
    model: z.string(),
    batch_id: z.string(),
    cache_hit: z.boolean(),
    generated_at: z.string().datetime(),
  }),

  quality_flags: z.array(z.string()).default([]),
});

// Conditional validation
if (question.question_type === 'mcq' && !question.choices) {
  throw new Error('MCQ questions require choices field');
}

if (question.question_type === 'comparison' && !question.comparison_values) {
  throw new Error('Comparison questions require comparison_values field');
}

if (question.question_type === 'diagram' && !question.diagram_config) {
  throw new Error('Diagram questions require diagram_config field');
}

if (question.diagram_config && !question.diagram_config.caption) {
  throw new Error('Diagrams must have accessibility caption (FR-018)');
}
```

---

## Backward Compatibility

### Loading v2.x Questions

When loading older questions (version != '3.0'), provide default values:

```typescript
function normalizeQuestion(rawQuestion: any): Question {
  return {
    ...rawQuestion,
    version: rawQuestion.version || '2.x',
    shape_type: rawQuestion.shape_type || null,
    pattern_id: rawQuestion.pattern_id || null,
    diagram_config: rawQuestion.diagram_config || null,
    comparison_values: rawQuestion.comparison_values || null,
    relationship_type: rawQuestion.relationship_type || null,
    generation_metadata: rawQuestion.generation_metadata || {},
    quality_flags: rawQuestion.quality_flags || [],
    corrected_at: rawQuestion.corrected_at || null,
    error_count: rawQuestion.error_count || 0,
  };
}
```

### Migrating v2.x Data (Optional)

If desired, can batch-update existing questions to add default v3.0 fields:

```sql
UPDATE questions
SET
  generation_metadata = '{}',
  quality_flags = '[]',
  error_count = 0
WHERE version != '3.0';
```

---

## Summary

**New Tables**: 3 (`question_errors`, `review_queue`, `exam_configs`)
**Extended Tables**: 1 (`questions` - added 9 new fields)
**New Indexes**: 7
**Backward Compatible**: ✅ Yes (via default values and conditional fields)
**Validation**: TypeScript + Zod + PostgreSQL CHECK constraints
**RLS Policies**: All new tables have row-level security enabled

**Next**: Phase 1 continues with contracts/ (API schemas) and quickstart.md
