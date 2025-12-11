import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { serverEnv } from '@/lib/env'

/**
 * Google Generative AI client configuration
 * Lazy initialization to avoid build-time errors
 */
let _genAI: GoogleGenerativeAI | null = null

function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    _genAI = new GoogleGenerativeAI(serverEnv.gemini.apiKey)
  }
  return _genAI
}

/**
 * Safety settings for content generation
 */
export const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
]

/**
 * Get the Gemini model for question generation
 */
export function getQuestionGenerationModel() {
  return getGenAI().getGenerativeModel({
    model: 'gemini-1.5-flash',
    safetySettings,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 8192,
    },
  })
}

/**
 * Get the Gemini model for analysis and feedback
 */
export function getAnalysisModel() {
  return getGenAI().getGenerativeModel({
    model: 'gemini-1.5-flash',
    safetySettings,
    generationConfig: {
      temperature: 0.3,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 4096,
    },
  })
}

/**
 * Get the Gemini model for full exam generation (96 questions)
 * Uses higher token limits for large response
 */
export function getExamGenerationModel() {
  return getGenAI().getGenerativeModel({
    model: 'gemini-1.5-flash',
    safetySettings,
    generationConfig: {
      temperature: 0.8,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 65536, // Higher limit for full exam
    },
  })
}
