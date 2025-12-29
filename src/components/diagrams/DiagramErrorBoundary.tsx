'use client'

import React, { Component, type ReactNode } from 'react'
import { logDiagramError } from '@/lib/diagrams/errorLogging'
import type { DiagramType } from '@/types/question'

interface DiagramErrorBoundaryProps {
  children: ReactNode
  diagramType?: DiagramType
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface DiagramErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  retryCount: number
}

/**
 * Error Boundary specifically for diagram rendering
 * Catches and handles rendering errors to prevent entire component tree crashes
 */
export class DiagramErrorBoundary extends Component<
  DiagramErrorBoundaryProps,
  DiagramErrorBoundaryState
> {
  constructor(props: DiagramErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<DiagramErrorBoundaryState> {
    // Update state to trigger fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error
    const { diagramType, onError } = this.props

    logDiagramError(
      'render-failed',
      diagramType || 'custom',
      error,
      {
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
      }
    )

    // Update state with error info
    this.setState({
      errorInfo,
    })

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }))
  }

  render() {
    const { hasError, error, retryCount } = this.state
    const { children, fallback } = this.props

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback
      }

      // Default error UI
      return (
        <div
          className="diagram-error-boundary flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200 gap-4"
          dir="rtl"
        >
          {/* Error icon */}
          <svg
            className="w-12 h-12 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>

          {/* Error message */}
          <div className="text-center space-y-2">
            <h3 className="text-sm font-semibold text-red-600">
              حدث خطأ أثناء عرض الرسم
            </h3>
            <p className="text-xs text-gray-600 max-w-sm">
              عذراً، لا يمكن عرض هذا الرسم في الوقت الحالي. يمكنك المتابعة مع الأسئلة الأخرى.
            </p>
          </div>

          {/* Development error details */}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="w-full max-w-md p-3 bg-gray-100 rounded text-left">
              <summary className="text-xs font-semibold text-gray-700 cursor-pointer">
                Error Details (Development Only)
              </summary>
              <pre className="mt-2 text-xs text-gray-600 overflow-auto">
                {error.toString()}
                {'\n\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          {/* Retry button */}
          {retryCount < 2 && (
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-[#1E5631] text-white rounded-lg hover:bg-[#163f24] transition-colors text-sm font-medium"
            >
              إعادة المحاولة {retryCount > 0 && `(${retryCount + 1})`}
            </button>
          )}

          {/* Max retries reached */}
          {retryCount >= 2 && (
            <p className="text-xs text-gray-500">
              تم الوصول إلى الحد الأقصى من المحاولات. يرجى المتابعة مع السؤال التالي.
            </p>
          )}
        </div>
      )
    }

    // No error, render children normally
    return children
  }
}

export default DiagramErrorBoundary
