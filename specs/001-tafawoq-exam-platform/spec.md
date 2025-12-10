# Feature Specification: Tafawoq - Saudi Aptitude Exam Preparation Platform

**Feature Branch**: `001-tafawoq-exam-platform`
**Created**: 2025-12-11
**Status**: Draft
**Input**: User description: Comprehensive Next.js web application for Arabic-speaking students preparing for Saudi aptitude exams (القدرات)

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New User Registration & Onboarding (Priority: P1)

A new Arabic-speaking student discovers Tafawoq and wants to create an account to start preparing for their upcoming Saudi aptitude exam (القدرات). They need to register, select their academic track (Scientific or Literary), choose a subscription plan, and understand how the platform works.

**Why this priority**: This is the critical entry point for all users. Without successful registration and onboarding, no other features can be accessed. This establishes the user's profile settings that drive personalized content throughout the platform.

**Independent Test**: Can be fully tested by completing the registration flow from welcome screen through dashboard access, delivering immediate value by establishing user identity and preferences.

**Acceptance Scenarios**:

1. **Given** a new user on the welcome screen, **When** they click "Create Account", **Then** they see the email and password registration form with Terms of Service and Privacy Policy checkboxes.

2. **Given** a user has entered valid email and password and accepted terms, **When** they submit the form, **Then** they receive a 6-digit OTP verification email within 60 seconds.

3. **Given** a user enters the correct OTP, **When** they submit verification, **Then** they proceed to academic track selection screen showing Scientific (المسار العلمي) and Literary (المسار الأدبي) options with clear explanations.

4. **Given** a user selects their academic track, **When** they proceed, **Then** they see subscription options (Free Plan and Premium Monthly) with feature comparisons.

5. **Given** a user selects Free Plan, **When** they confirm, **Then** they access the main dashboard immediately and see the onboarding tutorial.

6. **Given** a user selects Premium Plan, **When** they proceed, **Then** they see the Stripe payment form with 3-day trial messaging.

7. **Given** a premium user completes payment, **When** transaction succeeds, **Then** they access the dashboard with full premium features unlocked.

---

### User Story 2 - Full Integrated Exam Experience (Priority: P1)

A registered student wants to take a complete practice exam that simulates actual Saudi Aptitude Test conditions. They need to start an exam, answer 96 questions within 120 minutes, receive immediate feedback on each answer, and view comprehensive results.

**Why this priority**: Full exams are the core value proposition of the platform. They provide the primary means for students to assess their readiness and track progress toward their exam goals.

**Independent Test**: Can be fully tested by starting a full exam, answering questions, seeing feedback, and viewing final results with section scores.

**Acceptance Scenarios**:

1. **Given** a registered user on the dashboard, **When** they click "Start Full Exam", **Then** they see a confirmation modal showing 96 questions, 120 minutes duration, and their track-based question distribution.

2. **Given** a Scientific track user starts an exam, **When** questions are generated, **Then** approximately 57 questions are quantitative (advanced level) and 39 are verbal.

3. **Given** a Literary track user starts an exam, **When** questions are generated, **Then** approximately 29 questions are quantitative (basic level) and 67 are verbal.

4. **Given** a user is answering an exam question, **When** they select an answer, **Then** the correct answer is immediately highlighted in green and their selection shows success (green checkmark) or error (red indicator) state.

5. **Given** a user answered a question, **When** they click "Show Explanation" (عرض التوضيح), **Then** they see the correct answer, explanation, solving strategy, and tip sections (availability based on subscription).

6. **Given** a user completes all 96 questions or time expires, **When** the exam ends, **Then** they see results with three percentages: Verbal (اللفظي), Quantitative (الكمي), and Overall Average.

7. **Given** a free user has taken 3 exams this week, **When** they attempt a 4th exam, **Then** they see an upgrade prompt instead of exam launch.

---

### User Story 3 - Customized Practice Session (Priority: P2)

A student wants to focus their practice on specific weak areas. They need to create a targeted practice session by selecting sections, categories, difficulty level, and question count to address specific improvement needs.

**Why this priority**: Customized practice enables targeted learning after users identify weaknesses through full exams. It provides the primary mechanism for improvement and skill development.

**Independent Test**: Can be fully tested by creating a practice session with custom parameters and completing it to see practice-specific results.

**Acceptance Scenarios**:

1. **Given** a registered user selects "Customized Practice", **When** the wizard opens, **Then** they see Step 1 with Quantitative (القسم الكمي) and Verbal (القسم اللفظي) section cards.

2. **Given** a user selects Quantitative section, **When** they proceed to Step 2, **Then** they see only quantitative categories: Algebra, Geometry, Statistics, Ratios, Probability, Speed/Time/Distance.

