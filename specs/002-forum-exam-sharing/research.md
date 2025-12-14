# Research: Forum & Exam Sharing Platform

**Branch**: `002-forum-exam-sharing` | **Date**: 2025-12-14

## Research Tasks

### 1. Row Level Security (RLS) for Forum/Social Applications

**Decision**: Use Supabase RLS policies with `auth.uid()` for user-owned content and role-based policies for admin access.

**Rationale**:
- RLS is the recommended Supabase pattern for multi-tenant data access
- Policies can reference `auth.uid()` to restrict users to their own data
- Admin access achieved through `is_admin` flag check in policy conditions
- Performance optimized by adding indexes on filtered columns

**Key Patterns**:
```sql
-- User can read all published posts
CREATE POLICY "Anyone can view active posts" ON forum_posts
  FOR SELECT USING (status = 'active');

-- User can only modify their own posts
CREATE POLICY "Users can update own posts" ON forum_posts
  FOR UPDATE USING (author_id = auth.uid());

-- Admins can do everything
CREATE POLICY "Admins have full access" ON forum_posts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND is_admin = true)
  );
```

**Alternatives Considered**:
- Application-level authorization only: Rejected - less secure, bypasses direct DB access
- Separate admin database: Rejected - adds complexity, same Supabase project is sufficient

---

### 2. Cursor-Based Pagination with Supabase

**Decision**: Use Supabase's `.range()` method with `useInfiniteQuery` pattern from Supabase UI components for infinite scroll.

**Rationale**:
- Supabase provides official `useInfiniteQuery` hook for React apps
- Uses `.range(skip, skip + pageSize - 1)` for efficient pagination
- Supports `count: 'exact'` for total count needed by UI
- Intersection Observer API triggers `fetchNextPage()` when user scrolls

**Implementation Pattern**:
```typescript
const { data, fetchNextPage, hasMore, isFetching } = useInfiniteQuery({
  tableName: 'forum_posts',
  columns: '*',
  pageSize: 20,
  trailingQuery: (query) => query.order('created_at', { ascending: false }),
})
```

**Key Features**:
- `hasMore`: Boolean indicating if more data exists
- `fetchNextPage`: Function to load next page
- `trailingQuery`: Apply sorting, filtering before pagination

**Alternatives Considered**:
- Offset-based pagination: Rejected - page drift issues with new content
- Keyset pagination: Considered but `.range()` is simpler and sufficient for this scale

---

### 3. Next.js 14 Admin Panel with Protected Routes

**Decision**: Use Next.js Middleware for route protection with admin role verification in Data Access Layer (DAL).

**Rationale**:
- Middleware provides centralized access control early in request pipeline
- `matcher` config excludes public routes from auth checks
- DAL pattern ensures security checks at data access point, not just routing
- Admin flag verified server-side in API routes and Server Components

**Implementation Pattern**:
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value

  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return Response.redirect(new URL('/admin/login', request.url))
    }
    // Additional admin check in API/DAL layer
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

**DAL Security Pattern**:
```typescript
// lib/admin/queries.ts
export async function getAdminData() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', user?.id)
    .single()

  if (!profile?.is_admin) {
    throw new Error('Unauthorized')
  }
  // Proceed with admin operation
}
```

**Alternatives Considered**:
- Client-side only auth: Rejected - insecure
- Separate admin app: Rejected - adds deployment complexity

---

### 4. In-App Notifications Architecture

**Decision**: Store notifications in database table with periodic polling; use Supabase Realtime Broadcast for optional real-time updates.

**Rationale**:
- Database storage ensures notification persistence and history
- Polling (every 30s) is sufficient for non-critical notifications
- Realtime Broadcast available for instant updates without table replication overhead
- Email notifications via existing OTP email infrastructure (Supabase Auth emails)

**Notification Table Design**:
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL, -- 'exam_completed', 'comment', 'reply', 'report_resolved'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_type TEXT, -- 'post', 'comment', 'exam'
  target_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Real-time Pattern (optional enhancement)**:
