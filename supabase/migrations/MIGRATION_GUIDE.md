# 🔧 Database Migration Guide - Complete Instructions

## 🚨 IMPORTANT: Read This First

If you got the error **"relation 'questions' does not exist"**, it means your database is empty. You need to run the **BASE SCHEMA** migration first.

---

## ✅ Step-by-Step Migration Instructions

### Step 1: Determine Which Migration to Run

**Run this query in Supabase SQL Editor** to check if `questions` table exists:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'questions';
```

**Result:**
- **NO ROWS**: Database is empty → Go to **Option A** (Base Schema)
- **1 ROW**: Table exists → Go to **Option B** (Extensions Only)

---

## Option A: Base Schema Migration (Empty Database)

Use this if the `questions` table doesn't exist yet.

### File to Run:
📁 `supabase/migrations/00000000000000_base_schema_v3.sql`

### Instructions:

1. **Open the file** in your code editor
2. **Select ALL content** (Ctrl+A / Cmd+A)
3. **Copy** (Ctrl+C / Cmd+C)
4. **Open Supabase SQL Editor**: https://supabase.com/dashboard/project/fvstedbsjiqvryqpnmzl/sql/new
5. **Paste** the SQL
6. Click **"Run"**
7. Wait for success message

### What This Creates:
- ✅ `questions` table (with all v2.x and v3.0 fields)
- ✅ `question_errors` table
- ✅ `review_queue` table
- ✅ `exam_configs` table
- ✅ `practice_sessions` table
- ✅ Helper functions (`is_admin`, `is_reviewer`, `is_system`)
- ✅ All indexes and RLS policies

### Verification:
Run this to confirm all tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected result:** 5 tables
- `exam_configs`
- `practice_sessions`
- `question_errors`
- `questions`
- `review_queue`

✅ **Done!** Skip to "After Migration" section below.

---

## Option B: Extension Migration (Existing Database)

Use this if the `questions` table already exists.

### File to Run:
📁 `supabase/migrations/CONSOLIDATED_MIGRATION.sql`

### Instructions:

1. **Open the file** in your code editor
2. **Select ALL content** (Ctrl+A / Cmd+A)
3. **Copy** (Ctrl+C / Cmd+C)
4. **Open Supabase SQL Editor**: https://supabase.com/dashboard/project/fvstedbsjiqvryqpnmzl/sql/new
5. **Paste** the SQL
6. Click **"Run"**
7. Wait for success message

### What This Does:
- ✅ Adds v3.0 fields to existing `questions` table
- ✅ Creates new tables (question_errors, review_queue, exam_configs)
- ✅ Creates helper functions
- ✅ Adds all indexes and RLS policies

---

## 🔍 After Migration - Verify Success

### 1. Check All Tables Exist

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('questions', 'question_errors', 'review_queue', 'exam_configs', 'practice_sessions')
ORDER BY table_name;
```

**Expected:** 5 rows

### 2. Check New Columns in Questions Table

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'questions'
AND column_name IN (
  'shape_type', 'pattern_id', 'diagram_config',
  'comparison_values', 'relationship_type',
  'generation_metadata', 'quality_flags',
  'corrected_at', 'error_count'
)
ORDER BY column_name;
```

**Expected:** 9 rows (all new v3.0 columns)

### 3. Check Helper Functions

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('is_admin', 'is_reviewer', 'is_system');
```

**Expected:** 3 rows

### 4. Check Indexes

```sql
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'questions'
AND indexname LIKE 'idx_questions_%'
ORDER BY indexname;
```

**Expected:** 6+ indexes

---

## 🆘 Troubleshooting

### Error: "permission denied for schema public"
**Solution:** You need to be the database owner or have CREATE privileges
- Go to Database Settings → check your role
- Use service role key (not anon key)

### Error: "relation already exists"
**Solution:** Migration ran partially
- Safe to ignore if using `IF NOT EXISTS` clauses
- All our migrations use `IF NOT EXISTS`

### Error: "violates foreign key constraint"
**Solution:** Tables need to be created in order
- Use the BASE SCHEMA migration (Option A)
- Don't run individual migrations out of order

### Error: "function is_admin does not exist"
**Solution:** Helper functions not created
- Re-run the migration that creates functions
- Check if migration completed successfully

---

## ⚙️ Admin Role Configuration

The migrations create helper functions that check user roles. **You MUST configure these** to match your auth setup.

### Current Logic:
```sql
-- Checks user metadata for 'admin' role
raw_user_meta_data->>'role' = 'admin'
OR
raw_app_meta_data->>'role' = 'admin'
```

### To Update:

1. Check your user metadata structure:
```sql
SELECT id, email, raw_user_meta_data, raw_app_meta_data
FROM auth.users
LIMIT 5;
```

2. If your roles are stored differently, update the functions:
```sql
-- Example: Using a custom roles table
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_id
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📊 Expected Database State After Migration

```
Tables:
├── questions (extended with v3.0 fields)
├── question_errors (new)
├── review_queue (new)
├── exam_configs (new)
└── practice_sessions (if it didn't exist)

Functions:
├── is_admin(UUID)
├── is_reviewer(UUID)
└── is_system()

Indexes:
├── 6+ on questions table
├── 2 on question_errors
├── 2 on review_queue
└── 2 on practice_sessions
```

---

## ✅ Success Checklist

Before continuing with implementation:

- [ ] All tables created successfully
- [ ] All 9 new columns in `questions` table
- [ ] Helper functions exist (`is_admin`, `is_reviewer`, `is_system`)
- [ ] All indexes created
- [ ] RLS policies enabled
- [ ] Verification queries return expected results
- [ ] No error messages in SQL Editor

---

## 📞 Need Help?

If you're still getting errors:
1. Copy the EXACT error message
2. Copy the SQL query that caused the error
3. Let me know and I'll help debug!

---

## 🎯 Next Steps After Migration

Once migrations are complete:
1. ✅ Mark migration task as complete
2. ✅ Generate TypeScript types
3. ✅ Continue with Phase 2 implementation
4. ✅ Test the new schema with sample data
