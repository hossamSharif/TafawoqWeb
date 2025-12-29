import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes with tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as percentage with specified decimal places
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Get score color class based on percentage
 * Gold: 90-100%, Green: 75-89%, Grey: 60-74%, Warm: <60%
 */
export function getScoreColor(percentage: number): string {
  if (percentage >= 90) return 'score-gold'
  if (percentage >= 75) return 'score-green'
  if (percentage >= 60) return 'score-grey'
  return 'score-warm'
}

/**
 * Get score background color class based on percentage
 */
export function getScoreBgColor(percentage: number): string {
  if (percentage >= 90) return 'bg-score-gold'
  if (percentage >= 75) return 'bg-score-green'
  if (percentage >= 60) return 'bg-score-grey'
  return 'bg-score-warm'
}

/**
 * Format time in seconds to MM:SS format
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format time in seconds to HH:MM:SS format
 */
export function formatTimeLong(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Arabic number formatter
 */
export function formatArabicNumber(num: number): string {
  return num.toLocaleString('ar-SA')
}

/**
 * Delay utility for async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Parse post body that might contain JSON metadata and return human-readable text.
 * Some older posts may have JSON stored in the body field like:
 * {"description":"","section":"verbal","contentType":"practice","difficulty":"medium"}
 * This function converts that to a readable description or returns null if no meaningful content.
 */
export function parsePostBody(body: string | null | undefined): string | null {
  if (!body || typeof body !== 'string') return null

  const trimmedBody = body.trim()
  if (!trimmedBody) return null

  // Check if it looks like JSON
  if (trimmedBody.startsWith('{') && trimmedBody.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmedBody)

      // If it's a metadata object, generate a human-readable description
      if (typeof parsed === 'object' && parsed !== null) {
        // Check for the known metadata structure
        const { description, section, contentType, difficulty } = parsed

        // If there's an actual description, use it
        if (description && typeof description === 'string' && description.trim()) {
          return description.trim()
        }

        // Generate description from metadata
        const parts: string[] = []

        // Content type
        if (contentType === 'practice') {
          parts.push('تدريب')
        } else if (contentType === 'exam') {
          parts.push('اختبار')
        }

        // Section
        if (section === 'verbal') {
          parts.push('على القسم اللفظي')
        } else if (section === 'quantitative') {
          parts.push('على القسم الكمي')
        }

        // Difficulty
        if (difficulty === 'easy') {
          parts.push('بمستوى سهل')
        } else if (difficulty === 'medium') {
          parts.push('بمستوى متوسط')
        } else if (difficulty === 'hard') {
          parts.push('بمستوى صعب')
        }

        // If we generated any parts, return the combined string
        if (parts.length > 0) {
          return parts.join(' ')
        }

        // If no meaningful metadata, return null
        return null
      }
    } catch {
      // Not valid JSON, treat as regular text
    }
  }

  // Return the original body if it's not JSON
  return trimmedBody
}
