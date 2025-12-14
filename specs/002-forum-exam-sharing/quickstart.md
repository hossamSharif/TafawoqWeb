# Quickstart: Forum & Exam Sharing Platform

**Branch**: `002-forum-exam-sharing` | **Date**: 2025-12-14

## Prerequisites

- Node.js 18+ installed
- Access to Supabase project (fvstedbsjiqvryqpnmzl)
- Environment variables configured (see below)

## Environment Setup

Ensure these environment variables are set in `.env.local`:

```bash
# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=https://fvstedbsjiqvryqpnmzl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

# No new env vars required for this feature
```

## Database Setup

### 1. Run Migrations

All migrations must be applied via Supabase MCP tools. The migrations will be executed in order during implementation.

Key tables to be created:
- `forum_posts`
- `comments`
- `reactions`
- `notifications` (forum-specific, extends system)
- `shared_exam_completions`
- `user_credits`
- `reports`
- `admin_audit_log`
- `feature_toggles`

### 2. Extend Existing Tables

Add columns to `user_profiles`:
- `is_admin` (boolean)
- `is_banned` (boolean)
- `is_disabled` (boolean)

Add columns to `notification_preferences`:
- `forum_email_enabled` (boolean)
- `new_exam_email_enabled` (boolean)

### 3. Create Admin User

After migrations, create an admin user by updating the `is_admin` flag:

```sql
UPDATE user_profiles
SET is_admin = true
WHERE user_id = '<your-user-id>';
```

## Local Development

### 1. Install Dependencies

```bash
npm install
```

No new dependencies required - all features use existing packages.

### 2. Start Development Server

```bash
npm run dev
```

### 3. Access Features

| Feature | URL | Auth Required |
|---------|-----|---------------|
| Forum Feed | `/forum` | Yes |
| Create Post | `/forum/create` | Yes |
| Post Detail | `/forum/post/[id]` | Yes |
| Notifications | `/notifications` | Yes |
| Profile (with rewards) | `/profile` | Yes |
| Admin Dashboard | `/admin` | Yes (admin) |
| Admin Users | `/admin/users` | Yes (admin) |
| Admin Moderation | `/admin/moderation` | Yes (admin) |

## Key Implementation Patterns

### Forum Post Card Component

```tsx
// src/components/forum/PostCard.tsx
interface PostCardProps {
  post: ForumPost;
  onReaction: (type: 'like' | 'love') => void;
}

export function PostCard({ post, onReaction }: PostCardProps) {
  return (
    <RTLWrapper>
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-bold">{post.title}</h3>
        <p className="text-gray-600">{post.body}</p>
        <div className="flex gap-4 mt-2">
          <ReactionButtons post={post} onReaction={onReaction} />
          <span>{post.comment_count} تعليق</span>
        </div>
      </div>
    </RTLWrapper>
  );
}
```

### Infinite Scroll Hook Usage

```tsx
// src/app/(main)/forum/page.tsx
import { useInfiniteQuery } from '@/hooks/use-infinite-query';

export default function ForumPage() {
  const { data: posts, fetchNextPage, hasMore, isLoading } = useInfiniteQuery({
    tableName: 'forum_posts',
    pageSize: 20,
    trailingQuery: (query) =>
      query
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
  });

  return (
    <InfiniteList
      items={posts}
      renderItem={(post) => <PostCard key={post.id} post={post} />}
      onLoadMore={fetchNextPage}
      hasMore={hasMore}
    />
  );
}
```

### Admin Route Protection

```tsx
// src/app/(admin)/admin/layout.tsx
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

export default async function AdminLayout({ children }) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single();

  if (!profile?.is_admin) {
    redirect('/dashboard');
  }

  return <AdminShell>{children}</AdminShell>;
}
```

### Notification Service

```typescript
// src/lib/notifications/service.ts
export async function createNotification({
  userId,
  type,
  title,
  message,
  targetType,
  targetId,
}: CreateNotificationParams) {
  const supabase = createServerClient();

  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    target_type: targetType,
    target_id: targetId,
  });
}

// Usage in exam completion handler
await createNotification({
  userId: postAuthorId,
  type: 'exam_completed',
  title: 'إكمال اختبار',
  message: `${userName} أكمل اختبارك "${examTitle}"`,
  targetType: 'post',
  targetId: postId,
});
```

### Reward Milestone Check

```typescript
// src/lib/rewards/calculator.ts
export async function checkAndAwardMilestone(userId: string) {
  const supabase = createServerClient();

  // Get total completions across user's shared exams
  const { count } = await supabase
    .from('shared_exam_completions')
    .select('*', { count: 'exact' })
    .eq('post_author_id', userId);

  const { data: credits } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  const currentMilestone = Math.floor(count / 5) * 5;
  const lastMilestone = credits?.last_awarded_milestone || 0;

  if (currentMilestone > lastMilestone) {
    const creditsToAdd = ((currentMilestone - lastMilestone) / 5) * 5;

    await supabase
      .from('user_credits')
      .upsert({
        user_id: userId,
        exam_credits: (credits?.exam_credits || 0) + creditsToAdd,
        practice_credits: (credits?.practice_credits || 0) + creditsToAdd,
        last_awarded_milestone: currentMilestone,
      });

    // Notify user
    await createNotification({
      userId,
      type: 'reward_earned',
      title: 'مكافأة جديدة!',
      message: `حصلت على ${creditsToAdd} رصيد اختبار و ${creditsToAdd} رصيد تدريب`,
      targetType: null,
      targetId: null,
    });
  }
}
```

## Testing

### Manual Testing with Chrome MCP

Per constitution requirement, use Chrome MCP tools for UI validation:

```
1. Navigate to forum page
2. Take screenshot of initial state
3. Create a new post
4. Verify post appears in feed
5. Test reactions (like/love)
6. Add a comment
7. Capture final screenshot
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## File Structure Reference

```
src/
├── app/
│   ├── (main)/
│   │   ├── forum/
│   │   │   ├── page.tsx              # Forum feed
│   │   │   ├── post/[id]/page.tsx    # Post detail
│   │   │   └── create/page.tsx       # Create post
│   │   └── notifications/page.tsx     # Notification center
│   ├── (admin)/
│   │   └── admin/
│   │       ├── page.tsx              # Dashboard
│   │       ├── users/page.tsx        # User management
│   │       └── moderation/page.tsx   # Moderation queue
│   └── api/
│       ├── forum/                    # Forum API routes
│       ├── notifications/            # Notification routes
│       ├── rewards/                  # Rewards routes
│       └── admin/                    # Admin routes
├── components/
│   ├── forum/                        # Forum components
│   ├── notifications/                # Notification components
│   └── admin/                        # Admin components
└── lib/
    ├── forum/                        # Forum utilities
    ├── notifications/                # Notification service
    ├── rewards/                      # Reward calculator
    └── admin/                        # Admin utilities
```

## Common Tasks

### Add a New Notification Type

1. Add type to `NotificationType` in `src/lib/notifications/types.ts`
2. Add title/message templates in `src/lib/notifications/templates.ts`
3. Call `createNotification()` at trigger point

### Add a New Admin Action

1. Add action type to `AdminActionType` in `src/lib/admin/types.ts`
2. Use `logAdminAction()` after performing the action
3. Action is automatically recorded in `admin_audit_log`

### Test Reward System

1. Create a test user
2. Share an exam from the test user
3. Have 5 other users complete the shared exam
4. Verify credits awarded to sharer
