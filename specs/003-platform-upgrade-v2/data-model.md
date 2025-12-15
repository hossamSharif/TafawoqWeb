# Data Model: Platform Upgrade V2

**Branch**: `003-platform-upgrade-v2` | **Date**: 2025-12-15

## Overview

This document defines database schema changes for the Platform Upgrade V2 feature set. Changes are additive to existing schema and maintain backward compatibility.

---

## New Tables

### 1. `library_access`

Tracks which library exams each user has accessed. Used to enforce free tier 1-exam limit.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Primary key |
| `user_id` | `uuid` | FK → auth.users, NOT NULL | User who accessed the library exam |
| `post_id` | `uuid` | FK → forum_posts, NOT NULL | The exam_share post accessed |
| `accessed_at` | `timestamptz` | DEFAULT now(), NOT NULL | When access was granted |
| `exam_started` | `boolean` | DEFAULT false | Whether user actually started the exam |
| `exam_completed` | `boolean` | DEFAULT false | Whether user completed the exam |

**Indexes**:
- `idx_library_access_user_id` on `user_id`
- `idx_library_access_post_id` on `post_id`
- UNIQUE constraint on `(user_id, post_id)` - one access record per user per exam

**RLS Policies**:
- SELECT: `auth.uid() = user_id` (users see own records)
- INSERT: `auth.uid() = user_id` (users create own records)
- No UPDATE/DELETE for users (permanent record)

---

### 2. `maintenance_log`

Audit log for maintenance mode changes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Primary key |
| `admin_id` | `uuid` | FK → auth.users, NOT NULL | Admin who made the change |
| `action` | `text` | NOT NULL | 'enabled' or 'disabled' |
| `message` | `text` | | Custom maintenance message |
| `created_at` | `timestamptz` | DEFAULT now(), NOT NULL | When change occurred |

**RLS Policies**:
- SELECT: Admin only (`is_user_admin(auth.uid())`)
- INSERT: Admin only (`is_user_admin(auth.uid())`)

---

## Modified Tables

### 1. `forum_posts` (existing)

Add columns for library visibility and admin content tracking.

| New Column | Type | Constraints | Description |
|------------|------|-------------|-------------|
| `is_library_visible` | `boolean` | DEFAULT false | Whether post appears in exam library |
| `is_admin_upload` | `boolean` | DEFAULT false | Whether content was uploaded by admin |
| `library_access_count` | `integer` | DEFAULT 0 | How many users have accessed from library |

**Migration Notes**:
- Existing `exam_share` posts default to `is_library_visible = false`
- Users can opt-in to library visibility when sharing
- Admin uploads automatically set `is_library_visible = true`

---

### 2. `user_subscriptions` (existing)

Add columns for grace period handling.

| New Column | Type | Constraints | Description |
|------------|------|-------------|-------------|
| `grace_period_end` | `timestamptz` | | When grace period expires (null if not in grace) |
| `payment_failed_at` | `timestamptz` | | When last payment failure occurred |
| `downgrade_scheduled` | `boolean` | DEFAULT false | Whether auto-downgrade is scheduled |

---

### 3. `user_credits` (existing)

Add columns for sharing quotas.

| New Column | Type | Constraints | Description |
|------------|------|-------------|-------------|
| `share_credits_exam` | `integer` | DEFAULT based on tier | Remaining exam share quota |
| `share_credits_practice` | `integer` | DEFAULT based on tier | Remaining practice share quota |
| `library_access_used` | `integer` | DEFAULT 0 | Library exams accessed (for free users) |

**Default Values by Tier**:
- Free: `share_credits_exam = 2`, `share_credits_practice = 3`, max `library_access_used = 1`
- Premium: `share_credits_exam = 10`, `share_credits_practice = 15`, unlimited library

---

### 4. `user_profiles` (existing)

Ensure `is_admin` flag exists (may already be present).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `is_admin` | `boolean` | DEFAULT false | Admin access flag |

---

### 5. `notifications` (existing)

Add new notification types for rewards.

**New Enum Values for `type`**:
- `reward_earned` - When user earns credit from shared content completion
- `payment_failed` - When subscription payment fails
- `grace_period_warning` - Warning during grace period
- `downgrade_notice` - When auto-downgrade occurs

---

## Database Functions

### 1. `check_library_access_limit`

```sql
CREATE OR REPLACE FUNCTION check_library_access_limit(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_tier text;
  v_access_count integer;
BEGIN
  -- Get user tier
  SELECT tier INTO v_tier FROM user_subscriptions WHERE user_id = p_user_id;

  -- Premium users have unlimited access
  IF v_tier = 'premium' THEN
    RETURN true;
  END IF;

  -- Count existing library accesses for free user
  SELECT COUNT(*) INTO v_access_count
  FROM library_access
  WHERE user_id = p_user_id;

  -- Free users limited to 1
  RETURN v_access_count < 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. `grant_reward_on_completion`

Database trigger function to credit content owner when someone completes their shared content.

```sql
CREATE OR REPLACE FUNCTION grant_reward_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id uuid;
  v_content_type text;
