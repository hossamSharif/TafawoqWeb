# Feature Specification: Forum & Exam Sharing Platform

**Feature Branch**: `002-forum-exam-sharing`
**Created**: 2025-12-14
**Status**: Draft
**Input**: User description: "Forum and exam sharing system where users can share generated exams/practices, engage through a Reddit-inspired forum with posts, comments, likes, reactions, receive notifications, earn rewards, and admins have full platform control."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Share Exam/Practice with Community (Priority: P1)

A user who has created a high-quality exam or practice session wants to share it with the broader community so other students can benefit from the questions. The system removes the user's answers before sharing, allowing others to take the exam fresh.

**Why this priority**: Sharing is the foundational feature that enables community engagement. Without shared content, the forum has no purpose. This directly drives user value and platform growth.

**Independent Test**: Can be fully tested by selecting an exam to share, confirming sharing settings, and verifying the exam appears as shareable content without the original user's answers.

**Acceptance Scenarios**:

1. **Given** a user has completed at least one exam or practice session, **When** they navigate to their exam/practice history, **Then** they see a "Share" button next to each completed session.

2. **Given** a user clicks "Share" on an exam, **When** the sharing modal appears, **Then** they see an auto-generated description based on exam metadata (section types, difficulty, question count) that they can edit before posting.

3. **Given** a user confirms sharing, **When** the exam is published, **Then** it appears in the forum as a new post AND the original user's answers are NOT included in the shared version.

4. **Given** another user views a shared exam, **When** they click "Take this Exam", **Then** they can complete the exam as if it were a fresh practice session.

5. **Given** a user shares an exam, **When** checking their shared content dashboard, **Then** they see how many users have completed their shared exam.

---

### User Story 2 - Browse and Engage with Forum Posts (Priority: P1)

A student wants to discover shared exams from other users and engage with the community through a Reddit-inspired forum interface where they can browse posts, like content, and participate in discussions.

**Why this priority**: The forum is the central hub for community interaction. Without browsing and basic engagement, users cannot discover or interact with shared content.

**Independent Test**: Can be fully tested by navigating to the forum, viewing posts, and performing like/love interactions on content.

**Acceptance Scenarios**:

1. **Given** a user navigates to the forum section, **When** the page loads, **Then** they see a feed of posts sorted by recent activity (newest first by default).

2. **Given** a user views a forum post, **When** examining the post, **Then** they see: post title, description, author name, timestamp, like count, love count, comment count, and a direct link to take the shared exam/practice.

3. **Given** a user clicks the "Like" button on a post, **When** the action completes, **Then** the like count increments and the button shows their like state.

4. **Given** a user clicks the "Love" button on a post, **When** the action completes, **Then** the love count increments and the button shows their love state.

5. **Given** a user has already liked/loved a post, **When** they click the same button again, **Then** their reaction is removed and the count decrements.

6. **Given** a user views the forum, **When** they want to filter content, **Then** they can sort by: newest, most liked, most completed, or search by keyword.

---

### User Story 3 - Create Text Posts in Forum (Priority: P1)

A user wants to create a text-only post in the forum to share thoughts, ask questions, or discuss exam preparation strategies with the community.

**Why this priority**: Text posts enable community discussion beyond just exam sharing, fostering engagement and retention.

**Independent Test**: Can be fully tested by creating a new text post, submitting it, and verifying it appears in the forum feed.

**Acceptance Scenarios**:

1. **Given** a registered user in the forum section, **When** they click "Create Post", **Then** they see options for "Text Post" or "Share Exam/Practice".

2. **Given** a user selects "Text Post", **When** the form appears, **Then** they can enter a title (required, max 200 characters) and body text (required, max 5000 characters).

3. **Given** a user submits a valid text post, **When** the post is created, **Then** it appears in the forum feed and the user is redirected to their new post.

4. **Given** a user is the author of a post, **When** viewing their post, **Then** they see "Edit" and "Delete" options.

5. **Given** a user edits their post, **When** they save changes, **Then** the post shows "Edited" indicator with timestamp.

---

### User Story 4 - Comment on Forum Posts (Priority: P2)

A user wants to participate in discussions by adding comments to forum posts, replying to other comments, and engaging in threaded conversations.

**Why this priority**: Comments create deeper engagement and community value, but depend on having posts to comment on first.

**Independent Test**: Can be fully tested by viewing a post, adding a comment, and verifying the comment appears with correct attribution.

**Acceptance Scenarios**:

1. **Given** a user views a forum post, **When** they scroll to the comments section, **Then** they see existing comments sorted by newest first with author name, timestamp, and content.

2. **Given** a user types in the comment box and clicks "Post Comment", **When** the comment submits, **Then** it appears at the top of the comments list.

3. **Given** a user views a comment, **When** they click "Reply", **Then** they can write a reply that appears nested under the parent comment.

