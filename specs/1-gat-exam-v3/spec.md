# Feature Specification: GAT Exam Platform v3.0 - Advanced Diagrams & Quality Improvements

**Feature Branch**: `1-gat-exam-v3`
**Created**: 2026-01-05
**Status**: Draft
**Input**: User description: "Build a comprehensive update (v3.0) for the app, an AI-powered Saudi GAT (Qudurat) exam generation platform targeting Arabic-speaking students in the Middle East. This update focuses on implementing advanced diagram capabilities for overlapping shapes questions and improving the AI-powered question generation quality."

## Clarifications

### Session 2026-01-05

- Q: How should diagram configuration be stored in the database? → A: Store common fields (shape_type, pattern_id) as indexed columns, complex data (coordinates, shading) in JSONB (hybrid approach)
- Q: How should Arabic grammar validation be implemented? → A: LLM-based validation with human review queue for flagged items (balanced approach, catches most errors automatically)
- Q: How should mathematical accuracy be validated? → A: No automated validation - rely on AI generation accuracy and post-publication error reports (fastest, highest risk)
- Q: Which rendering technology should be implemented? → A: Mix of third-party libraries and other libraries, specific choices to be defined during planning phase
- Q: How should partial batch generation failures be handled? → A: Automatic retry from failure point with exponential backoff (fully automated, but may waste retries if issue persists)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Practice Overlapping Shapes Questions (Priority: P1)

As a Saudi student preparing for the GAT (Qudurat) exam, I want to practice questions with overlapping geometric shapes and shaded areas so that I can master this frequently-tested topic and improve my quantitative reasoning score.

**Why this priority**: Overlapping shapes questions represent a significant gap in current exam preparation. This is the most critical feature as it directly addresses missing content that appears frequently in real GAT exams (part of the 24% geometry section). Without this, students cannot fully prepare for a major exam topic.

**Independent Test**: Can be fully tested by generating a geometry question with overlapping shapes pattern (e.g., "square with quarter circles at corners"), viewing the diagram with proper shading and Arabic labels, answering the question, and seeing the solution formula. Delivers immediate value by enabling students to practice a previously unavailable question type.

**Acceptance Scenarios**:

1. **Given** I am on the practice exam page, **When** I select quantitative reasoning and start a practice session, **Then** I see geometry questions that include overlapping shapes with shaded regions clearly visible
2. **Given** I am viewing an overlapping shapes question, **When** I look at the diagram, **Then** I see Arabic labels for all vertices and measurements, proper shading of the calculated region, and the diagram renders clearly on my mobile device
3. **Given** I have answered an overlapping shapes question, **When** I submit my answer, **Then** I see the correct answer, the mathematical formula used to calculate the shaded area, and an explanation in formal Arabic
4. **Given** I am practicing geometry questions, **When** the system generates questions, **Then** I encounter different overlapping patterns (square with circles, rose pattern, tangent circles, etc.) to practice variety
5. **Given** I have visual impairment and use a screen reader, **When** I encounter a diagram, **Then** I hear a descriptive Arabic caption explaining the geometric configuration

---

### User Story 2 - Receive High-Quality AI-Generated Questions (Priority: P1)

As a student using the app for exam preparation, I want all generated questions to have correct calculations, proper Arabic grammar, and realistic difficulty so that I can trust the practice material matches actual GAT exam standards.

**Why this priority**: Question quality is fundamental to the platform's value. Poor quality questions undermine student trust and preparation effectiveness. This is P1 because it affects all question types across the entire platform, not just new features.

**Independent Test**: Can be fully tested by generating a batch of 20 questions across different topics, validating that all Arabic text is grammatically correct, all mathematical calculations are accurate, distractors reflect documented common errors, and difficulty distribution matches the specified 30% easy, 50% medium, 20% hard ratio.

**Acceptance Scenarios**:

1. **Given** I request a practice session with quantitative questions, **When** the system generates questions, **Then** 40% cover arithmetic topics, 24% geometry, 23% algebra, and 13% statistics (matching GAT distribution)
2. **Given** I request a practice session with verbal questions, **When** the system generates questions, **Then** 40% are reading comprehension, 25% analogy, 15% sentence completion, 12% context error, and 8% odd word out
3. **Given** I am answering a generated question, **When** I calculate the answer manually, **Then** the provided correct answer matches my calculation with no mathematical errors
4. **Given** I am reading generated questions, **When** I review the Arabic text, **Then** all grammar follows formal Arabic (فصحى) standards with proper diacritics and sentence structure
5. **Given** I am viewing answer choices, **When** I analyze the incorrect options, **Then** each distractor represents a plausible common mistake (e.g., forgetting to subtract an area, using diameter instead of radius)
6. **Given** I complete a 20-question practice session, **When** I review the difficulty distribution, **Then** approximately 6 questions are easy, 10 are medium, and 4 are hard
7. **Given** I am solving a quantitative question, **When** I attempt to calculate the answer, **Then** all numbers are suitable for mental calculation without requiring a calculator