BEGIN
  -- Get the owner of the shared content
  SELECT user_id,
    CASE WHEN shared_exam_id IS NOT NULL THEN 'exam' ELSE 'practice' END
  INTO v_owner_id, v_content_type
  FROM forum_posts
  WHERE id = NEW.post_id;

  -- Don't reward if completing own content
  IF v_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Credit the owner
  IF v_content_type = 'exam' THEN
    UPDATE user_credits
    SET exam_credits = exam_credits + 1
    WHERE user_id = v_owner_id;
  ELSE
    UPDATE user_credits
    SET practice_credits = practice_credits + 1
    WHERE user_id = v_owner_id;
  END IF;

  -- Create notification for owner
  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (
    v_owner_id,
    'reward_earned',
    'مكافأة جديدة! 🎉',
    'لقد أكمل مستخدم آخر اختبارك المشارك وحصلت على رصيد إضافي',
    jsonb_build_object('content_type', v_content_type, 'completer_id', NEW.user_id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. `get_library_exams`

Fetch library-visible exams with access status.

```sql
CREATE OR REPLACE FUNCTION get_library_exams(
  p_user_id uuid,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  post_id uuid,
  title text,
  section text,
  question_count integer,
  creator_name text,
  creator_id uuid,
  completion_count integer,
  user_has_access boolean,
  user_completed boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fp.id as post_id,
    fp.title,
    fp.shared_exam_section as section,
    fp.shared_exam_question_count as question_count,
    up.display_name as creator_name,
    fp.user_id as creator_id,
    fp.completion_count,
    EXISTS(SELECT 1 FROM library_access la WHERE la.user_id = p_user_id AND la.post_id = fp.id) as user_has_access,
    EXISTS(SELECT 1 FROM shared_exam_completions sec WHERE sec.user_id = p_user_id AND sec.post_id = fp.id) as user_completed
  FROM forum_posts fp
  JOIN user_profiles up ON fp.user_id = up.id
  WHERE fp.type = 'exam_share'
    AND fp.is_library_visible = true
    AND fp.is_deleted = false
  ORDER BY fp.completion_count DESC, fp.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Triggers

### 1. Reward on Completion Trigger

```sql
CREATE TRIGGER trg_grant_reward_on_completion
AFTER INSERT ON shared_exam_completions
FOR EACH ROW
EXECUTE FUNCTION grant_reward_on_completion();
```

---

## RLS Policy Updates

### `forum_posts` - Library Access

```sql
-- Allow all authenticated users to view library-visible posts
CREATE POLICY "library_visible_posts_select" ON forum_posts
FOR SELECT
USING (
  is_library_visible = true
  OR user_id = auth.uid()
  OR is_user_admin(auth.uid())
);
```

### `library_access` - User Access Control

```sql
-- Users can view their own access records
CREATE POLICY "library_access_select_own" ON library_access
FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own access records (with limit check)
CREATE POLICY "library_access_insert_own" ON library_access
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND check_library_access_limit(auth.uid())
);
```

---

## Entity Relationships

```
┌──────────────────┐     ┌──────────────────┐
│   user_profiles  │────<│  forum_posts     │
│   (is_admin)     │     │  (exam_share)    │
└──────────────────┘     │  is_library_     │
         │               │  visible         │
         │               └────────┬─────────┘
         │                        │
         ▼                        ▼
┌──────────────────┐     ┌──────────────────┐
│  user_credits    │     │  library_access  │
│  share_credits_  │     │  (tracks free    │
│  exam/practice   │     │   user access)   │
└──────────────────┘     └──────────────────┘
         │
         │ ◄── updated by trigger
         │
┌──────────────────┐
│ shared_exam_     │
│ completions      │
│ (triggers reward)│
└──────────────────┘
```

---

## Migration Order

1. Add columns to `user_profiles` (if `is_admin` not present)
2. Add columns to `forum_posts` (`is_library_visible`, `is_admin_upload`, `library_access_count`)
3. Add columns to `user_credits` (`share_credits_exam`, `share_credits_practice`, `library_access_used`)
4. Add columns to `user_subscriptions` (`grace_period_end`, `payment_failed_at`, `downgrade_scheduled`)
5. Create `library_access` table
6. Create `maintenance_log` table
7. Create database functions
8. Create triggers
9. Update RLS policies
10. Backfill defaults for existing users

---

## Validation Rules

| Entity | Rule | Enforcement |
|--------|------|-------------|
| `library_access` | Free users max 1 access | `check_library_access_limit()` function |
| `user_credits.share_credits_exam` | Free: max 2, Premium: max 10 | Application layer on share action |
| `user_credits.share_credits_practice` | Free: max 3, Premium: max 15 | Application layer on share action |
| `forum_posts.is_library_visible` | Only `exam_share` type can be true | Application layer + DB constraint |
| `maintenance_log` | Only admins can insert | RLS policy |

---

## State Transitions

### Subscription Grace Period Flow

```
Active → Payment Failed → Grace Period (3 days) → Downgraded to Free
                              │
                              ▼
                        Payment Successful → Active (grace cleared)
```

### Library Access Flow (Free User)

```
No Access → First Access Granted → Exam Started → Exam Completed
    │              │
    │              └── Cannot access other library exams
    │
    └── Can browse all library exams (preview only)
```

---

## Index Strategy

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| `library_access` | Primary | `id` | Primary key |
| `library_access` | Unique | `(user_id, post_id)` | Prevent duplicate access records |
| `library_access` | B-tree | `user_id` | Fast lookup by user |
| `forum_posts` | B-tree | `is_library_visible, created_at` | Library listing queries |
| `forum_posts` | B-tree | `is_admin_upload` | Admin content filtering |
| `user_subscriptions` | B-tree | `grace_period_end` | Grace period expiry checks |
