'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

interface AnimatedCursorProps {
  position: { x: number; y: number }
  isClicking: boolean
  visible: boolean
  isMobile?: boolean
}

export function AnimatedCursor({ position, isClicking, visible, isMobile = false }: AnimatedCursorProps) {
  const [showRipple, setShowRipple] = useState(false)
  const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0 })

  // Trigger ripple effect on click
  useEffect(() => {
    if (isClicking) {
      setRipplePosition(position)
      setShowRipple(true)
      const timer = setTimeout(() => setShowRipple(false), 600)
      return () => clearTimeout(timer)
    }
  }, [isClicking, position])

  const cursorSize = isMobile ? 18 : 24

  return (
    <>
      {/* Main Cursor */}
      <motion.svg
        width={cursorSize}
        height={cursorSize}
        viewBox="0 0 24 24"
        className="absolute pointer-events-none z-50"
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          x: position.x - cursorSize / 2, // Center cursor on position
          y: position.y - cursorSize / 2,
          opacity: visible ? 1 : 0,
          scale: isClicking ? 0.9 : 1
        }}
        transition={{
          x: { type: "spring", stiffness: 200, damping: 30 },
          y: { type: "spring", stiffness: 200, damping: 30 },
          scale: { duration: 0.1 },
          opacity: { duration: 0.3 }
        }}
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
      >
        <path
          d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
          fill="currentColor"
          className="text-primary"
        />
      </motion.svg>

      {/* Click Ripple Effect */}
      <AnimatePresence>
        {showRipple && (
          <motion.div
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute w-8 h-8 rounded-full bg-primary/30 pointer-events-none z-40"
            style={{
              left: ripplePosition.x - 16,
              top: ripplePosition.y - 16
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
