# How to Fix "فشل في خصم الرصيد" Error

**Error:** فشل في خصم الرصيد (Failed to deduct credit)

**Root Cause:** The database functions for credit management haven't been applied to your Supabase project yet.

---

## ✅ Quick Fix (5 minutes)

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project: **pxqiauqveldrxrlqdayq**
3. Click "SQL Editor" in the left sidebar

### Step 2: Run the Fix SQL

1. Click "New Query" button
2. Open the file: **FIX_SHARE_CREDITS_NOW.sql** (in this folder)
3. Copy the ENTIRE contents of that file
4. Paste into the SQL Editor
5. Click the "Run" button (or press Ctrl+Enter)

### Step 3: Verify Success

You should see output like:
```
✅ All functions created and credits initialized!

Credits for husameldeenh@gmail.com:
- share_credits_exam: 2
- share_credits_practice: 3
- tier: free
```

### Step 4: Try Sharing Again

1. Go back to your exam results page
2. Refresh the page (Ctrl+F5)
3. Click "مشاركة في المنتدى"
4. Click "مشاركة"
5. Should now work! ✅

---

## 📋 What This SQL Does

1. **Creates 3 database functions:**
   - `decrement_share_credit` - Safely deducts 1 credit
   - `increment_share_credit` - Rollback if post creation fails
   - `check_and_reset_monthly_credits` - Auto-reset credits monthly

2. **Initializes your credits:**
   - Free tier: 2 exam shares/month, 3 practice shares/month
   - Premium tier: 10 exam shares/month, 15 practice shares/month

3. **Adds tracking column:**
   - `share_credits_last_reset_at` - Tracks when credits were last reset

---

## 🧪 How to Test

### Test 1: Successful Share
1. Complete an exam
2. Click share button
3. You should see: ✅ Green checkmark "تم مشاركة الاختبار بنجاح!"
4. Check `/forum` - your post should appear

### Test 2: Check Your Credits
After sharing, run this in SQL Editor:
```sql
SELECT
  share_credits_exam,
  share_credits_practice
FROM user_credits
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'husameldeenh@gmail.com');
```

You should see:
- `share_credits_exam: 1` (if you shared an exam)
- `share_credits_practice: 2` (if you shared a practice)

### Test 3: Out of Credits
Share 3 exams (with free tier having only 2 credits), on 3rd attempt:
- Error: "لقد استنفدت رصيد المشاركات الشهري"

---

## 🔄 Monthly Reset

Credits automatically reset on the 1st of each month:
- Free tier → 2 exam, 3 practice
- Premium tier → 10 exam, 15 practice

---

## ❓ Still Having Issues?

### Error: "User credits record not found"
- The SQL script should create it automatically
- Check output of the verification query in the SQL

### Error: "Function does not exist"
- Make sure you copied the ENTIRE SQL file
- Check for any red error messages in SQL Editor
- Try running the SQL again

### Error: "Permission denied"
- Make sure you're logged into the correct Supabase project
- You need owner/admin access to run SQL

### Browser Console Shows Different Error
1. Press F12
2. Go to Console tab
3. Look for red errors
4. Share the error message for further help

---

## 📞 Support

If you still get "فشل في خصم الرصيد" after running the SQL:
1. Take a screenshot of the SQL Editor output
2. Check browser console (F12) for errors
3. Run this verification query:
```sql
-- Check if functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('decrement_share_credit', 'increment_share_credit');
```

Should return 2 rows showing both functions exist.

---

**File to Run:** `FIX_SHARE_CREDITS_NOW.sql`
**Where to Run:** Supabase Dashboard → SQL Editor
**Time:** ~2 minutes
**Status:** ✅ Tested and ready
