/**
 * Question Generation Service Contracts
 * Feature: GAT Exam Platform v3.0
 *
 * This defines the TypeScript interfaces for the server-side question generation
 * service that uses Claude API from Anthropic.
 *
 * Architecture:
 * - Server-side service (runs in Next.js API routes or Server Actions)
 * - Calls Claude API directly via @anthropic-ai/sdk
 * - Uses Skills-based prompt engineering with caching
 * - NOT a public REST API - internal service only
 */

import { Message } from '@anthropic-ai/sdk/resources/messages';

// ============================================================================
// Generation Service Interface
// ============================================================================

/**
 * Main service interface for AI question generation
 * Handles Skills loading, prompt building, Claude API calls, and caching
 */
export interface IQuduratGenerator {
  /**
   * Initialize the generator (load Skills modules)
   */
  initialize(): Promise<void>;

  /**
   * Generate a batch of questions
   * @param params - Generation parameters
   * @returns Array of generated questions with metadata
   */
  generateQuestions(params: GenerationParams): Promise<GenerationResult>;

  /**
   * Generate a full 120-question exam in batches
   * @param config - Exam configuration
   * @returns Exam generation job result
   */
  generateFullExam(config: ExamConfig): Promise<ExamGenerationResult>;

  /**
   * Get generation status (for long-running jobs)
   * @param jobId - Job identifier
   * @returns Current job status
   */
  getGenerationStatus(jobId: string): Promise<GenerationJobStatus>;
}

// ============================================================================
// Generation Parameters
// ============================================================================

export interface GenerationParams {
  // Exam Configuration
  examType: 'full' | 'quant-only' | 'verbal-only';
  section: 'quantitative' | 'verbal';
  track: 'scientific' | 'literary';

  // Batch Configuration
  batchSize: number;  // Typically 20
  batchNumber?: number;  // 1-indexed, for full exam generation
  totalBatches?: number;  // Total batches for full exam

  // Question Distribution
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';  // 'mixed' = 30/50/20 distribution
  diagramCount?: number;  // Number of diagram questions to include
  topicFocus?: string[];  // Optional specific topics to focus on

  // Quality Control
  enableGrammarValidation?: boolean;  // Default: true
  enableQualityChecks?: boolean;  // Default: true
}

export interface ExamConfig {
  // Exam Metadata
  name: string;
  track: 'scientific' | 'literary';
  totalQuestions: number;  // Typically 120

  // Section Distribution
  sectionSplit: {
    quantitative: number;
    verbal: number;
  };

  // Topic Distribution (enforced across full exam)
  topicDistribution: {
    quantitative?: {
      arithmetic: number;  // 0.40
      geometry: number;    // 0.24
      algebra: number;     // 0.23
      statistics: number;  // 0.13
    };
    verbal?: {
      reading: number;     // 0.40
      analogy: number;     // 0.25
      completion: number;  // 0.15
      error: number;       // 0.12
      'odd-word': number;  // 0.08
    };
  };

  // Difficulty Distribution
  difficulty: {
    easy: number;    // 0.30
    medium: number;  // 0.50
    hard: number;    // 0.20
  };

  // Generation Settings
  batchSize: number;  // Default: 20
  diagramPercentage: number;  // Default: 0.15 (15% of questions have diagrams)
}

// ============================================================================
// Generation Results
// ============================================================================

export interface GenerationResult {
  // Generated Questions
  questions: GeneratedQuestion[];

  // Batch Metadata
  batchMetadata: {
    batchId: string;
    cacheHit: boolean;  // Whether Claude API prompt cache was used
    generationTime: number;  // Milliseconds
    cost: number;  // API cost in USD
    model: string;  // e.g., "claude-sonnet-4-20250514"
  };

  // Quality Metrics
  qualityMetrics: {
    flaggedForReview: number;  // Questions sent to review queue
    topicDistribution: Record<string, number>;
    difficultyDistribution: {
      easy: number;
      medium: number;
      hard: number;
    };
  };

  // Error Handling
  errors?: GenerationError[];
}

export interface ExamGenerationResult {
  // Job Information
  jobId: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';

  // Progress (if in_progress)
  progress?: {
    completedBatches: number;
    totalBatches: number;
    questionsGenerated: number;
  };

  // Results (if completed)
  result?: {
    questionIds: string[];  // UUIDs of generated questions
    totalCost: number;
    totalTime: number;
    qualityMetrics: {
      flaggedCount: number;
      topicDistribution: Record<string, number>;
      difficultyDistribution: Record<string, number>;
    };
  };

  // Error (if failed)
  error?: {
    message: string;
    code: string;
    batchNumber?: number;  // Which batch failed
  };
}

export interface GenerationJobStatus {
  jobId: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  progress: {
    completedBatches: number;
    totalBatches: number;
    questionsGenerated: number;
    elapsedTime: number;  // Milliseconds
    estimatedTimeRemaining: number;  // Milliseconds
  };
  result?: ExamGenerationResult['result'];
  error?: ExamGenerationResult['error'];
}

export interface GeneratedQuestion {
  // Core Fields (from data-model.md)
  id: string;
  version: '3.0';
  language: 'ar';
  section: 'quantitative' | 'verbal';
  track: 'scientific' | 'literary';
  questionType: 'mcq' | 'comparison' | 'diagram' | 'reading' | 'analogy' | 'completion' | 'error' | 'odd-word';
  topic: string;
  subtopic: string;
  difficulty: 'easy' | 'medium' | 'hard';

  // Question Content
  questionText: string;
  correctAnswer: string;
  explanation: string;