3. **Given** a user selects Verbal section, **When** they proceed to Step 2, **Then** they see only verbal categories: Reading Comprehension, Sentence Completion, Contextual Error, Verbal Analogies, Association & Difference, Vocabulary.

4. **Given** a free user in Step 2, **When** they select categories, **Then** they can only select maximum 2 categories and see "Premium" badges on locked options.

5. **Given** a user reaches Step 3, **When** they configure the practice, **Then** they can select difficulty (Easy/Medium/Hard) and see question count options based on subscription tier.

6. **Given** a free user in Step 3, **When** viewing question count, **Then** only 5 questions is available (fixed).

7. **Given** a premium user in Step 3, **When** viewing question count, **Then** they see preset options (5, 10, 20, 30, 50) plus custom input up to 100.

8. **Given** a user clicks "Start Practice", **When** practice generates, **Then** questions match selected categories, difficulty, and question count, adjusted for user's academic track.

---

### User Story 4 - Exam Results & Performance Analytics (Priority: P2)

A student who completed an exam or practice session wants to review their performance, understand their strengths and weaknesses, and receive personalized improvement recommendations.

**Why this priority**: Results and analytics drive user engagement and provide the feedback loop necessary for learning. Without clear performance insights, users cannot effectively improve.

**Independent Test**: Can be fully tested by viewing results after completing any exam or practice session and verifying all analytics display correctly.

**Acceptance Scenarios**:

1. **Given** a user completes a full exam, **When** results display, **Then** they see three prominent percentage scores with color coding (Gold for 90-100%, Green for 75-89%, Grey for 60-74%, Warm tone for <60%).

2. **Given** a user views full exam results, **When** analyzing performance, **Then** they see top 3 strength categories (above personal average) and top 3 weakness categories (below personal average).

3. **Given** a user views results, **When** they check improvement advice, **Then** they see personalized recommendations including specific category practice suggestions and time allocation guidance.

4. **Given** a user views results, **When** they click "Practice Specific Categories", **Then** they navigate to customized practice with weak areas pre-selected.

5. **Given** a user completes a practice session, **When** results display, **Then** they see a single percentage score (practice results do NOT affect overall profile percentages).

6. **Given** a user completes any practice, **When** checking profile, **Then** their total practice hours counter has incremented.

7. **Given** a premium user views results, **When** checking comparative metrics, **Then** they see historical averages, trend indicators, and peer percentile comparisons.

---

### User Story 5 - Question Display & Multimedia Support (Priority: P2)

A student answering exam questions needs to see questions clearly in Arabic (RTL layout) with support for both text-only questions and questions with images (geometric diagrams, tables, graphs).

**Why this priority**: Proper question presentation is essential for exam simulation accuracy. The Saudi aptitude exam includes various question formats that must be faithfully represented.

**Independent Test**: Can be fully tested by viewing different question types and verifying proper Arabic rendering, image display, and responsive layouts.

**Acceptance Scenarios**:

1. **Given** a text-only question displays, **When** viewing on any device, **Then** Arabic text renders right-to-left with appropriate line height and full-width layout.

2. **Given** a question with image displays, **When** viewing the image, **Then** it scales responsively, supports high DPI screens, and shows Arabic captions where applicable.

3. **Given** a geometry question displays, **When** viewing the diagram, **Then** the user can click to zoom for detailed inspection.

4. **Given** a question is loading, **When** image is still fetching, **Then** a skeleton screen with placeholder text displays.

5. **Given** any question displays, **When** checking question header, **Then** question number, section indicator (e.g., "السؤال 12 - اللفظي"), and difficulty badge (سهل/متوسط/صعب) are visible.

6. **Given** a reading comprehension question displays, **When** viewing the passage, **Then** the full text passage appears with multiple questions referencing the same passage.

---

### User Story 6 - Subscription Management & Payments (Priority: P3)

A user wants to manage their subscription, upgrade from free to premium, view their subscription status, or modify their plan settings.

**Why this priority**: Subscription management is essential for monetization and user retention, but depends on users first experiencing value through registration and exam taking.

**Independent Test**: Can be fully tested by checking subscription status, initiating upgrades, processing payments, and viewing billing information.

**Acceptance Scenarios**:

1. **Given** a free user views their profile, **When** checking subscription status, **Then** they see "Free Plan" badge and "Upgrade to Premium" button.

2. **Given** a premium user views their profile, **When** checking subscription status, **Then** they see "Premium" badge and subscription renewal date.

3. **Given** a trial user views their profile, **When** checking subscription status, **Then** they see countdown showing days remaining in trial.

