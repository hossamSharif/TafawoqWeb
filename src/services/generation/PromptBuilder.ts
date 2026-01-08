/**
 * PromptBuilder.ts
 * Builds system and user prompts for Claude API question generation
 *
 * Features:
 * - Concatenates multiple Skills into system prompt
 * - Builds user prompts with generation parameters
 * - Optimizes for prompt caching (5K-15K tokens ideal)
 * - Supports different question types and topics
 *
 * @see specs/1-gat-exam-v3/plan.md - Prompt Construction
 */

import { SkillLoader } from '../skills/SkillLoader';
import { SkillValidator } from '../skills/SkillValidator';

export interface QuestionGenerationParams {
  /** Section: quantitative or verbal */
  section: 'quantitative' | 'verbal';
  /** Track: scientific or literary */
  track: 'scientific' | 'literary';
  /** Question type */
  questionType: 'mcq' | 'comparison' | 'diagram' | 'reading' | 'analogy' | 'completion' | 'error' | 'odd-word';
  /** Main topic */
  topic: string;
  /** Specific subtopic */
  subtopic?: string;
  /** Difficulty level */
  difficulty: 'easy' | 'medium' | 'hard';
  /** Number of questions to generate in this batch */
  batchSize?: number;
  /** Additional constraints or requirements */
  constraints?: string[];
  /** Problem type (e.g., "word-problem" for word problems) */
  problemType?: string;
  /** Word problem category (if problemType is "word-problem") */
  wordProblemCategory?: 'speed-time-distance' | 'work' | 'age' | 'profit-loss' | 'mixture';
  /** Relationship type for analogy questions (User Story 5) */
  relationshipType?: string;
}

export interface BuiltPrompt {
  /** System prompt (from Skills) */
  systemPrompt: string;
  /** User prompt (generation parameters) */
  userPrompt: string;
  /** Estimated total tokens */
  estimatedTokens: number;
  /** Skills used */
  skillsUsed: string[];
}

export class PromptBuilder {
  private skillLoader: SkillLoader;
  private skillValidator: SkillValidator;

  constructor(skillLoader?: SkillLoader, skillValidator?: SkillValidator) {
    this.skillLoader = skillLoader || new SkillLoader();
    this.skillValidator = skillValidator || new SkillValidator();
  }

  /**
   * Build complete prompt for question generation
   * @param params - Generation parameters
   * @returns Built prompt ready for Claude API
   */
  async buildPrompt(params: QuestionGenerationParams): Promise<BuiltPrompt> {
    // Determine which skills to load based on question type
    const skillNames = this.determineRequiredSkills(params);

    // Load skills
    const skills = await this.skillLoader.loadMultipleSkills(skillNames);

    // Validate combined skills
    const validation = this.skillValidator.validateMultiple([skills]);
    if (!validation.isValid) {
      throw new Error(
        `Skills validation failed: ${validation.errors.map(e => e.message).join(', ')}`
      );
    }

    // Build system prompt from skills
    const systemPrompt = this.buildSystemPrompt(skills.fullContent);

    // Build user prompt from parameters
    const userPrompt = this.buildUserPrompt(params);

    // Estimate total tokens
    const systemTokens = this.skillValidator.estimateTokens(systemPrompt);
    const userTokens = this.skillValidator.estimateTokens(userPrompt);
    const estimatedTokens = systemTokens + userTokens;

    return {
      systemPrompt,
      userPrompt,
      estimatedTokens,
      skillsUsed: skillNames,
    };
  }

  /**
   * Determine which Skills to load based on question parameters
   */
  private determineRequiredSkills(params: QuestionGenerationParams): string[] {
    const skills: string[] = [];

    // Always include schema skill
    skills.push('qudurat-schema');

    // Section-specific skills
    if (params.section === 'quantitative') {
      skills.push('qudurat-quant');

      // Add diagram skill for diagram questions or geometry topics
      if (
        params.questionType === 'diagram' ||
        params.topic === 'geometry' ||
        params.topic === 'statistics'
      ) {
        skills.push('qudurat-diagrams');
      }
    } else if (params.section === 'verbal') {
      skills.push('qudurat-verbal');
    }

    // Always include quality skill for validation rules
    skills.push('qudurat-quality');

    return skills;
  }

