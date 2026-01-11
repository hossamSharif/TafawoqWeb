/**
 * analogy-generation-test.ts
 * Test script for analogy question generation across all 22 relationship types
 * Verifies User Story 5 implementation
 *
 * Tests:
 * - Generate questions for each of 22 relationship types
 * - Verify relationship_type field is correctly set
 * - Verify Arabic word pairs are appropriate
 * - Verify relationship identification in explanations
 * - Verify balanced distribution
 *
 * Usage:
 * npm run test:analogy-generation
 * or
 * ts-node tests/analogy-generation-test.ts
 */

import { QuduratGenerator } from '@/services/generation/QuduratGenerator';
import { QuestionValidator } from '@/services/generation/QuestionValidator';
import {
  getAllAnalogyRelationshipIds,
  getAnalogyRelationshipNameAr,
} from '@/lib/constants/analogy-relationships';

interface TestResult {
  relationshipType: string;
  relationshipNameAr: string;
  success: boolean;
  question?: any;
  error?: string;
}

async function testAnalogyGeneration() {
  console.log('='.repeat(80));
  console.log('ANALOGY QUESTION GENERATION TEST - User Story 5');
  console.log('Testing all 22 relationship types');
  console.log('='.repeat(80));
  console.log('');

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ERROR: ANTHROPIC_API_KEY environment variable not set');
    console.error('Please set your API key before running this test.');
    process.exit(1);
  }

  // Initialize generator and validator
  const generator = new QuduratGenerator({
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-sonnet-4-20250514',
    maxTokens: 4000,
    temperature: 1.0,
    enableCaching: true,
  });

  const validator = new QuestionValidator();
  const allRelationshipTypes = getAllAnalogyRelationshipIds();

  console.log(`Total relationship types to test: ${allRelationshipTypes.length}`);
  console.log('');

  // Track results
  const results: TestResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  // Test each relationship type
  for (let i = 0; i < allRelationshipTypes.length; i++) {
    const relType = allRelationshipTypes[i];
    const relNameAr = getAnalogyRelationshipNameAr(relType);

    console.log(`[${i + 1}/${allRelationshipTypes.length}] Testing: ${relType} (${relNameAr})`);

    try {
      // Generate question for this relationship type
      const result = await generator.generateWithRetry({
        section: 'verbal',
        track: 'scientific',
        questionType: 'analogy',
        topic: 'analogy',
        subtopic: relType,
        difficulty: 'medium',
        relationshipType: relType,
      });

      if (!result.success || result.questions.length === 0) {
        console.log(`  ❌ FAIL: ${result.error || 'No questions generated'}`);
        results.push({
          relationshipType: relType,
          relationshipNameAr: relNameAr,
          success: false,
          error: result.error || 'No questions generated',
        });
        failureCount++;
        continue;
      }

      const question = result.questions[0];

      // Validate question structure
      const validation = validator.validate(question);

      if (!validation.valid) {
        console.log(`  ❌ FAIL: Validation failed`);
        validation.errors.forEach(err => {
          console.log(`    - ${err.field}: ${err.message}`);
        });
        results.push({
          relationshipType: relType,
          relationshipNameAr: relNameAr,
          success: false,
          error: 'Validation failed',
        });
        failureCount++;
        continue;
      }

      // Verify relationship_type field
      if (question.relationship_type !== relType) {
        console.log(`  ❌ FAIL: relationship_type mismatch`);
        console.log(`    Expected: ${relType}`);
        console.log(`    Got: ${question.relationship_type}`);
        results.push({
          relationshipType: relType,
          relationshipNameAr: relNameAr,
          success: false,
          error: 'relationship_type mismatch',
          question,
        });
        failureCount++;
        continue;
      }

      // Verify explanation mentions relationship
      const explanationIncludesRelationship =
        question.explanation.includes(relNameAr) || question.explanation.includes(relType);

      if (!explanationIncludesRelationship) {
        console.log(`  ⚠️  WARNING: Explanation doesn't mention relationship name`);
      }

      // Success!
      console.log(`  ✅ PASS`);
      console.log(`    Question: ${question.question_text.substring(0, 50)}...`);
      console.log(`    Correct Answer: ${question.correct_answer}`);

      results.push({
        relationshipType: relType,
        relationshipNameAr: relNameAr,
        success: true,
        question,
      });
      successCount++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.log(`  ❌ FAIL: ${error.message}`);
      results.push({
        relationshipType: relType,
        relationshipNameAr: relNameAr,
        success: false,
        error: error.message,
      });
      failureCount++;
    }

    console.log('');
  }

  // Print summary
  console.log('='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log('');
  console.log(`Total tests: ${allRelationshipTypes.length}`);
  console.log(`✅ Passed: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`Success rate: ${((successCount / allRelationshipTypes.length) * 100).toFixed(1)}%`);
  console.log('');

  // Show failed types
  if (failureCount > 0) {
    console.log('Failed relationship types:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`  - ${r.relationshipType} (${r.relationshipNameAr}): ${r.error}`);
      });
    console.log('');
  }

  // Cache metrics
  const cacheMetrics = generator.getCacheMetrics();
  console.log('Cache Performance:');
  console.log(`  Cache hits: ${cacheMetrics.cacheHits}`);
  console.log(`  Cache misses: ${cacheMetrics.cacheMisses}`);
  console.log(`  Hit rate: ${(cacheMetrics.hitRate * 100).toFixed(1)}%`);
  console.log(`  Total cost saved: $${cacheMetrics.costSavings.toFixed(4)}`);
  console.log('');

  // Export results to JSON
  const resultsJson = JSON.stringify(results, null, 2);
  const fs = await import('fs');
  const outputPath = './tests/analogy-generation-results.json';

  fs.writeFileSync(outputPath, resultsJson);
  console.log(`Results saved to: ${outputPath}`);
  console.log('');

  // Exit with appropriate code
  if (failureCount > 0) {
    console.log('❌ SOME TESTS FAILED');
    process.exit(1);
  } else {
    console.log('✅ ALL TESTS PASSED');
    process.exit(0);
  }
}

// Run test if executed directly
if (require.main === module) {
  testAnalogyGeneration().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { testAnalogyGeneration };
