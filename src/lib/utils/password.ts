/**
 * Password validation utilities
 * Enforces strong password requirements for security
 */

export interface PasswordStrength {
  score: number // 0-4 (weak to strong)
  label: 'ضعيفة جداً' | 'ضعيفة' | 'متوسطة' | 'قوية' | 'قوية جداً'
  color: 'red' | 'orange' | 'yellow' | 'lime' | 'green'
  requirements: PasswordRequirement[]
}

export interface PasswordRequirement {
  label: string
  met: boolean
}

const MIN_PASSWORD_LENGTH = 8

/**
 * Check if password meets minimum requirements
 */
export function isPasswordValid(password: string): boolean {
  if (password.length < MIN_PASSWORD_LENGTH) return false
  if (!/[A-Z]/.test(password)) return false
  if (!/[a-z]/.test(password)) return false
  if (!/\d/.test(password)) return false
  return true
}

/**
 * Get detailed password requirements with their status
 */
export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      label: `${MIN_PASSWORD_LENGTH} أحرف على الأقل`,
      met: password.length >= MIN_PASSWORD_LENGTH,
    },
    {
      label: 'حرف كبير واحد على الأقل (A-Z)',
      met: /[A-Z]/.test(password),
    },
    {
      label: 'حرف صغير واحد على الأقل (a-z)',
      met: /[a-z]/.test(password),
    },
    {
      label: 'رقم واحد على الأقل (0-9)',
      met: /\d/.test(password),
    },
  ]
}

/**
 * Calculate password strength score and details
 */
export function getPasswordStrength(password: string): PasswordStrength {
  const requirements = getPasswordRequirements(password)
  const metCount = requirements.filter((r) => r.met).length

  // Calculate base score from requirements
  let score = metCount

  // Bonus points for extra security features
  if (password.length >= 12) score += 0.5
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 0.5
  if (password.length >= 16) score += 0.5

  // Cap score at 4
  score = Math.min(4, Math.floor(score))

  // Map score to label and color
  const strengthMap: Record<number, { label: PasswordStrength['label']; color: PasswordStrength['color'] }> = {
    0: { label: 'ضعيفة جداً', color: 'red' },
    1: { label: 'ضعيفة', color: 'orange' },
    2: { label: 'متوسطة', color: 'yellow' },
    3: { label: 'قوية', color: 'lime' },
    4: { label: 'قوية جداً', color: 'green' },
  }

  const { label, color } = strengthMap[score]

  return {
    score,
    label,
    color,
    requirements,
  }
}

/**
 * Generate a random strong password
 */
export function generateStrongPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  const allChars = uppercase + lowercase + numbers + symbols

  // Ensure at least one of each required type
  let password = ''
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]

  // Fill remaining length with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

/**
 * Check if password has been exposed in known data breaches
 * Uses the HaveIBeenPwned API with k-anonymity
 */
export async function checkPasswordBreach(password: string): Promise<boolean> {
  try {
    // Create SHA-1 hash of the password
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-1', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    // Use k-anonymity: send first 5 characters of hash
    const prefix = hashHex.substring(0, 5).toUpperCase()
    const suffix = hashHex.substring(5).toUpperCase()

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`)

    if (!response.ok) {
      console.error('Password breach check failed:', response.status)
      return false // Assume not breached if API fails
    }

    const text = await response.text()
    const hashes = text.split('\n')

    // Check if our hash suffix appears in the list
    for (const line of hashes) {
      const [hashSuffix] = line.split(':')
      if (hashSuffix.trim() === suffix) {
        return true // Password has been breached
      }
    }

    return false // Password not found in breach database
  } catch (error) {
    console.error('Password breach check error:', error)
    return false // Assume not breached if check fails
  }
}