  /**
   * Build system prompt from skills content
   */
  private buildSystemPrompt(skillsContent: string): string {
    return `You are an expert GAT (General Aptitude Test) question generator for Saudi Arabian students.

Your role is to generate high-quality, accurate exam questions in formal Arabic (فصحى) that match the official GAT standards.

${skillsContent}

CRITICAL REQUIREMENTS:
1. All questions MUST be in formal Arabic (فصحى)
2. All calculations MUST be verifiable and correct
3. Follow exact JSON schema from qudurat-schema skill
4. Apply all quality criteria from qudurat-quality skill
5. Ensure mental-math-friendly numbers (no calculator needed)
6. Generate realistic distractors based on common student errors
7. Provide detailed explanations in Arabic

OUTPUT FORMAT:
Return ONLY valid JSON matching the schema. Do not include any text before or after the JSON.`;
  }

  /**
   * Build user prompt with generation parameters
   */
  private buildUserPrompt(params: QuestionGenerationParams): string {
    const batchSize = params.batchSize || 1;
    const constraints = params.constraints || [];

    let prompt = `Generate ${batchSize} ${params.difficulty} difficulty ${params.questionType} question${batchSize > 1 ? 's' : ''} for the GAT exam.\n\n`;

    prompt += `PARAMETERS:\n`;
    prompt += `- Section: ${params.section}\n`;
    prompt += `- Track: ${params.track}\n`;
    prompt += `- Topic: ${params.topic}\n`;
    if (params.subtopic) {
      prompt += `- Subtopic: ${params.subtopic}\n`;
    }
    prompt += `- Difficulty: ${params.difficulty}\n`;
    prompt += `- Question Type: ${params.questionType}\n`;
    if (params.problemType) {
      prompt += `- Problem Type: ${params.problemType}\n`;
    }
    if (params.wordProblemCategory) {
      prompt += `- Word Problem Category: ${params.wordProblemCategory}\n`;
    }
    if (params.relationshipType) {
      prompt += `- Relationship Type: ${params.relationshipType}\n`;
    }

    if (constraints.length > 0) {
      prompt += `\nADDITIONAL CONSTRAINTS:\n`;
      constraints.forEach((constraint, i) => {
        prompt += `${i + 1}. ${constraint}\n`;
      });
    }

    // Add specific instructions based on question type
    prompt += this.getQuestionTypeInstructions(params.questionType, params.problemType, params.wordProblemCategory);

    // Add batch generation instructions if generating multiple
    if (batchSize > 1) {
      prompt += `\nBATCH GENERATION:\n`;
      prompt += `- Generate ${batchSize} unique questions\n`;
      prompt += `- Ensure variety in problem types and approaches\n`;
      prompt += `- Avoid repetitive patterns\n`;
      prompt += `- Return as JSON array of questions\n`;
    } else {
      prompt += `\nReturn as a single JSON object matching the schema.\n`;
    }

    return prompt;
  }