---

### User Story 3 - Practice Comparison Questions (Priority: P2)

As a GAT exam student, I want to practice comparison questions (المقارنة) with two values to compare so that I can develop skills in determining relative magnitude without full calculation.

**Why this priority**: Comparison questions are a distinct GAT question format that requires specific logic and always uses the same four answer choices. While important, this is P2 because it represents one question subtype rather than a foundational capability like quality or a major content gap like overlapping shapes.

**Independent Test**: Can be fully tested by generating a comparison question, verifying it presents two mathematical expressions or values, confirming the four standard Arabic answer choices appear correctly, solving the comparison manually, and validating the system's correct answer matches the mathematical relationship.

**Acceptance Scenarios**:

1. **Given** I am practicing quantitative reasoning, **When** I receive a comparison question, **Then** I see two clearly labeled values or expressions (القيمة الأولى and القيمة الثانية)
2. **Given** I am answering a comparison question, **When** I view the answer choices, **Then** I see exactly four options: "القيمة الأولى أكبر", "القيمة الثانية أكبر", "القيمتان متساويتان", and "المعطيات غير كافية للمقارنة"
3. **Given** I am solving a comparison question, **When** the relationship requires additional information to determine, **Then** the correct answer is "المعطيات غير كافية للمقارنة" and the explanation clarifies what information is missing

---

### User Story 4 - Practice Word Problems (Priority: P2)

As a student preparing for practical applications in GAT, I want to practice word problems in realistic Arabic contexts (speed/distance, work problems, age problems, profit/loss, mixtures) so that I can apply mathematical concepts to everyday scenarios.

**Why this priority**: Word problems test applied mathematics understanding, a key GAT skill. This is P2 because while valuable for comprehensive preparation, students can still practice core mathematical concepts through abstract questions without word problem contexts.

**Independent Test**: Can be fully tested by generating word problems across the five categories (speed-time-distance, work, age, profit-loss, mixture), verifying each uses realistic Arabic names and contexts, confirming calculations use mental-math-friendly numbers, and validating step-by-step solution explanations are provided in Arabic.

**Acceptance Scenarios**:

1. **Given** I am practicing quantitative questions, **When** I receive a word problem, **Then** it uses realistic Arabic names (أحمد، فاطمة، etc.) and culturally appropriate contexts
2. **Given** I encounter a word problem, **When** I read the scenario, **Then** the problem falls into one of five categories: speed-time-distance, work problems, age problems, profit-loss, or mixture problems
3. **Given** I complete a word problem, **When** I view the solution, **Then** I see a step-by-step explanation in Arabic showing how to set up and solve the problem

---

### User Story 5 - Practice Analogy Questions with Relationship Types (Priority: P3)

As a student practicing verbal reasoning, I want to encounter analogy questions covering all 22 relationship types (synonymy, antonymy, part-whole, cause-effect, tool-user, etc.) so that I can develop comprehensive pattern recognition skills.

**Why this priority**: While analogy questions are important (25% of verbal section), this user story specifically addresses the breadth of relationship types rather than the ability to practice analogies at all. This is P3 because students can benefit from analogy practice even with a subset of relationship types.

**Independent Test**: Can be fully tested by generating 22 analogy questions, each demonstrating a different relationship type, verifying each relationship is correctly labeled in the solution explanation, and confirming the Arabic word pairs appropriately demonstrate each relationship pattern.

**Acceptance Scenarios**:

1. **Given** I am practicing verbal reasoning, **When** I complete multiple analogy questions over time, **Then** I encounter diverse relationship types including synonymy (ترادف), antonymy (تضاد), part-whole (جزء-كل), cause-effect (سبب-نتيجة), and tool-user (أداة-مستخدم)
2. **Given** I answer an analogy question, **When** I view the explanation, **Then** the system identifies which of the 22 relationship types the word pair demonstrates

---

### User Story 6 - Generate Practice Exams Efficiently (Priority: P3)

As a content creator or teacher using the app, I want to generate full practice exams (120 questions) or batches (20 questions) efficiently so that I can create comprehensive practice materials without excessive waiting time or cost.

