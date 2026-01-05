/**
 * SkillValidator.ts
 * Service for validating skill file format and token count estimation
 *
 * Validates:
 * - SKILL.md exists and has proper format
 * - Reference files are valid markdown
 * - Total token count is within limits for prompt caching
 * - Content structure meets requirements
 *
 * @see specs/1-gat-exam-v3/plan.md - Skills Architecture
 */

import type { SkillContent } from './SkillLoader';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  tokenCount: number;
  /** Whether this skill is suitable for prompt caching (5K-15K tokens ideal) */
  isCacheable: boolean;
}

export interface ValidationError {
  type: 'missing_skill_md' | 'invalid_format' | 'empty_content' | 'invalid_reference';
  message: string;
  file?: string;
}

export interface ValidationWarning {
  type: 'token_count_low' | 'token_count_high' | 'no_references' | 'large_reference';
  message: string;
  file?: string;
}

export class SkillValidator {
  // Token count thresholds (based on Claude API prompt caching)
  private static readonly MIN_CACHEABLE_TOKENS = 1024; // Minimum for caching
  private static readonly IDEAL_MIN_TOKENS = 5000; // Ideal minimum for efficient caching
  private static readonly IDEAL_MAX_TOKENS = 15000; // Ideal maximum to avoid truncation
  private static readonly MAX_SAFE_TOKENS = 100000; // Maximum safe limit

  /**
   * Validate a skill's content
   * @param skill - The loaded skill content to validate
   * @returns Validation result with errors and warnings
   */
  validate(skill: SkillContent): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check main content exists and is not empty
    if (!skill.mainContent || skill.mainContent.trim().length === 0) {
      errors.push({
        type: 'empty_content',
        message: `Skill '${skill.name}' has empty SKILL.md file`,
        file: 'SKILL.md',
      });
    }

    // Check main content has proper structure (should have headers)
    if (skill.mainContent && !this.hasProperStructure(skill.mainContent)) {
      warnings.push({
        type: 'invalid_format',
        message: `SKILL.md for '${skill.name}' should contain markdown headers (##)`,
        file: 'SKILL.md',
      });
    }

    // Validate references
    for (const ref of skill.references) {
      if (!ref.content || ref.content.trim().length === 0) {
        errors.push({
          type: 'invalid_reference',
          message: `Reference file '${ref.filename}' is empty`,
          file: ref.filename,
        });
      }

      // Warn if reference is very large (>5K tokens ≈ 20K chars)
      const refTokens = this.estimateTokens(ref.content);
      if (refTokens > 5000) {
        warnings.push({
          type: 'large_reference',
          message: `Reference file '${ref.filename}' is large (${refTokens} tokens). Consider splitting.`,
          file: ref.filename,
        });
      }
    }

    // Check token count
    const tokenCount = skill.estimatedTokens;
    const isCacheable = tokenCount >= SkillValidator.MIN_CACHEABLE_TOKENS &&
                        tokenCount <= SkillValidator.MAX_SAFE_TOKENS;

    // Token count warnings
    if (tokenCount < SkillValidator.IDEAL_MIN_TOKENS) {
      warnings.push({
        type: 'token_count_low',
        message: `Skill token count (${tokenCount}) is below ideal minimum (${SkillValidator.IDEAL_MIN_TOKENS}) for efficient caching`,
      });
    }

    if (tokenCount > SkillValidator.IDEAL_MAX_TOKENS) {
      warnings.push({
        type: 'token_count_high',
        message: `Skill token count (${tokenCount}) exceeds ideal maximum (${SkillValidator.IDEAL_MAX_TOKENS}). May increase costs.`,
      });
    }

    // Warn if no references
    if (skill.references.length === 0) {
      warnings.push({
        type: 'no_references',
        message: `Skill '${skill.name}' has no reference files. Consider adding examples or documentation.`,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      tokenCount,
      isCacheable,
    };
  }

  /**
   * Validate multiple skills and check combined token count
   * @param skills - Array of skills to validate together
   * @returns Combined validation result
   */
  validateMultiple(skills: SkillContent[]): ValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];
    let totalTokens = 0;

    // Validate each skill individually
    for (const skill of skills) {
      const result = this.validate(skill);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
      totalTokens += result.tokenCount;
    }

    // Check combined token count
    const isCacheable = totalTokens >= SkillValidator.MIN_CACHEABLE_TOKENS &&
                        totalTokens <= SkillValidator.MAX_SAFE_TOKENS;

    if (totalTokens > SkillValidator.MAX_SAFE_TOKENS) {
      allWarnings.push({
        type: 'token_count_high',
        message: `Combined skills exceed maximum safe token count (${totalTokens} > ${SkillValidator.MAX_SAFE_TOKENS})`,
      });
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      tokenCount: totalTokens,
      isCacheable,
    };
  }

  /**
   * Estimate token count for a string
   * Uses rough approximation: 1 token ≈ 4 characters
   * This is conservative for Arabic text (which can be more compact)
   *
   * @param text - Text to estimate tokens for
   * @returns Estimated token count
   */
  estimateTokens(text: string): number {
    // Simple character-based estimation
    // For more accurate estimation, could use a tokenizer library
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if skill content has proper markdown structure
   * @param content - Content to check
   * @returns True if has headers
   */
  private hasProperStructure(content: string): boolean {
    // Check for markdown headers (## or ###)
    return /^#{2,3}\s+.+$/m.test(content);
  }

  /**
   * Format validation result as a human-readable report
   * @param result - Validation result to format
   * @returns Formatted string report
   */
  formatReport(result: ValidationResult): string {
    let report = '=== Skill Validation Report ===\n\n';
    report += `Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}\n`;
    report += `Token Count: ${result.tokenCount.toLocaleString()}\n`;
    report += `Cacheable: ${result.isCacheable ? 'Yes' : 'No'}\n\n`;

    if (result.errors.length > 0) {
      report += '❌ Errors:\n';
      for (const error of result.errors) {
        report += `  - [${error.type}] ${error.message}`;
        if (error.file) {
          report += ` (${error.file})`;
        }
        report += '\n';
      }
      report += '\n';
    }

    if (result.warnings.length > 0) {
      report += '⚠️  Warnings:\n';
      for (const warning of result.warnings) {
        report += `  - [${warning.type}] ${warning.message}`;
        if (warning.file) {
          report += ` (${warning.file})`;
        }
        report += '\n';
      }
    }

    return report;
  }
}

/**
 * Singleton instance for convenient access
 */
export const skillValidator = new SkillValidator();
