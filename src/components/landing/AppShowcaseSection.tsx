'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { QuestionShowcase } from './QuestionShowcase'
import { AnimatedCursor } from './AnimatedCursor'
import { ANIMATION_TIMINGS, getResponsiveCursorPath } from '@/lib/showcase/animationSequence'
import { MOCK_QUESTION } from '@/lib/showcase/mockData'

type ShowcaseState =
  | 'initial'
  | 'hovering'
  | 'selecting'
  | 'incorrect'
  | 'moving-to-panel'
  | 'expanding'
  | 'reading'
  | 'resetting'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export function AppShowcaseSection() {
  const [state, setState] = useState<ShowcaseState>('initial')
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [explanationOpen, setExplanationOpen] = useState(false)
  const [cursorPosition, setCursorPosition] = useState({ x: 50, y: 50 })
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [targetRefs, setTargetRefs] = useState<{
    optionB: HTMLDivElement | null
    explanationButton: HTMLDivElement | null
  }>({ optionB: null, explanationButton: null })
  const containerRef = useState<HTMLDivElement | null>(null)[0]

  // Detect mobile device and handle resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()

    // Recalculate cursor positions on resize
    const handleResize = () => {
      checkMobile()
      if (targetRefs.optionB && state === 'hovering') {
        setCursorPosition(getCursorPosition(targetRefs.optionB))
      } else if (targetRefs.explanationButton && (state === 'moving-to-panel' || state === 'expanding' || state === 'reading')) {
        setCursorPosition(getCursorPosition(targetRefs.explanationButton))
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [targetRefs, state])

  // Calculate dynamic cursor position from element ref
  const getCursorPosition = (element: HTMLDivElement | null) => {
    if (!element) return { x: 50, y: 50 }

    const rect = element.getBoundingClientRect()
    const container = document.getElementById('app-showcase')
    const containerRect = container?.getBoundingClientRect()

    if (!containerRect) return { x: 50, y: 50 }

    // Calculate center of element relative to container
    const x = rect.left - containerRect.left + rect.width / 2
    const y = rect.top - containerRect.top + rect.height / 2

    return { x, y }
  }

  // Intersection Observer for performance (pause when not in view)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 } // Lower threshold to trigger earlier
    )
    const element = document.getElementById('app-showcase')
    if (element) observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // Animation sequence controller
  useEffect(() => {
    if (!isVisible || !targetRefs.optionB || !targetRefs.explanationButton) return

    const runSequence = async () => {
      const CURSOR_PATHS = getResponsiveCursorPath(isMobile)

      // Reset all states
      setState('initial')
      setSelectedAnswer(null)
      setExplanationOpen(false)
      setCursorPosition(CURSOR_PATHS.START)

      // 0-2s: Initial - cursor enters
      await delay(ANIMATION_TIMINGS.INITIAL_DELAY)

      // 2-4s: Hovering - Use dynamic position
      setState('hovering')
      setCursorPosition(getCursorPosition(targetRefs.optionB))
      await delay(ANIMATION_TIMINGS.HOVER_DURATION)

      // 4-5s: Selecting - click animation
      setState('selecting')
      setSelectedAnswer(1) // Option B (wrong answer: ١٤)
      await delay(ANIMATION_TIMINGS.CLICK_DELAY)

      // 5-8s: Incorrect state - show red border and X
      setState('incorrect')
      await delay(ANIMATION_TIMINGS.INCORRECT_PAUSE)

      // 8-10s: Moving to explanation button in header - Use dynamic position
      setState('moving-to-panel')
      setCursorPosition(getCursorPosition(targetRefs.explanationButton))
      await delay(ANIMATION_TIMINGS.MOVE_TO_BUTTON)

      // 10-11s: Click button
      setState('expanding')
      await delay(ANIMATION_TIMINGS.BUTTON_CLICK)

      // 11-12s: Expanding dropdown
      setExplanationOpen(true)
      await delay(ANIMATION_TIMINGS.DROPDOWN_EXPAND)

      // 12-17s: Reading
      setState('reading')
      await delay(ANIMATION_TIMINGS.READING_TIME)

      // 17-18s: Close dropdown
      setExplanationOpen(false)
      await delay(ANIMATION_TIMINGS.DROPDOWN_CLOSE)

      // 18-19s: Resetting
      setState('resetting')
      await delay(ANIMATION_TIMINGS.RESET_TRANSITION)

      // Loop
      runSequence()
    }

    runSequence()
  }, [isVisible, isMobile, targetRefs])

  const isClicking = state === 'selecting' || state === 'expanding'
  const cursorVisible = state !== 'resetting'
  const showResult = state === 'incorrect' || state === 'moving-to-panel' ||
    state === 'expanding' || state === 'reading'

  return (
    <section
      id="app-showcase"
      className="relative flex items-center justify-center overflow-visible py-0"
    >
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4">
        {/* Showcase container */}
        <div className="relative max-w-2xl mx-auto">
          <AnimatedCursor
            position={cursorPosition}
            isClicking={isClicking}
            visible={cursorVisible}
            isMobile={isMobile}
          />

          <QuestionShowcase
            question={MOCK_QUESTION}
            selectedAnswer={selectedAnswer}
            showResult={showResult}
            explanationOpen={explanationOpen}
            animationState={state}
            onRefsReady={setTargetRefs}
          />
        </div>
      </div>
    </section>
  )
}
