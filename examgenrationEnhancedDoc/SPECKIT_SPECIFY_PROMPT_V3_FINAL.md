/speckit.specify

Build a comprehensive update (v3.0) for anyExamAi, an AI-powered Saudi GAT (Qudurat) exam generation platform targeting Arabic-speaking students in the Middle East. This update focuses on implementing advanced diagram capabilities for overlapping shapes questions and improving the AI-powered question generation quality.

═══════════════════════════════════════════════════════════════════════════════
CONTEXT: WHAT IS QUDURAT EXAM?
═══════════════════════════════════════════════════════════════════════════════

The General Aptitude Test (GAT/Qudurat) is a standardized test administered by Saudi Arabia's National Center for Assessment (Qiyas). It measures analytical and reasoning abilities for university admissions.

- Total questions: 120 (computerized test)
- Duration: 150 minutes
- Format: Multiple choice (4 options each)
- No calculator allowed
- Scientific track: 60% quantitative, 40% verbal
- Literary track: 50% quantitative, 50% verbal

═══════════════════════════════════════════════════════════════════════════════
FEATURE 1: OVERLAPPING SHAPES & SHADED AREA QUESTIONS
═══════════════════════════════════════════════════════════════════════════════

Problem Statement:
Real GAT exams frequently include questions about calculating shaded areas in overlapping geometric shapes. Currently, anyExamAi cannot generate or display these question types, leaving a significant gap in exam preparation coverage.

User Story 1.1: As a student preparing for GAT, I want to practice overlapping shapes questions so that I can master calculating shaded areas, which appear frequently in the actual exam.

Acceptance Criteria:
- Support 8 overlapping shape patterns commonly found in GAT exams:
  • Square with quarter circles at corners (vertices as centers)
  • Square vertex positioned at circle center
  • Rose pattern: four semicircles from square midpoints
  • Three mutually tangent circles forming curvilinear triangle
  • Circular sector with inscribed triangle removed
  • Multiple circles inscribed in a rectangle
  • Circle inscribed inside a square (touching all sides)
  • Square inscribed inside a circle (vertices on circumference)

- Each pattern displays with:
  • Clear visual shading of the region being calculated
  • Arabic labels for all vertices, centers, and measurements
  • The mathematical formula shown after answering

- Questions follow GAT standards:
  • All text in formal Arabic (فصحى)
  • Numbers suitable for mental calculation (no calculator)
  • 4 answer choices with plausible distractors based on common errors

User Story 1.2: As a student, I want diagrams to automatically display in the best visual quality so that I can clearly understand the geometric relationships.

Acceptance Criteria:
- Simple shapes (circle, triangle, square) display clearly
- Overlapping shapes show shaded regions with appropriate transparency
- Charts and graphs for statistics questions display accurately
- All diagrams work on mobile devices (iOS and Android)
- Arabic text in diagrams reads correctly (right-to-left)

User Story 1.3: As a student with visual impairment, I want diagrams to have text descriptions so that I can understand the geometric problem.

Acceptance Criteria:
- Every diagram has an Arabic caption describing the shape
- Color contrast meets accessibility standards
- Diagram descriptions can be read by screen readers

═══════════════════════════════════════════════════════════════════════════════
FEATURE 2: IMPROVED QUESTION GENERATION QUALITY
═══════════════════════════════════════════════════════════════════════════════

Problem Statement:
Current AI-generated questions sometimes have inconsistent quality, incorrect calculations, or grammatically imperfect Arabic. A structured approach to question generation is needed.

User Story 2.1: As a content creator, I want the AI to generate questions following strict quality guidelines so that all questions meet GAT exam standards.

Acceptance Criteria:
- Quantitative questions follow official topic distribution:
  • Arithmetic: 40% (operations, fractions, percentages, roots, ratios)
  • Geometry: 24% (shapes, angles, area, perimeter, 3D, coordinates, overlapping)
  • Algebra: 23% (equations, inequalities, sequences, expressions)
  • Statistics: 13% (mean, median, mode, probability, charts)