  /**
   * Get specific instructions based on question type
   */
  private getQuestionTypeInstructions(questionType: string, problemType?: string, wordProblemCategory?: string): string {
    const instructions: Record<string, string> = {
      mcq: `
MCQ INSTRUCTIONS:
- Provide exactly 4 answer choices
- Ensure only one correct answer
- Make distractors plausible based on common errors
- Label choices as أ، ب، ج، د (A, B, C, D in Arabic)`,

      comparison: `
COMPARISON INSTRUCTIONS:
- Provide two values (القيمة الأولى and القيمة الثانية)
- Answer choices MUST be exactly these 4 in Arabic:
  1. القيمة الأولى أكبر
  2. القيمة الثانية أكبر
  3. القيمتان متساويتان
  4. المعطيات غير كافية للمقارنة
- Ensure mathematical relationship is clear`,

      diagram: `
DIAGRAM INSTRUCTIONS:
- REQUIRED: Include complete "diagram" object with type, renderHint, data, and caption
- Choose appropriate renderHint: "SVG" for simple shapes, "JSXGraph" for overlapping, "Chart.js" for statistics
- Provide Arabic labels for all diagram elements
- Include formulaUsed field for geometric calculations
- Add accessibility caption describing the diagram in Arabic
- For overlapping shapes: specify shading configuration
- IMPORTANT: Field name must be "diagram" (not "diagram_config")`,

      analogy: `
ANALOGY INSTRUCTIONS:
- Specify relationship_type from the 22 relationship types
- Provide word pairs that clearly demonstrate the relationship
- Include relationship name in explanation
- Ensure culturally appropriate Arabic vocabulary`,

      reading: `
READING COMPREHENSION INSTRUCTIONS:
- Provide a passage (100-200 words) in formal Arabic
- Question should test comprehension, inference, or vocabulary
- Ensure answer is directly supported by the passage`,

      completion: `
SENTENCE COMPLETION INSTRUCTIONS:
- Provide sentence with blank(s)
- Choices should fit grammatically and semantically
- Ensure context clues guide to correct answer`,

      error: `
ERROR IDENTIFICATION INSTRUCTIONS:
- Provide sentence with one grammatical or contextual error
- Highlight the error location
- Explain the correction in the explanation`,

      'odd-word': `
ODD WORD OUT INSTRUCTIONS:
- Provide 4 words where 3 belong to same category
- One word should be clearly different
- Explain the semantic relationship`,
    };

    let baseInstructions = instructions[questionType] || '';

    // Add word problem-specific instructions if problemType is "word-problem"
    if (problemType === 'word-problem') {
      baseInstructions += `\n
WORD PROBLEM INSTRUCTIONS:
- REQUIRED: Set problemType = "word-problem" and questionType = "mcq"
- REQUIRED: Set wordProblemCategory to one of: "speed-time-distance", "work", "age", "profit-loss", "mixture"
- REQUIRED: Set stepByStep = true
- REQUIRED: Use realistic Arabic names from: أحمد، محمد، خالد، عبدالله، سعود، فهد، ناصر، علي، عمر، يوسف (male) or فاطمة، نورة، سارة، مريم، عائشة، هدى، ريم، منى، لمى، شهد (female)
- REQUIRED: Use Saudi/Gulf context: cities (الرياض، جدة، مكة المكرمة، المدينة المنورة، الدمام، الطائف), currency (ريال), common products
- REQUIRED: Provide step-by-step explanation with exact format:
  **المعطيات:**
  [list given information]

  **المطلوب:** [what is required]

  **الحل:**
  **الخطوة 1:** [identify formula/approach]
  **الخطوة 2:** [substitute values]
  **الخطوة 3:** [perform calculation]

  **الإجابة النهائية:** [final answer with units]

- REQUIRED: Use mental-math-friendly numbers (see SKILL.md for ranges per category)
- REQUIRED: Include arabicNames array with names used
- REQUIRED: Include saudiContext array if using Saudi-specific elements
- FORBIDDEN: Do NOT use interest/riba (الربا), alcohol (except "كحول طبي"), or non-Arabic names
- Generate distractors based on common errors: formula error, calculation error, unit error, conceptual error`;

      if (wordProblemCategory) {
        baseInstructions += `\n\nCATEGORY SPECIFIC (${wordProblemCategory}):\n`;
        const categoryInstructions: Record<string, string> = {
          'speed-time-distance': `- Use formulas: المسافة = السرعة × الزمن, السرعة = المسافة ÷ الزمن, الزمن = المسافة ÷ السرعة
- Speeds: 40-120 km/h (cars), 500-900 km/h (planes)
- Distances: 100-960 km
- Times: 1-12 hours
- Scenarios: simple travel, meeting problems, catching up, relative speed`,

          'work': `- Use formulas: العمل = المعدل × الزمن, معدل = 1/زمن الإنجاز, المعدل المشترك = معدل A + معدل B
- Days to complete: 2-30 days
- Work rates as simple fractions: 1/2, 1/3, 1/4, 1/5, 1/6, 1/8, 1/10, 1/12
- Scenarios: joint work, pipes and tanks, partial then joint, different rates`,

          'age': `- Use formulas: العمر الحالي = العمر الماضي + السنوات, الفرق ثابت دائماً
- Current ages: 5-60 years
- Years ago/future: 2-20 years
- Ratios: 2:1, 3:1, 3:2, 4:1, 5:2
- Scenarios: age ratio, age over time, sum of ages, age difference
- Family relations: أب، أم، ابن، ابنة، أخ، أخت، جد، جدة`,

          'profit-loss': `- Use formulas: الربح = سعر البيع - التكلفة, نسبة الربح = (الربح ÷ التكلفة) × 100%, سعر البيع = التكلفة × (1 + نسبة الربح)
- Cost prices: 100-1000 ريال
- Profit %: 5%, 10%, 15%, 20%, 25%, 30%, 40%, 50%
- Loss %: 5%, 10%, 15%, 20%, 25%
- Discounts: 10%, 15%, 20%, 25%, 30%, 40%, 50%
- Scenarios: simple profit/loss, find cost, successive discounts, break-even`,

          'mixture': `- Use formulas: إجمالي القيمة = (كمية A × سعر A) + (كمية B × سعر B), متوسط السعر = إجمالي القيمة ÷ إجمالي الكمية
- Quantities: 2-30 kg or liters
- Concentrations: 5%-100%
- Prices per kg: 10-50 ريال
- Scenarios: mixing by price, concentration, dilution, alligation`,
        };

        baseInstructions += categoryInstructions[wordProblemCategory] || '';
      }
    }

    return baseInstructions;
  }