  // Conditional Fields
  choices?: string[];  // For MCQ
  comparisonValues?: {
    value1: string | number;
    value2: string | number;
  };
  diagramConfig?: any;  // Import from diagram-types.ts
  relationshipType?: string;  // For analogy questions

  // Generation Metadata
  generationMetadata: {
    model: string;
    batchId: string;
    cacheHit: boolean;
    generatedAt: string;  // ISO 8601
  };

  // Quality Flags
  qualityFlags: string[];  // e.g., ['grammar-flagged', 'needs-review']
}

export interface GenerationError {
  code: string;
  message: string;
  questionIndex?: number;
  recoverable: boolean;
}

// ============================================================================
// Skills Loader Interface
// ============================================================================

/**
 * Service for loading and managing Skills modules
 */
export interface ISkillLoader {
  /**
   * Initialize - load all Skills files from disk
   */
  initialize(): Promise<void>;

  /**
   * Build system prompt based on exam type
   * Concatenates relevant Skills modules
   */
  buildSystemPrompt(examType: 'full' | 'quant-only' | 'verbal-only'): string;

  /**
   * Get specific skill content
   */
  getSkill(skillName: SkillName): string;

  /**
   * Validate skills content format
   */
  validateSkills(): Promise<SkillValidationResult>;
}

export type SkillName =
  | 'qudurat-quant'
  | 'qudurat-verbal'
  | 'qudurat-diagrams'
  | 'qudurat-schema'
  | 'qudurat-quality';

export interface SkillValidationResult {
  valid: boolean;
  errors: Array<{
    skill: SkillName;
    error: string;
  }>;
  tokenCount: number;  // Total tokens in system prompt
}

// ============================================================================
// Prompt Builder Interface
// ============================================================================

/**
 * Builds user prompts for Claude API
 */
export interface IPromptBuilder {
  /**
   * Build user prompt for batch generation
   */
  buildBatchPrompt(params: GenerationParams): string;

  /**
   * Build user prompt for single question
   */
  buildSingleQuestionPrompt(params: Omit<GenerationParams, 'batchSize'>): string;
}

// ============================================================================
// Response Parser Interface
// ============================================================================

/**
 * Parses Claude API responses into structured questions
 */
export interface IResponseParser {
  /**
   * Parse questions from Claude API response
   * @param response - Raw Claude API message
   * @returns Parsed questions
   */
  parseQuestions(response: Message): GeneratedQuestion[];

  /**
   * Validate parsed question structure
   */
  validateQuestion(question: any): question is GeneratedQuestion;
}

// ============================================================================
// Question Validator Interface
// ============================================================================

/**
 * Validates generated questions for quality
 */
export interface IQuestionValidator {
  /**
   * Validate question quality
   * @returns Validation result with flags
   */
  validate(question: GeneratedQuestion): Promise<ValidationResult>;

  /**
   * Check Arabic grammar using LLM
   */
  validateGrammar(text: string): Promise<GrammarValidationResult>;

  /**
   * Validate diagram configuration
   */
  validateDiagram(diagramConfig: any): DiagramValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  flags: string[];  // e.g., ['grammar-suspicious', 'distractor-weak']
  shouldReview: boolean;  // Should be added to review queue
  errors: string[];
}

export interface GrammarValidationResult {
  correct: boolean;
  issues: Array<{
    type: 'agreement' | 'conjugation' | 'diacritics' | 'syntax' | 'other';
    description: string;
    location: string;
  }>;
  confidence: number;  // 0-1
}

export interface DiagramValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Prompt Cache Manager Interface
// ============================================================================

/**
 * Manages Claude API prompt caching for cost optimization
 */
export interface IPromptCacheManager {
  /**
   * Check if prompt is cacheable
   */
  isCacheable(systemPrompt: string): boolean;

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats;

  /**
   * Clear cache (for testing)
   */
  clearCache(): void;
}

export interface CacheStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;  // Percentage
  totalCostSavings: number;  // USD
}

// ============================================================================
// Retry Strategy Interface
// ============================================================================

export interface RetryConfig {
  maxRetries: number;  // Default: 3
  baseDelay: number;  // Base delay in ms (Default: 1000)
  maxDelay: number;  // Max delay in ms (Default: 30000)
  backoffMultiplier: number;  // Default: 2 (exponential)
}

export interface RetryContext {
  attempt: number;
  lastError: Error;
  params: GenerationParams;
}

// ============================================================================
// Error Types
// ============================================================================

export class GenerationServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = false,
    public details?: any
  ) {
    super(message);
    this.name = 'GenerationServiceError';
  }
}

export class SkillLoadError extends GenerationServiceError {
  constructor(skillName: string, originalError: Error) {
    super(
      `Failed to load skill: ${skillName}`,
      'SKILL_LOAD_ERROR',
      false,
      { skillName, originalError: originalError.message }
    );
  }
}

export class ClaudeAPIError extends GenerationServiceError {
  constructor(message: string, public statusCode?: number, public apiError?: any) {
    super(
      message,
      'CLAUDE_API_ERROR',
      statusCode ? statusCode >= 500 || statusCode === 429 : false,
      { statusCode, apiError }
    );
  }
}

export class ValidationError extends GenerationServiceError {
  constructor(message: string, public validationErrors: string[]) {
    super(
      message,
      'VALIDATION_ERROR',
      false,
      { validationErrors }
    );
  }
}

export class ParseError extends GenerationServiceError {
  constructor(message: string, public rawResponse: string) {
    super(
      message,
      'PARSE_ERROR',
      false,
      { rawResponse: rawResponse.substring(0, 500) }  // Truncate for logging
    );
  }
}
