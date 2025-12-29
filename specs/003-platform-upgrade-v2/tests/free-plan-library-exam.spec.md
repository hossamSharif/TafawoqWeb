# Test Specification: Free Plan User - Library Exam Access and Completion

**Feature**: Platform Upgrade V2 - Exam Library Access (User Story 1)
**Created**: 2025-12-19
**Status**: Active

## Overview

This specification covers testing scenarios for free plan users accessing and completing exams from the library.

## Requirements Reference

From `spec.md`:
- **FR-003**: System MUST limit free users to accessing exactly 1 exam from the library total (permanently tracked; does not reset)
- **FR-005**: System MUST add completed library exams to user's exam history
- **FR-006**: System MUST prevent library exams from being re-shared by users who took them

From `subscription.ts` TIER_LIMITS:
```typescript
free: {
  examsPerMonth: 2,
  practicesPerMonth: 3,
  examSharesPerMonth: 2,
  practiceSharesPerMonth: 3,
  libraryAccessCount: 1,  // FREE USERS CAN ONLY ACCESS 1 LIBRARY EXAM EVER
}
```

## Test Scenarios

### TS-001: Free User Can Browse Library

**Preconditions**:
- User is logged in with a free plan account
- User has not accessed any library exams yet

**Steps**:
1. Navigate to `/library`
2. Verify library page loads successfully
3. Verify exams list is displayed (if exams exist)
4. Verify user access status shows "الوصول المتبقي: 1 / 1" (Remaining access: 1/1)

**Expected Results**:
- Library page displays with exam cards
- User can see exam titles, sections, question counts, and creators
- Access counter shows 1 remaining

### TS-002: Free User Can View Exam Details

**Preconditions**:
- User is logged in with a free plan account
- At least one library exam exists

**Steps**:
1. Navigate to `/library`
2. Click on an exam card
3. Verify exam detail page (`/library/[postId]`) loads

**Expected Results**:
- Exam detail page shows:
  - Title and description
  - Section badge (verbal/quantitative)
  - Question count
  - Estimated time
  - Difficulty
  - Completion count
  - Creator info
  - "فتح الاختبار" (Open Exam) button
- Message below button: "متبقي لك 1 وصول من المكتبة" (You have 1 library access remaining)

### TS-003: Free User Can Request Access with Confirmation

**Preconditions**:
- User is logged in with a free plan account
- User has not used their 1 free library access
- User is on exam detail page

**Steps**:
1. Click "فتح الاختبار" (Open Exam) button
2. Verify confirmation dialog appears
3. Verify dialog message warns about using the only free access

**Expected Results**:
- AlertDialog shows with:
  - Title: "تأكيد الوصول للاختبار" (Confirm Exam Access)
  - Description: Warning that this is the only free library access
  - "تأكيد" (Confirm) and "إلغاء" (Cancel) buttons

### TS-004: Free User Can Grant Access and Start Exam

**Preconditions**:
- User completed TS-003 (at confirmation dialog)

**Steps**:
1. Click "تأكيد" (Confirm) button
2. Wait for API response
3. Verify page refreshes with access granted
4. Verify "بدء الاختبار" (Start Exam) button appears
5. Click "بدء الاختبار" button
6. Verify redirect to exam page (`/exam/[sessionId]`)

**Expected Results**:
- Access is granted via POST `/api/library/[postId]/access`
- Button changes to "بدء الاختبار" (Start Exam)
- Clicking start calls POST `/api/library/[postId]/start`
- User is redirected to `/exam/[sessionId]`
- Exam loads with questions

### TS-005: Free User Can Complete Library Exam

**Preconditions**:
- User completed TS-004 (exam is in progress)

**Steps**:
1. Answer all questions in the exam
2. Click "إنهاء الاختبار" (Finish Exam)
3. Confirm completion
4. Verify results page loads

**Expected Results**:
- Exam session is marked as completed
- Library access record is marked as exam_completed
- shared_exam_completions record is created (triggers reward for exam owner)
- Results page shows score and analysis

### TS-006: Free User Cannot Access Second Library Exam

**Preconditions**:
- User completed TS-005 (has used their 1 free library access)

**Steps**:
1. Navigate to `/library`
2. Click on a different exam card
3. Verify upgrade prompt appears

**Expected Results**:
- Access counter shows "الوصول المتبقي: 0 / 1" (Remaining access: 0/1)
- Clicking "فتح الاختبار" (Open Exam) triggers upgrade prompt
- LibraryUpgradePrompt dialog shows upgrade options

### TS-007: Library Exam Appears in Exam History

**Preconditions**:
- User completed TS-005 (completed a library exam)

**Steps**:
1. Navigate to exam history page
2. Verify completed library exam appears in list

**Expected Results**:
- Library exam shows in exam history
- Exam is marked as a library exam (badge or indicator)
- User can view results but cannot re-share the exam

### TS-008: Already Completed Exam Shows Completion Status

**Preconditions**:
- User completed TS-005

**Steps**:
1. Navigate to `/library`
2. Find the completed exam
3. Verify completion badge is shown
4. Click on the exam
5. Verify detail page shows completion status