  /**
   * Build prompt for batch generation (multiple questions at once)
   * Optimized for prompt caching efficiency
   */
  async buildBatchPrompt(
    paramsArray: QuestionGenerationParams[]
  ): Promise<BuiltPrompt> {
    if (paramsArray.length === 0) {
      throw new Error('Cannot build batch prompt with empty params array');
    }

    // Use first params to determine skills (assume same section for batch)
    const firstParams = paramsArray[0];
    const skillNames = this.determineRequiredSkills(firstParams);

    // Load skills (will be cached)
    const skills = await this.skillLoader.loadMultipleSkills(skillNames);

    // Build system prompt (same for entire batch)
    const systemPrompt = this.buildSystemPrompt(skills.fullContent);

    // Build combined user prompt for all questions
    let userPrompt = `Generate a batch of ${paramsArray.length} GAT exam questions with the following specifications:\n\n`;

    paramsArray.forEach((params, index) => {
      userPrompt += `QUESTION ${index + 1}:\n`;
      userPrompt += `- Section: ${params.section}\n`;
      userPrompt += `- Topic: ${params.topic}${params.subtopic ? ' / ' + params.subtopic : ''}\n`;
      userPrompt += `- Type: ${params.questionType}\n`;
      userPrompt += `- Difficulty: ${params.difficulty}\n`;
      userPrompt += `\n`;
    });

    userPrompt += `\nReturn as JSON array with ${paramsArray.length} question objects matching the schema.\n`;
    userPrompt += `Ensure variety and avoid repetitive patterns across the batch.\n`;

    const systemTokens = this.skillValidator.estimateTokens(systemPrompt);
    const userTokens = this.skillValidator.estimateTokens(userPrompt);

    return {
      systemPrompt,
      userPrompt,
      estimatedTokens: systemTokens + userTokens,
      skillsUsed: skillNames,
    };
  }
}

/**
 * Singleton instance for convenient access
 */
export const promptBuilder = new PromptBuilder();