**Why this priority**: Batch generation efficiency is important for scalability and user experience, but it's an optimization rather than a core capability. This is P3 because users can still generate exams even if it takes longer or costs more - the functionality exists, just with room for improvement.

**Independent Test**: Can be fully tested by requesting a full 120-question exam generation, measuring the total time to completion, verifying all 120 questions meet quality standards, and confirming the cost is within the target 70% reduction compared to single-question generation.

**Acceptance Scenarios**:

1. **Given** I request a batch of 20 questions, **When** the generation completes, **Then** all 20 questions are delivered within a reasonable timeframe and meet quality standards consistently
2. **Given** I request a full 120-question exam, **When** the generation process runs, **Then** the exam is completed in under 3 minutes
3. **Given** I generate questions in batches, **When** I review the API costs, **Then** batch generation costs approximately 70% less than generating the same number of questions individually

---

### Edge Cases

- What happens when a diagram fails to render on a specific mobile device or browser?
  - Fallback: Display the text description of the diagram and provide alternative question or retry mechanism

- How does the system handle overlapping shapes questions when screen width is very narrow (< 320px)?
  - Diagram should scale down proportionally while maintaining readability, or switch to vertical layout with scrollable diagram area

- What if AI-generated Arabic text contains grammatical errors despite quality controls?
  - LLM-based validation automatically flags suspicious grammar; flagged questions enter human review queue and are not presented to students until approved by Arabic language expert

- How does the system handle comparison questions where the relationship depends on variable values?
  - The correct answer should be "المعطيات غير كافية للمقارنة" and explanation should clarify the dependency

- What happens when generating a full 120-question exam and the process fails partway through?
  - System automatically retries from the failure point using exponential backoff strategy; preserves successfully generated questions to avoid regenerating them

- How does the system ensure diverse question distribution when generating small batches (e.g., 5 questions)?
  - With small batches, strict percentage distribution may not be possible; system should round sensibly and track distribution across multiple batches for the same user session

- What if a student has enabled screen reader but the diagram has no text description?
  - System must not present the question; all diagram questions require text descriptions as a validation requirement

## Requirements *(mandatory)*

### Functional Requirements

#### Core Question Generation & Quality

- **FR-001**: System MUST generate quantitative questions following the official GAT topic distribution: 40% arithmetic, 24% geometry, 23% algebra, 13% statistics
- **FR-002**: System MUST generate verbal questions following the official GAT topic distribution: 40% reading comprehension, 25% analogy, 15% sentence completion, 12% context error, 8% odd word out
- **FR-003**: System MUST validate all generated questions for grammatically correct formal Arabic (فصحى) before presenting to users using LLM-based validation; questions flagged with potential grammar issues MUST be queued for human expert review before publication
- **FR-004**: System MUST ensure mathematical accuracy of all calculations in generated questions and answer choices through high-quality AI generation; accuracy issues identified through post-publication error reporting MUST be corrected and questions updated
- **FR-005**: System MUST generate answer choice distractors based on documented common student errors (e.g., using diameter instead of radius, forgetting negative signs, arithmetic mistakes)
- **FR-006**: System MUST distribute question difficulty as approximately 30% easy, 50% medium, 20% hard
- **FR-007**: System MUST ensure all quantitative questions can be solved through mental calculation without requiring a calculator
- **FR-008**: System MUST generate questions in batches of 20 with consistent quality across all batches
- **FR-009**: System MUST complete generation of a full 120-question exam in under 3 minutes
- **FR-009a**: System MUST provide an error reporting mechanism for students and teachers to flag mathematical calculation errors in published questions; reported errors MUST be reviewed and corrected promptly
- **FR-009b**: System MUST implement automatic retry with exponential backoff when batch question generation fails partway through; successfully generated questions MUST be preserved to avoid regeneration

#### Overlapping Shapes & Diagrams

