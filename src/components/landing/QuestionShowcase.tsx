'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, BookOpen, ChevronUp, Target, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRef, useEffect } from 'react'

interface QuestionShowcaseProps {
  question: {
    stem: string
    choices: [string, string, string, string]
    correctAnswer: number
    explanation: string
    solvingStrategy: string
    tip: string
  }
  selectedAnswer: number | null
  showResult: boolean
  explanationOpen: boolean
  animationState: string
  onRefsReady?: (refs: { optionB: HTMLDivElement | null; explanationButton: HTMLDivElement | null }) => void
}

const OPTION_LABELS = ['أ', 'ب', 'ج', 'د'] as const

export function QuestionShowcase({
  question,
  selectedAnswer,
  showResult,
  explanationOpen,
  animationState,
  onRefsReady
}: QuestionShowcaseProps) {
  const optionBRef = useRef<HTMLDivElement>(null)
  const explanationButtonRef = useRef<HTMLDivElement>(null)

  // Send refs to parent when ready
  useEffect(() => {
    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      if (onRefsReady && optionBRef.current && explanationButtonRef.current) {
        onRefsReady({ optionB: optionBRef.current, explanationButton: explanationButtonRef.current })
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [onRefsReady])

  const getOptionState = (index: number) => {
    if (!showResult) {
      return selectedAnswer === index ? 'selected' : 'default'
    }
    if (index === question.correctAnswer) return 'correct'
    if (index === selectedAnswer && selectedAnswer !== question.correctAnswer) {
      return 'incorrect'
    }
    return 'default'
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{
          opacity: 1,
          scale: 1,
          boxShadow: [
            '0 0 20px rgba(30, 86, 49, 0.2), 0 0 40px rgba(30, 86, 49, 0.1), 0 10px 30px rgba(0, 0, 0, 0.1)',
            '0 0 30px rgba(30, 86, 49, 0.4), 0 0 60px rgba(30, 86, 49, 0.2), 0 10px 30px rgba(0, 0, 0, 0.1)',
            '0 0 20px rgba(30, 86, 49, 0.2), 0 0 40px rgba(30, 86, 49, 0.1), 0 10px 30px rgba(0, 0, 0, 0.1)'
          ]
        }}
        transition={{
          duration: 0.6,
          boxShadow: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
        className="bg-white rounded-2xl border-2 border-primary/20 overflow-hidden relative"
        dir="rtl"
      >
      {/* Question Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-primary text-white font-bold text-lg flex items-center justify-center">
            1
          </span>
          <span className="text-gray-500 text-sm">من 30</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Explanation Button - appears after answer is shown */}
          <motion.div
            ref={explanationButtonRef}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: showResult ? 1 : 0,
              scale: showResult ? 1 : 0.8
            }}
            transition={{ duration: 0.3 }}
            style={{ pointerEvents: showResult ? 'auto' : 'none' }}
          >
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-amber-500 bg-amber-50 hover:bg-amber-100 transition-colors text-sm font-semibold text-amber-900">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>الشرح</span>
            </button>
          </motion.div>

          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            القسم الكمي
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            متوسط
          </span>
        </div>
      </div>

      {/* Question Stem */}
      <div className="p-6 relative">
        <p className="text-lg text-gray-900 leading-loose mb-6">
          {question.stem}
        </p>

        {/* Answer Options */}
        <div className="space-y-3">
          {question.choices.map((choice, index) => {
            const state = getOptionState(index)

            return (
              <motion.div
                key={index}
                ref={index === 1 ? optionBRef : null}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-200',
                  state === 'default' && 'border-gray-200 bg-white',
                  state === 'selected' && 'border-primary bg-primary/10',
                  state === 'correct' && 'border-green-500 bg-green-50',
                  state === 'incorrect' && 'border-red-500 bg-red-50'
                )}
                animate={{
                  borderColor:
                    state === 'incorrect' ? 'rgb(239, 68, 68)' :
                      state === 'correct' ? 'rgb(34, 197, 94)' :
                        state === 'selected' ? 'rgb(30, 86, 49)' :
                          'rgb(229, 231, 235)',
                  backgroundColor:
                    state === 'incorrect' ? 'rgba(239, 68, 68, 0.1)' :
                      state === 'correct' ? 'rgba(34, 197, 94, 0.1)' :
                        state === 'selected' ? 'rgba(30, 86, 49, 0.1)' :
                          'rgb(255, 255, 255)'
                }}
                transition={{ duration: 0.3 }}
              >
                <motion.span
                  className={cn(
                    'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg',
                    state === 'default' && 'bg-gray-100 text-gray-600',
                    state === 'selected' && 'bg-primary text-white',
                    state === 'correct' && 'bg-green-500 text-white',
                    state === 'incorrect' && 'bg-red-500 text-white'
                  )}
                  initial={false}
                  animate={{ scale: state === 'incorrect' || state === 'correct' ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 0.4 }}
                >
                  {state === 'correct' ? (
                    <Check className="w-5 h-5" />
                  ) : state === 'incorrect' ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    OPTION_LABELS[index]
                  )}
                </motion.span>
                <span className="flex-1 text-base text-gray-800">{choice}</span>
              </motion.div>
            )
          })}
        </div>

        {/* Dropdown Explanation Overlay - Covers answers area */}
        <AnimatePresence>
          {explanationOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-x-0 top-0 z-20 mt-16"
            >
              <div className="rounded-xl border-2 border-amber-200 bg-amber-50 shadow-xl mx-2">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-amber-100 bg-amber-100/50 rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-gray-800">الشرح التفصيلي</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center">
                    <Check className="w-5 h-5 text-amber-700" />
                  </div>
                </div>

                {/* Content */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="p-5 space-y-4 max-h-[400px] overflow-y-auto"
                >
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">الشرح</h4>
                    <p className="text-gray-700 leading-relaxed">
                      {question.explanation}
                    </p>
                  </div>

                  <div className="p-4 bg-white rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-800">
                        استراتيجية الحل
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {question.solvingStrategy}
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-semibold text-yellow-800">
                        نصيحة
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 leading-relaxed">
                      {question.tip}
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
    </>
  )
}
