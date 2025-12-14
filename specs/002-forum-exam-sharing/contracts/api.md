# API Contracts: Forum & Exam Sharing Platform

**Branch**: `002-forum-exam-sharing` | **Date**: 2025-12-14

## Base URL

All endpoints are relative to `/api/`

## Authentication

All endpoints require authentication via Supabase session cookie unless marked as public.
Admin endpoints require `is_admin: true` in user profile.

---

## Forum Posts API

### GET /api/forum/posts

List forum posts with cursor-based pagination.

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| cursor | string | No | - | Cursor for pagination (post ID) |
| limit | number | No | 20 | Items per page (max 50) |
| sort | string | No | 'newest' | Sort order: 'newest', 'most_liked', 'most_completed' |
| type | string | No | - | Filter by post_type: 'text', 'exam_share' |
| search | string | No | - | Search in title and body |

**Response** (200 OK):
```json
{
  "posts": [
    {
      "id": "uuid",
      "post_type": "exam_share",
      "title": "اختبار قدرات شامل - 40 سؤال",
      "body": "اختبار يغطي جميع أقسام القدرات...",
      "author": {
        "id": "uuid",
        "display_name": "أحمد محمد",
        "profile_picture_url": "https://..."
      },
      "shared_exam": {
        "id": "uuid",
        "section_counts": { "verbal": 20, "quantitative": 20 },
        "difficulty_distribution": { "easy": 10, "medium": 20, "hard": 10 },
        "question_count": 40
      },
      "like_count": 42,
      "love_count": 15,
      "comment_count": 8,
      "completion_count": 156,
      "user_reaction": { "like": true, "love": false },
      "is_edited": false,
      "created_at": "2025-12-14T10:00:00Z",
      "updated_at": "2025-12-14T10:00:00Z"
    }
  ],
  "next_cursor": "uuid-of-last-post",
  "has_more": true
}
```

---

### POST /api/forum/posts

Create a new forum post.

**Request Body**:
```json
{
  "post_type": "text" | "exam_share",
  "title": "عنوان المنشور",
  "body": "محتوى المنشور...",
  "shared_exam_id": "uuid",      // Required for exam_share
  "shared_practice_id": "uuid"   // Alternative for practice_share
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "post_type": "text",
  "title": "عنوان المنشور",
  "body": "محتوى المنشور...",
  "author": { ... },
  "created_at": "2025-12-14T10:00:00Z"
}
```

**Errors**:
- 400: Invalid input / missing required fields
- 403: User is banned from forum
- 409: Exam already shared

---

### GET /api/forum/posts/[id]

Get single post with full details.

**Response** (200 OK):
```json
{
  "id": "uuid",
  "post_type": "exam_share",
  "title": "...",
  "body": "...",
  "author": { ... },
  "shared_exam": { ... },
  "like_count": 42,
  "love_count": 15,
  "comment_count": 8,
  "completion_count": 156,
  "user_reaction": { "like": true, "love": false },
  "user_completed": false,
  "is_edited": false,
  "created_at": "...",
  "updated_at": "..."
}
```

---

### PUT /api/forum/posts/[id]

Update a post (author only).

**Request Body**:
```json
{
  "title": "عنوان معدل",
  "body": "محتوى معدل..."
}
```

**Response** (200 OK): Updated post object

**Errors**:
- 403: Not the author
- 404: Post not found

---

### DELETE /api/forum/posts/[id]

Delete a post (author or admin).

**Response** (204 No Content)

---

## Reactions API

### POST /api/forum/posts/[id]/reactions

Add a reaction to a post.

**Request Body**:
```json
{
  "reaction_type": "like" | "love"
}
```

**Response** (200 OK):
```json
{
  "like_count": 43,
  "love_count": 15,
  "user_reaction": { "like": true, "love": false }
}
```

---

### DELETE /api/forum/posts/[id]/reactions/[type]

Remove a reaction from a post.

**Response** (200 OK):
```json
{
  "like_count": 42,
  "love_count": 15,
  "user_reaction": { "like": false, "love": false }
}
```

---

## Comments API

### GET /api/forum/posts/[id]/comments

Get comments for a post with pagination.

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| cursor | string | No | - | Cursor for pagination |
| limit | number | No | 20 | Items per page |

