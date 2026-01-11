/speckit.plan

This plan addresses the technical implementation for GAT Exam Platform v3.0, focusing on three core technical areas: Diagram Rendering System, AI Question Generation with Skills Architecture, and Cost Optimization through Prompt Caching.

═══════════════════════════════════════════════════════════════════════════════
SECTION 1: DIAGRAM RENDERING ARCHITECTURE
═══════════════════════════════════════════════════════════════════════════════

## 1.1 Library Selection Strategy

Use a multi-library approach with automatic routing based on diagram complexity:

### Library 1: SVG (Native) - Simple Shapes
- **Use for**: 18 simple geometric shapes (FR-014)
- **Shapes covered**:
  • Circles (with radius, diameter, chord, sector, tangent)
  • Triangles (right, isosceles, equilateral, scalene)
  • Quadrilaterals (square, rectangle, parallelogram, rhombus, trapezoid)
  • Regular polygons (pentagon, hexagon)
  • 3D shapes (cube, cuboid, cylinder, cone, sphere) - isometric projection
  • Coordinate plane with points and lines
- **Why SVG**: Zero dependencies, fast rendering, perfect for static shapes
- **Arabic support**: Use `direction="rtl"` and `text-anchor="end"` for labels
- **Implementation**: Create reusable SVG components for each shape type

### Library 2: JSXGraph v1.11+ - Overlapping Shapes
- **Use for**: 8 overlapping patterns requiring shaded regions (FR-010, FR-011)
- **Patterns covered**:
  • `square-with-corner-circles`: Square with quarter circles at vertices
  • `square-vertex-at-circle-center`: Square corner at circle center
  • `rose-pattern-in-square`: Four semicircles from midpoints
  • `three-tangent-circles`: Three mutually tangent circles
  • `sector-minus-triangle`: Sector with inscribed triangle removed
  • `circles-in-rectangle`: Multiple circles in rectangle
  • `inscribed-circle-in-square`: Circle inscribed in square
  • `inscribed-square-in-circle`: Square inscribed in circle
- **Why JSXGraph**: 
  • Native support for geometric constructions
  • Built-in intersection and region filling
  • Mathematical precision for area calculations
  • Educational focus matches our use case
- **Configuration**:
  ```
  npm install jsxgraph@^1.11.0
  ```
- **Arabic support**: Configure board with RTL text rendering
- **Shading**: Use `JXG.Curve` with `fillColor` and `fillOpacity: 0.3-0.6`

### Library 3: Chart.js v4+ - Statistical Charts
- **Use for**: 9 chart types for statistics questions (FR-015)
- **Charts covered**:
  • Bar chart (vertical, horizontal, grouped)
  • Line graph (single line, multiple lines)
  • Pie chart / Doughnut chart
  • Histogram
  • Area chart
  • Frequency table (HTML table, not Chart.js)
- **Why Chart.js**: Industry standard, excellent documentation, responsive
- **Configuration**:
  ```
  npm install chart.js@^4.4.0 react-chartjs-2@^5.2.0
  ```
- **Arabic support**: Configure with RTL plugin and Arabic font family
- **Accessibility**: Enable built-in accessibility features for screen readers

## 1.2 Unified DiagramRenderer Architecture

Create a single entry point component that routes to appropriate renderer:

```
DiagramRenderer (Entry Point)
├── Receives: diagram object with type, subtype, data, renderHint
├── Routes based on renderHint field:
│   ├── renderHint: "SVG" → SVGDiagram component
│   ├── renderHint: "JSXGraph" → JSXGraphDiagram component (lazy loaded)
│   └── renderHint: "Chart.js" → ChartJSDiagram component (lazy loaded)
└── Fallback: If renderHint missing, infer from diagram.type
```

### Routing Logic:
```
if (diagram.type === "overlapping-shapes") → JSXGraph
else if (diagram.type contains "chart" or "graph" or "histogram") → Chart.js
else → SVG
```

### Lazy Loading Strategy:
- SVG: Bundle with main application (small, always needed)
- JSXGraph: Dynamic import, load only when overlapping-diagram question appears
- Chart.js: Dynamic import, load only when statistics question appears
- Show skeleton loader during library load (estimated 200-400ms first load)

## 1.3 Diagram Data Structure

Each diagram stored with this structure (aligns with FR-027):

