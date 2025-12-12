'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface NetworkStatusState {
  /** Whether the browser reports being online */
  isOnline: boolean
  /** Whether we've detected actual connectivity (API reachable) */
  isConnected: boolean
  /** Time when connection was lost (null if connected) */
  disconnectedAt: Date | null
  /** Time spent disconnected in seconds */
  disconnectedSeconds: number
  /** Whether currently checking connectivity */
  isChecking: boolean
  /** Last successful connectivity check */
  lastCheckedAt: Date | null
}

export interface UseNetworkStatusOptions {
  /** Interval to check connectivity when offline (ms, default 5000) */
  checkInterval?: number
  /** URL to ping for connectivity check (default /api/health) */
  pingUrl?: string
  /** Called when connection is lost */
  onDisconnect?: () => void
  /** Called when connection is restored */
  onReconnect?: (disconnectedSeconds: number) => void
  /** Whether to actively poll for connectivity (default true) */
  enablePolling?: boolean
}

export interface UseNetworkStatusReturn extends NetworkStatusState {
  /** Manually check connectivity */
  checkConnectivity: () => Promise<boolean>
}

/**
 * useNetworkStatus - Detect network connectivity with active polling
 * Uses both browser online/offline events and active connectivity checks
 */
export function useNetworkStatus(
  options: UseNetworkStatusOptions = {}
): UseNetworkStatusReturn {
  const {
    checkInterval = 5000,
    pingUrl = '/api/auth/session',
    onDisconnect,
    onReconnect,
    enablePolling = true,
  } = options

  const [state, setState] = useState<NetworkStatusState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isConnected: true,
    disconnectedAt: null,
    disconnectedSeconds: 0,
    isChecking: false,
    lastCheckedAt: null,
  })

  const disconnectedAtRef = useRef<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  // Check actual connectivity by pinging the server
  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isChecking: true }))

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(pingUrl, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const isConnected = response.ok || response.status === 401 // 401 means server is reachable

      setState((prev) => ({
        ...prev,
        isConnected,
        isChecking: false,
        lastCheckedAt: new Date(),
      }))

      return isConnected
    } catch {
      setState((prev) => ({
        ...prev,
        isConnected: false,
        isChecking: false,
      }))
      return false
    }
  }, [pingUrl])

  // Handle going offline
  const handleDisconnect = useCallback(() => {
    const now = new Date()
    disconnectedAtRef.current = now

    setState((prev) => ({
      ...prev,
      isOnline: false,
      isConnected: false,
      disconnectedAt: now,
      disconnectedSeconds: 0,
    }))

    onDisconnect?.()

    // Start counting disconnected time
    countdownRef.current = setInterval(() => {
      if (disconnectedAtRef.current) {
        const seconds = Math.floor(
          (Date.now() - disconnectedAtRef.current.getTime()) / 1000
        )
        setState((prev) => ({
          ...prev,
          disconnectedSeconds: seconds,
        }))
      }
    }, 1000)
  }, [onDisconnect])

  // Handle coming back online
  const handleReconnect = useCallback(async () => {
    // Clear countdown
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }

    // Verify actual connectivity
    const isConnected = await checkConnectivity()

    if (isConnected) {
      const disconnectedSeconds = disconnectedAtRef.current
        ? Math.floor(
            (Date.now() - disconnectedAtRef.current.getTime()) / 1000
          )
        : 0

      disconnectedAtRef.current = null

      setState((prev) => ({
        ...prev,
        isOnline: true,
        isConnected: true,
        disconnectedAt: null,
        disconnectedSeconds: 0,
      }))

      onReconnect?.(disconnectedSeconds)
    }
  }, [checkConnectivity, onReconnect])

  // Listen to browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }))
      handleReconnect()
    }

    const handleOffline = () => {
      handleDisconnect()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial state
    if (!navigator.onLine) {
      handleDisconnect()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleDisconnect, handleReconnect])

  // Active polling when offline
  useEffect(() => {
    if (!enablePolling) return

    if (!state.isConnected && state.isOnline) {
      // Browser thinks we're online but we failed connectivity check
      // Poll more frequently
      intervalRef.current = setInterval(async () => {
        const connected = await checkConnectivity()
        if (connected) {
          handleReconnect()
        }
      }, checkInterval)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [
    state.isConnected,
    state.isOnline,
    checkInterval,
    enablePolling,
    checkConnectivity,
    handleReconnect,
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [])

  return {
    ...state,
    checkConnectivity,
  }
}

export default useNetworkStatus
