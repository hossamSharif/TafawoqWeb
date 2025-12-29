'use client'

import { useEffect, useRef } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    UnicornStudio: {
      isInitialized: boolean
      init: () => void
    }
  }
}

export function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  const initUnicorn = () => {
    if (typeof window !== 'undefined' && window.UnicornStudio && !window.UnicornStudio.isInitialized) {
      window.UnicornStudio.init()
      window.UnicornStudio.isInitialized = true
    }
  }

  useEffect(() => {
    // Try to init if script already loaded
    if (typeof window !== 'undefined' && window.UnicornStudio) {
      initUnicorn()
    }
  }, [])

  return (
    <>
      {/* UnicornStudio Script */}
      <Script
        src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.33/dist/unicornStudio.umd.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== 'undefined') {
            window.UnicornStudio = window.UnicornStudio || { isInitialized: false, init: () => {} }
            initUnicorn()
          }
        }}
      />

      {/* UnicornStudio Animated Background Container - inverted for white bg */}
      <div
        ref={containerRef}
        className="absolute top-0 left-0 right-0 w-full h-[500px] z-[1]"
        data-alpha-mask="80"
        style={{
          filter: 'invert(1) sepia(1) saturate(5) hue-rotate(90deg)',
          maskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)',
        }}
      >
        <div
          data-us-project="XajWK1PAkgbbjptYflOF"
          className="absolute w-full h-full left-0 top-0"
        />
      </div>

      {/* Subtle green ambient glow at top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full pointer-events-none z-[2]"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(120, 180, 140, 0.015) 0%, transparent 60%)',
          filter: 'blur(100px)',
        }}
      />
    </>
  )
}
