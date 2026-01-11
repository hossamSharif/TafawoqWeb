/**
 * API Key Validation Utility
 * Validates that the ANTHROPIC_API_KEY is properly configured
 */

export interface APIKeyValidation {
  isValid: boolean
  error?: string
  details?: string
}

/**
 * Validate that the ANTHROPIC_API_KEY exists and is in the correct format
 */
export function validateAnthropicAPIKey(): APIKeyValidation {
  const apiKey = process.env.ANTHROPIC_API_KEY

  // Check if API key exists
  if (!apiKey) {
    return {
      isValid: false,
      error: 'ANTHROPIC_API_KEY not found in environment variables',
      details: 'Please add ANTHROPIC_API_KEY to your .env.local file',
    }
  }

  // Check if API key is empty
  if (apiKey.trim() === '') {
    return {
      isValid: false,
      error: 'ANTHROPIC_API_KEY is empty',
      details: 'Please set a valid API key in your .env.local file',
    }
  }

  // Check API key format (Anthropic keys typically start with 'sk-ant-')
  if (!apiKey.startsWith('sk-ant-')) {
    return {
      isValid: false,
      error: 'ANTHROPIC_API_KEY has invalid format',
      details: 'Anthropic API keys should start with "sk-ant-"',
    }
  }

  // Check minimum length (Anthropic keys are typically 100+ characters)
  if (apiKey.length < 80) {
    return {
      isValid: false,
      error: 'ANTHROPIC_API_KEY appears to be too short',
      details: `Key length: ${apiKey.length} characters (expected 100+)`,
    }
  }

  return {
    isValid: true,
  }
}

/**
 * Log API key validation result on server startup
 */
export function logAPIKeyStatus(): void {
  const validation = validateAnthropicAPIKey()

  if (validation.isValid) {
    console.log('✅ ANTHROPIC_API_KEY validation: OK')
  } else {
    console.error('❌ ANTHROPIC_API_KEY validation: FAILED')
    console.error(`   Error: ${validation.error}`)
    console.error(`   Details: ${validation.details}`)
    console.error('   ⚠️  Question generation will not work until this is fixed!')
  }
}

/**
 * Get helpful error message for frontend based on validation result
 */
export function getAPIKeyErrorMessage(validation: APIKeyValidation): string {
  if (validation.isValid) {
    return ''
  }

  return 'خطأ في إعدادات النظام. يرجى التواصل مع الدعم الفني.'
}

/**
 * Check if an error is an API key authentication error
 */
export function isAuthenticationError(error: unknown): boolean {
  const errorMessage = error instanceof Error ? error.message : String(error)
  return (
    errorMessage.includes('authentication_error') ||
    errorMessage.includes('invalid x-api-key') ||
    errorMessage.includes('invalid_api_key') ||
    errorMessage.includes('401')
  )
}
