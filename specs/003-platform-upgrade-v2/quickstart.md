# Quickstart: Platform Upgrade V2

**Branch**: `003-platform-upgrade-v2` | **Date**: 2025-12-15

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase CLI (for migrations)
- Access to Supabase project
- Stripe account (for subscription testing)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

No new packages required - all dependencies already present in project.

### 2. Environment Variables

Ensure the following environment variables are configured:

```env
# Existing (should already be set)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
ANTHROPIC_API_KEY=

# New for this feature (optional)
MAINTENANCE_MODE_DEFAULT=false
```

### 3. Database Migrations

Apply migrations in order using Supabase MCP tools:

```bash
# Via MCP (recommended per constitution)
mcp__supabase__apply_migration "001_add_is_admin_column"
mcp__supabase__apply_migration "002_forum_posts_library_columns"
mcp__supabase__apply_migration "003_user_credits_sharing_columns"
mcp__supabase__apply_migration "004_user_subscriptions_grace_period"
mcp__supabase__apply_migration "005_create_library_access_table"
mcp__supabase__apply_migration "006_create_maintenance_log_table"
mcp__supabase__apply_migration "007_database_functions"
mcp__supabase__apply_migration "008_rls_policies"
```

### 4. Generate TypeScript Types

After migrations, regenerate types:

```bash
# Via MCP (required per constitution)
mcp__supabase__generate_typescript_types
```

### 5. Local Development

```bash
npm run dev
```

Access at `http://localhost:3000`

## Testing Features

### Test Exam Library

1. Create a user account
2. Generate an exam (uses Claude API)
3. Share the exam to library via forum post
4. Create second user account
5. Browse library at `/library`
6. Access the shared exam (free user gets 1 access)

### Test Subscription Limits

1. As free user, verify limits: 2 exams, 3 practices, 2 exam shares, 3 practice shares
2. Upgrade to premium via Stripe
3. Verify premium limits: 10 exams, 15 practices, 10 exam shares, 15 practice shares

### Test Reward System

1. User A shares an exam to library
2. User B completes User A's exam
3. Verify User A receives notification
4. Verify User A's exam credits increased by 1

### Test Admin Features

1. Set user as admin in database: `UPDATE user_profiles SET is_admin = true WHERE id = '<user_id>'`
2. Access `/admin`
3. Upload exam JSON via admin panel
4. Verify uploaded content appears in library
5. Enable/disable maintenance mode

### Test Maintenance Mode

1. As admin, enable maintenance mode
2. As regular user, try to generate exam → should see maintenance message
3. As regular user, try to create practice → should see maintenance message
4. As regular user, browse existing content → should work normally

## Key Files to Review

### New Files (to be created)

```
src/
├── app/
│   ├── (main)/library/
│   │   ├── page.tsx              # Library listing page
│   │   └── [postId]/page.tsx     # Library exam detail
│   ├── api/
│   │   ├── library/
│   │   │   ├── route.ts          # GET /api/library
│   │   │   └── [postId]/
│   │   │       ├── route.ts      # GET /api/library/[postId]
│   │   │       ├── access/route.ts  # POST access
│   │   │       └── start/route.ts   # POST start exam
│   │   └── admin/
│   │       ├── content/
│   │       │   ├── upload/route.ts
│   │       │   └── validate/route.ts
│   │       └── maintenance/
│   │           └── route.ts
├── components/
│   └── library/
│       ├── LibraryExamCard.tsx
│       ├── LibraryExamList.tsx
│       ├── LibraryAccessButton.tsx
│       └── LibraryEmptyState.tsx
├── lib/
│   ├── library/
│   │   ├── types.ts
│   │   ├── queries.ts
│   │   └── actions.ts
│   └── brand.ts                  # New branding configuration
└── types/
    └── library.ts
```

### Modified Files

```
src/
├── app/
│   └── page.tsx                  # Landing page (rebrand + new features)
├── components/
│   ├── shared/
│   │   └── Navigation.tsx        # Add Library nav item
│   └── subscription/
│       └── PlanCard.tsx          # New pricing display
├── lib/
│   └── supabase/types.ts         # Updated after type generation
├── types/
│   └── subscription.ts           # New limits structure
└── middleware.ts                 # Maintenance mode check
```

## Stripe Configuration

### Webhook Events

Ensure these events are enabled in Stripe dashboard:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.trial_will_end`

### Price Configuration

Update Stripe price to 49 SAR with metadata:

```json
{
  "original_price": 100,
  "currency": "SAR"
}
```

## Common Issues

### "Library exam not visible"

- Check `is_library_visible` is `true` on the forum post
- Verify post type is `exam_share`
- Ensure `is_deleted` is `false`

### "Free user can access multiple library exams"

- Verify `library_access` table exists
- Check `check_library_access_limit` function is deployed
- Verify RLS policy on `library_access` table

### "Rewards not crediting"

- Verify `grant_reward_on_completion` trigger is active
- Check `shared_exam_completions` INSERT is happening
- Verify user is not completing their own content

### "Maintenance mode not blocking"

- Check `feature_toggles` table has `maintenance_mode` entry
- Verify middleware is checking the toggle
- Ensure middleware runs before protected routes

## Next Steps After Setup

1. Run `/speckit.tasks` to generate implementation tasks
2. Execute `/speckit.implement` for each task
3. Test with Chrome MCP tools per constitution
4. Commit changes after each implementation task