- **FR-010**: System MUST support 8 overlapping geometric shape patterns: square with quarter circles at corners, square vertex at circle center, rose pattern (four semicircles from square midpoints), three mutually tangent circles, circular sector with inscribed triangle removed, multiple circles in rectangle, circle inscribed in square, square inscribed in circle
- **FR-011**: System MUST display diagrams with clear visual shading of the calculated region using appropriate transparency levels
- **FR-012**: System MUST label all diagram vertices, centers, and measurements in Arabic with right-to-left text direction
- **FR-013**: System MUST provide the mathematical formula used for area calculation after the student answers the question
- **FR-014**: System MUST support 18 simple geometric shape types: circle (with radius, diameter, chord, sector, tangent options), triangles (right, isosceles, equilateral, scalene), quadrilaterals (square, rectangle, parallelogram, rhombus, trapezoid), regular polygons (pentagon, hexagon), 3D shapes (cube, cuboid, cylinder, cone, sphere), and coordinate plane with points and lines
- **FR-015**: System MUST support 9 statistical chart types: bar chart (vertical, horizontal, grouped), line graph (single, multiple lines), pie chart, histogram, area chart, and frequency table
- **FR-016**: System MUST render all diagrams in under 500 milliseconds on supported devices
- **FR-017**: System MUST ensure diagrams display correctly on screen widths from 320px to 1920px
- **FR-018**: System MUST provide an Arabic text description (caption) for every diagram that can be read by screen readers
- **FR-019**: System MUST ensure diagram color contrast meets WCAG 2.1 AA accessibility standards

#### Question Type Support

- **FR-020**: System MUST generate comparison questions (المقارنة) with two clearly labeled values or expressions to compare
- **FR-021**: System MUST provide exactly four answer choices for comparison questions in Arabic: "القيمة الأولى أكبر", "القيمة الثانية أكبر", "القيمتان متساويتان", "المعطيات غير كافية للمقارنة"
- **FR-022**: System MUST support word problem categories: speed-time-distance, work problems, age problems, profit-loss, and mixture problems
- **FR-023**: System MUST use realistic Arabic names and culturally appropriate contexts in word problems
- **FR-024**: System MUST provide step-by-step solution explanations in Arabic for word problems
- **FR-025**: System MUST support all 22 analogy relationship types including synonymy (ترادف), antonymy (تضاد), part-whole (جزء-كل), cause-effect (سبب-نتيجة), tool-user (أداة-مستخدم), and 17 additional relationship types
- **FR-026**: System MUST identify and label the relationship type in analogy question explanations

#### Data & Structure

- **FR-027**: System MUST store questions with a data structure that includes: question type, subtype, diagram configuration (if applicable), shading configuration, overlap description, formula, display method hint, relationship type (for analogies), difficulty level, topic, and subtopic
- **FR-028**: System MUST maintain backward compatibility with existing v2.x questions
- **FR-029**: System MUST provide default values for new v3.0 fields when loading older questions
- **FR-030**: System MUST support mobile devices running iOS and Android operating systems

### Key Entities

- **Question**: Represents a single exam question with text, answer choices, correct answer, explanation, topic classification, difficulty level, diagram data (if applicable), and metadata (creation date, version, language)

- **Diagram Configuration**: Represents the visual and geometric data for a question diagram. Stored using a hybrid schema approach: common fields (shape_type, pattern_id) as indexed database columns for efficient querying, with complex nested data (coordinates, shading configuration, labels, dimensions) stored in JSONB format. Also includes overlap description, formula, and rendering method hint

- **Topic Hierarchy**: Represents the classification structure for questions including main category (quantitative/verbal), topic (arithmetic, geometry, algebra, statistics, reading comprehension, analogy, etc.), and subtopic (e.g., within geometry: shapes, angles, area, perimeter, 3D, coordinates, overlapping)

- **Analogy Relationship**: Represents one of 22 relationship types that can connect word pairs in analogy questions, including the Arabic name, definition, and example word pairs

- **Practice Session**: Represents a student's practice session including question set, student responses, scores, time spent, and completion status

- **Exam Configuration**: Represents the parameters for generating a practice exam including total questions (typically 120), quantitative/verbal split (based on track: scientific or literary), topic distribution requirements, and difficulty distribution

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Students can access and view all 8 overlapping shapes question patterns with properly shaded diagrams and Arabic labels on mobile and web browsers
- **SC-002**: Generated questions rely on high-quality AI generation for mathematical accuracy; error reporting system enables rapid correction of any calculation issues identified post-publication
- **SC-003**: 100% of generated Arabic text passes grammatical validation for formal Arabic (فصحى)
- **SC-004**: 95% of answer choice distractors are based on documented common student errors
- **SC-005**: Diagrams render in under 500 milliseconds on supported devices (iOS, Android, modern web browsers)
- **SC-006**: System generates a full 120-question practice exam in under 3 minutes
- **SC-007**: Batch question generation (20 questions) achieves approximately 70% cost reduction compared to generating 20 individual questions
- **SC-008**: Generated questions follow topic distribution within ±5% of specified percentages across a full 120-question exam
- **SC-009**: Difficulty distribution across a full exam is 30% ± 5% easy, 50% ± 5% medium, 20% ± 5% hard
- **SC-010**: All diagrams maintain readability and correct display on screens ranging from 320px to 1920px width
- **SC-011**: 100% of diagrams include Arabic text descriptions accessible to screen readers
- **SC-012**: Students can complete a 20-question practice session without encountering diagram rendering failures or errors
- **SC-013**: Content creators can generate multiple 20-question batches with consistent quality across all batches (measured by error rate < 1%)

