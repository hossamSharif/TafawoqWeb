# Forum "Unknown" Username Fix

## Problem
Forum posts were showing "Unknown" as the author name instead of the actual username.

## Root Cause
The Row Level Security (RLS) policy on the `user_profiles` table was too restrictive. It only allowed users to read their own profile:

```sql
CREATE POLICY "Users read own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);
```

When the forum queries tried to join `forum_posts` with `user_profiles` to get author information, the join returned `null` because the RLS policy blocked access to other users' profiles.

## Solution
Add a new RLS policy that allows public read access to user profiles, so that forum posts can display author information.

### Step 1: Apply the Migration

Run the following SQL in your Supabase SQL Editor:

```sql
-- Drop the old policy if it exists
DROP POLICY IF EXISTS "Public profile read for forum" ON public.user_profiles;

-- Create new policy allowing public read access
CREATE POLICY "Public profile read for forum"
  ON public.user_profiles
  FOR SELECT
  TO public  -- This role includes both authenticated and anonymous users
  USING (true);  -- Allow anyone to view profiles
```

### Step 2: Verify the Fix

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Run this query to verify the policy was created:

```sql
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_profiles';
```

You should see a policy named "Public profile read for forum" with `cmd = 'SELECT'` and `roles = {public}`.

### Step 3: Test the Forum

1. Refresh your application
2. Navigate to the forum page
3. Verify that author names are now displayed correctly instead of "Unknown"

## Alternative: Apply via Supabase CLI

If you have the Supabase CLI configured:

```bash
npx supabase db push
```

This will apply the migration file at:
`supabase/migrations/20241222000003_allow_public_profile_read.sql`

## Security Note

This change is safe because:
- The `user_profiles` table only contains public information (display_name, profile_picture_url)
- Users' private data is stored in other tables with appropriate RLS policies
- This is a common pattern in social/forum applications where user profiles need to be publicly visible

## Files Changed

1. `supabase/migrations/20241222000003_allow_public_profile_read.sql` - New migration with the RLS policy fix
2. `src/lib/forum/queries.ts` - Removed debug logging (no functional changes needed)

## Testing

Run the verification script to confirm the fix:

```bash
npx tsx scripts/verify-rls-policy.ts
```

This will test:
- Service role access (should work)
- Anonymous access (should now work)
- Forum posts join (should now return author data)
