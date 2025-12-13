// OpenRouter AI client with auto-fallback
export {
  callOpenRouter,
  generateWithPreset,
  getCurrentModel,
  resetModelIndex,
  FREE_MODELS,
  GenerationPresets,
  OpenRouterError,
  type OpenRouterConfig,
  type FreeModel,
} from './client'

// Question and exam generation prompts
export {
  generateQuestions,
  generateFullExam,
  generateExam,
  generatePracticeQuestions,
  generatePracticeSession,
  generatePerformanceFeedback,
  TRACK_DISTRIBUTION,
  type QuestionGenerationConfig,
  type ExamConfig,
  type AcademicTrack,
  type PracticeConfig,
} from './prompts'

// Response validators
export {
  validateQuestion,
  extractQuestionsFromResponse,
  extractFeedbackFromResponse,
  validateExamResponse,
  type FeedbackResponse,
} from './validators'