**Response** (200 OK):
```json
{
  "comments": [
    {
      "id": "uuid",
      "content": "تعليق رائع!",
      "author": {
        "id": "uuid",
        "display_name": "محمد علي",
        "profile_picture_url": "https://..."
      },
      "like_count": 5,
      "user_liked": false,
      "is_edited": false,
      "replies": [
        {
          "id": "uuid",
          "content": "شكراً!",
          "author": { ... },
          "like_count": 2,
          "user_liked": true,
          "is_edited": false,
          "created_at": "..."
        }
      ],
      "created_at": "2025-12-14T11:00:00Z"
    }
  ],
  "next_cursor": "uuid",
  "has_more": false
}
```

---

### POST /api/forum/posts/[id]/comments

Create a comment on a post.

**Request Body**:
```json
{
  "content": "محتوى التعليق",
  "parent_id": "uuid"  // Optional, for replies
}
```

**Response** (201 Created): Comment object

**Errors**:
- 400: Reply to reply not allowed (max 2 levels)
- 403: User is banned

---

### PUT /api/forum/comments/[id]

Update a comment (author only).

**Request Body**:
```json
{
  "content": "تعليق معدل"
}
```

**Response** (200 OK): Updated comment object

---

### DELETE /api/forum/comments/[id]

Delete a comment (author or admin).

**Response** (204 No Content)

---

### POST /api/forum/comments/[id]/like

Like a comment.

**Response** (200 OK):
```json
{
  "like_count": 6,
  "user_liked": true
}
```

---

### DELETE /api/forum/comments/[id]/like

Remove like from comment.

**Response** (200 OK):
```json
{
  "like_count": 5,
  "user_liked": false
}
```

---

## Shared Exam Actions

### POST /api/forum/posts/[id]/start-exam

Start taking a shared exam.

**Response** (200 OK):
```json
{
  "session_id": "uuid",
  "session_type": "exam" | "practice",
  "redirect_url": "/exam/[session_id]" | "/practice/[session_id]"
}
```

**Errors**:
- 400: Post is not an exam share
- 403: Cannot take own shared exam
- 409: Already completed this shared exam

---

## Notifications API

### GET /api/notifications

Get user notifications with pagination.

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| cursor | string | No | - | Cursor for pagination |
| limit | number | No | 20 | Items per page |
| unread_only | boolean | No | false | Filter to unread only |

**Response** (200 OK):
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "exam_completed",
      "title": "إكمال اختبار",
      "message": "أحمد أكمل اختبارك المشارك",
      "target_type": "post",
      "target_id": "uuid",
      "is_read": false,
      "created_at": "2025-12-14T12:00:00Z"
    }
  ],
  "unread_count": 5,
  "next_cursor": "uuid",
  "has_more": true
}
```

---

### GET /api/notifications/count

Get unread notification count.

**Response** (200 OK):
```json
{
  "unread_count": 5
}
```

---

### POST /api/notifications/[id]/read

Mark notification as read.

**Response** (200 OK):
```json
{
  "id": "uuid",
  "is_read": true
}
```

---

### POST /api/notifications/read-all

Mark all notifications as read.

**Response** (200 OK):
```json
{
  "updated_count": 5
}
```

---

## Rewards API

### GET /api/rewards

Get user's reward balance and stats.

**Response** (200 OK):
```json
{
  "exam_credits": 10,
  "practice_credits": 15,
  "total_completions": 23,
  "next_milestone": 25,
  "progress_to_next": 23,
  "total_shares": 5,
  "credit_history": [
    {
      "type": "earned",
      "exam_credits": 5,
      "practice_credits": 5,
      "reason": "milestone_20",
      "timestamp": "2025-12-10T10:00:00Z"
    }
  ]
}
```

---

### POST /api/rewards/redeem

Redeem a credit.

**Request Body**:
```json
{
  "credit_type": "exam" | "practice"
}
```

**Response** (200 OK):
```json
{
  "exam_credits": 9,
  "practice_credits": 15,
  "redeemed": true
}
```

**Errors**:
- 400: Insufficient credits

---

## Reports API

### POST /api/reports

Report content for moderation.

**Request Body**:
```json
{
  "content_type": "post" | "comment",
  "content_id": "uuid",
  "reason": "spam" | "harassment" | "inappropriate_content" | "misinformation" | "other",
  "details": "تفاصيل إضافية..."
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "status": "pending",
  "created_at": "2025-12-14T13:00:00Z"
}
```

**Errors**:
- 400: Cannot report own content
- 409: Already reported this content

---

## Admin API

All admin endpoints require `is_admin: true`.

### GET /api/admin/dashboard

Get admin dashboard metrics.

**Response** (200 OK):
```json
{
  "metrics": {
    "daily_active_users": 1250,
    "new_registrations_today": 45,
    "exams_taken_today": 380,
    "posts_created_today": 28,
    "pending_reports": 12,
    "revenue_this_month": 15000
  },
  "trends": {
    "dau_change": 5.2,
    "registrations_change": -2.1
  }
}
```

---

### GET /api/admin/users

List users with search and pagination.

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| cursor | string | No | - | Cursor for pagination |
| limit | number | No | 20 | Items per page |
| search | string | No | - | Search by email or name |
| status | string | No | - | Filter: 'active', 'disabled', 'banned' |

**Response** (200 OK):
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "display_name": "أحمد محمد",
      "academic_track": "scientific",
      "subscription_tier": "premium",
      "is_admin": false,
      "is_banned": false,
      "is_disabled": false,
      "created_at": "2025-01-15T10:00:00Z",
      "last_active_at": "2025-12-14T09:00:00Z"
    }
  ],
  "next_cursor": "uuid",
  "has_more": true
}
```