4. **Given** a user is the author of a comment, **When** viewing their comment, **Then** they see "Edit" and "Delete" options.

5. **Given** a user views comments, **When** they click "Like" on a comment, **Then** the comment's like count increments.

---

### User Story 5 - Receive Notifications for Sharing Activity (Priority: P2)

A user who shared an exam wants to be notified when other users complete their exam, comment on their post, or react to their content. Other users also receive notifications when new exams are shared that match their interests.

**Why this priority**: Notifications drive engagement and retention by keeping users informed of relevant activity.

**Independent Test**: Can be fully tested by triggering a notification event (e.g., someone completes a shared exam) and verifying the notification appears in the notification center and/or email.

**Acceptance Scenarios**:

1. **Given** User A shares an exam, **When** User B completes that exam, **Then** User A receives an in-app notification saying "User B completed your shared exam [exam name]".

2. **Given** User A shares an exam, **When** User B comments on the post, **Then** User A receives an in-app notification about the new comment.

3. **Given** a new exam is shared in the forum, **When** it matches another user's interests (same academic track), **Then** interested users receive an email notification (if enabled in preferences).

4. **Given** a user navigates to the notification section, **When** the page loads, **Then** they see a chronological list of all notifications with read/unread status.

5. **Given** a user has unread notifications, **When** viewing any page, **Then** they see a notification badge with unread count in the navigation.

6. **Given** a user clicks on a notification, **When** it opens, **Then** they are navigated to the relevant content (post, exam result, comment).

---

### User Story 6 - Earn Rewards for Sharing (Priority: P3)

A user who actively shares exams and helps the community wants to earn rewards in the form of free exam and practice credits that work within the subscription system.

**Why this priority**: Rewards incentivize sharing behavior but depend on the core sharing and completion tracking features being in place first.

**Independent Test**: Can be fully tested by sharing exams, having other users complete them, and verifying credits are awarded and can be redeemed.

**Acceptance Scenarios**:

1. **Given** a user has shared exams, **When** 5 unique users complete any of their shared exams (cumulative), **Then** the user earns 5 exam credits and 5 practice credits.

2. **Given** a user views their profile, **When** checking the rewards section, **Then** they see their current credit balance and progress toward the next reward milestone.

3. **Given** a free-tier user has earned exam credits, **When** they start a new exam beyond their weekly limit, **Then** they can use 1 credit to access the exam instead of upgrading.

4. **Given** a user uses an exam credit, **When** the exam starts, **Then** their credit balance decrements by 1.

5. **Given** a user has earned rewards, **When** viewing their sharing dashboard, **Then** they see statistics: total shares, total completions by others, credits earned, and credits remaining.

---

### User Story 7 - Report Inappropriate Content (Priority: P3)

A user encounters a forum post or comment that violates community guidelines and wants to report it for moderator review.

**Why this priority**: Content moderation is important for community health but depends on having content to moderate first.

**Independent Test**: Can be fully tested by reporting a post/comment and verifying it appears in the admin moderation queue.

**Acceptance Scenarios**:

1. **Given** a user views any post or comment, **When** they click the "Report" option, **Then** they see a report form with reason categories (spam, harassment, inappropriate content, misinformation, other).

2. **Given** a user submits a report, **When** the report is filed, **Then** they see a confirmation message and the content is flagged for moderator review.

3. **Given** a piece of content has been reported, **When** an admin reviews and takes action, **Then** the reporting user receives a notification about the resolution.

---

### User Story 8 - Admin Full Platform Control (Priority: P3)

An administrator needs to manage the entire platform including users, content moderation, subscriptions, and feature settings through a dedicated admin interface.

**Why this priority**: Admin capabilities are essential for platform operation but depend on having users and content to manage.

**Independent Test**: Can be fully tested by logging into the admin panel at `/admin` and performing CRUD operations on users, posts, and settings.

**Acceptance Scenarios**:

1. **Given** an admin navigates to `/admin`, **When** they are not logged in as admin, **Then** they see a dedicated admin login page.

2. **Given** an admin logs in with valid admin credentials, **When** authentication succeeds, **Then** they access the admin dashboard with platform overview metrics.

3. **Given** an admin in the user management section, **When** searching for a user, **Then** they can view user details, edit profiles, reset passwords, disable accounts, or delete accounts.

4. **Given** an admin in the content moderation section, **When** viewing the moderation queue, **Then** they see all reported content with report reasons and can approve, edit, or delete content.

5. **Given** an admin in the subscription section, **When** viewing a user's subscription, **Then** they can manually upgrade/downgrade tiers, add credits, extend trials, or cancel subscriptions.

6. **Given** an admin in the settings section, **When** managing feature toggles, **Then** they can enable/disable features platform-wide (e.g., forum posting, sharing, rewards).

