# Skills Architecture for AI Question Generation

**Purpose**: Modular system for organizing AI prompts and reference materials used by Claude API for generating GAT exam questions.

**Version**: v3.0
**Feature**: 1-gat-exam-v3

---

## Overview

The Skills system provides a structured way to organize domain knowledge, generation rules, and reference materials that guide the Claude API in generating high-quality exam questions. Skills are modular, cacheable, and designed to work with Claude's prompt caching feature for cost optimization.

```
Skills Content (~15,000 tokens)
    ↓
SkillLoader concatenates to single prompt
    ↓
PromptBuilder adds cache control headers
    ↓
Claude API (with prompt caching enabled)
    ↓
Generated Questions
```

**Key Benefits**:
- **Modularity**: Each skill is self-contained and can be updated independently
- **Cost Optimization**: Skills prompt is cached by Claude API (75% cost reduction on batches 2+)
- **Maintainability**: Separation of concerns - domain knowledge separate from code
- **Versioning**: Skills content can be versioned alongside code

---

## Directory Structure

```
src/skills/
├── README.md                           # This file
├── qudurat-quant/                      # Quantitative questions skill
│   ├── SKILL.md                        # Core rules and instructions
│   └── references/
│       ├── topics.md                   # 29 quantitative subtopics
│       ├── examples.md                 # Sample questions (MCQ, comparison, diagram)
│       └── word-problems.md            # 5 word problem categories
├── qudurat-verbal/                     # Verbal questions skill
│   ├── SKILL.md                        # Core rules and instructions
│   └── references/
│       ├── topics.md                   # Verbal topics structure
│       └── analogy-relations.md        # 22 analogy relationship types
├── qudurat-diagrams/                   # Diagram generation skill
│   ├── SKILL.md                        # Diagram rules and renderHint logic
│   └── references/
│       ├── overlapping-shapes.md       # 8 overlapping patterns
│       ├── simple-shapes.md            # 18 simple shape types
│       └── charts.md                   # 9 Chart.js statistical charts
├── qudurat-schema/                     # JSON schema validation skill
│   ├── SKILL.md                        # Required/conditional field rules
│   └── references/
│       └── full-schema.md              # Complete TypeScript interfaces
└── qudurat-quality/                    # Quality criteria skill
    └── SKILL.md                        # 10 quality criteria, grammar rules
```

---

## Skills Components

### 1. SKILL.md (Required)

The main file containing:
- **Purpose**: What this skill enables
- **Rules**: Generation rules and constraints
- **Instructions**: Step-by-step guidance for the AI
- **Examples**: Brief examples (detailed examples go in references/)

**Format**:
```markdown
# Skill: [Skill Name]

## Purpose
[What this skill does]

## Rules
- [Rule 1]
- [Rule 2]

## Instructions
1. [Step 1]
2. [Step 2]

## Examples
[Brief examples inline]
```

### 2. references/ Directory (Optional)

Contains supporting reference materials:
- **topics.md**: Topic hierarchies and distributions
- **examples.md**: Detailed worked examples
- **[domain].md**: Domain-specific knowledge (e.g., overlapping-shapes.md)

**Why separate references?**
- Keeps SKILL.md concise and focused
- Allows deep domain knowledge without cluttering main instructions
- Easier to update reference data without touching core rules

---

## Available Skills

### qudurat-quant
**Purpose**: Generate quantitative reasoning questions
**Token Count**: ~6,000 tokens
**Contains**:
- Topic distribution rules (40% arithmetic, 24% geometry, 23% algebra, 13% statistics)
- 29 quantitative subtopics with formulas
- Mental calculation constraints
- Word problem templates (speed-distance, work, age, profit-loss, mixture)
- Example questions for all question types

**When to use**: Generating quantitative section questions

---

### qudurat-verbal
**Purpose**: Generate verbal reasoning questions
**Token Count**: ~4,000 tokens
**Contains**:
- Topic distribution rules (verbal topics FR-002)
- 22 analogy relationship types with Arabic word pairs
- Verbal question type specifications
- Example questions

**When to use**: Generating verbal section questions

