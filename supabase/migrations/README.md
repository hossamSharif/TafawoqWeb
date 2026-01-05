# Database Migrations for GAT Exam Platform v3.0

These migrations extend the existing database schema to support advanced diagram rendering, AI question generation quality improvements, and batch optimization features.

## Migration Files

1. **20260105000001_extend_questions_table_v3.sql** - Extends the `questions` table with new v3.0 fields for diagrams, comparisons, and quality tracking
2. **20260105000002_create_question_errors_table.sql** - Creates `question_errors` table for user error reporting with RLS policies
3. **20260105000003_create_review_queue_table.sql** - Creates `review_queue` table for automated quality flagging with RLS policies
4. **20260105000004_create_exam_configs_table.sql** - Creates `exam_configs` table for batch generation configuration

## How to Run Migrations

### Option 1: Using Supabase CLI (Recommended)

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref fvstedbsjiqvryqpnmzl

# Apply all migrations
supabase db push
```

### Option 2: Using Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/fvstedbsjiqvryqpnmzl/editor
2. Open the SQL Editor
3. Copy and paste each migration file in order (001 → 002 → 003 → 004)
4. Execute each migration

### Option 3: Using psql

```bash
# Run migrations in order
psql "postgresql://postgres.[PROJECT-REF]@aws-0-us-west-1.pooler.supabase.com:6543/postgres" \
  -f supabase/migrations/20260105000001_extend_questions_table_v3.sql

psql "postgresql://postgres.[PROJECT-REF]@aws-0-us-west-1.pooler.supabase.com:6543/postgres" \
  -f supabase/migrations/20260105000002_create_question_errors_table.sql

# ... continue for all migrations
```

## Important Notes

### Admin/Reviewer Role Functions

The migrations create helper functions `is_admin()`, `is_reviewer()`, and `is_system()` for Row Level Security (RLS) policies. These functions contain placeholder logic that assumes:

- Admin users have `raw_user_meta_data->>'role' = 'admin'`
- Reviewer users have `raw_user_meta_data->>'role' IN ('reviewer', 'admin')`

**⚠️ YOU MUST UPDATE THESE FUNCTIONS** to match your actual user role implementation:

1. Edit migrations 002 and 003
2. Modify the `is_admin()`, `is_reviewer()`, and `is_system()` functions
3. Update the logic to check your actual user roles table or metadata structure

### Migration Dependencies

- These migrations assume an existing `questions` table exists from v2.x
- The `questions` table must have an `id` UUID primary key
- The `auth.users` table must exist (standard Supabase auth)

### Rollback

If you need to rollback these migrations:

```sql
-- Drop new tables (in reverse order)
DROP TABLE IF EXISTS exam_configs CASCADE;
DROP TABLE IF EXISTS review_queue CASCADE;
DROP TABLE IF EXISTS question_errors CASCADE;

-- Drop helper functions
DROP FUNCTION IF EXISTS is_admin(UUID);
DROP FUNCTION IF EXISTS is_reviewer(UUID);
DROP FUNCTION IF EXISTS is_system();

-- Remove new columns from questions table
ALTER TABLE questions
  DROP COLUMN IF EXISTS shape_type,
  DROP COLUMN IF EXISTS pattern_id,
  DROP COLUMN IF EXISTS diagram_config,
  DROP COLUMN IF EXISTS comparison_values,
  DROP COLUMN IF EXISTS relationship_type,
  DROP COLUMN IF EXISTS generation_metadata,
  DROP COLUMN IF EXISTS quality_flags,
  DROP COLUMN IF EXISTS corrected_at,
  DROP COLUMN IF EXISTS error_count;

-- Drop indexes
DROP INDEX IF EXISTS idx_questions_shape_type;
DROP INDEX IF EXISTS idx_questions_pattern_id;
DROP INDEX IF EXISTS idx_questions_diagram_config;
DROP INDEX IF EXISTS idx_questions_version;
DROP INDEX IF EXISTS idx_question_errors_question_id;
DROP INDEX IF EXISTS idx_question_errors_status;
DROP INDEX IF EXISTS idx_review_queue_status;
DROP INDEX IF EXISTS idx_review_queue_priority;
```

## Verification

After running migrations, verify they were successful:

```sql
-- Check new columns in questions table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'questions'
AND column_name IN ('shape_type', 'pattern_id', 'diagram_config', 'comparison_values', 'relationship_type', 'generation_metadata', 'quality_flags', 'corrected_at', 'error_count');

-- Check new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('question_errors', 'review_queue', 'exam_configs');

-- Check indexes exist
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'questions'
AND indexname LIKE 'idx_questions_%';
```

## Next Steps

After running migrations:

1. Generate TypeScript types: `npm run generate:types` (or see src/lib/database.types.ts)
2. Continue with Phase 2 implementation tasks (Skills, Services, Components)
3. Test the new schema with sample data