7. **Given** an admin in the analytics section, **When** viewing dashboard, **Then** they see key metrics: daily active users, new registrations, exams taken, posts created, and revenue.

8. **Given** an admin views the forum, **When** they see any post or comment, **Then** they have direct "Edit" and "Delete" options without needing to go through moderation queue.

---

### Edge Cases

- What happens when a user tries to share an incomplete exam?
  - **Resolved**: Only completed exams/practices can be shared. Share button is disabled for incomplete sessions.

- What happens when the original exam creator deletes their account?
  - **Resolved**: Shared exams remain available but show "Deleted User" as author. Original creator's answers remain hidden.

- What happens if a user reports their own content?
  - **Resolved**: Self-reporting is blocked. Report button is hidden for user's own content.

- How does the system handle duplicate exam shares?
  - **Resolved**: Users can only share each exam once. Re-sharing requires creating a new post (which allows updating the description).

- What happens when a reported post is deleted while users are viewing it?
  - **Resolved**: Graceful handling with "This content is no longer available" message.

- What happens when a user completes a shared exam that was later deleted?
  - **Resolved**: Completion counts still apply to reward system; results remain in user's history.

- How does the notification system handle users with disabled email notifications?
  - **Resolved**: In-app notifications always work; email notifications respect user preferences.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Exam/Practice Sharing

- **FR-001**: System MUST allow users to share completed exams and practice sessions with the community.
- **FR-002**: System MUST remove the original user's answers when an exam is shared.
- **FR-003**: System MUST auto-generate a description for shared exams based on metadata (section types, categories, difficulty distribution, question count).
- **FR-004**: System MUST allow users to edit the auto-generated description before publishing.
- **FR-005**: System MUST prevent sharing of incomplete exam/practice sessions.
- **FR-006**: System MUST track which users have completed each shared exam.
- **FR-007**: System MUST allow exam owners to view completion statistics for their shared content.

#### Forum Posts

- **FR-008**: System MUST support two post types: text posts and exam share posts.
- **FR-009**: System MUST allow text posts with title (max 200 characters) and body (max 5000 characters).
- **FR-010**: System MUST display posts with author name, timestamp, like count, love count, and comment count.
- **FR-011**: System MUST allow post authors to edit and delete their own posts.
- **FR-012**: System MUST show "Edited" indicator with timestamp on modified posts.
- **FR-013**: System MUST support sorting posts by: newest, most liked, and most completed (for exam posts).
- **FR-014**: System MUST support keyword search across post titles and descriptions.
- **FR-014a**: System MUST use cursor-based pagination with infinite scroll for posts, comments, and notifications (20 items per page).

#### Reactions and Comments

- **FR-015**: System MUST support "Like" and "Love" reactions on posts.
- **FR-016**: System MUST allow users to toggle reactions (add/remove with single click).
- **FR-017**: System MUST support comments on posts with threaded replies (maximum 2 levels: comment → reply).
- **FR-018**: System MUST allow comment authors to edit and delete their own comments.
- **FR-019**: System MUST support "Like" reactions on comments.
- **FR-020**: System MUST display comments sorted by newest first.

#### Notifications

- **FR-021**: System MUST send in-app notifications when someone completes a user's shared exam.
- **FR-022**: System MUST send in-app notifications when someone comments on a user's post.
- **FR-023**: System MUST send in-app notifications when someone replies to a user's comment.
- **FR-024**: System MUST send email notifications for new shared exams matching user's academic track (when enabled).
- **FR-025**: System MUST display notification badge with unread count in navigation.
- **FR-026**: System MUST provide a notification center page showing all notifications with read/unread status.
- **FR-027**: System MUST allow users to configure notification preferences (email on/off per type).

#### Reward System

