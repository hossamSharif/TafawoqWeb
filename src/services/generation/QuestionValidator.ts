/**
 * QuestionValidator.ts
 * Validates generated questions using Zod schemas and LLM-based grammar validation
 *
 * Features:
 * - Zod schema validation for structure
 * - Conditional field validation (MCQ needs choices, etc.)
 * - Arabic grammar validation via Claude API (optional)
 * - Topic distribution validation
 * - Difficulty distribution validation
 *
 * @see specs/1-gat-exam-v3/data-model.md - Question schema
 * @see User Story 2 (FR-003, FR-005, FR-006) - Quality validation
 */

import { z } from 'zod';
import { isValidAnalogyRelationship } from '@/lib/constants/analogy-relationships';
import Anthropic from '@anthropic-ai/sdk';

// ============================================================================
// Zod Schemas
// ============================================================================

/** Diagram configuration schema */
const DiagramConfigSchema = z.object({
  type: z.string(),
  subtype: z.string().optional(),
  renderHint: z.enum(['SVG', 'JSXGraph', 'Chart.js', 'Mafs', 'Canvas']).default('SVG'),
  data: z.record(z.any()),
  shading: z
    .object({
      type: z.enum(['difference', 'intersection', 'union']),
      operation: z.string(),
      shadedRegion: z.string().optional(),
      fillColor: z.string(),
      fillOpacity: z.number().min(0.1).max(0.9),
    })
    .optional(),
  overlap: z
    .object({
      type: z.string(),
      angle: z.number().optional(),
      description: z.string(),
    })
    .optional(),
  formulaUsed: z.string().optional(),
  caption: z.string().optional(), // Optional - will use default if not provided
  accessibilityFeatures: z
    .object({
      highContrast: z.boolean().optional(),
      patternOverlay: z.boolean().optional(),
      textAlternative: z.string().optional(),
    })
    .optional(),
  aspectRatio: z.number().optional(),
  minWidth: z.number().optional(),
  maxWidth: z.number().optional(),
});

/** Comparison values schema (FR-020, FR-021) */
const ComparisonValuesSchema = z.object({
  value1: z.object({
    expression: z.string().min(1, 'value1.expression must not be empty'),
    label: z.string().min(1, 'value1.label must not be empty'),
  }),
  value2: z.object({
    expression: z.string().min(1, 'value2.expression must not be empty'),
    label: z.string().min(1, 'value2.label must not be empty'),
  }),
});

/** Base question schema */
const QuestionSchemaBase = z.object({
  // Base fields
  version: z.literal('3.0').default('3.0'),
  language: z.literal('ar').default('ar'),
  section: z.enum(['quantitative', 'verbal']),
  track: z.enum(['scientific', 'literary']),
  question_type: z.enum([
    'mcq',
    'comparison',
    'diagram',
    'reading',
    'analogy',
    'completion',
    'error',
    'odd-word',
  ]),
  topic: z.string().min(1),
  subtopic: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  question_text: z.string().min(10),
  correct_answer: z.string().min(1),
  explanation: z.string().min(20),

  // Optional/conditional fields
  choices: z.array(z.string()).optional(),
  comparison_values: ComparisonValuesSchema.optional().nullable(),
  shape_type: z.string().optional().nullable(),
  pattern_id: z.string().optional().nullable(),
  diagram: DiagramConfigSchema.optional().nullable(),
  relationship_type: z.string().optional().nullable(),

  // Metadata (will be added by system)
  generation_metadata: z
    .object({
      model: z.string().optional(),
      batch_id: z.string().optional(),
      cache_hit: z.boolean().optional(),
      generated_at: z.string().optional(),
    })
    .optional(),
  quality_flags: z.array(z.string()).default([]),
});

export type QuestionData = z.infer<typeof QuestionSchemaBase>;

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  question?: QuestionData;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

export interface GrammarValidationResult {
  isValid: boolean;
  issues: Array<{
    field: 'question_text' | 'explanation' | 'choices';
    issue: string;
    suggestion?: string;
  }>;
}

// ============================================================================
// QuestionValidator Class
// ============================================================================

export class QuestionValidator {
  private anthropic: Anthropic | null = null;

