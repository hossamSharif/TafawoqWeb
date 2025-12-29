# Reviews System - Setup Guide

## ✅ Implementation Complete!

All code has been created and is ready to use. The reviews system is now fully implemented with:

- ✅ Database schema and migrations
- ✅ Backend API routes with rate limiting
- ✅ Email notifications to admin
- ✅ Frontend components (forms, cards, stats)
- ✅ Public reviews page (/reviews)
- ✅ Admin management page (/admin/reviews)
- ✅ Featured reviews on landing page
- ✅ Full Arabic RTL support

---

## 🚀 Quick Start - 3 Steps to Go Live

### Step 1: Apply Database Migration

You need to apply the migration to create the `app_reviews` table in your Supabase database.

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to: **SQL Editor** (in left sidebar)
3. Click **New Query**
4. Copy the entire contents of: `supabase/migrations/20241228000001_create_app_reviews_table.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Ctrl+Enter)
7. You should see: "Success. No rows returned"

**Option B: Using Supabase CLI**

```bash
# If you have Supabase CLI installed
npx supabase db push

# Or apply the specific migration
npx supabase migration up
```

**Verify the migration worked:**
- In Supabase Dashboard → **Table Editor** → You should see `app_reviews` table
- In Supabase Dashboard → **Database** → **Functions** → You should see `get_review_stats`

---

### Step 2: Configure Environment Variables

Add the admin email to your environment variables:

**For Development (.env.local):**
```env
ADMIN_REVIEW_EMAIL=hossamsharif1990@gmail.com
```

**For Production (Vercel/Deployment):**
Add the same environment variable in your hosting platform:
- Vercel: Settings → Environment Variables
- Add: `ADMIN_REVIEW_EMAIL` = `hossamsharif1990@gmail.com`

Make sure `RESEND_API_KEY` is also configured for email notifications.

---

### Step 3: Test the System

1. **Restart your dev server** (to load new env variables):
   ```bash
   npm run dev
   ```

2. **Test user review submission:**
   - Visit: http://localhost:3000/reviews
   - Login with a test user account
   - Click "أضف تقييمك" (Add your review)
   - Submit a 5-star review with test text
   - Check your email at hossamsharif1990@gmail.com for notification

3. **Test admin management:**
   - Visit: http://localhost:3000/admin/reviews
   - Login with an admin account
   - You should see all reviews with stats
   - Try featuring/unfeaturing a review
   - Try deleting a review

4. **Check landing page testimonials:**
   - Visit: http://localhost:3000
   - Scroll to testimonials section
   - Should show featured reviews (if any exist)

---

## 📋 Features Overview

### For Users:
- **Public Reviews Page** (`/reviews`)
  - View all app reviews with overall statistics
  - See rating distribution (5-star, 4-star, etc.)
  - Sort by: Recent, Rating, or Helpful
  - Submit your own review (requires login)
  - Edit or delete your review anytime
  - One review per user

### For Admins:
- **Admin Dashboard** (`/admin/reviews`)
  - View all reviews with detailed stats
  - Filter by: All, Featured, Not Featured
  - Sort reviews by various criteria
  - Toggle featured status (for landing page)
  - Delete inappropriate reviews
  - Full audit logging of all actions

### Email Notifications:
- Beautiful RTL Arabic email template
- Sent to `hossamsharif1990@gmail.com` on new reviews
- Includes:
  - Reviewer name and email
  - Star rating visualization
  - Full review text
  - Direct link to admin dashboard
  - Submission timestamp

### Landing Page Integration:
- Automatically shows up to 6 featured reviews
- Grid layout (responsive 1/2/3 columns)
- Star ratings and reviewer info
- Link to full reviews page
- Auto-hides if no featured reviews

---

## 🔒 Security Features

✅ **Rate Limiting**
- 5 reviews per user per hour
- Prevents spam and abuse

✅ **Row Level Security (RLS)**
- Public can read all reviews
- Users can only create/edit/delete their own
- Admins can modify any review
- Enforced at database level

✅ **Input Validation**
- Rating: 1-5 stars (enforced)
- Review text: 10-1000 characters
- Client-side and server-side validation

✅ **Authentication Required**
- Must be logged in to submit review
- Admin routes require admin privileges

---

## 🗂️ File Structure

```
TafawqoqWeb/
├── supabase/migrations/
│   └── 20241228000001_create_app_reviews_table.sql    # Database migration
│
├── src/
│   ├── app/
│   │   ├── (main)/reviews/page.tsx                    # Public reviews page
│   │   ├── (admin)/admin/reviews/page.tsx             # Admin dashboard
│   │   └── api/
│   │       ├── reviews/
│   │       │   ├── route.ts                           # GET/POST reviews
│   │       │   └── [id]/route.ts                      # DELETE review
│   │       └── admin/reviews/
│   │           ├── route.ts                           # Admin GET
│   │           └── [id]/route.ts                      # Admin PATCH/DELETE
│   │
│   ├── components/
│   │   ├── reviews/
│   │   │   ├── ReviewForm.tsx                         # Star rating form
│   │   │   ├── ReviewCard.tsx                         # Display single review
│   │   │   ├── ReviewStats.tsx                        # Stats widget
│   │   │   ├── ReviewsList.tsx                        # Paginated list
│   │   │   └── AdminReviewNotificationEmail.tsx       # Email template
│   │   ├── landing/
│   │   │   └── TestimonialsSection.tsx                # Featured reviews
│   │   └── admin/
│   │       └── AdminSidebar.tsx                       # (updated)
│   │
│   └── lib/
│       └── reviews/
│           ├── types.ts                               # TypeScript types
│           ├── validation.ts                          # Validation logic
│           └── email.ts                               # Email service
│
└── .env.example                                        # (updated with ADMIN_REVIEW_EMAIL)
```

---

## 🎨 Customization Options

### Change Admin Email:
Update `ADMIN_REVIEW_EMAIL` in your `.env.local` or deployment environment variables.

### Adjust Rate Limits:
In `src/app/api/reviews/route.ts`, modify:
```typescript
const rateLimitResult = checkRateLimit(`review:${user.id}`)
// Change the 5 to your desired limit
if (limit.count >= 5) {
```

### Modify Review Length:
In database migration and validation:
- Minimum: Change `>= 10` to your desired minimum
- Maximum: Change `<= 1000` to your desired maximum

### Customize Email Template:
Edit: `src/components/reviews/AdminReviewNotificationEmail.tsx`
- Change colors, layout, branding
- Add/remove sections
- Modify text content

### Change Featured Reviews Limit:
In `src/components/landing/TestimonialsSection.tsx`:
```typescript
const response = await fetch('/api/reviews?featured_only=true&limit=6')
// Change 6 to your desired limit
```

---

## 🐛 Troubleshooting

### "Table app_reviews does not exist"
- **Solution**: Run the migration in Supabase SQL Editor (Step 1 above)

### "Email not sending"
- **Check**: `RESEND_API_KEY` is configured in environment
- **Check**: `ADMIN_REVIEW_EMAIL` is configured
- **Check**: Resend API key is valid (test at https://resend.com/emails)
- **Check**: Server logs for email errors

### "Permission denied for table app_reviews"
- **Solution**: RLS policies may not be applied correctly
- **Fix**: Re-run the migration to ensure policies are created

### "Cannot read properties of undefined (reading 'user_id')"
- **Solution**: Ensure you're logged in when submitting a review
- **Check**: Auth context is properly initialized

### "Rate limit exceeded"
- **Expected**: You've submitted 5 reviews in the last hour
- **Wait**: Rate limit resets after 1 hour
- **Or**: Clear rate limit (restart server in dev mode)

---

## 📊 Database Schema Reference

### Table: `app_reviews`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PRIMARY KEY, auto-generated |
| `user_id` | uuid | FOREIGN KEY → auth.users(id), NOT NULL, UNIQUE |
| `rating` | integer | 1-5, NOT NULL |
| `review_text` | text | 10-1000 chars, NOT NULL |
| `is_featured` | boolean | Default: false |
| `helpful_count` | integer | Default: 0 |
| `created_at` | timestamptz | Auto-set on insert |
| `updated_at` | timestamptz | Auto-updated on change |

### Function: `get_review_stats()`

Returns:
```sql
{
  total_reviews: bigint,
  average_rating: numeric,
  rating_distribution: {
    '5': count,
    '4': count,
    '3': count,
    '2': count,
    '1': count
  }
}
```

---

## 🎯 Next Steps (Optional Enhancements)

Future features you could add:

1. **Helpful Votes**
   - Let users mark reviews as helpful
   - Sort by most helpful
   - Already has `helpful_count` column

2. **Review Responses**
   - Allow admin to respond to reviews
   - Add `admin_response` column

3. **Review Photos**
   - Let users upload screenshots
   - Store URLs in array column

4. **Review Filtering**
   - Filter by star rating
   - Filter by date range
   - Search review text

5. **Analytics Dashboard**
   - Track review trends over time
   - Average rating by month
   - Most active reviewers

6. **Review Reminders**
   - Email users to leave reviews
   - After completing X exams

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] Migration applied successfully in Supabase
- [ ] `app_reviews` table visible in Table Editor
- [ ] Environment variable `ADMIN_REVIEW_EMAIL` configured
- [ ] Environment variable `RESEND_API_KEY` configured
- [ ] Dev server restarted after env changes
- [ ] Can submit a test review (as user)
- [ ] Email notification received
- [ ] Admin page accessible (as admin)
- [ ] Can feature/unfeature reviews (as admin)
- [ ] Featured reviews appear on landing page
- [ ] RLS policies preventing unauthorized access
- [ ] Rate limiting working (test 6th review fails)

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review server logs for errors
3. Check Supabase logs in dashboard
4. Verify all environment variables are set
5. Ensure migration was applied correctly

---

## 🎉 You're All Set!

Once you complete Steps 1-3 above, your reviews system will be fully operational!

Users can submit reviews, you'll receive email notifications, and featured reviews will display on your landing page.

**Congratulations on adding this awesome feature to your app! 🚀**
