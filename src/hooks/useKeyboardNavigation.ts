import { useEffect, useCallback, useRef } from 'react'

export interface KeyboardNavigationOptions {
  onNext: () => void
  onPrevious: () => void
  onToggleGrid?: () => void
  onJumpToAnswer?: (answerIndex: number) => void
  enabled?: boolean
  isModalOpen?: boolean
}

/**
 * useKeyboardNavigation - Handle keyboard shortcuts for review navigation
 *
 * Keyboard shortcuts:
 * - Arrow Left/Right: Navigate between questions
 * - J/K: Previous/Next (vim-style)
 * - G: Toggle grid view
 * - 1-4: Jump to answer option (for learning)
 * - Escape: Close modals
 */
export function useKeyboardNavigation({
  onNext,
  onPrevious,
  onToggleGrid,
  onJumpToAnswer,
  enabled = true,
  isModalOpen = false,
}: KeyboardNavigationOptions) {
  const handlersRef = useRef({ onNext, onPrevious, onToggleGrid, onJumpToAnswer })

  // Update ref when handlers change
  useEffect(() => {
    handlersRef.current = { onNext, onPrevious, onToggleGrid, onJumpToAnswer }
  }, [onNext, onPrevious, onToggleGrid, onJumpToAnswer])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't handle keyboard shortcuts if disabled or if modal is open
      if (!enabled || isModalOpen) return

      // Don't handle shortcuts if user is typing in an input/textarea
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      const { onNext, onPrevious, onToggleGrid, onJumpToAnswer } = handlersRef.current

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault()
          onNext()
          break

        case 'ArrowLeft':
          event.preventDefault()
          onPrevious()
          break

        case 'j':
        case 'J':
          event.preventDefault()
          onNext()
          break

        case 'k':
        case 'K':
          event.preventDefault()
          onPrevious()
          break

        case 'g':
        case 'G':
          if (onToggleGrid) {
            event.preventDefault()
            onToggleGrid()
          }
          break

        case '1':
        case '2':
        case '3':
        case '4':
          if (onJumpToAnswer) {
            event.preventDefault()
            const answerIndex = parseInt(event.key) - 1
            onJumpToAnswer(answerIndex)
          }
          break

        default:
          // No action for other keys
          break
      }
    },
    [enabled, isModalOpen]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])

  return {
    // Expose a method to programmatically trigger keyboard actions
    triggerShortcut: (key: string) => {
      handleKeyDown(new KeyboardEvent('keydown', { key }))
    },
  }
}

export default useKeyboardNavigation