- Verbal questions follow official topic distribution:
  • Reading Comprehension: 40% (main idea, inference, details, vocabulary in context)
  • Analogy: 25% (22 relationship types including synonymy, antonymy, part-whole, cause-effect)
  • Sentence Completion: 15% (single blank, double blank, contrast, cause-effect)
  • Context Error: 12% (semantic, logical, contradiction errors)
  • Odd Word Out: 8%

- Question quality standards:
  • All Arabic text is grammatically correct
  • All mathematical calculations are verified accurate
  • Distractors are based on common student mistakes
  • Difficulty distribution: 30% easy, 50% medium, 20% hard
  • No calculator required for any calculation

User Story 2.2: As a content creator, I want to generate questions in batches efficiently so that I can create full practice exams quickly.

Acceptance Criteria:
- Generate 20 questions per batch request
- Full exam (120 questions) generated in reasonable time
- Consistent quality across all batches
- Cost-effective API usage for batch generation

User Story 2.3: As a content creator, I want comparison questions (المقارنة) generated correctly so that students can practice this important GAT question type.

Acceptance Criteria:
- Comparison questions have two values/expressions to compare
- Fixed answer choices in Arabic:
  • "القيمة الأولى أكبر"
  • "القيمة الثانية أكبر"
  • "القيمتان متساويتان"
  • "المعطيات غير كافية للمقارنة"
- Mathematical relationships are logically valid

═══════════════════════════════════════════════════════════════════════════════
FEATURE 3: ENHANCED QUESTION DATA STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

Problem Statement:
The current question data structure doesn't support overlapping shapes, multiple rendering methods, or the full range of verbal question subtypes. An updated structure is needed while maintaining compatibility with existing questions.

User Story 3.1: As a developer, I want the question data structure to support all v3.0 features so that new question types can be stored and displayed properly.

Acceptance Criteria:
- New question type supported: overlapping-diagram
- Diagram data includes:
  • Shape subtype (which of the 8 patterns)
  • Shading configuration (which region, what color, transparency level)
  • Overlap description (how shapes relate)
  • Formula used (shown after answering)
  • Display method hint (for optimal rendering)

- All 22 analogy relationship types supported:
  • Synonymy (ترادف), Antonymy (تضاد), Part-Whole (جزء-كل)
  • Cause-Effect (سبب-نتيجة), Tool-User (أداة-مستخدم)
  • And 17 more relationship types

- Backward compatibility:
  • Existing v2.x questions continue to work
  • Missing new fields default to sensible values
  • Migration path for old questions

═══════════════════════════════════════════════════════════════════════════════
FEATURE 4: COMPREHENSIVE DIAGRAM SUPPORT
═══════════════════════════════════════════════════════════════════════════════

Problem Statement:
Different diagram types require different rendering approaches. Simple shapes, complex overlapping patterns, and statistical charts each have unique display requirements.

User Story 4.1: As a student, I want all diagram types to display correctly so that I can focus on solving problems, not interpreting unclear graphics.

Acceptance Criteria:
- Simple geometric shapes supported (18 types):
  • Circle (with radius, diameter, chord, sector, tangent options)
  • Triangle (right, isosceles, equilateral, scalene)
  • Quadrilaterals (square, rectangle, parallelogram, rhombus, trapezoid)
  • Regular polygons (pentagon, hexagon)
  • 3D shapes (cube, cuboid, cylinder, cone, sphere)
  • Coordinate plane with points and lines

- Overlapping shapes supported (8 patterns as listed in Feature 1)

- Statistical charts supported (9 types):
  • Bar chart (vertical, horizontal, grouped)
  • Line graph (single, multiple lines)
  • Pie chart
  • Histogram
  • Area chart
  • Frequency table

- All diagrams:
  • Render in under 500 milliseconds
  • Display correctly on screens from 320px to 1920px width
  • Support Arabic labels and RTL text direction

═══════════════════════════════════════════════════════════════════════════════
FEATURE 5: WORD PROBLEMS (APPLIED MATHEMATICS)
═══════════════════════════════════════════════════════════════════════════════