```typescript
interface DiagramConfig {
  type: string;                    // "circle", "triangle", "overlapping-shapes", "bar-chart"
  subtype?: string;                // For overlapping: "three-tangent-circles", etc.
  data: ShapeData | ChartData;     // Shape-specific parameters
  
  // Overlapping shapes specific (FR-011, FR-013)
  shading?: {
    type: "difference" | "intersection" | "union";
    operation: string;             // "square - 4_quarter_circles"
    shadedRegion: string;          // Description of shaded area
    fillColor: string;             // "#e74c3c"
    fillOpacity: number;           // 0.3-0.6
  };
  
  overlap?: {
    type: string;                  // "quarter-circle-inside-square"
    angle?: number;                // For sectors
    description: string;           // Arabic description
  };
  
  formulaUsed?: string;            // "المساحة = مساحة المربع - مساحة الدائرة"
  renderHint: "SVG" | "JSXGraph" | "Chart.js";
  caption: string;                 // Arabic accessibility description (FR-018)
  
  // Rendering constraints
  aspectRatio?: number;            // Default 1:1
  minWidth?: number;               // Minimum 200px
  maxWidth?: number;               // Maximum 600px
}
```

## 1.4 Performance Requirements Implementation

To meet FR-016 (<500ms rendering):
- Pre-calculate all coordinates server-side, store in diagram.data
- Use CSS containment for diagram containers
- Implement intersection observer for diagrams below fold
- Cache rendered diagrams in browser for repeat views

## 1.5 Accessibility Implementation (FR-018, FR-019)

- Every diagram MUST have `caption` field with Arabic description
- Render caption as `<figcaption>` with `aria-describedby` link
- Use colorblind-safe palette for shading:
  • Primary shaded: #e74c3c (red) with pattern overlay option
  • Secondary: #3498db (blue)
  • Ensure 4.5:1 contrast ratio for all labels
- Provide high-contrast mode toggle

═══════════════════════════════════════════════════════════════════════════════
SECTION 2: SKILLS ARCHITECTURE FOR AI QUESTION GENERATION
═══════════════════════════════════════════════════════════════════════════════

## 2.1 What Are Skills?

Skills are modular Markdown documents that contain domain-specific knowledge, rules, and examples for question generation. They are loaded into Claude API's system prompt to provide consistent, high-quality generation.

## 2.2 Five Skills Module Structure

```
skills/
├── qudurat-quant/
│   ├── SKILL.md                    # Core instructions (<500 lines)
│   └── references/
│       ├── topics.md               # 29 subtopics with formulas
│       └── examples.md             # Example questions with JSON
│
├── qudurat-verbal/
│   ├── SKILL.md                    # Core instructions
│   └── references/
│       ├── topics.md               # Reading, completion, error topics
│       └── analogy-relations.md    # 22 relationship types (FR-025)
│
├── qudurat-diagrams/
│   ├── SKILL.md                    # Diagram generation rules
│   └── references/
│       ├── simple-shapes.md        # 18 shape specifications
│       ├── overlapping-shapes.md   # 8 patterns with formulas
│       └── charts.md               # 9 chart type specs
│
├── qudurat-schema/
│   ├── SKILL.md                    # JSON structure rules
│   └── references/
│       └── full-schema.md          # Complete TypeScript interfaces
│
└── qudurat-quality/
    └── SKILL.md                    # Quality criteria, distractor rules
```

## 2.3 Skill Content Specifications

### Skill 1: qudurat-quant (Quantitative Section)

**SKILL.md contains:**
- Topic distribution rules: 40% arithmetic, 24% geometry, 23% algebra, 13% statistics (FR-001)
- Question type distribution: mcq 70%, comparison 15%, diagram 15%
- Difficulty distribution: 30% easy, 50% medium, 20% hard (FR-006)
- Mental calculation constraint (FR-007)
- Comparison question format with fixed Arabic choices (FR-020, FR-021)

**references/topics.md contains:**
- Arithmetic subtopics: basic-operations, number-properties, fractions, decimals, exponents-roots, ratio-proportion, percentages
- Algebra subtopics: linear-equations, quadratic-equations, inequalities, algebraic-expressions, sequences, functions
- Geometry subtopics: angles, triangles, circles, polygons, area-perimeter, 3d-shapes, coordinate-geometry, overlapping-shapes
- Statistics subtopics: central-tendency, dispersion, charts, probability, permutations
- Word problems: speed-time-distance, work-problems, age-problems, profit-loss, mixture-problems (FR-022)
- Arabic formulas and terminology for each subtopic

**references/examples.md contains:**
- 2-3 complete JSON examples per question type
- Examples showing correct distractor generation (FR-005)
- Examples with Arabic names for word problems (FR-023)

### Skill 2: qudurat-verbal (Verbal Section)

**SKILL.md contains:**
- Topic distribution: 40% reading, 25% analogy, 15% completion, 12% error, 8% odd-word (FR-002)
- Reading passage structure and question types
- Sentence completion patterns (single-blank, double-blank, contrast, cause-effect)
- Context error identification rules

