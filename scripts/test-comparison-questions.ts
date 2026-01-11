/**
 * Test script for comparison question generation
 * Verifies User Story 3 (Phase 5) implementation
 *
 * Tests:
 * - Question generation with comparison type
 * - Correct comparisonValues structure
 * - Four standard answer choices
 * - All four answer scenarios (value1 larger, value2 larger, equal, insufficient data)
 * - Schema validation
 */

import { QuduratGenerator } from '../src/services/generation/QuduratGenerator';
import { QuestionValidator } from '../src/services/generation/QuestionValidator';
import type { QuestionGenerationParams } from '../src/services/generation/PromptBuilder';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testComparisonQuestionGeneration() {
  log('\n=== Testing Comparison Question Generation (User Story 3) ===\n', 'cyan');

  // Check API key
  if (!process.env.ANTHROPIC_API_KEY) {
    log('❌ ANTHROPIC_API_KEY not found in environment', 'red');
    log('Please set ANTHROPIC_API_KEY in .env file', 'yellow');
    process.exit(1);
  }

  const generator = new QuduratGenerator({
    apiKey: process.env.ANTHROPIC_API_KEY,
    enableCaching: false, // Disable caching for testing
  });

  const validator = new QuestionValidator();

  // Test scenarios for all four answer types
  const scenarios = [
    {
      name: 'Equal Values',
      subtopic: 'algebraic',
      constraints: ['Generate a comparison where the two values are equal'],
      expectedAnswer: 'القيمتان متساويتان',
    },
    {
      name: 'Value 1 Larger',
      subtopic: 'fractions',
      constraints: ['Generate a comparison where value1 is larger than value2'],
      expectedAnswer: 'القيمة الأولى أكبر',
    },
    {
      name: 'Value 2 Larger',
      subtopic: 'percentages',
      constraints: ['Generate a comparison where value2 is larger than value1'],
      expectedAnswer: 'القيمة الثانية أكبر',
    },
    {
      name: 'Insufficient Data',
      subtopic: 'algebraic',
      constraints: [
        'Generate a comparison with variables where the relationship depends on unknown values',
      ],
      expectedAnswer: 'المعطيات غير كافية للمقارنة',
    },
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const scenario of scenarios) {
    log(`\n--- Testing Scenario: ${scenario.name} ---`, 'blue');

    const params: QuestionGenerationParams = {
      section: 'quantitative',
      track: 'scientific',
      questionType: 'comparison',
      topic: 'comparisons',
      subtopic: scenario.subtopic,
      difficulty: 'medium',
      batchSize: 1,
      constraints: scenario.constraints,
    };

    try {
      log('Generating question...', 'yellow');
      const result = await generator.generateWithRetry(params);

      if (!result.success) {
        log(`❌ Generation failed: ${result.error}`, 'red');
        failedTests++;
        continue;
      }

      if (result.questions.length === 0) {
        log('❌ No questions generated', 'red');
        failedTests++;
        continue;
      }

      const question = result.questions[0];
      log('✓ Question generated successfully', 'green');

      // Test 1: Validate structure
      log('\nValidating question structure...', 'yellow');
      const validation = validator.validate(question);

      if (!validation.valid) {
        log('❌ Validation failed:', 'red');
        validation.errors.forEach(err => {
          log(`  - ${err.field}: ${err.message}`, 'red');
        });
        failedTests++;
        continue;
      }
      log('✓ Validation passed', 'green');

      // Test 2: Check comparisonValues structure
      log('\nChecking comparisonValues structure...', 'yellow');
      if (!question.comparison_values) {
        log('❌ Missing comparison_values field', 'red');
        failedTests++;
        continue;
      }

      const { value1, value2 } = question.comparison_values as any;

      if (!value1 || !value1.expression || !value1.label) {
        log('❌ Invalid value1 structure', 'red');
        failedTests++;
        continue;
      }

      if (!value2 || !value2.expression || !value2.label) {
        log('❌ Invalid value2 structure', 'red');
        failedTests++;
        continue;
      }

      log(`✓ value1: ${value1.expression} (${value1.label})`, 'green');
      log(`✓ value2: ${value2.expression} (${value2.label})`, 'green');

      // Test 3: Check standard choices
      log('\nChecking answer choices...', 'yellow');
      const standardChoices = [
        'القيمة الأولى أكبر',
        'القيمة الثانية أكبر',
        'القيمتان متساويتان',
        'المعطيات غير كافية للمقارنة',
      ];

      if (!question.choices || question.choices.length !== 4) {
        log('❌ Invalid choices array', 'red');
        failedTests++;
        continue;
      }

      const choicesMatch = question.choices.every(
        (choice, index) => choice === standardChoices[index]
      );

      if (!choicesMatch) {
        log('❌ Choices do not match standard choices', 'red');
        log(`Expected: ${standardChoices.join(', ')}`, 'yellow');
        log(`Got: ${question.choices.join(', ')}`, 'yellow');
        failedTests++;
        continue;
      }

      log('✓ All four standard choices present and in correct order', 'green');

      // Test 4: Display question details
      log('\n📝 Generated Question:', 'cyan');
      log(`  Question: ${question.question_text}`, 'reset');
      log(`  Value 1: ${value1.expression}`, 'reset');
      log(`  Value 2: ${value2.expression}`, 'reset');
      log(`  Correct Answer: ${question.correct_answer}`, 'reset');
      log(`  Explanation: ${question.explanation}`, 'reset');

      // Test 5: Generation metadata
      log('\n📊 Generation Metadata:', 'cyan');
      log(`  Model: ${result.metadata.model}`, 'reset');
      log(`  Cache Hit: ${result.metadata.cacheHit}`, 'reset');
      log(`  Retries: ${result.metadata.retriesAttempted}`, 'reset');
      log(`  Total Tokens: ${result.metadata.totalTokens}`, 'reset');

      log(`\n✅ Scenario "${scenario.name}" PASSED`, 'green');
      passedTests++;
    } catch (error) {
      log(`❌ Error in scenario "${scenario.name}":`, 'red');
      log(String(error), 'red');
      failedTests++;
    }
  }

  // Summary
  log('\n=== Test Summary ===', 'cyan');
  log(`Total Scenarios: ${scenarios.length}`, 'blue');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, 'red');

  if (failedTests === 0) {
    log('\n🎉 All comparison question tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Please review the errors above.', 'yellow');
    process.exit(1);
  }
}

// Run tests
testComparisonQuestionGeneration().catch(error => {
  log('\n❌ Fatal error:', 'red');
  console.error(error);
  process.exit(1);
});