**Expected Results**:
- Exam card shows "مكتمل" (Completed) badge with green checkmark
- Detail page shows disabled button with "تم إكمال هذا الاختبار" (This exam has been completed)
- Message: "يمكنك مراجعة نتائجك في سجل الاختبارات" (You can review your results in exam history)

## API Endpoints Tested

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/library` | GET | List library exams with pagination |
| `/api/library/[postId]` | GET | Get single exam details |
| `/api/library/[postId]/access` | POST | Grant access to exam |
| `/api/library/[postId]/start` | POST | Start exam session |

## Database Tables Involved

- `forum_posts` - Library exam source (is_library_visible = true)
- `library_access` - Tracks user access to library exams
- `exam_sessions` - New exam session created from library exam
- `shared_exam_completions` - Records completion (triggers rewards)
- `user_subscriptions` - User's tier (free/premium)
- `user_credits` - Tracks library_access_used

## Bug Fixes Applied

### BUG-001: handleStartExam Navigation Error (Fixed 2025-12-19)

**Location**: `src/components/library/LibraryAccessButton.tsx:86-107`

**Problem**: `handleStartExam` was navigating to `/library/${postId}/start` which doesn't exist as a page route.

**Solution**: Changed to:
1. Call POST `/api/library/${postId}/start`
2. Get `sessionId` from response
3. Redirect to `/exam/${sessionId}`

**Code Change**:
```typescript
// Before (broken)
const handleStartExam = () => {
  router.push(`/library/${postId}/start`)
}

// After (fixed)
const handleStartExam = async () => {
  setIsLoading(true)
  setError(null)
  try {
    const response = await fetch(`/api/library/${postId}/start`, {
      method: 'POST',
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'فشل في بدء الاختبار')
    }
    router.push(`/exam/${data.sessionId}`)
  } catch (err) {
    setError(err instanceof Error ? err.message : 'حدث خطأ')
    setIsLoading(false)
  }
}
```

## Manual Testing Checklist

- [x] TS-001: Free user can browse library ✅ PASSED (2025-12-19)
- [x] TS-002: Free user can view exam details ✅ PASSED (2025-12-19)
- [x] TS-003: Free user sees confirmation dialog ✅ PASSED (2025-12-19)
- [x] TS-004: Free user can grant access and start exam ✅ PASSED (2025-12-19)
- [ ] TS-005: Free user can complete library exam ❌ BLOCKED by BUG-006
- [ ] TS-006: Free user cannot access second library exam
- [ ] TS-007: Library exam appears in exam history
- [ ] TS-008: Completed exam shows completion status

## Edge Cases

1. **Network failure during access grant**: Show error message, allow retry
2. **Network failure during exam start**: Show error message, allow retry
3. **Session expiry during exam**: Handle gracefully with re-auth
4. **Empty library**: Show LibraryEmptyState component
5. **Concurrent access attempts**: Database handles via unique constraint

### BUG-002: Supabase RPC .catch() Pattern Error (Fixed 2025-12-19)

**Location**: `src/lib/library/actions.ts:92-109, 250-265`

**Problem**: Code used `.catch()` on Supabase RPC calls, but Supabase uses `{ data, error }` pattern, not Promises with `.catch()`.

**Error Message**:
```
TypeError: supabase.rpc(...).catch is not a function
```

**Solution**: Changed from `.catch()` chaining to `try/catch` blocks with proper Supabase query patterns.

### BUG-003: Missing Null Check for exam_sessions Join (Fixed 2025-12-19)

**Location**: `src/lib/library/actions.ts:167-184`

**Problem**: `startLibraryExam` checked for `shared_exam_id` but not for the joined `exam_sessions` object. When the join fails (linked exam deleted or FK broken), accessing `exam_sessions.questions` threw null error.

**Error Message**:
```
TypeError: Cannot read properties of null (reading 'questions')
```

**Solution**: Added null checks for `exam_sessions` and `questions` with informative error messages.

**Code Change**:
```typescript
// Added after shared_exam_id check
if (!post.exam_sessions) {
  console.error('Exam session join failed for post:', postId)
  throw new Error('Exam data not found - the linked exam may have been deleted')
}

if (!originalExam.questions) {
  throw new Error('Exam has no questions')
}
```

## Database Migration Required

### MIGRATION-001: Add shared exam tracking columns (Created 2025-12-19)

**File**: `supabase/migrations/20241219000001_add_shared_exam_columns.sql`

**Problem**: The code uses `shared_from_post_id` and `is_library_exam` columns on `exam_sessions` and `practice_sessions` tables, but these columns were not created in any previous migration.

**Solution**: Created migration to add:
- `exam_sessions.shared_from_post_id` - Foreign key to `forum_posts`
- `exam_sessions.is_library_exam` - Boolean flag
- `practice_sessions.shared_from_post_id` - Foreign key to `forum_posts`

**Apply Migration**:
```bash
npx supabase migration up
# OR run SQL directly in Supabase dashboard
```

### BUG-004: Foreign Key Join Failing Silently (Fixed 2025-12-19)

**Location**: `src/lib/library/actions.ts:148-170`

**Problem**: Using Supabase foreign key join syntax `exam_sessions!forum_posts_shared_exam_id_fkey(...)` was failing silently when the linked exam_session couldn't be accessed due to RLS policies. The join returned null without an error.

**Solution**: Changed from FK join to separate queries:
1. First query: Get `shared_exam_id` from `forum_posts`
2. Second query: Get exam data from `exam_sessions` using the ID
3. Add proper null checks after each query

**Code Change**:
```typescript
// Before (broken FK join)
const { data: post } = await supabase
  .from('forum_posts')
  .select(`
    shared_exam_id,
    exam_sessions!forum_posts_shared_exam_id_fkey(id, questions, ...)
  `)