**references/analogy-relations.md contains (FR-025, FR-026):**
All 22 relationship types with Arabic examples:
1. ترادف (Synonymy): كبير : ضخم
2. تضاد (Antonymy): نور : ظلام
3. جزء من كل (Part-Whole): إصبع : يد
4. كل إلى جزء (Whole-Part): شجرة : ورقة
5. سبب ونتيجة (Cause-Effect): نار : دخان
6. نتيجة وسبب (Effect-Cause): فيضان : مطر
7. تتابع (Succession): فجر : شروق
8. علاقة زمنية (Temporal): ربيع : صيف
9. علاقة مكانية (Spatial): سمك : ماء
10. أداة واستخدام (Tool-Usage): قلم : كتابة
11. مهنة وأداة (Profession-Tool): نجار : منشار
12. مهنة وفعل (Profession-Action): طبيب : علاج
13. أصل وفرع (Origin-Branch): عربية : لهجة
14. نوع من (Type-Of): تفاح : فاكهة
15. تصنيف (Category): أسد : حيوان
16. درجة (Degree): دافئ : حار
17. تدرج (Gradation): همس : صراخ
18. تحول (Transformation): يرقة : فراشة
19. مادة ومصنوع (Made-Of): خشب : طاولة
20. حالة (Condition): مريض : صحيح
21. تصريف (Conjugation): كتب : يكتب
22. صفة (Attribute): عسل : حلاوة

### Skill 3: qudurat-diagrams (Diagram Generation)

**SKILL.md contains:**
- When to include diagrams (geometry, statistics questions)
- renderHint selection rules
- Accessibility requirements (caption mandatory)
- Arabic label conventions

**references/simple-shapes.md contains:**
Complete JSON structure for all 18 simple shapes (FR-014):
- Circle with all variations (radius, chord, sector, tangent)
- All triangle types with angle/side specifications
- All quadrilateral types
- 3D shape isometric representations
- Coordinate plane with point/line syntax

**references/overlapping-shapes.md contains (FR-010):**
For each of 8 patterns:
- Exact JSON structure with data fields
- Mathematical formula for shaded area
- Typical question variations
- Common student errors (for distractors)

Example for `three-tangent-circles`:
```
Pattern: Three Tangent Circles
Formula: Area = √3 - π/2 (for radius = 1)
General: Area = r²(√3 - π/2)
Distractors based on:
- Using √3 + π/2 (wrong operation)
- Forgetting to multiply by r²
- Using 60° sector formula incorrectly
```

**references/charts.md contains (FR-015):**
Chart.js configuration for all 9 chart types with Arabic label examples

### Skill 4: qudurat-schema (JSON Schema)

**SKILL.md contains:**
- Required fields for all questions
- Conditional fields (when to include diagram, comparison values, etc.)
- ID format convention
- Validation rules

**references/full-schema.md contains (FR-027, FR-028, FR-029):**
- Complete TypeScript interfaces
- All enum values for each field
- Default values for v3.0 fields (backward compatibility)
- Example JSON for each questionType

### Skill 5: qudurat-quality (Quality Assurance)

**SKILL.md contains:**
- 10 quality criteria checklist
- Arabic grammar requirements (فصحى) (FR-003)
- Mathematical accuracy self-check (FR-004)
- Distractor generation rules based on common errors (FR-005)
- Mental calculation verification (FR-007)
- Difficulty calibration guidelines
- Cultural appropriateness rules

## 2.4 SkillLoader Service Implementation

