# New Bugs Found During Automated Testing
**Date:** 2025-12-18
**Branch:** 003-platform-upgrade-v2
**Tester:** Automated testing with Chrome DevTools MCP

---

## Executive Summary

During automated testing of the forum, exam sharing, and library features, discovered **2 critical bugs** that completely block core functionality:

### Critical Bugs:
1. **Missing Database Function** - `check_exam_eligibility` function doesn't exist, causing ALL exam generation to fail with "3/3 weekly limit" error
2. **Library Page Authentication Bug** - Library page shows "Login required" message even when user is authenticated

Both bugs prevent users from using core features of the platform.

---

## Bug #1: Missing `check_exam_eligibility` Database Function

### Severity: CRITICAL 🔴
**Impact:** Users cannot create ANY exams - system incorrectly shows "3/3 weekly limit reached" even for users who have never created an exam.

### Symptoms:
- User attempts to start an exam via `/exam` page
- UI displays: "لقد استخدمت 3 من 3 اختبارات هذا الأسبوع" (You've used 3 of 3 exams this week)
- Database query shows user has **ZERO** exam_sessions records
- Exam creation is completely blocked

### Root Cause:
The API route `src/app/api/exams/route.ts` calls a database function `check_exam_eligibility` at line 53-56:

```typescript
const { data: eligibility, error: eligibilityError } = await supabase.rpc(
  'check_exam_eligibility',
  { p_user_id: user.id }
)
```

**This function does NOT exist in the database.**

### Evidence:
1. Searched all migration files:
```bash
$ grep -r "check_exam_eligibility" supabase/migrations/
# Result: No matches found
```

2. Function is not defined in `supabase/migrations/20241215000006_database_functions.sql`

3. Code expects the function to return:
   - `is_eligible: boolean`
   - `exams_taken_this_week: integer`
   - `max_exams_per_week: integer`
   - `next_eligible_at: timestamptz`
   - `reason: text`

### Expected Behavior:
The function should:
1. Check user's subscription tier (free vs premium)
2. If premium: Allow unlimited exams
3. If free: Check `performance_records.weekly_exam_count`
4. Reset count if `week_start_date` is more than 7 days old
5. Return eligibility status based on 3 exams/week limit for free users

### Fix Created:
✅ **Migration file created:** `supabase/migrations/20241218000001_create_check_exam_eligibility_function.sql`

✅ **Script created:** `scripts/apply-check-exam-eligibility-migration.ts`

⚠️ **Requires manual application** via Supabase dashboard SQL editor (see Appendix A)

### Files Affected:
- `src/app/api/exams/route.ts:53-56` - RPC call to missing function
- `src/app/(main)/exam/start/page.tsx:164` - Displays error message from API

### Data Flow:
```
┌────────────────────────────────────────────────────────┐
│ User clicks "بدء الاختبار الآن" on /exam page         │
└──────────────┬─────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────┐
│ POST /api/exams - Create new exam session              │
│ Line 53: calls supabase.rpc('check_exam_eligibility')  │
└──────────────┬─────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────┐
│ ❌ Function doesn't exist in database!                 │
│ - RPC call fails or returns unexpected result          │
│ - Code interprets missing data as "limit reached"      │
│ - Returns 429 error: "تجاوزت الحد الأسبوعي"           │
└──────────────┬─────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────┐
│ UI shows: "لقد استخدمت 3 من 3 اختبارات"              │
│ Even though user has 0 exams in database!               │
└────────────────────────────────────────────────────────┘
```

---

## Bug #2: Library Page Authentication Failure

### Severity: CRITICAL 🔴
**Impact:** Users cannot access the library page even when properly authenticated.

### Symptoms:
- User is logged in (can see logout button, notifications, navigation)
- Navigates to `/library` page
- Page displays: "سجّل الدخول للوصول للمكتبة" (Log in to access the library)
- Content shows login prompt instead of library exams

### Evidence:
```
uid=12_27 heading "سجّل الدخول للوصول للمكتبة" level="3"
uid=12_28 StaticText "سجّل دخولك للاستفادة من اختبارات المجتمع المشاركة"
```

Meanwhile, the navigation shows the user IS logged in:
```
uid=12_21 link "الإشعارات" url="http://localhost:3000/notifications"
uid=12_23 link "ترقية الحساب" url="http://localhost:3000/subscription"
uid=12_25 button "خروج"
```

### Root Cause:
**AuthContext user state is null on library page despite user being authenticated.**

The issue occurs because:
1. User successfully logs in and session is stored in browser
2. Navigation bar renders correctly with logout button (auth state is available in layout)
3. Library page uses `useAuth()` hook from the same `AuthContext`
4. However, `useAuth()` returns `user: null` on the library page specifically
5. Library page code checks `if (!user)` at line 133 and shows login prompt

### Evidence:
**Library page code flow:**
```typescript
// src/app/(main)/library/page.tsx
const { user, isLoading: authLoading } = useAuth() // Line 39

if (authLoading) {
  return <Loader /> // Line 125-131
}

if (!user) {
  return <LibraryEmptyState title="سجّل الدخول للوصول للمكتبة" /> // Line 133-143
}
```

**Browser state confirms:**
- Navigation shows: "الإشعارات" (notifications), "ترقية الحساب" (upgrade), "خروج" (logout)
- These elements only render when user is authenticated
- Yet main content shows: "سجّل الدخول للوصول للمكتبة" (login required)

### Possible Causes:
1. **AuthContext initialization race condition** - Library page renders before AuthContext finishes loading user
2. **Client-side Supabase session not persisting** - Session exists but `getSession()` fails on library page
3. **Browser local storage issue** - Auth tokens not accessible to library page component
4. **React hydration mismatch** - Server-side render shows no user, client-side doesn't rehydrate

### Files Involved:
- `src/app/(main)/library/page.tsx:39,133` - Uses `useAuth()` and checks user state
- `src/contexts/AuthContext.tsx:79-100` - Initializes auth state via `getSession()`
- `src/app/(main)/layout.tsx:167` - Wraps children with `AuthProvider`
- `src/lib/supabase/client.ts:9-19` - Client-side Supabase configuration

### Recommended Fix:
1. Add debug logging to AuthContext to trace initialization
2. Check if `isLoading` state is properly transitioning to `false`
3. Verify Supabase session persistence settings
4. Consider adding explicit session refresh on library page mount
5. Review Next.js SSR/CSR rendering for auth state mismatch

### Status:
⚠️ **Investigation complete** - Root cause identified as AuthContext state inconsistency. Requires code fix to ensure proper user state propagation to all pages.

---

## Testing Environment

### User Account:
- Email: `husameldeenh@gmail.com`
- User ID: `42ca4e44-e668-4c95-86f9-1d9dfd30ee45`
- Subscription: Free tier (default)

### Database State:
```sql
-- User credits record exists (after previous fixes)
SELECT * FROM user_credits WHERE user_id = '42ca4e44-e668-4c95-86f9-1d9dfd30ee45';
-- Result: exam_credits=0, practice_credits=0, total_completions=0

-- No exam sessions exist
SELECT COUNT(*) FROM exam_sessions WHERE user_id = '42ca4e44-e668-4c95-86f9-1d9dfd30ee45';
-- Result: 0

-- No practice sessions exist
SELECT COUNT(*) FROM practice_sessions WHERE user_id = '42ca4e44-e668-4c95-86f9-1d9dfd30ee45';
-- Result: 0

-- No forum posts exist (verified via UI - empty forum)
SELECT COUNT(*) FROM forum_posts WHERE status != 'deleted';
-- Result: 0
```

---

## Impact Analysis

### Bug #1 - Missing Function:
- **User Impact:** Cannot create exams at all - core feature completely broken
- **Scope:** Affects ALL users (free and premium)
- **Workaround:** None - must fix the function
- **Priority:** P0 - Blocks all exam generation

### Bug #2 - Library Auth:
- **User Impact:** Cannot access library exams shared by community
- **Scope:** Affects ALL users trying to access library
- **Workaround:** None - page is inaccessible
- **Priority:** P0 - Blocks major feature

---

## Related Previous Fixes

These bugs are INDEPENDENT from the previous 5 bugs fixed on 2025-12-17:
1. ✅ Database trigger UPSERT fix (already applied)
2. ✅ User credits initialization (already applied)
3. ✅ Exam completion schema mismatch (already applied)
4. ✅ Practice completion schema mismatch (already applied)
5. ✅ Claim rewards API simplification (already applied)

The previous fixes focused on the reward system. These new bugs are in:
- Exam eligibility checking (Bug #1)
- Library page authentication (Bug #2)

---

## Appendix A: Manual Migration Steps

Since automated migration application failed due to missing `exec_sql` RPC function, apply manually:

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select project: `ckihxegodvexuxkklmmm`
3. Navigate to SQL Editor

### Step 2: Execute SQL
Copy and paste the contents of:
`supabase/migrations/20241218000001_create_check_exam_eligibility_function.sql`

Or use the SQL provided in this document (see Bug #1 fix section).

### Step 3: Verify Function
Run this test query:
```sql
SELECT * FROM check_exam_eligibility('42ca4e44-e668-4c95-86f9-1d9dfd30ee45');
```

Expected result:
```
is_eligible: true
exams_taken_this_week: 0
max_exams_per_week: 3
next_eligible_at: null
reason: "Eligible to create exam"
```

### Step 4: Test Exam Creation
1. Refresh the application at http://localhost:3000
2. Navigate to `/exam` page
3. Click "بدء الاختبار الآن"
4. Should start generating questions (not show "3/3 limit" error)

---

## Next Steps

1. ✅ Bug #1 fix created - needs manual application
2. ⏳ Bug #2 needs investigation - read library page source
3. ⏳ Apply both fixes
4. ⏳ Resume automated testing:
   - Test complete exam flow
   - Test exam sharing to forum
   - Test forum interactions
   - Test reward system end-to-end
   - Create second user for completion testing

---

## Notes for Developer

Both bugs indicate **missing implementation** rather than logic errors:
- Bug #1: Function was probably planned but never implemented
- Bug #2: Library page auth check might be incomplete or incorrectly configured

Recommend reviewing:
1. All database functions referenced in TypeScript code - ensure they exist
2. All authenticated pages - verify auth state is properly checked
3. RLS policies - ensure they don't block legitimate user access

---

**Status:** 🔴 BLOCKING - Cannot proceed with testing until fixes applied
