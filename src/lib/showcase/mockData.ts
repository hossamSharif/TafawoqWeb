export const MOCK_QUESTION = {
  stem: 'إذا كان س + ٥ = ١٢، فما قيمة ٢س؟',
  choices: ['٧', '١٤', '١٢', '١٠'] as [string, string, string, string],
  correctAnswer: 0,  // Option A (٧) is correct
  explanation: 'نحل المعادلة: س + ٥ = ١٢، إذن س = ١٢ - ٥ = ٧. ثم نحسب ٢س = ٢ × ٧ = ١٤.',
  solvingStrategy: 'عند حل معادلة خطية، اعزل المتغير أولاً ثم طبق العملية المطلوبة. تذكر دائماً التحقق من إجابتك بالتعويض.',
  tip: 'انتبه للفرق بين قيمة س وقيمة ٢س. السؤال يطلب ٢س وليس س!'
}