```typescript
class SkillLoader {
  private skills: Map<string, string> = new Map();
  
  // Load all skills at server startup
  async initialize(): Promise<void> {
    const skillNames = ['qudurat-quant', 'qudurat-verbal', 'qudurat-diagrams', 
                        'qudurat-schema', 'qudurat-quality'];
    
    for (const name of skillNames) {
      const skillContent = await this.loadSkill(name);
      this.skills.set(name, skillContent);
    }
  }
  
  // Load SKILL.md + all references/ files
  private async loadSkill(name: string): Promise<string> {
    const basePath = `./skills/${name}`;
    let content = await readFile(`${basePath}/SKILL.md`);
    
    const refsPath = `${basePath}/references`;
    if (await exists(refsPath)) {
      const refFiles = await readdir(refsPath);
      for (const file of refFiles) {
        const refContent = await readFile(`${refsPath}/${file}`);
        content += `\n\n### Reference: ${file}\n${refContent}`;
      }
    }
    return content;
  }
  
  // Build system prompt based on exam type
  buildSystemPrompt(examType: 'full' | 'quant-only' | 'verbal-only'): string {
    const parts: string[] = [];
    
    // Always include schema and quality
    parts.push(this.skills.get('qudurat-schema')!);
    parts.push(this.skills.get('qudurat-quality')!);
    
    // Include section-specific skills
    if (examType === 'full' || examType === 'quant-only') {
      parts.push(this.skills.get('qudurat-quant')!);
      parts.push(this.skills.get('qudurat-diagrams')!);
    }
    
    if (examType === 'full' || examType === 'verbal-only') {
      parts.push(this.skills.get('qudurat-verbal')!);
    }
    
    return parts.join('\n\n---\n\n');
  }
}
```

═══════════════════════════════════════════════════════════════════════════════
SECTION 3: PROMPT CACHING STRATEGY FOR COST OPTIMIZATION
═══════════════════════════════════════════════════════════════════════════════

## 3.1 Understanding Claude API Prompt Caching

Claude API supports caching system prompts with `cache_control` parameter:
- Cached prompts cost 90% less on subsequent requests
- Cache TTL: 5 minutes (ephemeral)
- Cache key based on exact system prompt content

## 3.2 Cost Reduction Target: 70% (SC-007, FR-008)

### Current Cost (Without Caching):
- System prompt: ~15,000 tokens (all 5 skills)
- Per batch: 15,000 input tokens × $0.003/1K = $0.045
- Full exam (6 batches): 6 × $0.045 = $0.27

### With Prompt Caching:
- First batch: Full cost = $0.045
- Batches 2-6: 90% discount = $0.0045 each
- Full exam: $0.045 + (5 × $0.0045) = $0.0675
- **Savings: 75%** ✓ Exceeds 70% target

## 3.3 Implementation Architecture

```typescript
class QuduratGenerator {
  private anthropic: Anthropic;
  private skillLoader: SkillLoader;
  private systemPrompt: string | null = null;
  
  async initialize(): Promise<void> {
    await this.skillLoader.initialize();
  }
  
  async generateQuestions(params: GenerationParams): Promise<Question[]> {
    // Build system prompt once per exam type
    if (!this.systemPrompt) {
      this.systemPrompt = this.skillLoader.buildSystemPrompt(params.examType);
    }
    
    const response = await this.anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      
      // CRITICAL: Cache control on system prompt
      system: [
        {
          type: "text",
          text: this.systemPrompt,
          cache_control: { type: "ephemeral" }  // 5-minute cache
        }
      ],
      
      messages: [
        {
          role: "user",
          content: this.buildUserPrompt(params)
        }
      ]
    });
    
    return this.parseQuestions(response.content[0].text);
  }
  
  private buildUserPrompt(params: GenerationParams): string {
    return `
      Generate ${params.batchSize} questions for GAT exam.
      
      Section: ${params.section}
      Track: ${params.track}
      Batch: ${params.batchNumber} of ${params.totalBatches}
      Difficulty: ${params.difficulty}
      
      Requirements:
      - Follow topic distribution from skills
      - Include ${params.diagramCount} diagram questions
      - All text in formal Arabic (فصحى)
      - Return valid JSON array
    `;
  }
}
```

## 3.4 Batch Generation Flow

```
Full Exam Generation (120 questions):
│
├── Batch 1 (Questions 1-20)
│   ├── System Prompt: FULL LOAD (cache miss) → $0.045
│   └── User Prompt: Batch 1 parameters
│
├── Batch 2 (Questions 21-40)
│   ├── System Prompt: CACHE HIT → $0.0045 (90% off)
│   └── User Prompt: Batch 2 parameters
│
├── Batch 3-6... (Same pattern)
│   └── All CACHE HIT → $0.0045 each
│
└── Total: $0.045 + (5 × $0.0045) = $0.0675
   Savings: 75% vs $0.27 without caching