Problem Statement:
GAT includes practical word problems that apply mathematical concepts to real-world scenarios. These require proper categorization and context-appropriate generation.

User Story 5.1: As a student, I want to practice word problems in various categories so that I can apply mathematical concepts to real situations.

Acceptance Criteria:
- Word problem categories supported:
  • Speed-Time-Distance (السرعة والمسافة والزمن)
  • Work Problems (العمل المشترك)
  • Age Problems (مسائل الأعمار)
  • Profit-Loss (الربح والخسارة)
  • Mixture Problems (المزج والخلط)

- Each word problem:
  • Uses realistic Arabic names and contexts
  • Has numbers suitable for mental calculation
  • Includes step-by-step solution explanation

═══════════════════════════════════════════════════════════════════════════════
NON-FUNCTIONAL REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

Performance:
- Diagram rendering: Under 500 milliseconds for any diagram type
- Question generation: Full 120-question exam in under 3 minutes
- App remains responsive during diagram loading

Accessibility:
- All diagrams have descriptive Arabic captions
- Color choices meet WCAG 2.1 AA contrast requirements
- Screen reader compatibility for diagram descriptions
- Minimum touch target size: 44px on mobile


Cost Efficiency:
- Batch question generation should minimize API costs
- Target: 70% cost reduction compared to single-question generation
- Efficient caching of repeated system instructions


═══════════════════════════════════════════════════════════════════════════════
SUCCESS METRICS
═══════════════════════════════════════════════════════════════════════════════

Feature Completeness:
□ All 8 overlapping shape patterns display correctly
□ All 18 simple shape types render properly
□ All 9 chart types display accurately
□ All 22 analogy relationships generate correctly
□ All 5 word problem categories supported

Quality Metrics:
□ 100% of generated questions have correct Arabic grammar
□ 100% of mathematical calculations are accurate
□ 95% of distractors based on documented common errors
□ Diagrams display correctly on iOS, Android, and web browsers

User Experience:
□ Students can complete a 20-question practice session without diagram loading issues
□ Content creators can generate a full 120-question exam in one session
□ All diagrams readable on mobile screens (minimum 320px width)

═══════════════════════════════════════════════════════════════════════════════
REFERENCE DOCUMENTATION
═══════════════════════════════════════════════════════════════════════════════

The following documentation files contain detailed specifications and should be referenced during planning and implementation:

1. @examgenrationEnhancedDoc/EXAM_GENERATION_PROMPTS_V3.0.md (1,405 lines)
   - Complete topic hierarchies with Arabic descriptions
   - Question distribution percentages
   - Example questions for each type

2. @examgenrationEnhancedDoc/JSON_SCHEMA_CHANGELOG.md (1,007 lines)
   - All data structure changes from v1.0 to v3.0
   - Field specifications and allowed values
   - Migration guide for existing data

3. @examgenrationEnhancedDoc/DIAGRAM_CHART_REFERENCE_GUIDE.md (2,457 lines)
   - Detailed specifications for all 18 simple shapes
   - Complete documentation for 8 overlapping patterns with formulas
   - All 9 chart type configurations
   - Example data structures for each diagram type

4.@src/skills/ Skills Reference Files (2,590 lines total)
   - Modular content specifications
   - Topic and subtopic details
   - Quality criteria and validation rules

═══════════════════════════════════════════════════════════════════════════════
IMPLEMENTATION PRIORITY
═══════════════════════════════════════════════════════════════════════════════

Phase 1 - Core (Must Have):
- Updated question data structure with v3.0 fields
- Diagram rendering for overlapping shapes (4 most common patterns first)
- Quality-controlled question generation

Phase 2 - Extended (Should Have):
- Remaining 4 overlapping shape patterns
- All 22 analogy relationship types
- Batch generation with cost optimization

Phase 3 - Enhancement (Nice to Have):
- Interactive diagram manipulation
- Dark mode for diagrams
- Advanced performance optimizations