- **FR-028**: System MUST award 5 exam credits and 5 practice credits at cumulative milestones (5, 10, 15... unique completions across all of a user's shared exams).
- **FR-029**: System MUST track credit balance as part of user profile.
- **FR-030**: System MUST allow free-tier users to redeem 1 exam credit to take an exam beyond weekly limit.
- **FR-031**: System MUST allow free-tier users to redeem 1 practice credit for extended practice sessions.
- **FR-032**: System MUST display reward progress and credit balance in user profile.
- **FR-033**: System MUST integrate credits with existing subscription feature checks.

#### Content Moderation and Reporting

- **FR-034**: System MUST allow users to report posts and comments with reason categories.
- **FR-035**: System MUST prevent users from reporting their own content.
- **FR-036**: System MUST queue reported content for admin review.
- **FR-037**: System MUST notify reporting users of resolution outcomes.

#### Admin Panel

- **FR-038**: System MUST provide dedicated admin login at `/admin` route.
- **FR-039**: System MUST authenticate admins using the same Supabase Auth system with an `is_admin` role flag in user profile, checked server-side via RLS policies.
- **FR-040**: System MUST provide admin dashboard with platform overview metrics (DAU, registrations, exams, posts, revenue).
- **FR-041**: System MUST allow admins to search, view, edit, disable, and delete user accounts. Disabled accounts cannot login to the platform.
- **FR-042**: System MUST allow admins to reset user passwords.
- **FR-043**: System MUST provide content moderation queue showing all reported content.
- **FR-044**: System MUST allow admins to approve, edit, or delete any forum content.
- **FR-045**: System MUST allow admins to manage subscriptions (upgrade, downgrade, add credits, extend trials, cancel).
- **FR-046**: System MUST provide feature toggles for platform-wide feature control.
- **FR-047**: System MUST allow admins to ban users from forum participation. Banned users can still login and use exams/practice but cannot post, comment, share, or react in the forum.
- **FR-048**: System MUST log all admin actions for audit purposes.

---

### Key Entities

- **SharedExam**: Represents a shared exam/practice including reference to original session, sharing user, share timestamp, completion count, and visibility status (active/deleted).

- **ForumPost**: Represents a forum post with post type (text/exam), title, body/description, author reference, created/updated timestamps, like count, love count, and status (active/edited/deleted).

- **Comment**: Represents a comment on a post with content, author reference, parent comment reference (for replies), created/updated timestamps, like count, and status.

- **Reaction**: Represents a user's reaction to content with reaction type (like/love), target type (post/comment), target reference, and user reference.

- **Notification**: Represents a user notification with notification type, message content, target reference, read status, and created timestamp.

- **NotificationPreference**: Represents user's notification settings including email preferences per notification type.

- **UserCredits**: Represents user's reward credits with exam credit balance, practice credit balance, and earning history.

- **Report**: Represents a content report with reporter reference, content reference, reason category, additional details, status (pending/resolved), and resolution outcome.

- **AdminUser**: Regular user account with `is_admin` flag set to true, granting access to admin panel and elevated permissions. Admin status is set via direct database update or seed scripts.

- **AdminAuditLog**: Represents logged admin actions with admin reference, action type, target reference, timestamp, and action details.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can share a completed exam within 30 seconds of clicking "Share" (including description review).

- **SC-002**: Forum feed loads and displays first 20 posts within 2 seconds.

- **SC-003**: 50% of users who complete an exam discover and browse the forum within their first week.

- **SC-004**: Average of 3+ comments per exam share post within first 7 days of platform launch.

- **SC-005**: Notifications appear in user's notification center within 5 seconds of triggering event.

- **SC-006**: 20% of active users earn at least one reward milestone within their first month.

- **SC-007**: Admin can resolve a content report (review and take action) within 3 clicks from the moderation queue.

- **SC-008**: Admin dashboard loads with all metrics within 3 seconds.

- **SC-009**: 90% of reported content is reviewed within 24 hours of submission.

- **SC-010**: Shared exam completion rate (users who start actually finish) is at least 70%.

- **SC-011**: User satisfaction score of 4.0 or higher (out of 5) for forum experience.

- **SC-012**: Zero incidents of answer leakage from shared exams (original answers never exposed).

---

## Assumptions

- Existing user authentication via Supabase Auth will be extended to support admin authentication.
- Email delivery infrastructure (existing for OTP) will be used for notification emails.
- The existing exam_sessions and practice_sessions tables contain sufficient metadata to generate meaningful share descriptions.
- Users must be registered and logged in to share content or interact with the forum.
- The reward credit system will integrate with the existing subscription tier checks without modifying core subscription logic.
- Forum will be in Arabic with RTL layout consistent with the rest of the platform.
- Admin accounts will be created through direct database access or seed scripts (not self-registration).
- The platform has sufficient storage for increased user-generated content (posts, comments).

---

## Clarifications

### Session 2025-12-14

- Q: What should happen when an admin disables a user account vs. bans a user from the forum? → A: Different actions - Disabled = no login; Banned = can login but no forum actions
- Q: What is the maximum nesting depth for comment replies? → A: 2 levels (comment → reply, no deeper nesting)
- Q: How should admin authentication work? → A: Same Supabase Auth with admin role flag in user profile
- Q: What pagination strategy should be used for lists (posts, comments, notifications)? → A: Cursor-based pagination (infinite scroll)
- Q: How should the reward milestone system work? → A: Cumulative total - rewards at 5, 10, 15... completions across all shares

---

## Out of Scope

- Media uploads in forum posts (images, videos, files) - text and exam links only
- Private messaging between users
- User blocking/muting other users (only reporting)
- Forum post scheduling or drafts
- Forum categories or tags for organization (may be added later)
- Gamification beyond the credit reward system (badges, levels, leaderboards)
- Mobile push notifications (email and in-app only)
- Real-time chat or live discussions
- Content translation or multi-language support
- Third-party social media sharing integration
- Automated content moderation (AI-based filtering)