```

## 3.5 Cache Optimization Rules

1. **Keep system prompt identical across batches**
   - Same skills content
   - Same order
   - No dynamic content in system prompt

2. **All variation goes in user prompt**
   - Batch number
   - Question count
   - Specific topic focus
   - Difficulty distribution for this batch

3. **Generate batches sequentially, not in parallel**
   - Parallel requests = multiple cache misses
   - Sequential = one miss, five hits

4. **Complete exam within 5-minute window**
   - 6 batches × ~30 seconds = 3 minutes ✓
   - Cache remains valid throughout

5. **Group same-type exams together**
   - Scientific track exams together
   - Literary track exams together
   - Maximizes cache reuse across users

## 3.6 Retry Strategy with Cache Preservation (FR-009b)

```typescript
async generateWithRetry(params: GenerationParams): Promise<Question[]> {
  const maxRetries = 3;
  let attempt = 0;
  let lastError: Error | null = null;
  
  while (attempt < maxRetries) {
    try {
      return await this.generateQuestions(params);
    } catch (error) {
      lastError = error;
      attempt++;
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      await sleep(delay);
      
      // Cache is still valid - don't rebuild system prompt
      // Just retry with same cached prompt
    }
  }
  
  throw new Error(`Generation failed after ${maxRetries} attempts: ${lastError}`);
}
```

═══════════════════════════════════════════════════════════════════════════════
SECTION 4: INTEGRATION ARCHITECTURE
═══════════════════════════════════════════════════════════════════════════════

## 4.1 Service Layer Structure

```
services/
├── skills/
│   ├── SkillLoader.ts              # Loads and caches skill files
│   └── SkillValidator.ts           # Validates skill file format
│
├── generation/
│   ├── QuduratGenerator.ts         # Main generation service
│   ├── PromptBuilder.ts            # Builds user prompts
│   ├── ResponseParser.ts           # Parses JSON from Claude
│   └── QuestionValidator.ts        # Validates generated questions
│
├── diagrams/
│   ├── DiagramRenderer.ts          # Entry point component
│   ├── SVGRenderer.ts              # Simple shapes
│   ├── JSXGraphRenderer.ts         # Overlapping shapes
│   └── ChartRenderer.ts            # Statistical charts
│
└── cache/
    └── PromptCacheManager.ts       # Manages cache timing
```

## 4.2 Data Flow

```
User requests exam
       │
       ▼
┌─────────────────────┐
│  QuduratGenerator   │
│  ┌───────────────┐  │
│  │ SkillLoader   │──┼──► Load skills (once at startup)
│  └───────────────┘  │
│         │           │
│         ▼           │
│  Build System       │
│  Prompt with        │──► cache_control: ephemeral
│  cache_control      │
│         │           │
│         ▼           │
│  ┌───────────────┐  │
│  │ Claude API    │  │
│  │ (Cached)      │  │
│  └───────────────┘  │
│         │           │
│         ▼           │
│  Parse & Validate   │
│  Questions          │
└─────────────────────┘
       │
       ▼
Store in Database
       │
       ▼
┌─────────────────────┐
│ DiagramRenderer     │
│  ├── SVG            │
│  ├── JSXGraph       │
│  └── Chart.js       │
└─────────────────────┘
       │
       ▼
Display to Student
```

═══════════════════════════════════════════════════════════════════════════════
SECTION 5: IMPLEMENTATION PHASES
═══════════════════════════════════════════════════════════════════════════════

## Phase 1: Core Infrastructure
1. Set up Skills folder structure with all 5 SKILL.md files
2. Implement SkillLoader service
3. Implement basic QuduratGenerator with Prompt Caching
4. Create DiagramRenderer with SVG support only
5. Update database schema for v3.0 fields

## Phase 2: Diagram Libraries
1. Integrate JSXGraph for 4 common overlapping patterns
2. Integrate Chart.js for bar, line, pie charts
3. Implement lazy loading for heavy libraries
4. Add remaining 4 overlapping patterns
5. Add remaining chart types (histogram, area, grouped bar)

## Phase 3: Quality & Optimization
1. Complete all 5 skills with full reference files
2. Implement question validation against quality criteria
3. Performance optimization for <500ms rendering
4. Accessibility audit and fixes
5. Cache optimization across user sessions

═══════════════════════════════════════════════════════════════════════════════
DEPENDENCIES TO INSTALL
═══════════════════════════════════════════════════════════════════════════════

```bash
# Diagram rendering
npm install jsxgraph@^1.11.0
npm install chart.js@^4.4.0 react-chartjs-2@^5.2.0

# Claude API
npm install @anthropic-ai/sdk@^0.30.0

# File system (for skill loading in Node.js)
# Built-in: fs/promises

# Validation
npm install zod@^3.23.0  # For JSON schema validation
```

═══════════════════════════════════════════════════════════════════════════════
REFERENCE DOCUMENTS
═══════════════════════════════════════════════════════════════════════════════

The following prepared documents contain detailed specifications:

1. **EXAM_GENERATION_PROMPTS_V3.0.md** - Full prompts for skills content
2. **JSON_SCHEMA_CHANGELOG.md** - Complete schema for qudurat-schema skill
3. **DIAGRAM_CHART_REFERENCE_GUIDE.md** - All diagram specs for qudurat-diagrams skill
4. **Skills Files (5 SKILL.md + references)** - Ready-to-use skill content