```typescript
// Client subscribes to user-specific channel
const channel = supabase.channel(`user:${userId}:notifications`, {
  config: { private: true }
})
.on('broadcast', { event: 'new_notification' }, (payload) => {
  // Update notification badge
})
.subscribe()
```

**Email Notifications**:
- Use Supabase Edge Function or API route to send emails
- Respect user preferences from `notification_preferences` table
- Batch daily digests for "new exams in your track" notifications

**Alternatives Considered**:
- Postgres Changes listener: Rejected - Broadcast is recommended for notifications
- Push notifications: Out of scope per spec

---

### 5. Reward Credit System Integration

**Decision**: Store credits in dedicated `user_credits` table with milestone tracking; integrate with existing subscription checks.

**Rationale**:
- Separate table allows independent credit management
- Cumulative milestone tracking (5, 10, 15...) stored in `total_completions` counter
- Credit redemption checked alongside subscription tier in feature gates
- Audit trail via `credit_history` JSONB column

**Credit Check Integration**:
```typescript
// lib/subscription/feature-check.ts
export async function canTakeExam(userId: string): Promise<boolean> {
  const subscription = await getSubscription(userId)
  const credits = await getCredits(userId)

  if (subscription.tier === 'premium') return true
  if (credits.exam_credits > 0) return true // Can use credit

  const weeklyUsage = await getWeeklyExamCount(userId)
  return weeklyUsage < FREE_TIER_WEEKLY_LIMIT
}
```

**Milestone Calculation**:
```sql
-- Trigger function to check milestones
CREATE OR REPLACE FUNCTION check_reward_milestone()
RETURNS TRIGGER AS $$
DECLARE
  current_total INTEGER;
  last_milestone INTEGER;
  new_milestone INTEGER;
BEGIN
  -- Get total completions across all user's shared exams
  SELECT COUNT(DISTINCT completer_id) INTO current_total
  FROM shared_exam_completions sec
  JOIN forum_posts fp ON sec.post_id = fp.id
  WHERE fp.author_id = NEW.author_id;

  -- Calculate milestones (5, 10, 15...)
  new_milestone := (current_total / 5) * 5;
  last_milestone := COALESCE((
    SELECT last_awarded_milestone FROM user_credits WHERE user_id = NEW.author_id
  ), 0);

  IF new_milestone > last_milestone THEN
    -- Award credits
    UPDATE user_credits
    SET exam_credits = exam_credits + 5,
        practice_credits = practice_credits + 5,
        last_awarded_milestone = new_milestone
    WHERE user_id = NEW.author_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Alternatives Considered**:
- Credits in user_profiles: Rejected - cleaner separation of concerns
- Real-time credit calculation: Rejected - milestone tracking is simpler

---

### 6. Admin Audit Logging

**Decision**: Dedicated `admin_audit_log` table with structured action recording.

**Rationale**:
- Required by FR-048 for compliance
- Structured JSON for action details enables querying
- Indexed by admin_id and created_at for efficient lookups

**Schema**:
```sql
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  action_type TEXT NOT NULL, -- 'user_disabled', 'content_deleted', 'subscription_modified'
  target_type TEXT NOT NULL, -- 'user', 'post', 'comment', 'subscription'
  target_id UUID NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_admin ON admin_audit_log(admin_id);
CREATE INDEX idx_audit_created ON admin_audit_log(created_at DESC);
```

---

## Summary of Technology Decisions

| Area | Decision | Key Benefit |
|------|----------|-------------|
| Authorization | RLS policies with `is_admin` flag | Security at database level |
| Pagination | Cursor-based with `useInfiniteQuery` | No page drift, good UX |
| Admin Routes | Middleware + DAL pattern | Defense in depth |
| Notifications | Database + optional Realtime Broadcast | Persistence + real-time option |
| Credits | Separate table with milestone trigger | Clean integration with subscriptions |
| Audit | Structured logging table | Compliance + queryability |

## Unresolved Items

None - all technical decisions have been made based on research.
