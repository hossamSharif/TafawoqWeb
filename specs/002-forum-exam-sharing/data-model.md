# Data Model: Forum & Exam Sharing Platform

**Branch**: `002-forum-exam-sharing` | **Date**: 2025-12-14

## Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  user_profiles  │     │   forum_posts   │     │    comments     │
│  (existing)     │────<│                 │────<│                 │
│                 │     │ author_id (FK)  │     │ post_id (FK)    │
│ + is_admin      │     │ shared_exam_id  │     │ author_id (FK)  │
│ + is_banned     │     │ post_type       │     │ parent_id (FK)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  user_credits   │     │   reactions     │     │    reports      │
│                 │     │                 │     │                 │
│ user_id (FK)    │     │ user_id (FK)    │     │ reporter_id(FK) │
│ exam_credits    │     │ target_type     │     │ content_type    │
│ practice_credits│     │ target_id       │     │ content_id      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │
        │
        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  notifications  │     │ notification_   │     │ admin_audit_log │
│                 │     │ preferences     │     │                 │
│ user_id (FK)    │     │ (extend existing)    │ admin_id (FK)   │
│ type            │     │ + forum prefs   │     │ action_type     │
│ target_type     │     │                 │     │ target_type     │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│ shared_exam_    │     │ feature_toggles │
│ completions     │     │                 │
│                 │     │ feature_name    │
│ post_id (FK)    │     │ is_enabled      │
│ user_id (FK)    │     │                 │
└─────────────────┘     └─────────────────┘
```

## Entities

### 1. forum_posts

Forum posts including both text posts and exam share posts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| author_id | UUID | FK → auth.users(id), NOT NULL | Post creator |
| post_type | TEXT | NOT NULL, CHECK IN ('text', 'exam_share') | Type of post |
| title | TEXT | NOT NULL, MAX 200 chars | Post title |
| body | TEXT | MAX 5000 chars | Post content (text posts) or description (exam shares) |
| shared_exam_id | UUID | FK → exam_sessions(id), NULLABLE | Reference to shared exam (only for exam_share type) |
| shared_practice_id | UUID | FK → practice_sessions(id), NULLABLE | Reference to shared practice (only for exam_share type) |
| like_count | INTEGER | DEFAULT 0 | Cached like count |
| love_count | INTEGER | DEFAULT 0 | Cached love count |
| comment_count | INTEGER | DEFAULT 0 | Cached comment count |
| completion_count | INTEGER | DEFAULT 0 | Cached completion count (exam shares only) |
| status | TEXT | DEFAULT 'active', CHECK IN ('active', 'deleted') | Post status |
| is_edited | BOOLEAN | DEFAULT false | Whether post has been edited |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**Indexes**:
- `idx_posts_author` ON (author_id)
- `idx_posts_created` ON (created_at DESC)
- `idx_posts_type_status` ON (post_type, status)
- `idx_posts_likes` ON (like_count DESC) WHERE status = 'active'

**Validation Rules**:
- title: Required, 1-200 characters
- body: Required for text posts, optional for exam shares, max 5000 characters
- shared_exam_id or shared_practice_id: Required for exam_share type, must be completed session
- Cannot share same exam/practice twice (unique constraint on author_id + shared_exam_id/shared_practice_id)

---

### 2. comments

Comments on forum posts with 2-level threading support.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| post_id | UUID | FK → forum_posts(id) ON DELETE CASCADE, NOT NULL | Parent post |
| author_id | UUID | FK → auth.users(id), NOT NULL | Comment author |
| parent_id | UUID | FK → comments(id) ON DELETE CASCADE, NULLABLE | Parent comment for replies |
| content | TEXT | NOT NULL, MAX 2000 chars | Comment text |
| like_count | INTEGER | DEFAULT 0 | Cached like count |
| status | TEXT | DEFAULT 'active', CHECK IN ('active', 'deleted') | Comment status |
| is_edited | BOOLEAN | DEFAULT false | Whether comment has been edited |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**Indexes**:
- `idx_comments_post` ON (post_id, created_at DESC)
- `idx_comments_author` ON (author_id)
- `idx_comments_parent` ON (parent_id) WHERE parent_id IS NOT NULL

**Validation Rules**:
- content: Required, 1-2000 characters
- parent_id: If set, parent must belong to same post_id
- Nesting depth: Maximum 2 levels (post → comment → reply). Replies to replies not allowed.

**State Transitions**:
- active → deleted (by author or admin)

---

### 3. reactions

User reactions (like/love) on posts and comments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| user_id | UUID | FK → auth.users(id), NOT NULL | User who reacted |
| target_type | TEXT | NOT NULL, CHECK IN ('post', 'comment') | Type of content |
| target_id | UUID | NOT NULL | ID of post or comment |
| reaction_type | TEXT | NOT NULL, CHECK IN ('like', 'love') | Type of reaction |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

**Indexes**:
- `idx_reactions_user_target` UNIQUE ON (user_id, target_type, target_id, reaction_type)
- `idx_reactions_target` ON (target_type, target_id)

**Validation Rules**:
- One reaction per type per user per target (user can both like AND love same post)
- Target must exist and be active

---

### 4. notifications

In-app notifications for user activity.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| user_id | UUID | FK → auth.users(id) ON DELETE CASCADE, NOT NULL | Notification recipient |
| type | TEXT | NOT NULL | Notification type (see enum below) |
| title | TEXT | NOT NULL | Notification title (Arabic) |
| message | TEXT | NOT NULL | Notification message (Arabic) |
| target_type | TEXT | NULLABLE | Type of related content |
| target_id | UUID | NULLABLE | ID of related content |
| is_read | BOOLEAN | DEFAULT false | Read status |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

**Notification Types**:
- `exam_completed`: Someone completed user's shared exam
- `new_comment`: Someone commented on user's post
- `comment_reply`: Someone replied to user's comment
- `report_resolved`: User's report was resolved
- `reward_earned`: User earned reward credits

**Indexes**:
- `idx_notifications_user_read` ON (user_id, is_read, created_at DESC)
- `idx_notifications_created` ON (created_at DESC)

---

### 5. shared_exam_completions

Tracks which users have completed which shared exams.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| post_id | UUID | FK → forum_posts(id) ON DELETE CASCADE, NOT NULL | The shared exam post |
| user_id | UUID | FK → auth.users(id), NOT NULL | User who completed |
| exam_session_id | UUID | FK → exam_sessions(id), NULLABLE | Their exam session |
| practice_session_id | UUID | FK → practice_sessions(id), NULLABLE | Their practice session |
| created_at | TIMESTAMPTZ | DEFAULT now() | Completion timestamp |

**Indexes**:
- `idx_completions_post` ON (post_id)
- `idx_completions_user_post` UNIQUE ON (post_id, user_id)

**Validation Rules**:
- User cannot complete their own shared exam
- Each user can only complete each shared exam once

---

### 6. user_credits

User reward credits earned from sharing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| user_id | UUID | FK → auth.users(id), UNIQUE, NOT NULL | Credit owner |
| exam_credits | INTEGER | DEFAULT 0, CHECK >= 0 | Available exam credits |
| practice_credits | INTEGER | DEFAULT 0, CHECK >= 0 | Available practice credits |
| total_completions | INTEGER | DEFAULT 0 | Total completions across all shared exams |
| last_awarded_milestone | INTEGER | DEFAULT 0 | Last milestone that awarded credits |
| credit_history | JSONB | DEFAULT '[]' | History of credit transactions |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**Credit History Entry Schema**:
```json
{
  "type": "earned" | "redeemed",
  "exam_credits": 5,
  "practice_credits": 5,
  "reason": "milestone_10" | "exam_redemption",
  "timestamp": "2025-12-14T10:00:00Z"
}
```

**Indexes**:
- `idx_credits_user` UNIQUE ON (user_id)

---

### 7. reports

Content reports for moderation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| reporter_id | UUID | FK → auth.users(id), NOT NULL | User who reported |
| content_type | TEXT | NOT NULL, CHECK IN ('post', 'comment') | Type of reported content |
| content_id | UUID | NOT NULL | ID of reported content |
| reason | TEXT | NOT NULL | Report reason category |
| details | TEXT | NULLABLE, MAX 500 chars | Additional details |
| status | TEXT | DEFAULT 'pending', CHECK IN ('pending', 'resolved', 'dismissed') | Report status |
| resolution_notes | TEXT | NULLABLE | Admin resolution notes |
| resolved_by | UUID | FK → auth.users(id), NULLABLE | Admin who resolved |
| resolved_at | TIMESTAMPTZ | NULLABLE | Resolution timestamp |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

**Report Reason Categories**:
- `spam`
- `harassment`
- `inappropriate_content`
- `misinformation`
- `other`

**Indexes**:
- `idx_reports_status` ON (status, created_at DESC)
- `idx_reports_content` ON (content_type, content_id)

**Validation Rules**:
- User cannot report their own content
- User cannot submit duplicate reports for same content

---

### 8. admin_audit_log

Audit trail for admin actions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| admin_id | UUID | FK → auth.users(id), NOT NULL | Admin who performed action |
| action_type | TEXT | NOT NULL | Type of action |
| target_type | TEXT | NOT NULL | Type of target |
| target_id | UUID | NOT NULL | ID of target |
| details | JSONB | DEFAULT '{}' | Action details |
| created_at | TIMESTAMPTZ | DEFAULT now() | Action timestamp |

**Action Types**:
- `user_disabled`, `user_enabled`, `user_deleted`, `user_banned`, `user_unbanned`
- `password_reset`
- `post_deleted`, `post_edited`
- `comment_deleted`, `comment_edited`
- `report_resolved`, `report_dismissed`
- `subscription_modified`, `credits_added`
- `feature_toggled`

**Indexes**:
- `idx_audit_admin` ON (admin_id)
- `idx_audit_created` ON (created_at DESC)
- `idx_audit_target` ON (target_type, target_id)

---

### 9. feature_toggles

Platform-wide feature flags.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| feature_name | TEXT | UNIQUE, NOT NULL | Feature identifier |
| is_enabled | BOOLEAN | DEFAULT true | Whether feature is enabled |
| description | TEXT | NULLABLE | Feature description |
| updated_by | UUID | FK → auth.users(id), NULLABLE | Last admin to update |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

**Default Features**:
- `forum_enabled`: Enable/disable forum access
- `forum_posting_enabled`: Enable/disable new posts
- `forum_sharing_enabled`: Enable/disable exam sharing
- `rewards_enabled`: Enable/disable reward system
- `notifications_enabled`: Enable/disable notifications

---

## Schema Extensions (Existing Tables)

### user_profiles (extend)

Add columns:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| is_admin | BOOLEAN | DEFAULT false | Admin flag |
| is_banned | BOOLEAN | DEFAULT false | Forum ban status |
| is_disabled | BOOLEAN | DEFAULT false | Account disabled status |

### notification_preferences (extend)

Add columns:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| forum_email_enabled | BOOLEAN | DEFAULT true | Email for forum activity |
| new_exam_email_enabled | BOOLEAN | DEFAULT true | Email for new exams in track |

---

## RLS Policies Summary

### forum_posts
- SELECT: Anyone can view active posts
- INSERT: Authenticated users (not banned)
- UPDATE: Author only (or admin)
- DELETE: Author only (or admin)

### comments
- SELECT: Anyone can view active comments
- INSERT: Authenticated users (not banned)
- UPDATE: Author only (or admin)
- DELETE: Author only (or admin)

### reactions
- SELECT: Anyone
- INSERT: Authenticated users (not banned)
- DELETE: Owner only

### notifications
- SELECT: Owner only
- INSERT: System only (service role)
- UPDATE: Owner only (for is_read)

### reports
- SELECT: Reporter (own reports) or admin
- INSERT: Authenticated users (not own content)
- UPDATE: Admin only

### admin_audit_log
- SELECT: Admin only
- INSERT: Admin only (service role for triggers)

### feature_toggles
- SELECT: Anyone (for feature checks)
- UPDATE: Admin only

---

## Database Functions

### increment_reaction_count()
Trigger function to update cached reaction counts on posts/comments.

### decrement_reaction_count()
Trigger function to update cached counts when reactions are removed.

### increment_comment_count()
Trigger function to update post comment count.

### check_reward_milestone()
Trigger function to check and award credits on exam completion.

### log_admin_action()
Helper function to create audit log entries.