4. **Given** a user clicks upgrade button, **When** the payment form appears, **Then** they see Stripe-hosted secure form with 3-day trial messaging and monthly price.

5. **Given** a user completes payment, **When** transaction processes, **Then** they see inline feedback with loading indicator and success/error messages.

6. **Given** a premium user accesses settings, **When** viewing subscription options, **Then** they can cancel (effective end of billing cycle) and view billing history.

---

### User Story 7 - Profile & Academic Track Management (Priority: P3)

A registered user wants to view and update their profile information, change their academic track if their educational path changes, and track their overall progress.

**Why this priority**: Profile management supports long-term user engagement and allows users to adapt the platform to changing needs.

**Independent Test**: Can be fully tested by viewing profile, updating academic track, and verifying content recommendations change accordingly.

**Acceptance Scenarios**:

1. **Given** a user views their profile, **When** checking dashboard, **Then** they see their last full exam scores (اللفظي, كمي, Average) and total practice hours.

2. **Given** a user wants to change academic track, **When** they access settings, **Then** they can switch between Scientific and Literary tracks.

3. **Given** a user changes academic track, **When** they confirm the change, **Then** content recommendations recalibrate and future exam distributions adjust to new track.

4. **Given** a user views profile, **When** checking exam history, **Then** they see historical trends and performance comparisons.

5. **Given** a premium user wants to export data, **When** they access export options, **Then** they can download exam history and performance reports.

---

### User Story 8 - Onboarding Tutorial Experience (Priority: P3)

A new user who completed registration wants to understand how the platform works through an educational tutorial that explains full exams vs. practices, academic track benefits, and the performance tracking system.

**Why this priority**: Onboarding increases user success and reduces confusion, but is supplementary to the core registration flow.

**Independent Test**: Can be fully tested by viewing all three tutorial screens and verifying clear explanations and navigation.

**Acceptance Scenarios**:

1. **Given** a new user reaches the dashboard for first time, **When** the screen loads, **Then** the onboarding tutorial automatically displays.

2. **Given** a user views tutorial Screen 1, **When** reading content, **Then** they understand the difference between full integrated exams and customized practice sessions.

3. **Given** a user views tutorial Screen 2, **When** reading content, **Then** they understand how academic track selection optimizes their content and recommendations.

4. **Given** a user views tutorial Screen 3, **When** reading content, **Then** they understand the three-score system and practice hour tracking.

5. **Given** a user completes the tutorial, **When** they click "Start Preparing", **Then** they navigate to the main dashboard with tutorial marked as completed.

6. **Given** an existing user wants to review tutorial, **When** they access Settings > Help, **Then** they can replay the onboarding sequence.

---

### Edge Cases

- What happens when a user's internet connection drops mid-exam? → **Resolved**: Auto-save progress after each answer; timer pauses on disconnect; user resumes from last saved answer upon reconnection.
- How does the system handle partial exam completion if the browser tab closes or crashes? → **Resolved**: Same auto-save mechanism; user can resume exam within the session validity window.
- What happens when Stripe payment fails after multiple retry attempts?
- How does the system behave when the weekly exam limit resets mid-week?
- What happens when a user switches academic tracks while having a partially completed practice?
- How does the system handle OTP expiration during registration?
- What happens when image assets fail to load for a question?
- How does the platform handle users who attempt to circumvent subscription limits?

---

## Clarifications

### Session 2025-12-11

- Q: What authentication mechanism should be used for API requests? → A: Supabase Auth with JWT (as defined in planning docs)
- Q: Which AI provider should be used for question generation? → A: Google Gemini (multimodal, competitive Arabic support)
- Q: How should the system handle internet disconnection mid-exam? → A: Auto-save progress + resume from last answer (timer pauses on disconnect)
- Q: What is the question generation strategy? → A: On-demand generation via Gemini API per exam/practice session (as defined in planning docs)
- Q: What is the data retention policy? → A: Retain indefinitely + user can request full deletion (PDPL compliant)
- Q: What observability approach should be used? → A: Basic error tracking only (Sentry or similar)

---

## Requirements *(mandatory)*

### Functional Requirements

#### Authentication & Registration

- **FR-001**: System MUST allow users to register with email and password meeting complexity requirements (minimum 8 characters with uppercase, lowercase, number, symbol).
- **FR-002**: System MUST send email verification with 6-digit OTP within 60 seconds of registration submission.
- **FR-003**: System MUST allow OTP resend with 60-second cooldown between attempts.
- **FR-004**: System MUST require explicit acceptance of Terms of Service and Privacy Policy before registration completion.
- **FR-005**: System MUST support returning user sign-in with email and password.
- **FR-005a**: System MUST use Supabase Auth for authentication, leveraging its built-in JWT handling and session management.