  constructor() {
    // Initialize Anthropic client only if API key is available
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  }
  /**
   * Validate a single question
   * @param data - Question data to validate
   * @returns Validation result
   */
  validate(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Step 1: Zod schema validation
    const schemaResult = QuestionSchemaBase.safeParse(data);

    if (!schemaResult.success) {
      // Extract Zod errors
      schemaResult.error.errors.forEach(err => {
        errors.push({
          field: err.path.join('.'),
          message: err.message,
          code: 'SCHEMA_VALIDATION',
        });
      });

      return { valid: false, errors, warnings };
    }

    const question = schemaResult.data;

    // Step 2: Conditional field validation
    const conditionalErrors = this.validateConditionalFields(question);
    errors.push(...conditionalErrors);

    // Step 3: Business logic validation
    const logicErrors = this.validateBusinessLogic(question);
    errors.push(...logicErrors);

    // Step 4: Generate warnings
    const generatedWarnings = this.generateWarnings(question);
    warnings.push(...generatedWarnings);

    // Step 5: Check distractor quality (T056)
    const distractorWarnings = this.validateDistractorQuality(question);
    warnings.push(...distractorWarnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      question: errors.length === 0 ? question : undefined,
    };
  }

  /**
   * Validate conditional fields based on question type
   */
  private validateConditionalFields(question: QuestionData): ValidationError[] {
    const errors: ValidationError[] = [];

    // MCQ questions require choices
    if (question.question_type === 'mcq') {
      if (!question.choices || question.choices.length !== 4) {
        errors.push({
          field: 'choices',
          message: 'MCQ questions must have exactly 4 answer choices',
          code: 'MISSING_CHOICES',
        });
      }
    }

    // Comparison questions require comparison_values (FR-020)
    if (question.question_type === 'comparison') {
      if (!question.comparison_values) {
        errors.push({
          field: 'comparison_values',
          message: 'Comparison questions must have comparison_values field',
          code: 'MISSING_COMPARISON_VALUES',
        });
      }

      // Comparison questions must have exactly the four standard choices (FR-021)
      const standardChoices = [
        'القيمة الأولى أكبر',
        'القيمة الثانية أكبر',
        'القيمتان متساويتان',
        'المعطيات غير كافية للمقارنة',
      ];

      if (!question.choices || question.choices.length !== 4) {
        errors.push({
          field: 'choices',
          message: 'Comparison questions must have exactly 4 answer choices',
          code: 'INVALID_COMPARISON_CHOICES_COUNT',
        });
      } else {
        // Check that choices match the standard choices exactly
        const choicesMatch = question.choices.every((choice, index) =>
          choice === standardChoices[index]
        );

        if (!choicesMatch) {
          errors.push({
            field: 'choices',
            message: 'Comparison questions must use the exact standard choices in order',
            code: 'INVALID_COMPARISON_CHOICES',
          });
        }
      }
    }

    // Diagram questions require diagram
    if (question.question_type === 'diagram') {
      if (!question.diagram) {
        errors.push({
          field: 'diagram',
          message: 'Diagram questions must have diagram field',
          code: 'MISSING_DIAGRAM',
        });
      }
    }

    // Analogy questions require relationship_type
    if (question.subtopic && question.topic === 'analogy') {
      if (!question.relationship_type) {
        errors.push({
          field: 'relationship_type',
          message: 'Analogy questions must have relationship_type field',
          code: 'MISSING_RELATIONSHIP_TYPE',
        });
      } else if (!isValidAnalogyRelationship(question.relationship_type)) {
        errors.push({
          field: 'relationship_type',
          message: `Invalid relationship type: ${question.relationship_type}`,
          code: 'INVALID_RELATIONSHIP_TYPE',
        });
      }
    }

    return errors;
  }

  /**
   * Validate business logic rules
   */
  private validateBusinessLogic(question: QuestionData): ValidationError[] {
    const errors: ValidationError[] = [];

    // Diagram-related validations
    if (question.shape_type && !question.diagram) {
      errors.push({
        field: 'diagram',
        message: 'If shape_type is set, diagram must also be set',
        code: 'INCONSISTENT_DIAGRAM_FIELDS',
      });
    }

    if (question.pattern_id && question.shape_type !== 'overlapping-shapes') {
      errors.push({
        field: 'pattern_id',
        message: 'pattern_id should only be set for overlapping-shapes',
        code: 'INVALID_PATTERN_ID_USAGE',
      });
    }

    // Diagram config validations - now optional/lenient
    // Caption is now optional, will be generated with default if missing
    // Shading no longer requires overlap (can shade simple shapes too)

    // Correct answer validation for comparison questions
    if (question.question_type === 'comparison') {
      const validAnswers = [
        'القيمة الأولى أكبر',
        'القيمة الثانية أكبر',
        'القيمتان متساويتان',
        'المعطيات غير كافية للمقارنة',
      ];

      if (!validAnswers.includes(question.correct_answer)) {
        errors.push({
          field: 'correct_answer',
          message: 'Comparison question answer must be one of the 4 standard Arabic choices',
          code: 'INVALID_COMPARISON_ANSWER',
        });
      }
    }

    return errors;
  }

