import { NextResponse } from 'next/server'
import { serverEnv } from '@/lib/env'
import { callOpenRouter, getCurrentModel, FREE_MODELS } from '@/lib/gemini'

/**
 * GET /api/test/gemini - Test OpenRouter API connection
 * TEMPORARY: For debugging - DELETE AFTER TESTING
 */
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  try {
    const apiKey = serverEnv.openrouter.apiKey

    if (!apiKey) {
      return NextResponse.json({
        error: 'OPENROUTER_API_KEY not configured',
        hasKey: false
      }, { status: 500 })
    }

    // Test simple generation
    const text = await callOpenRouter({
      messages: [
        { role: 'user', content: 'Say "Hello" in Arabic' }
      ],
      temperature: 0.7,
      maxTokens: 100,
    })

    return NextResponse.json({
      success: true,
      hasKey: true,
      keyPrefix: apiKey.substring(0, 15) + '...',
      currentModel: getCurrentModel(),
      availableModels: FREE_MODELS,
      response: text,
    })
  } catch (error) {
    console.error('OpenRouter test error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      currentModel: getCurrentModel(),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }
}