---

### qudurat-diagrams
**Purpose**: Generate diagram configurations for geometry questions
**Token Count**: ~3,000 tokens
**Contains**:
- 8 overlapping shape patterns with formulas
- 18 simple shape types
- 9 Chart.js statistical chart types
- renderHint selection logic (SVG vs JSXGraph vs Chart.js)
- Accessibility requirements (labels, ARIA, contrast)

**When to use**: Generating any question requiring a diagram

---

### qudurat-schema
**Purpose**: Validate question JSON structure
**Token Count**: ~1,500 tokens
**Contains**:
- Required vs conditional field rules
- TypeScript interfaces for all question types
- Field validation examples
- Relationship between question_type and required fields

**When to use**: Always include for schema validation

---

### qudurat-quality
**Purpose**: Ensure question quality and Arabic grammar
**Token Count**: ~1,000 tokens
**Contains**:
- 10 quality criteria checklist
- Arabic فصحى grammar requirements
- Distractor generation rules
- Difficulty calibration guidelines
- Common errors to avoid

**When to use**: Always include for quality assurance

---

## Usage Guide

### Loading a Single Skill

```typescript
import { skillLoader } from '@/services/skills/SkillLoader';

// Load a skill
const quantSkill = await skillLoader.loadSkill('qudurat-quant');

console.log(quantSkill.name);              // 'qudurat-quant'
console.log(quantSkill.estimatedTokens);   // ~6000
console.log(quantSkill.fullContent);       // Concatenated SKILL.md + references
```

### Loading Multiple Skills

```typescript
import { skillLoader } from '@/services/skills/SkillLoader';

// Load multiple skills for comprehensive generation
const skills = await skillLoader.loadMultipleSkills([
  'qudurat-quant',
  'qudurat-diagrams',
  'qudurat-schema',
  'qudurat-quality'
]);

console.log(skills.estimatedTokens);  // ~12,500 tokens
console.log(skills.fullContent);      // All skills concatenated
```

### Using with PromptBuilder

```typescript
import { skillLoader } from '@/services/skills/SkillLoader';
import { PromptBuilder } from '@/services/generation/PromptBuilder';

// Load skills
const skills = await skillLoader.loadMultipleSkills([
  'qudurat-quant',
  'qudurat-diagrams',
  'qudurat-schema',
  'qudurat-quality'
]);

// Build system prompt with cache control
const promptBuilder = new PromptBuilder();
const systemPrompt = promptBuilder.buildSystemPrompt(skills.fullContent);

// systemPrompt now includes cache_control for prompt caching
```

### Caching Behavior

```typescript
// First load: reads from disk
const skill1 = await skillLoader.loadSkill('qudurat-quant');

// Second load: returns from cache (instant)
const skill2 = await skillLoader.loadSkill('qudurat-quant');

// Force reload from disk
const skill3 = await skillLoader.loadSkill('qudurat-quant', false);

// Clear all cached skills
skillLoader.clearCache();
```

---

## Extending the Skills System

### Adding a New Skill

1. **Create skill directory**:
   ```bash
   mkdir -p src/skills/my-new-skill/references
   ```

2. **Create SKILL.md**:
   ```bash
   touch src/skills/my-new-skill/SKILL.md
   ```

   Add content following the standard format (see section above).

3. **Add reference files** (optional):
   ```bash
   touch src/skills/my-new-skill/references/examples.md
   touch src/skills/my-new-skill/references/rules.md
   ```

4. **Test loading**:
   ```typescript
   const mySkill = await skillLoader.loadSkill('my-new-skill');
   console.log(mySkill.estimatedTokens);
   ```

5. **Update PromptBuilder** (if needed):
   If your skill requires special handling, update `src/services/generation/PromptBuilder.ts`.

### Updating Existing Skills

**When to update**:
- Add new topic categories
- Fix generation errors
- Improve example quality
- Update Arabic grammar rules
- Adjust difficulty calibration

**Best practices**:
1. Test changes in isolation first
2. Monitor quality metrics after deployment
3. Version control all skill content
4. Document changes in skill commit messages

