# Feature Specification: Platform Upgrade V2 - Rebranding, Exam Library & Subscription Overhaul

**Feature Branch**: `003-platform-upgrade-v2`
**Created**: 2025-12-15
**Status**: Draft
**Input**: User description: "Platform upgrade with app rebranding, exam library, new subscription plans with reward system, admin features, and UI/UX improvements"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Exam Library Access and Usage (Priority: P1)

A user wants to access exams created by other users to practice and prepare for their tests. The exam library provides a centralized place to discover, access, and take community-generated exams.

**Why this priority**: The exam library is the core new feature that enables community-driven content sharing and is essential for the platform's value proposition. It directly ties into the subscription model and reward system.

**Independent Test**: Can be fully tested by having a user browse the library, select an exam, complete it, and verify it appears in their exam history.

**Acceptance Scenarios**:

1. **Given** a free user with no previous library usage, **When** they browse the exam library, **Then** they can see all available exams with preview information (title, section, question count, creator)
2. **Given** a free user, **When** they attempt to access a library exam, **Then** they can access only 1 exam total from the library
3. **Given** a free user who has used their 1 free library exam, **When** they try to access another library exam, **Then** they see an upgrade prompt
4. **Given** a premium user, **When** they access any library exam, **Then** they can take unlimited exams from the library
5. **Given** any user completing a library exam, **When** they finish, **Then** the exam appears in their exam history
6. **Given** any user, **When** they complete a library exam, **Then** that exam cannot be shared with others (only user-generated exams can be shared)

---

### User Story 2 - Subscription Plans with Reward System (Priority: P1)

Users can choose between Free and Premium subscription plans. Both plans include a reward system where sharing content earns additional exam/practice credits.

**Why this priority**: The subscription model is foundational to the business and directly impacts how users interact with all other features.

**Independent Test**: Can be fully tested by creating users on each plan, verifying their limits, testing the reward mechanism when content is shared and completed by others.

**Acceptance Scenarios**:

1. **Given** a new free user, **When** they view their account limits, **Then** they see: 2 exams, 3 practices, ability to share up to 2 exams and 3 practices
2. **Given** a free user with 0 exam credits, **When** another user completes their shared exam, **Then** they receive 1 exam credit as a reward
3. **Given** a free user with 0 practice credits, **When** another user completes their shared practice, **Then** they receive 1 practice credit as a reward
4. **Given** a free user who has shared their maximum (2 exams, 3 practices), **When** they try to share more, **Then** they see an upgrade prompt
5. **Given** a premium user, **When** they view their account limits, **Then** they see: 10 exams, 15 practices, ability to share up to 10 exams and 15 practices
6. **Given** a premium user, **When** another user completes their shared content, **Then** they receive 1 credit as a reward (same reward mechanism as free)
7. **Given** the premium plan pricing page, **When** a user views the price, **Then** they see 49 SAR (with strikethrough showing original price of 100 SAR)

---

### User Story 3 - Practice Session Limits (Priority: P2)

When creating a practice session, users can only select up to half the number of questions available in that section from the exam bank.

**Why this priority**: This ensures practice sessions are appropriately sized and encourages users to generate more exams for comprehensive coverage.

**Independent Test**: Can be fully tested by creating a practice session and verifying the maximum question limit matches half the section's exam question count.

**Acceptance Scenarios**:

1. **Given** a section with 40 verbal questions in the exam, **When** a user creates a practice for verbal, **Then** the maximum selectable questions is 20
2. **Given** a section with an odd number (e.g., 41 questions), **When** calculating the practice limit, **Then** the system rounds down to 20
3. **Given** a user creating a practice, **When** they try to select more than the maximum, **Then** they cannot exceed the limit and see an explanation

---

### User Story 4 - App Rebranding and Landing Page (Priority: P2)

The platform receives a new name, logo, and updated landing page that reflects all new features including exam sharing, forum discussions, and the library.

**Why this priority**: Branding creates first impressions and communicates the platform's value proposition to new users.

**Independent Test**: Can be fully tested by visiting the landing page and verifying all new features are highlighted with clear calls-to-action.

**Acceptance Scenarios**:

1. **Given** a new visitor, **When** they arrive at the landing page, **Then** they see the new app name and logo prominently displayed
2. **Given** a visitor on the landing page, **When** they scroll through features, **Then** they see sections for: exam sharing for rewards, community library, forum discussions, and practice modes
3. **Given** a user starting the onboarding tutorial, **When** they go through it, **Then** they learn about exam sharing rewards, forum features, and library access

