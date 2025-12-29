/**
 * Phone number validation utilities for Saudi Arabia (+966)
 * Validates and formats phone numbers in E.164 format
 */

// Saudi mobile numbers: start with 5, followed by 8 digits (total 9 digits)
export const SAUDI_PHONE_REGEX = /^(5[0-9]{8})$/

// Flexible input format: allows +966 or 966 prefix
export const FORMATTED_SAUDI_PHONE_REGEX = /^(\+?966)?5[0-9]{8}$/

export interface PhoneValidationResult {
  isValid: boolean
  error?: string
  formatted?: string // E.164 without + (e.g., 966501234567)
}

/**
 * Validates and formats Saudi phone numbers
 *
 * Accepts various input formats:
 * - 0501234567
 * - 501234567
 * - +966501234567
 * - 966501234567
 * - 0 50 123 4567 (with spaces)
 *
 * Returns E.164 format without + (966501234567)
 *
 * @param input Phone number in any common format
 * @returns Validation result with formatted number if valid
 */
export function validateSaudiPhone(input: string): PhoneValidationResult {
  if (!input || input.trim() === '') {
    return {
      isValid: false,
      error: 'رقم الجوال مطلوب'
    }
  }

  // Remove all non-digit characters except + at the start
  let cleaned = input.trim()

  // Remove spaces, dashes, parentheses
  cleaned = cleaned.replace(/[\s\-\(\)]/g, '')

  // Remove +966 or 966 prefix if present
  const withoutPrefix = cleaned.replace(/^(\+?966)/, '')

  // Remove leading 0 if present (Saudi format: 0501234567)
  const withoutZero = withoutPrefix.replace(/^0/, '')

  // Validate: must start with 5 and be exactly 9 digits
  if (!SAUDI_PHONE_REGEX.test(withoutZero)) {
    // Check if it's the right length but wrong starting digit
    if (/^[0-9]{9}$/.test(withoutZero) && !withoutZero.startsWith('5')) {
      return {
        isValid: false,
        error: 'رقم الجوال يجب أن يبدأ بالرقم 5 (أرقام الجوال السعودية)'
      }
    }

    // Check if it's too short or too long
    if (withoutZero.length < 9) {
      return {
        isValid: false,
        error: `رقم الجوال قصير جداً (${withoutZero.length}/9 أرقام)`
      }
    }

    if (withoutZero.length > 9) {
      return {
        isValid: false,
        error: `رقم الجوال طويل جداً (${withoutZero.length}/9 أرقام)`
      }
    }

    return {
      isValid: false,
      error: 'رقم الجوال يجب أن يبدأ بـ 5 ويتكون من 9 أرقام'
    }
  }

  // Format to E.164 without + (966501234567)
  const formatted = `966${withoutZero}`

  return {
    isValid: true,
    formatted
  }
}

/**
 * Formats a validated phone number for display
 *
 * @param phoneNumber Phone number in E.164 format (966501234567)
 * @returns Formatted display string (+966 50 123 4567)
 */
export function formatPhoneForDisplay(phoneNumber: string): string {
  // Remove 966 prefix
  const without966 = phoneNumber.replace(/^966/, '')

  // Format as: +966 50 123 4567
  const formatted = `+966 ${without966.slice(0, 2)} ${without966.slice(2, 5)} ${without966.slice(5)}`

  return formatted
}

/**
 * Extracts the display number without country code
 *
 * @param phoneNumber Phone number in E.164 format (966501234567)
 * @returns Local format with leading 0 (0501234567)
 */
export function formatPhoneLocal(phoneNumber: string): string {
  // Remove 966 prefix and add leading 0
  const without966 = phoneNumber.replace(/^966/, '')
  return `0${without966}`
}