---

### PUT /api/admin/users/[id]

Update user status.

**Request Body**:
```json
{
  "is_disabled": true,
  "is_banned": false
}
```

**Response** (200 OK): Updated user object

---

### POST /api/admin/users/[id]/reset-password

Trigger password reset for user.

**Response** (200 OK):
```json
{
  "message": "Password reset email sent"
}
```

---

### DELETE /api/admin/users/[id]

Delete user account.

**Response** (204 No Content)

---

### GET /api/admin/moderation

Get moderation queue.

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| cursor | string | No | - | Cursor for pagination |
| limit | number | No | 20 | Items per page |
| status | string | No | 'pending' | Filter: 'pending', 'resolved', 'dismissed' |

**Response** (200 OK):
```json
{
  "reports": [
    {
      "id": "uuid",
      "content_type": "post",
      "content_id": "uuid",
      "content_preview": "محتوى المنشور...",
      "content_author": { "id": "uuid", "display_name": "..." },
      "reporter": { "id": "uuid", "display_name": "..." },
      "reason": "harassment",
      "details": "...",
      "status": "pending",
      "created_at": "2025-12-14T08:00:00Z"
    }
  ],
  "next_cursor": "uuid",
  "has_more": false
}
```

---

### POST /api/admin/moderation/[id]/resolve

Resolve a report.

**Request Body**:
```json
{
  "action": "approve" | "delete_content" | "dismiss",
  "notes": "ملاحظات المشرف..."
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "status": "resolved",
  "resolved_at": "2025-12-14T14:00:00Z"
}
```

---

### GET /api/admin/settings

Get feature toggles.

**Response** (200 OK):
```json
{
  "features": [
    {
      "feature_name": "forum_enabled",
      "is_enabled": true,
      "description": "Enable/disable forum access"
    },
    {
      "feature_name": "rewards_enabled",
      "is_enabled": true,
      "description": "Enable/disable reward system"
    }
  ]
}
```

---

### PUT /api/admin/settings/[feature_name]

Toggle a feature.

**Request Body**:
```json
{
  "is_enabled": false
}
```

**Response** (200 OK): Updated feature object

---

### PUT /api/admin/users/[id]/subscription

Manage user subscription.

**Request Body**:
```json
{
  "action": "upgrade" | "downgrade" | "add_credits" | "extend_trial" | "cancel",
  "tier": "premium",
  "credits": { "exam": 5, "practice": 5 },
  "days": 7
}
```

**Response** (200 OK): Updated subscription object

---

## Error Response Format

All errors return:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "details": { "field": "title" }
  }
}
```

**Common Error Codes**:
- `VALIDATION_ERROR` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `INTERNAL_ERROR` (500)
