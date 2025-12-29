# Forum Posting Bug Analysis

## Issue Summary

**Problem**: Users (including free tier users) are unable to post in the forum and receive a "خطأ في الخادم" (Server Error) message.

**Affected User**: husameldeenh@gmail.com (free account)

**Status**: 🔴 **CRITICAL BUG** - Missing database RLS policies

---

## Root Cause Analysis

### 1. Expected Behavior (Per Spec)

According to `specs/002-forum-exam-sharing/data-model.md`, the forum_posts table should have the following RLS policies:

- **SELECT**: Anyone can view active posts
- **INSERT**: Authenticated users (not banned)
- **UPDATE**: Author only (or admin)
- **DELETE**: Author only (or admin)

### 2. Actual Implementation

Analysis of migration files revealed:

**File**: `supabase/migrations/20241215000008_rls_policies.sql`

Only ONE policy exists for forum_posts:
```sql
CREATE POLICY "library_visible_posts_select" ON public.forum_posts
FOR SELECT USING (
  is_library_visible = true
  OR author_id = auth.uid()
  OR public.is_user_admin(auth.uid())
);
```

**Missing Policies**:
- ❌ INSERT policy
- ❌ UPDATE policy
- ❌ DELETE policy

### 3. Impact

When a user tries to create a forum post:

1. Frontend sends POST request to `/api/forum/posts`
2. API route validates all permissions (user authenticated, not banned, has credits, etc.)
3. API calls `createPost()` function which attempts to INSERT into `forum_posts` table
4. PostgreSQL RLS blocks the INSERT operation (no INSERT policy exists)
5. Supabase returns error
6. API returns generic "خطأ في الخادم" (500 Server Error)

**Error flow**:
```
src/app/api/forum/posts/route.ts:331
  ↓
src/lib/forum/queries.ts:323 (createPost function)
  ↓
supabase.from('forum_posts').insert(data)
  ↓
❌ RLS BLOCKS INSERT (no policy)
  ↓
Error: "Failed to create post"
  ↓
API returns: { error: 'خطأ في الخادم' }, status: 500
```

---

## Subscription Tier Analysis

### Free Tier Permissions

From `src/types/subscription.ts`:

```typescript
TIER_LIMITS = {
  free: {
    examsPerMonth: 2,
    practicesPerMonth: 3,
    examSharesPerMonth: 2,      // ✅ Free users CAN share
    practiceSharesPerMonth: 3,  // ✅ Free users CAN share
    libraryAccessCount: 1,
  }
}
```

**Conclusion**: Free users SHOULD be able to post in the forum. This is not a subscription restriction issue.

---

## Solution

### Created Files

1. **Migration File**: `supabase/migrations/20241222000004_add_forum_posts_rls_policies.sql`
   - Adds INSERT policy for authenticated, non-banned users
   - Adds UPDATE policy for authors or admins
   - Adds DELETE policy for authors or admins
   - Also adds missing policies for `comments` and `reactions` tables

2. **Application Script**: `scripts/apply-forum-rls-fix.ts`
   - Script to apply the migration to the database

### How to Apply the Fix

**Option 1: Using Supabase CLI (Recommended)**
```bash
npx supabase db push
```

**Option 2: Using the Application Script**
```bash
npx tsx scripts/apply-forum-rls-fix.ts
```

**Option 3: Manual Application (Supabase Dashboard)**
1. Go to Supabase Dashboard → SQL Editor
2. Open the migration file: `supabase/migrations/20241222000004_add_forum_posts_rls_policies.sql`
3. Copy and paste the entire content
4. Execute the SQL

---

## Verification Steps

After applying the fix:

1. **Test Forum Post Creation**:
   ```bash
   # Log in as husameldeenh@gmail.com
   # Navigate to forum
   # Try creating a new post
   # Should succeed without errors
   ```

2. **Verify RLS Policies** (via Supabase Dashboard):
   - Go to Database → Tables → forum_posts → Policies
   - Should see 4 policies:
     - `library_visible_posts_select` (SELECT)
     - `forum_posts_insert_authenticated` (INSERT)
     - `forum_posts_update_author_or_admin` (UPDATE)
     - `forum_posts_delete_author_or_admin` (DELETE)

3. **Check Error Logs**:
   - No more "Failed to create post" errors in server logs
   - Successful post creation returns 201 status

---

## Related Files Analyzed

### API Layer
- `src/app/api/forum/posts/route.ts` ✅ - Logic is correct, handles all validations
- `src/lib/forum/queries.ts` ✅ - createPost function is correct

### Database Layer
- `supabase/migrations/20241215000008_rls_policies.sql` ❌ - Missing INSERT/UPDATE/DELETE policies
- `specs/002-forum-exam-sharing/data-model.md` ✅ - Spec correctly defines required policies

### Type Definitions
- `src/types/subscription.ts` ✅ - Free tier has sharing permissions

---

## Prevention

To prevent similar issues in the future:

1. **RLS Policy Checklist**: When creating new tables, always implement all 4 CRUD policies:
   - SELECT
   - INSERT
   - UPDATE
   - DELETE

2. **Migration Review**: Before deploying migrations, verify they match the spec documentation

3. **Integration Testing**: Add tests that verify RLS policies are working for all user operations

4. **Documentation**: Keep `data-model.md` in sync with actual database migrations

---

## Summary

- **Issue**: Missing RLS INSERT policy on forum_posts table
- **Severity**: Critical - blocks all user forum posting
- **Affected Users**: ALL users (free and premium)
- **Fix**: Add missing RLS policies via migration
- **Files Changed**:
  - `supabase/migrations/20241222000004_add_forum_posts_rls_policies.sql` (new)
  - `scripts/apply-forum-rls-fix.ts` (new)

**Status**: ✅ **FIX READY** - Awaiting migration deployment
