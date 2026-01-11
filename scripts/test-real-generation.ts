/**
 * Test script to verify actual overlapping-diagram question generation
 *
 * This script calls the actual PromptBuilder to verify
 * the system prompt includes overlapping diagram instructions
 */

import { PromptBuilder, QuestionGenerationParams } from '../src/services/generation/PromptBuilder';

async function testOverlappingDiagramGeneration() {
  console.log('='.repeat(60));
  console.log('TESTING REAL PROMPTBUILDER FOR OVERLAPPING DIAGRAMS');
  console.log('='.repeat(60));

  const promptBuilder = new PromptBuilder();

  // Test overlapping-diagram question type
  const params: QuestionGenerationParams = {
    section: 'quantitative',
    track: 'scientific',
    questionType: 'overlapping-diagram',
    topic: 'geometry',
    subtopic: 'overlapping-shapes',
    difficulty: 'medium',
    batchSize: 1,
  };

  console.log('\nTest params:');
  console.log(JSON.stringify(params, null, 2));

  try {
    const result = await promptBuilder.buildPrompt(params);

    console.log('\n--- RESULT ---');
    console.log('Skills used:', result.skillsUsed);
    console.log('Estimated tokens:', result.estimatedTokens);

    // Check if overlapping diagram instructions are in the user prompt
    const hasOverlappingInstructions = result.userPrompt.includes('OVERLAPPING DIAGRAM');
    console.log('\nUser prompt includes OVERLAPPING DIAGRAM instructions:', hasOverlappingInstructions);

    // Check if the system prompt includes qudurat-diagrams skill
    const hasDiagramSkill = result.skillsUsed.includes('qudurat-diagrams');
    console.log('Includes qudurat-diagrams skill:', hasDiagramSkill);

    // Show relevant portions of prompts
    console.log('\n--- USER PROMPT (first 1000 chars) ---');
    console.log(result.userPrompt.substring(0, 1000));

    if (hasOverlappingInstructions && hasDiagramSkill) {
      console.log('\n✅ SUCCESS: PromptBuilder correctly generates overlapping-diagram prompts!');
    } else {
      console.log('\n❌ FAILURE: Missing expected content');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testOverlappingDiagramGeneration().catch(console.error);