  /**
   * Generate warnings for potential issues
   */
  private generateWarnings(question: QuestionData): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Warn if question text is very short
    if (question.question_text.length < 20) {
      warnings.push({
        field: 'question_text',
        message: 'Question text is very short, may lack context',
        code: 'SHORT_QUESTION_TEXT',
      });
    }

    // Warn if explanation is very short
    if (question.explanation.length < 30) {
      warnings.push({
        field: 'explanation',
        message: 'Explanation is very short, may not be detailed enough',
        code: 'SHORT_EXPLANATION',
      });
    }

    // Warn if MCQ choices are too similar in length
    if (question.choices && question.choices.length === 4) {
      const lengths = question.choices.map(c => c.length);
      const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const allSimilar = lengths.every(len => Math.abs(len - avgLength) < 5);

      if (allSimilar) {
        warnings.push({
          field: 'choices',
          message: 'All answer choices are similar length, may not be realistic distractors',
          code: 'UNIFORM_CHOICE_LENGTHS',
        });
      }
    }

    return warnings;
  }

  /**
   * Validate a batch of questions
   * @param questions - Array of question data
   * @returns Array of validation results
   */
  validateBatch(questions: any[]): ValidationResult[] {
    return questions.map(q => this.validate(q));
  }

  /**
   * Validate topic distribution across a batch
   * @param questions - Array of validated questions
   * @param targetDistribution - Expected topic weights
   * @param tolerance - Allowed deviation (default 0.05 = 5%)
   * @returns Distribution validation result
   */
  validateTopicDistribution(
    questions: QuestionData[],
    targetDistribution: Record<string, number>,
    tolerance: number = 0.05
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const total = questions.length;

    if (total === 0) {
      return { valid: false, errors: ['No questions to validate'] };
    }

    // Count questions per topic
    const actualCounts: Record<string, number> = {};
    questions.forEach(q => {
      actualCounts[q.topic] = (actualCounts[q.topic] || 0) + 1;
    });

    // Check each topic against target
    for (const [topic, targetWeight] of Object.entries(targetDistribution)) {
      const actualCount = actualCounts[topic] || 0;
      const actualWeight = actualCount / total;
      const deviation = Math.abs(actualWeight - targetWeight);

      if (deviation > tolerance) {
        errors.push(
          `Topic '${topic}' has ${(actualWeight * 100).toFixed(1)}% but target is ${(targetWeight * 100).toFixed(1)}% (deviation: ${(deviation * 100).toFixed(1)}%)`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate difficulty distribution
   * @param questions - Array of validated questions
   * @param targetDistribution - Expected difficulty weights (default: 30% easy, 50% medium, 20% hard)
   * @param tolerance - Allowed deviation
   */
  validateDifficultyDistribution(
    questions: QuestionData[],
    targetDistribution: Record<string, number> = { easy: 0.3, medium: 0.5, hard: 0.2 },
    tolerance: number = 0.05
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const total = questions.length;

    if (total === 0) {
      return { valid: false, errors: ['No questions to validate'] };
    }

    // Count questions per difficulty
    const actualCounts: Record<string, number> = {};
    questions.forEach(q => {
      actualCounts[q.difficulty] = (actualCounts[q.difficulty] || 0) + 1;
    });

    // Check each difficulty against target
    for (const [difficulty, targetWeight] of Object.entries(targetDistribution)) {
      const actualCount = actualCounts[difficulty] || 0;
      const actualWeight = actualCount / total;
      const deviation = Math.abs(actualWeight - targetWeight);

      if (deviation > tolerance) {
        errors.push(
          `Difficulty '${difficulty}' has ${(actualWeight * 100).toFixed(1)}% but target is ${(targetWeight * 100).toFixed(1)}% (deviation: ${(deviation * 100).toFixed(1)}%)`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate Arabic grammar using Claude API (T052)
   * @param question - Question data to validate
   * @returns Grammar validation result with specific issues
   */
  async validateArabicGrammar(question: QuestionData): Promise<GrammarValidationResult> {
    if (!this.anthropic) {
      console.warn('ANTHROPIC_API_KEY not set, skipping grammar validation');
      return { isValid: true, issues: [] };
    }

    const grammarPrompt = `أنت مدقق لغوي متخصص في اللغة العربية الفصحى. راجع النص التالي واكتشف أي أخطاء نحوية أو إملائية.

**نص السؤال:**
${question.question_text}

**الشرح:**
${question.explanation}

${question.choices && question.choices.length > 0 ? `**الخيارات:**\n${question.choices.map((c, i) => `${i + 1}. ${c}`).join('\n')}` : ''}

يجب أن يكون النص بالعربية الفصحى الصحيحة. ابحث عن:
1. الأخطاء النحوية (إعراب، تركيب الجملة، استخدام الضمائر)
2. الأخطاء الإملائية (الهمزات، التاء المربوطة/المفتوحة، الألف المقصورة)
3. الأخطاء في علامات الترقيم
4. استخدام العامية بدلاً من الفصحى
5. أخطاء في الأفعال والأزمنة

إذا وجدت أخطاء، أجب بتنسيق JSON:
\`\`\`json
{
  "isValid": false,
  "issues": [
    {
      "field": "question_text" | "explanation" | "choices",
      "issue": "وصف الخطأ",
      "suggestion": "التصحيح المقترح (اختياري)"
    }
  ]
}
\`\`\`

إذا كان النص صحيحاً لغوياً، أجب:
\`\`\`json
{
  "isValid": true,
  "issues": []
}
\`\`\``;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20251022',
        max_tokens: 1024,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: grammarPrompt,
          },
        ],
      });

      // Extract JSON from response
      const textContent = response.content[0];
      if (textContent.type !== 'text') {
        throw new Error('Unexpected response type from Claude API');
      }

      // Parse JSON from markdown code block if present
      let jsonText = textContent.text.trim();
      const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      const result = JSON.parse(jsonText) as GrammarValidationResult;
      return result;
    } catch (error) {
      console.error('Grammar validation error:', error);
      // On error, assume valid to avoid blocking question generation
      return { isValid: true, issues: [] };
    }
  }

  /**
   * Determine if question should be flagged for review (T053)
   * @param question - Question data to check
   * @param grammarResult - Grammar validation result (optional)
   * @returns Quality flags array for insertion into review_queue
   */
  determineQualityFlags(
    question: QuestionData,
    grammarResult?: GrammarValidationResult
  ): string[] {
    const flags: string[] = [];

    // Flag 1: Grammar issues
    if (grammarResult && !grammarResult.isValid && grammarResult.issues.length > 0) {
      flags.push('grammar');
    }

    // Flag 2: Mathematical issues (for quantitative questions)
    if (question.section === 'quantitative') {
      // Check if correct_answer is actually in the choices (for MCQ)
      if (question.question_type === 'mcq' && question.choices) {
        if (!question.choices.includes(question.correct_answer)) {
          flags.push('mathematical');
        }
      }

      // Check for suspiciously short explanation
      if (question.explanation.length < 50) {
        flags.push('insufficient_explanation');
      }
    }

    // Flag 3: Distractor quality issues
    const distractorWarnings = this.validateDistractorQuality(question);
    const hasCriticalDistractorIssue = distractorWarnings.some(w =>
      ['DUPLICATE_CHOICES', 'MISSING_CORRECT_ANSWER_IN_CHOICES', 'EMPTY_CHOICE'].includes(w.code)
    );

    if (hasCriticalDistractorIssue) {
      flags.push('poor_distractors');
    }

    // Flag 4: Diagram issues (now just a warning, not a blocker)
    // Caption is optional, but flag if completely missing for accessibility review
    if (question.diagram && !question.diagram.caption) {
      flags.push('diagram_accessibility');
    }

    return flags;
  }

  /**
   * Validate distractor quality (T056)
   * Checks if answer choices represent realistic student errors
   * @param question - Question data to validate
   * @returns Validation result with distractor quality issues
   */
  validateDistractorQuality(question: QuestionData): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Only applies to MCQ questions
    if (question.question_type !== 'mcq' || !question.choices || question.choices.length !== 4) {
      return warnings;
    }

    const choices = question.choices;
    const correctIndex = choices.findIndex(c => c === question.correct_answer);

    if (correctIndex === -1) {
      warnings.push({
        field: 'choices',
        message: 'Correct answer not found in choices array',
        code: 'MISSING_CORRECT_ANSWER_IN_CHOICES',
      });
      return warnings;
    }

    // Check 1: All choices should be non-empty
    if (choices.some(c => !c || c.trim().length === 0)) {
      warnings.push({
        field: 'choices',
        message: 'One or more choices are empty',
        code: 'EMPTY_CHOICE',
      });
    }

    // Check 2: Choices should not be duplicates
    const uniqueChoices = new Set(choices.map(c => c.trim()));
    if (uniqueChoices.size < choices.length) {
      warnings.push({
        field: 'choices',
        message: 'Duplicate choices detected - each choice should be unique',
        code: 'DUPLICATE_CHOICES',
      });
    }

    // Check 3: For numeric answers, check if distractors are reasonable
    const numericPattern = /^-?\d+(\.\d+)?$/;
    const allNumeric = choices.every(c => numericPattern.test(c.trim()));

    if (allNumeric) {
      const numbers = choices.map(c => parseFloat(c.trim()));
      const sorted = [...numbers].sort((a, b) => a - b);

      // Warn if numbers are sequential (1, 2, 3, 4) - too obvious
      const isSequential = sorted.every((n, i) => i === 0 || n === sorted[i - 1] + 1);
      if (isSequential) {
        warnings.push({
          field: 'choices',
          message: 'Numeric choices are sequential (e.g., 1, 2, 3, 4), consider more realistic distractors',
          code: 'SEQUENTIAL_NUMERIC_CHOICES',
        });
      }

      // Warn if all numbers are multiples of each other
      const gcd = numbers.reduce((a, b) => {
        while (b) {
          const t = b;
          b = a % b;
          a = t;
        }
        return Math.abs(a);
      });

      if (gcd > 1 && numbers.every(n => n % gcd === 0)) {
        warnings.push({
          field: 'choices',
          message: 'All numeric choices are multiples of the same number, may lack realistic variation',
          code: 'MULTIPLE_BASED_CHOICES',
        });
      }
    }

    // Check 4: For geometry/formula-based questions, verify unit consistency
    const hasUnits = choices.some(c => /سم|م|كم|متر|سنتيمتر/.test(c));
    if (hasUnits) {
      const allHaveSameUnit = choices.every(c => {
        const match = c.match(/(سم|م|كم|متر|سنتيمتر|م²|سم²)/);
        return match !== null;
      });

      if (!allHaveSameUnit) {
        warnings.push({
          field: 'choices',
          message: 'Inconsistent units across choices - all should have the same unit type',
          code: 'INCONSISTENT_UNITS',
        });
      }
    }

    // Check 5: Choices should have reasonable length variation
    const lengths = choices.map(c => c.length);
    const maxLength = Math.max(...lengths);
    const minLength = Math.min(...lengths);

    if (maxLength > minLength * 3) {
      warnings.push({
        field: 'choices',
        message: 'Large length variation in choices, may make correct answer too obvious',
        code: 'LARGE_LENGTH_VARIATION',
      });
    }

    return warnings;
  }

  /**
   * Format validation result as human-readable report
   */
  formatReport(result: ValidationResult): string {
    let report = '=== Question Validation Report ===\n\n';
    report += `Status: ${result.valid ? '✅ VALID' : '❌ INVALID'}\n\n`;

    if (result.errors.length > 0) {
      report += '❌ Errors:\n';
      result.errors.forEach(err => {
        report += `  - [${err.field}] ${err.message} (${err.code})\n`;
      });
      report += '\n';
    }

    if (result.warnings.length > 0) {
      report += '⚠️  Warnings:\n';
      result.warnings.forEach(warn => {
        report += `  - [${warn.field}] ${warn.message} (${warn.code})\n`;
      });
    }

    return report;
  }
}

/**
 * Singleton instance for convenient access
 */
export const questionValidator = new QuestionValidator();