**Example commit**:
```bash
git add src/skills/qudurat-quant/references/topics.md
git commit -m "feat(skills): Add 3 new geometry topics to qudurat-quant

- Triangle similarity problems
- Circle tangent problems
- Coordinate geometry distance formulas

Refs: FR-001 (topic distribution)"
```

---

## Token Count Budget

Total Skills Content: ~15,000 tokens (cacheable)

| Skill | Estimated Tokens | % of Total |
|-------|-----------------|------------|
| qudurat-quant | ~6,000 | 40% |
| qudurat-verbal | ~4,000 | 27% |
| qudurat-diagrams | ~3,000 | 20% |
| qudurat-schema | ~1,500 | 10% |
| qudurat-quality | ~1,000 | 7% |

**Note**: Token estimates are approximate (1 token ≈ 4 characters). Actual counts may vary based on content.

**Why this matters**:
- Claude API charges for tokens
- Prompt caching saves 75% on cached content (~15K tokens cached)
- Keep skills concise to stay within cache budget

---

## Prompt Caching Integration

The Skills system is designed to work with Claude API's prompt caching feature:

### How It Works

1. **First batch request**:
   - Skills content sent to Claude API
   - Marked with `cache_control: {type: "ephemeral"}`
   - Claude caches the skills prompt for 5 minutes
   - Full cost: ~15,000 input tokens

2. **Subsequent requests (within 5 minutes)**:
   - Skills content retrieved from cache
   - Cost: ~10% of original (cache read cost)
   - Savings: ~75% cost reduction

3. **Cache expiry**:
   - After 5 minutes of inactivity, cache expires
   - Next request creates new cache

### Sequential Batch Strategy

To maximize cache utilization, batches are generated **sequentially** (not parallel):

```typescript
// ❌ BAD: Parallel batches don't benefit from caching
const batch1Promise = generateBatch(1);
const batch2Promise = generateBatch(2);  // Starts immediately, no cache hit
await Promise.all([batch1Promise, batch2Promise]);

// ✅ GOOD: Sequential batches maximize cache reuse
const batch1 = await generateBatch(1);  // Creates cache
const batch2 = await generateBatch(2);  // Cache hit! (5 min window)
const batch3 = await generateBatch(3);  // Cache hit!
```

**Result**: For 120-question exam (6 batches of 20):
- Batch 1: Full cost
- Batches 2-6: 75% savings
- **Overall savings**: ~62.5% (5 of 6 batches cached)

---

## Testing Skills

### Unit Testing SkillLoader

```typescript
import { SkillLoader } from '@/services/skills/SkillLoader';

describe('SkillLoader', () => {
  const loader = new SkillLoader();

  it('should load qudurat-quant skill', async () => {
    const skill = await loader.loadSkill('qudurat-quant');

    expect(skill.name).toBe('qudurat-quant');
    expect(skill.mainContent).toContain('# Skill: qudurat-quant');
    expect(skill.references.length).toBeGreaterThan(0);
    expect(skill.estimatedTokens).toBeGreaterThan(5000);
  });

  it('should cache loaded skills', async () => {
    const skill1 = await loader.loadSkill('qudurat-quant');
    const skill2 = await loader.loadSkill('qudurat-quant');

    // Should be same reference (cached)
    expect(skill1).toBe(skill2);
  });

  it('should list all available skills', async () => {
    const skills = await loader.listAvailableSkills();

    expect(skills).toContain('qudurat-quant');
    expect(skills).toContain('qudurat-verbal');
    expect(skills).toContain('qudurat-diagrams');
    expect(skills).toContain('qudurat-schema');
    expect(skills).toContain('qudurat-quality');
  });
});
```

### Integration Testing with Generation

