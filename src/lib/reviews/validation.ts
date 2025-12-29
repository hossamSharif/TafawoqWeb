export interface ReviewValidationResult {
  isValid: boolean
  errors: {
    rating?: string
    review_text?: string
  }
}

export function validateReview(data: {
  rating: number
  review_text: string
}): ReviewValidationResult {
  const errors: ReviewValidationResult['errors'] = {}

  // Validate rating
  if (!data.rating || data.rating < 1 || data.rating > 5) {
    errors.rating = 'يجب أن يكون التقييم بين 1 و 5 نجوم'
  }

  // Validate review text
  if (!data.review_text || data.review_text.trim().length === 0) {
    errors.review_text = 'نص المراجعة مطلوب'
  } else if (data.review_text.trim().length < 10) {
    errors.review_text = 'يجب أن يحتوي نص المراجعة على 10 أحرف على الأقل'
  } else if (data.review_text.trim().length > 1000) {
    errors.review_text = 'يجب ألا يتجاوز نص المراجعة 1000 حرف'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