#### Academic Track & Profile

- **FR-006**: System MUST require academic track selection (Scientific or Literary) during onboarding before dashboard access.
- **FR-007**: System MUST allow users to change academic track from settings at any time.
- **FR-008**: System MUST adjust exam question distribution based on user's academic track (Scientific: 60% quantitative/40% verbal; Literary: 30% quantitative/70% verbal).
- **FR-009**: System MUST adjust quantitative question complexity based on academic track (advanced for Scientific, basic for Literary).
- **FR-010**: System MUST persist user profile data including email, academic track, subscription status, and performance history.
- **FR-010a**: System MUST retain user data indefinitely unless user requests deletion.
- **FR-010b**: System MUST provide users ability to request complete account and data deletion (PDPL compliance).
- **FR-010c**: System MUST complete data deletion requests within 30 days of request.

#### Subscription Management

- **FR-011**: System MUST offer two subscription tiers: Free Plan and Monthly Paid Plan.
- **FR-012**: System MUST limit Free Plan users to 3 full exam attempts per week.
- **FR-013**: System MUST limit Free Plan practice sessions to 5 questions maximum and 2 categories maximum per session.
- **FR-014**: System MUST delay explanation access for Free Plan users by 24 hours after exam completion.
- **FR-015**: System MUST provide unlimited exam and practice access for Premium subscribers.
- **FR-016**: System MUST integrate with Stripe for secure payment processing.
- **FR-017**: System MUST provide 3-day free trial for new Premium subscribers with credit card on file.
- **FR-018**: System MUST display subscription status badge on user profile.
- **FR-019**: System MUST show upgrade prompts when Free users encounter feature restrictions.

#### Full Integrated Exam

- **FR-020**: System MUST generate 96-question exams combining verbal and quantitative sections.
- **FR-021**: System MUST enforce 120-minute (2-hour) time limit for full exams.
- **FR-022**: System MUST present 4-option multiple choice questions with single correct answer.
- **FR-023**: System MUST randomize question order within exams (NOT ordered by difficulty).
- **FR-024**: System MUST provide immediate answer feedback showing correct answer highlighted and user selection state.
- **FR-025**: System MUST NOT penalize incorrect answers in scoring calculations.
- **FR-025a**: System MUST auto-save exam progress after each answer submission to the server.
- **FR-025b**: System MUST pause the exam timer when network disconnection is detected and resume upon reconnection.
- **FR-025c**: System MUST allow users to resume incomplete exams from their last saved answer within the same calendar day.

#### Customized Practice

- **FR-026**: System MUST require section selection (Quantitative, Verbal, or both) as first step of practice creation.
- **FR-027**: System MUST display only relevant categories based on selected sections.
- **FR-028**: System MUST allow difficulty selection (Easy, Medium, Hard) for practice sessions.
- **FR-029**: System MUST allow Premium users to select custom question count up to 100.
- **FR-030**: System MUST track practice session time as elapsed (not countdown).
- **FR-031**: Practice results MUST NOT affect user's overall profile percentage scores.
- **FR-032**: System MUST increment total practice hours counter upon practice completion.

#### Question Presentation

- **FR-033**: System MUST render all content in Arabic with proper RTL layout.
- **FR-034**: System MUST support text-only question format with appropriate line height.
- **FR-035**: System MUST support text-with-image question format with responsive sizing.
- **FR-036**: System MUST support click-to-zoom for question images.
- **FR-037**: System MUST display question number, section indicator, and difficulty badge for each question.
- **FR-038**: System MUST show skeleton loading states while images load.
- **FR-039**: System MUST support reading comprehension passages with multiple associated questions.

#### AI Question Generation

- **FR-040**: System MUST generate questions measuring mental/cognitive abilities, analytical reasoning, and critical thinking (NOT memorization).
- **FR-041**: System MUST generate questions based on general high school skills, not specific curriculum.
- **FR-042**: System MUST generate questions appropriate for mental calculation (no calculator required).
- **FR-043**: System MUST generate quantitative questions covering: Algebra, Geometry, Statistics, Ratios/Percentages/Fractions, Probability, Speed/Time/Distance.
- **FR-044**: System MUST generate verbal questions covering: Reading Comprehension, Sentence Completion, Contextual Error, Verbal Analogies, Association & Difference, Vocabulary.
- **FR-045**: System MUST include geometric diagrams for applicable geometry and statistics questions.

#### Results & Analytics