```typescript
import { skillLoader } from '@/services/skills/SkillLoader';
import { QuduratGenerator } from '@/services/generation/QuduratGenerator';

describe('Skills + Generation Integration', () => {
  it('should generate question using skills', async () => {
    const skills = await skillLoader.loadMultipleSkills([
      'qudurat-quant',
      'qudurat-schema',
      'qudurat-quality'
    ]);

    const generator = new QuduratGenerator();
    const question = await generator.generateQuestion({
      section: 'quantitative',
      questionType: 'mcq',
      topic: 'arithmetic',
      difficulty: 'medium',
      skills: skills.fullContent
    });

    expect(question).toMatchObject({
      question_text: expect.any(String),
      answer_choices: expect.arrayContaining([
        expect.objectContaining({ text: expect.any(String) })
      ]),
      correct_answer: expect.any(Number),
      topic: 'arithmetic'
    });
  });
});
```

---

## Performance Considerations

### Memory Usage

- Skills are cached in memory after first load
- Total memory footprint: ~500KB for all skills
- Use `skillLoader.clearCache()` if memory is constrained

### Load Time

- First load: ~50ms (disk I/O)
- Cached load: ~1ms (memory access)
- Recommended: Load skills once at app startup

### Token Optimization

**Keep skills concise**:
- Move verbose examples to references/
- Avoid redundant explanations
- Use bullet points over paragraphs
- Reference external docs instead of copying

**Example**:
```markdown
<!-- ❌ Verbose -->
For more information about triangle formulas, please see the following:
The area of a triangle can be calculated using the formula A = 1/2 × base × height.
The perimeter is the sum of all three sides.

<!-- ✅ Concise -->
Triangle formulas:
- Area: A = 1/2 × base × height
- Perimeter: sum of all sides
```

---

## Troubleshooting

### Error: "Skill directory not found"

```typescript
// Error: Skill directory not found: /path/to/src/skills/my-skill

// Solution 1: Verify skill exists
await skillLoader.listAvailableSkills();

// Solution 2: Check skill name spelling
const skill = await skillLoader.loadSkill('qudurat-quant');  // Correct
const skill = await skillLoader.loadSkill('qudarat-quant');  // Typo!
```

### Error: "SKILL.md not found"

```bash
# Each skill directory MUST have a SKILL.md file
ls src/skills/my-skill/
# Should show: SKILL.md  references/

# If missing, create it
touch src/skills/my-skill/SKILL.md
```

### High Token Count

```typescript
const skill = await skillLoader.loadSkill('qudurat-quant');
console.log(skill.estimatedTokens);  // 10,000 (too high!)

// Solution: Move content to references/ or remove verbosity
// Target: <7,000 tokens per skill
```

### Cache Not Working

```typescript
// Ensure cache is not being cleared unnecessarily
skillLoader.clearCache();  // ❌ Don't do this in production

// Load with cache enabled (default)
const skill = await skillLoader.loadSkill('qudurat-quant', true);
```

---

## Best Practices

### ✅ Do

- Keep SKILL.md focused on rules and instructions
- Use references/ for examples and domain knowledge
- Test skills in isolation before integration
- Version control all skill content
- Monitor token counts
- Document skill updates in commit messages
- Use consistent formatting across skills

### ❌ Don't

- Hard-code question content in SKILL.md (use examples/ instead)
- Include implementation details (e.g., TypeScript code in skills)
- Duplicate content across multiple skills
- Exceed token budget without justification
- Clear cache in production code
- Modify skills without testing impact on generation

---

## Related Documentation

- **Implementation Plan**: `/specs/1-gat-exam-v3/plan.md` - Skills architecture design
- **SkillLoader Service**: `/src/services/skills/SkillLoader.ts` - Loading implementation
- **PromptBuilder**: `/src/services/generation/PromptBuilder.ts` - Prompt construction
- **QuduratGenerator**: `/src/services/generation/QuduratGenerator.ts` - Generation service
- **Prompt Caching**: `/specs/1-gat-exam-v3/research.md` - Claude API caching research

---

## Support

For questions or issues with the Skills system:
1. Check this README first
2. Review individual SKILL.md files for specific skill documentation
3. Consult `/specs/1-gat-exam-v3/plan.md` for architectural decisions
4. Test with `SkillLoader` unit tests
5. Check generation logs for token usage and caching stats

---

**Last Updated**: 2026-01-05
**Feature Version**: v3.0 (1-gat-exam-v3)
