'use client'

import { useEffect, useState } from 'react'

/**
 * Hook to access Tawk.to API
 * Provides methods to interact with the chat widget programmatically
 */
export function useTawkTo() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Check if Tawk.to is loaded
    const checkTawkLoaded = () => {
      if (window.Tawk_API && window.Tawk_API.onLoaded) {
        setIsLoaded(true)
      }
    }

    // Poll for Tawk.to availability
    const interval = setInterval(checkTawkLoaded, 500)

    // Listen for Tawk.to load event
    if (window.Tawk_API) {
      window.Tawk_API.onLoad = function () {
        setIsLoaded(true)
        clearInterval(interval)
      }
    }

    return () => clearInterval(interval)
  }, [])

  return {
    isLoaded,

    // Show/hide widget
    show: () => {
      if (window.Tawk_API?.showWidget) {
        window.Tawk_API.showWidget()
      }
    },
    hide: () => {
      if (window.Tawk_API?.hideWidget) {
        window.Tawk_API.hideWidget()
      }
    },

    // Maximize/minimize widget
    maximize: () => {
      if (window.Tawk_API?.maximize) {
        window.Tawk_API.maximize()
      }
    },
    minimize: () => {
      if (window.Tawk_API?.minimize) {
        window.Tawk_API.minimize()
      }
    },

    // Toggle widget
    toggle: () => {
      if (window.Tawk_API?.toggle) {
        window.Tawk_API.toggle()
      }
    },

    // Add event
    addEvent: (eventName: string, metadata?: any) => {
      if (window.Tawk_API?.addEvent) {
        window.Tawk_API.addEvent(eventName, metadata)
      }
    },
  }
}