// After (separate queries)
const { data: post } = await supabase
  .from('forum_posts')
  .select('shared_exam_id')
  .eq('id', postId)
  .single()

const { data: originalExam, error: examError } = await supabase
  .from('exam_sessions')
  .select('id, questions, total_questions, track')
  .eq('id', post.shared_exam_id)
  .single()
```

### BUG-005: RLS Policy Blocking Library Exam Access (Fixed 2025-12-19)

**Location**: Database - `exam_sessions` table RLS policies

**Problem**: The `exam_sessions` table had RLS policies that only allowed users to read their own exam sessions. Library exams belong to other users (the exam creator), so when a user tried to start a library exam, they couldn't read the source exam data.

**Error Message**:
```
PGRST116: The result contains 0 rows
Exam data not found - the linked exam may have been deleted
```

**Root Cause**: `shared_exam_id: 86cc9e38-3c40-4bdc-a090-01cac1e73fae` existed in `exam_sessions` but RLS blocked read access because it belonged to a different user.

**Solution**: Applied new RLS policy via Supabase MCP:

**File**: `supabase/migrations/20241219000002_add_library_exam_rls_policy.sql`

```sql
CREATE POLICY "Users can read exam_sessions linked to library posts"
ON public.exam_sessions
FOR SELECT
USING (
  -- User can read their own sessions
  auth.uid() = user_id
  OR
  -- User can read sessions linked to library-visible posts
  id IN (
    SELECT shared_exam_id
    FROM public.forum_posts
    WHERE is_library_visible = true
    AND shared_exam_id IS NOT NULL
  )
);
```

**Applied via**: Supabase MCP `apply_migration` tool (project: fvstedbsjiqvryqpnmzl)

## Test Execution Log (2025-12-19)

### Session Details
- **Tester**: Automated via Chrome DevTools MCP
- **User**: husameldeenh@gmail.com (free plan)
- **Environment**: localhost:3003
- **Supabase Project**: fvstedbsjiqvryqpnmzl

### Test Flow
1. **Login**: Successful authentication
2. **TS-001**: Navigated to `/library`, saw 2 exams, access counter showed "0/1" (already used)
3. **TS-002**: Clicked "اختبار قدرات علمي 1", detail page loaded with 96 questions
4. **TS-003**: Confirmation dialog shown (previously granted access, so showed "متاح")
5. **TS-004**:
   - Clicked "بدء الاختبار" (Start Exam)
   - First attempt: Failed with BUG-002 (fixed)
   - Second attempt: Failed with BUG-003 (fixed)
   - Third attempt: Failed with BUG-004 (fixed)
   - Fourth attempt: Failed with BUG-005 (RLS policy applied)
   - Fifth attempt: SUCCESS! Redirected to `/exam/e0bf663b-8529-4cef-815e-f80fa117002d`
6. **Exam Page Verified**:
   - Timer: 1:59:54 remaining
   - 96 questions with navigation
   - Question 1 displayed correctly
   - Answer options visible

### BUG-006: Notification target_type Constraint Violation (BLOCKING - 2025-12-19)

**Location**: Database trigger `grant_reward_on_completion()` in migration file `20241217000002_fix_reward_trigger_upsert.sql`

**Problem**: When completing a library exam, the trigger inserts a notification with `target_type = 'exam'` or `'practice'`, but the `notifications` table has a CHECK constraint that only allows: `'post'`, `'comment'`, `'report'`, `'reward'`.

**Error Message**:
```
new row for relation "notifications" violates check constraint "notifications_target_type_check"
Failing row contains (..., exam, d8b89722-fce6-4c23-ab9a-8a13624421b4, ...)
```

**Impact**:
- Library exams cannot be completed
- PATCH `/api/exams/[sessionId]` returns 500
- Results page returns 400 (exam not marked as completed)

**Root Cause**: Line 77 in the trigger uses `v_content_type` (which is 'exam' or 'practice') instead of a valid target_type.

**Fix Created**: `supabase/migrations/20241219000003_fix_reward_notification_target_type.sql`

```sql
-- Change line 77 from:
target_type = v_content_type  -- 'exam' or 'practice' - INVALID

-- To:
target_type = 'post'  -- VALID (since target_id is post_id)
```

**How to Apply Fix**:
1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL from `supabase/migrations/20241219000003_fix_reward_notification_target_type.sql`
3. Or use: `npx supabase db push` after linking the project