- **FR-046**: System MUST display three percentage scores for full exams: Verbal, Quantitative, and Overall Average.
- **FR-047**: System MUST apply color coding to scores: Gold (90-100%), Green (75-89%), Grey (60-74%), Warm tone (<60%).
- **FR-048**: System MUST identify top 3 strength categories and top 3 weakness categories.
- **FR-049**: System MUST provide personalized improvement recommendations based on performance.
- **FR-050**: System MUST persist exam history for trend analysis on user profile.
- **FR-051**: Premium users MUST have access to advanced analytics including trend indicators and peer percentile comparisons.
- **FR-052**: Premium users MUST be able to export exam history and performance reports.

#### Explanation System

- **FR-053**: System MUST provide explanation content including: correct answer, answer explanation, solving strategy, and tip.
- **FR-054**: Premium users MUST have instant access to explanations after each answer.
- **FR-055**: Free users MUST wait 24 hours after exam completion to access explanations.

---

### Key Entities

- **User**: Represents a registered student with email, password hash, academic track selection, subscription status, profile preferences, and creation timestamp.

- **Subscription**: Represents user's subscription state including tier (Free/Premium), status (active/cancelled/trial), billing cycle dates, Stripe customer reference, and payment history.

- **Exam Session**: Represents a full integrated exam attempt with 96 questions, start time, duration, completion status, and final scores (verbal, quantitative, overall).

- **Practice Session**: Represents a customized practice attempt with selected sections, categories, difficulty, question count, duration, and completion score.

- **Question**: Represents an AI-generated question with section type (verbal/quantitative), category, difficulty level, question text in Arabic, optional image reference, 4 answer options, correct answer indicator, and explanation content.

- **User Answer**: Represents a user's response to a question within a session including selected answer, correctness, time spent, and explanation view status.

- **Performance Record**: Represents aggregated user performance metrics including category-level scores, historical trends, total practice hours, and exam attempt history.

- **Academic Track Configuration**: Represents track-specific settings including quantitative/verbal ratio, difficulty levels by category, and content complexity mappings.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the full registration and onboarding flow (from welcome screen to dashboard access) in under 5 minutes.

- **SC-002**: Users can start a full integrated exam within 10 seconds of clicking "Start Full Exam" (question generation and display).

- **SC-003**: System supports at least 1,000 concurrent users taking exams simultaneously without performance degradation.

- **SC-004**: 90% of users successfully complete their first full exam within their first week of registration.

- **SC-005**: Answer feedback (correct/incorrect highlight) displays within 500 milliseconds of answer selection.

- **SC-006**: Users can view complete exam results (all three scores, strengths, weaknesses, recommendations) within 3 seconds of exam completion.

- **SC-007**: 80% of users who complete an exam proceed to take a customized practice session within 7 days.

- **SC-008**: Question images load and display correctly on 99% of attempts across supported devices.

- **SC-009**: All Arabic text renders correctly in RTL layout with no truncation or display issues.

- **SC-010**: Payment transactions complete successfully on 95% of first attempts.

- **SC-011**: Free-to-Premium conversion rate of at least 15% within first month of user registration.

- **SC-012**: Users report satisfaction score of 4.0 or higher (out of 5) for exam experience accuracy compared to actual Saudi aptitude test format.

### Non-Functional Requirements

- **NFR-001**: System MUST integrate error tracking (Sentry or similar) to capture and report runtime errors with context.
- **NFR-002**: Error tracking MUST capture user context (anonymized), browser info, and stack traces for debugging.
- **NFR-003**: Critical errors MUST be reported in real-time to enable rapid response.

---

## Assumptions

- Users have modern web browsers (Chrome, Firefox, Safari, Edge) capable of running Next.js applications with adequate screen sizes for Arabic text display.
- Users have reliable internet connectivity for exam taking and payment processing.
- Stripe payment integration is available for Saudi Arabian users.
- AI question generation will be handled by Google Gemini API, leveraging its multimodal capabilities for generating questions with diagrams and strong Arabic language support.
- The platform will launch as a Next.js web application with responsive design for desktop and mobile browsers.
- Error tracking will be implemented using Sentry (or similar service) for production monitoring.
- Email delivery infrastructure is available for OTP verification.
- Image storage and CDN services are available for question media assets.
- Users are familiar with the Saudi aptitude exam format and expectations.

---

## Out of Scope

- Native mobile applications (iOS/Android) - web-first approach with responsive design
- Social features (study groups, peer competitions, leaderboards)
- Live tutoring or instructor support
- Offline exam functionality
- Multiple language support beyond Arabic
- Integration with official Saudi education systems or score reporting
- Parental monitoring or family account features
- Gamification elements beyond practice hours tracking
