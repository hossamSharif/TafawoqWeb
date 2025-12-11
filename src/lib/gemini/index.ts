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
  generatePerformanceFeedback,
  TRACK_DISTRIBUTION,
  type QuestionGenerationConfig,
  type ExamConfig,
  type AcademicTrack,
} from './prompts'

// Response validators
export {
  validateQuestion,
  extractQuestionsFromResponse,
  extractFeedbackFromResponse,
  validateExamResponse,
  type FeedbackResponse,
} from './validators'
