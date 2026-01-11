import { NextRequest, NextResponse } from 'next/server'
import { QuduratGenerator } from '@/services/generation/QuduratGenerator'
import type { QuestionGenerationParams } from '@/services/generation/PromptBuilder'

/**
 * Test endpoint for debugging question generation
 * GET /api/test-generation
 */
export async function GET(request: NextRequest) {
  try {
    console.log('=== Testing Question Generation ===')

    // Test 1: Check if API key is present
    const apiKey = process.env.ANTHROPIC_API_KEY
    console.log('API Key present:', !!apiKey)
    console.log('API Key length:', apiKey?.length || 0)

    if (!apiKey) {
      return NextResponse.json({
        error: 'ANTHROPIC_API_KEY not found in environment',
        success: false,
      }, { status: 500 })
    }

    // Test 2: Create generator instance
    console.log('Creating QuduratGenerator...')
    const generator = new QuduratGenerator({
      enableCaching: true,
      maxRetries: 1, // Just 1 retry for testing
    })
    console.log('Generator created successfully')

    // Test 3: Try to generate a single question
    console.log('Generating test question...')
    const params: QuestionGenerationParams = {
      section: 'quantitative',
      track: 'scientific',
      topic: 'algebra',
      subtopic: undefined,
      difficulty: 'easy',
      questionType: 'mcq',
    }

    console.log('Generation params:', JSON.stringify(params, null, 2))

    const result = await generator.generateBatch([params])

    console.log('Generation result:', {
      success: result.success,
      questionsCount: result.questions.length,
      failedCount: result.failed.length,
      error: result.error,
      metadata: result.metadata,
    })

    // Log first question if any
    if (result.questions.length > 0) {
      console.log('First question preview:', {
        id: result.questions[0].id,
        question_text: result.questions[0].question_text?.substring(0, 100),
        choices: result.questions[0].choices,
      })
    }

    // Log failed questions if any
    if (result.failed.length > 0) {
      console.log('Failed questions:', result.failed.map(f => ({
        validation: f.validation,
        dataPreview: JSON.stringify(f.data).substring(0, 200),
      })))
    }

    return NextResponse.json({
      success: result.success,
      questionsGenerated: result.questions.length,
      questionsFailed: result.failed.length,
      error: result.error,
      metadata: result.metadata,
      sampleQuestion: result.questions[0] || null,
      failedSample: result.failed[0] || null,
    })
  } catch (error) {
    console.error('=== Test Generation Error ===')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')

    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      errorType: error?.constructor?.name,
      stack: error instanceof Error ? error.stack : undefined,
      success: false,
    }, { status: 500 })
  }
}