---

### User Story 5 - Reward Notification System (Priority: P2)

Users receive modern, engaging notifications throughout the app when they earn rewards from sharing content.

**Why this priority**: Notifications encourage engagement with the reward system and motivate users to share more content.

**Independent Test**: Can be fully tested by completing another user's shared exam and verifying the original user receives a notification.

**Acceptance Scenarios**:

1. **Given** a user whose shared exam was completed by another user, **When** the completion occurs, **Then** they receive an in-app notification with reward details
2. **Given** multiple pending rewards, **When** a user opens the app, **Then** they see a notification badge or banner summarizing new rewards
3. **Given** any notification, **When** the user views it, **Then** they can see details and optionally dismiss it
4. **Given** notification preferences, **When** a user adjusts settings, **Then** they can control notification frequency and types

---

### User Story 6 - Admin Exam/Practice Management (Priority: P3)

Administrators can upload exam/practice content via JSON format to populate the library with curated, externally-generated content.

**Why this priority**: Admin tools enable content quality control and allow exams generated outside the platform (e.g., Claude Web) to be added after review.

**Independent Test**: Can be fully tested by an admin uploading JSON, verifying it renders correctly, and appears in the library for users.

**Acceptance Scenarios**:

1. **Given** an admin user, **When** they access the admin section, **Then** they see an option to upload exam/practice JSON
2. **Given** valid JSON content, **When** an admin uploads it, **Then** the system validates, renders a preview, and stores the content
3. **Given** stored admin content, **When** any user browses the library, **Then** they see the admin-uploaded exams/practices available
4. **Given** invalid JSON, **When** an admin attempts upload, **Then** they receive clear error messages about what's wrong

---

### User Story 7 - Maintenance Mode (Priority: P3)

Administrators can enable maintenance mode to temporarily prevent users from generating exams, creating practices, or subscribing.

**Why this priority**: Maintenance mode is essential for platform stability during updates but is not user-facing functionality.

**Independent Test**: Can be fully tested by enabling maintenance mode and verifying restricted actions show appropriate messages.

**Acceptance Scenarios**:

1. **Given** maintenance mode is enabled, **When** a user tries to generate an exam, **Then** they see a maintenance message and cannot proceed
2. **Given** maintenance mode is enabled, **When** a user tries to create a practice, **Then** they see a maintenance message and cannot proceed
3. **Given** maintenance mode is enabled, **When** a user tries to subscribe, **Then** they see a maintenance message and cannot proceed
4. **Given** maintenance mode is enabled, **When** a user browses existing content or takes existing exams, **Then** they can still do so (read-only operations allowed)

---

### Edge Cases

- What happens when a user's shared exam/practice is deleted after others have completed it? (Rewards already earned remain valid)
- What happens when a premium user downgrades to free? (Excess content remains but cannot create new until under limits; library access reverts to 1-exam limit)
- What happens when two users complete a shared exam simultaneously? (Both completions count, owner gets 2 rewards)
- How does the system handle network failures during reward credit? (Use optimistic updates with background sync)
- What happens when the library is empty? (Show helpful message encouraging users to share exams)
- What happens when admin JSON references invalid section types? (Reject with specific validation error)

## Requirements *(mandatory)*

### Functional Requirements

**Exam Library**
- **FR-001**: System MUST provide a browsable library of exams shared by other users
- **FR-001a**: System MUST display "Library" as a main navigation tab alongside Dashboard, Exams, Practice, and Forum
- **FR-002**: System MUST display exam preview information (title, section, question count, creator name) before access
- **FR-003**: System MUST limit free users to accessing exactly 1 exam from the library total (permanently tracked; does not reset)
- **FR-004**: System MUST allow premium users unlimited library access
- **FR-005**: System MUST add completed library exams to user's exam history
- **FR-006**: System MUST prevent library exams from being re-shared by users who took them

**Subscription Plans**
- **FR-007**: System MUST enforce free plan limits: 2 exam generations, 3 practice generations
- **FR-008**: System MUST enforce premium plan limits: 10 exam generations, 15 practice generations
- **FR-009**: System MUST enforce sharing limits: free users can share 2 exams and 3 practices; premium users can share 10 exams and 15 practices
- **FR-010**: System MUST display premium pricing at 49 SAR with original price (100 SAR) shown as strikethrough
- **FR-011**: System MUST NOT apply time-based restrictions (daily/weekly/monthly) on generation limits

