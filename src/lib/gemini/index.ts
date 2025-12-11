// Gemini AI client and configuration
export {
  getQuestionGenerationModel,
  getAnalysisModel,
  getExamGenerationModel,
  safetySettings,
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
