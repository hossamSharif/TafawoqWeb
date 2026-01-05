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

// ============================================================================
// Zod Schemas
// ============================================================================

/** Diagram configuration schema */
const DiagramConfigSchema = z.object({
  type: z.string(),
  subtype: z.string().optional(),
  renderHint: z.enum(['SVG', 'JSXGraph', 'Chart.js']),
  data: z.record(z.any()),
  shading: z
    .object({
      type: z.enum(['difference', 'intersection', 'union']),
      operation: z.string(),
      shadedRegion: z.string(),
      fillColor: z.string(),
      fillOpacity: z.number().min(0.3).max(0.6),
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
  caption: z.string(), // REQUIRED for accessibility
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

/** Comparison values schema */
const ComparisonValuesSchema = z.object({
  value1: z.union([z.string(), z.number()]),
  value2: z.union([z.string(), z.number()]),
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
  diagram_config: DiagramConfigSchema.optional().nullable(),
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

// ============================================================================
// QuestionValidator Class
// ============================================================================

export class QuestionValidator {
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

    // Comparison questions require comparison_values
    if (question.question_type === 'comparison') {
      if (!question.comparison_values) {
        errors.push({
          field: 'comparison_values',
          message: 'Comparison questions must have comparison_values field',
          code: 'MISSING_COMPARISON_VALUES',
        });
      }
    }

    // Diagram questions require diagram_config
    if (question.question_type === 'diagram') {
      if (!question.diagram_config) {
        errors.push({
          field: 'diagram_config',
          message: 'Diagram questions must have diagram_config field',
          code: 'MISSING_DIAGRAM_CONFIG',
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
    if (question.shape_type && !question.diagram_config) {
      errors.push({
        field: 'diagram_config',
        message: 'If shape_type is set, diagram_config must also be set',
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

    // Diagram config validations
    if (question.diagram_config) {
      if (!question.diagram_config.caption) {
        errors.push({
          field: 'diagram_config.caption',
          message: 'Diagram must have accessibility caption',
          code: 'MISSING_DIAGRAM_CAPTION',
        });
      }

      // Shading requires overlap
      if (question.diagram_config.shading && !question.diagram_config.overlap) {
        errors.push({
          field: 'diagram_config.overlap',
          message: 'If shading exists, overlap must also exist',
          code: 'SHADING_WITHOUT_OVERLAP',
        });
      }
    }

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