## Assumptions

- The platform already has user authentication, session management, and basic question display infrastructure from v2.x
- Students using the platform have internet connectivity sufficient for loading diagrams (estimated < 200KB per diagram)
- The AI question generation uses a language model capable of generating formal Arabic text (assumed to be Claude or similar)
- Mobile devices include smartphones and tablets from the past 5 years running up-to-date operating systems
- "Mental calculation" means solvable within approximately 2-3 minutes using basic arithmetic without complex multi-step calculations
- Question quality validation occurs during generation before questions are saved to the database
- The platform stores questions in a database (assumed PostgreSQL based on project context) with JSON/JSONB fields for flexible structure
- Diagram rendering will use a combination of third-party libraries and other rendering solutions; specific technology choices (SVG, Canvas, charting libraries) will be determined during the planning phase based on capability requirements
- Cost reduction target of 70% for batch generation is based on reducing redundant AI API calls through batching system prompts and using more efficient prompting strategies
- The existing v2.x question data structure can be extended with new optional fields without breaking existing functionality
- Screen reader compatibility refers to standard assistive technologies (JAWS, NVDA, VoiceOver)
- WCAG 2.1 AA contrast requirements mean a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text
- Formula display "after answering" means shown in the explanation/solution view, not in the initial question presentation

## Out of Scope

The following are explicitly NOT included in v3.0:

- Interactive diagram manipulation (e.g., dragging points, adjusting shapes) - deferred to Phase 3
- Dark mode for diagrams - deferred to Phase 3
- Offline mode for practicing with downloaded questions
- Generating questions in languages other than Arabic
- Adaptive difficulty adjustment based on student performance during a session
- Social features (sharing scores, competing with friends)
- Integration with Saudi Qiyas official exam registration or scoring systems
- Automated proctoring or anti-cheating measures
- Video explanations or tutorial content
- Custom question creation by teachers (only AI-generated questions)
- Exporting questions to PDF or other external formats
- Performance analytics dashboard showing progress over time (beyond basic session scoring)

## Dependencies

- AI language model API (Claude or equivalent) must support Arabic text generation with sufficient quality
- Mobile rendering must be tested on minimum device specifications: iPhone 8+ (iOS 14+), Samsung Galaxy S8+ (Android 9+)
- Diagram rendering solution (combination of third-party libraries and custom rendering) must support Arabic text, RTL direction, transparency, and meet performance requirements (defined in planning phase)
- Database must support JSON/JSONB fields for flexible question structure (PostgreSQL recommended)
- Existing v2.x question database schema and data must be accessible for migration and compatibility

## Non-Functional Requirements

### Performance
- Diagram rendering completes in under 500 milliseconds for any diagram type
- Full 120-question exam generation completes in under 3 minutes
- Application remains responsive during diagram loading (no UI freezing)
- Batch generation of 20 questions processes within reasonable timeframe (estimated < 30 seconds)

### Accessibility
- All diagrams include descriptive Arabic captions
- Diagram color contrast meets WCAG 2.1 AA standards (4.5:1 for normal text, 3:1 for large text)
- Screen reader compatibility for diagram descriptions using semantic HTML and ARIA labels
- Minimum touch target size of 44px × 44px on mobile devices for interactive elements

### Cost Efficiency
- Batch question generation achieves approximately 70% cost reduction compared to single-question generation
- Efficient caching of repeated system instructions to minimize API token usage
- Optimize prompt engineering to reduce token count while maintaining quality

### Reliability
- Mathematical accuracy relies on high-quality AI generation; post-publication error reporting system allows rapid identification and correction of any calculation issues
- Arabic grammar validation using LLM-based checking automatically flags potential errors; human expert review queue ensures grammatically incorrect content is not presented to students
- Batch generation failures handled via automatic retry with exponential backoff; successfully generated questions preserved to avoid wasted API costs and regeneration
- Graceful degradation when diagrams fail to render (show text description and alternative question)
- Database schema migrations support backward compatibility with v2.x data

### Scalability
- System supports concurrent generation of multiple exams by different users
- Database can store and retrieve thousands of generated questions efficiently
- Diagram rendering performance remains consistent regardless of database size
