/**
 * Contact Form Validation
 * Purpose: Validate contact form inputs with Arabic error messages
 */

export const CONTACT_LIMITS = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 254, // RFC 5321
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 20,
  SUBJECT_MIN_LENGTH: 3,
  SUBJECT_MAX_LENGTH: 200,
  MESSAGE_MIN_LENGTH: 10,
  MESSAGE_MAX_LENGTH: 2000,
} as const

export interface ContactFormData {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: {
    name?: string
    email?: string
    phone?: string
    subject?: string
    message?: string
  }
}

/**
 * Validate contact form data
 * @param data - Contact form data to validate
 * @returns Validation result with errors if invalid
 */
export function validateContactForm(data: ContactFormData): ValidationResult {
  const errors: ValidationResult['errors'] = {}

  // Name validation
  if (!data.name || data.name.trim().length < CONTACT_LIMITS.NAME_MIN_LENGTH) {
    errors.name = 'الاسم يجب أن يكون حرفين على الأقل'
  } else if (data.name.length > CONTACT_LIMITS.NAME_MAX_LENGTH) {
    errors.name = `الاسم يجب ألا يتجاوز ${CONTACT_LIMITS.NAME_MAX_LENGTH} حرف`
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!data.email || !emailRegex.test(data.email)) {
    errors.email = 'صيغة البريد الإلكتروني غير صحيحة'
  } else if (data.email.length > CONTACT_LIMITS.EMAIL_MAX_LENGTH) {
    errors.email = 'البريد الإلكتروني طويل جداً'
  }

  // Phone validation
  if (!data.phone || data.phone.trim().length < CONTACT_LIMITS.PHONE_MIN_LENGTH) {
    errors.phone = 'رقم الجوال غير صحيح (10 أرقام على الأقل)'
  } else if (data.phone.length > CONTACT_LIMITS.PHONE_MAX_LENGTH) {
    errors.phone = 'رقم الجوال طويل جداً'
  }

  // Subject validation
  if (!data.subject || data.subject.trim().length < CONTACT_LIMITS.SUBJECT_MIN_LENGTH) {
    errors.subject = 'الموضوع يجب أن يكون 3 أحرف على الأقل'
  } else if (data.subject.length > CONTACT_LIMITS.SUBJECT_MAX_LENGTH) {
    errors.subject = `الموضوع يجب ألا يتجاوز ${CONTACT_LIMITS.SUBJECT_MAX_LENGTH} حرف`
  }

  // Message validation
  if (!data.message || data.message.trim().length < CONTACT_LIMITS.MESSAGE_MIN_LENGTH) {
    errors.message = 'الرسالة يجب أن تكون 10 أحرف على الأقل'
  } else if (data.message.length > CONTACT_LIMITS.MESSAGE_MAX_LENGTH) {
    errors.message = `الرسالة يجب ألا يتجاوز ${CONTACT_LIMITS.MESSAGE_MAX_LENGTH} حرف`
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Check if phone number is in Saudi format (optional validation)
 * @param phone - Phone number to check
 * @returns True if Saudi format, false otherwise
 */
export function isSaudiPhoneNumber(phone: string): boolean {
  // Saudi format: +966XXXXXXXXX or 05XXXXXXXX or 5XXXXXXXX
  const saudiRegex = /^(\+966|966|0)?5[0-9]{8}$/
  return saudiRegex.test(phone.replace(/[\s-]/g, ''))
}