**Reward System**
- **FR-012**: System MUST credit 1 exam to content owner when another user completes their shared exam
- **FR-013**: System MUST credit 1 practice to content owner when another user completes their shared practice
- **FR-014**: System MUST notify users when they receive rewards
- **FR-015**: System MUST track and display reward history/notifications prominently across the app

**Practice Limits**
- **FR-016**: System MUST limit practice question selection to half the exam section's question count (rounded down)
- **FR-017**: System MUST display the maximum allowed questions when creating a practice

**Branding & Onboarding**
- **FR-018**: System MUST display new app name "Qudratak - قدراتك" (meaning "Your Abilities") and logo throughout the application
- **FR-019**: System MUST update landing page to feature: exam sharing rewards, library access, forum discussions
- **FR-020**: System MUST update onboarding tutorial to explain new features

**Admin Features**
- **FR-021**: System MUST provide admin interface for uploading exam/practice content via JSON
- **FR-021a**: System MUST accept JSON matching the existing internal exam/practice data structure (no custom format)
- **FR-022**: System MUST validate and preview JSON content before storing
- **FR-023**: System MUST make admin-uploaded content available in the library

**Maintenance Mode**
- **FR-024**: System MUST allow admins to enable/disable maintenance mode
- **FR-025**: System MUST block exam generation, practice creation, and subscription when maintenance mode is active
- **FR-026**: System MUST allow read-only operations (browsing, taking existing content) during maintenance
- **FR-027**: System MUST display clear maintenance messaging to users

### Non-Functional Requirements

**Security & Access Control**
- **NFR-001**: Admin features MUST use existing Supabase authentication with an `is_admin` boolean flag in the user profile
- **NFR-002**: Admin access MUST be enforced via Supabase RLS policies checking the `is_admin` flag

**Payment & Subscription Reliability**
- **NFR-003**: System MUST retry failed subscription payments with a 3-day grace period before taking action
- **NFR-004**: System MUST auto-downgrade users to free plan after grace period expires without successful payment
- **NFR-005**: System MUST notify users of payment failures and pending downgrade during grace period

### Key Entities

- **ExamLibrary**: Collection of shareable exams; attributes include source (user-generated vs admin-uploaded), access count, availability status
- **LibraryAccess**: Permanent record of library exams accessed by each user; used to enforce free tier 1-exam limit
- **SubscriptionPlan**: User's current plan type (free/premium) with associated limits for generation and sharing
- **UserCredits**: Tracks available exam/practice credits, earned rewards, and sharing quota remaining
- **RewardTransaction**: Records of rewards earned; includes source user, action type (exam/practice completion), timestamp
- **Notification**: User notifications for rewards and system messages; includes type, content, read status, timestamp
- **MaintenanceConfig**: System configuration for maintenance mode; includes status, message, allowed operations

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can browse the exam library and access an exam within 30 seconds
- **SC-002**: 80% of users who share content receive at least one reward within their first week
- **SC-003**: Users can complete the upgrade from free to premium in under 2 minutes
- **SC-004**: Admin can upload and publish new exam content within 5 minutes
- **SC-005**: Notification delivery occurs within 10 seconds of reward-triggering action
- **SC-006**: 90% of new users complete the updated onboarding tutorial
- **SC-007**: Maintenance mode can be enabled/disabled within 1 minute by admin
- **SC-008**: Users understand their remaining credits/limits at a glance (visible on dashboard)

## Clarifications

### Session 2025-12-15

- Q: How should user authentication be handled for admin features? → A: Existing Supabase auth with `is_admin` flag in user profile (checked via RLS policies)
- Q: How should Stripe payment integration handle subscription failures? → A: Retry with 3-day grace period, then auto-downgrade to free plan
- Q: How should the system track which library exam a free user has accessed? → A: Permanent record in database (user can never access another library exam on free plan)
- Q: Where should the exam library be accessible from in the app navigation? → A: Main navigation tab alongside existing sections (Dashboard, Exams, Practice, Forum, Library)
- Q: What is the expected JSON schema format for admin exam/practice uploads? → A: Match existing internal exam data structure used by the platform

## Assumptions

- Currency is SAR (Saudi Riyal) for pricing
- "Section" refers to exam sections like Verbal, Quantitative, etc. that already exist in the platform
- Rewards are additive - they add to remaining credits, not total lifetime allowance
- Admin-uploaded content is considered "library content" and follows the same access rules
- The reward system applies equally to both free and premium users
- Time-based restrictions (per week/month) are explicitly NOT part of this plan per user requirements
- Existing forum functionality will be referenced in landing page but not modified
