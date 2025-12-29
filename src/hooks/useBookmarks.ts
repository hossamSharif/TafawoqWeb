import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface UseBookmarksOptions {
  sessionId: string
  sessionType: 'exam' | 'practice'
  enabled?: boolean
}

export interface UseBookmarksReturn {
  bookmarks: Set<number>
  isLoading: boolean
  toggleBookmark: (questionIndex: number) => Promise<void>
  isBookmarked: (questionIndex: number) => boolean
}

/**
 * useBookmarks - Manage question bookmarks with optimistic updates
 *
 * Features:
 * - Fetches bookmarks on mount
 * - Optimistic UI updates
 * - Error handling with rollback
 * - Toast notifications
 */
export function useBookmarks({
  sessionId,
  sessionType,
  enabled = true,
}: UseBookmarksOptions): UseBookmarksReturn {
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  // Fetch bookmarks on mount
  useEffect(() => {
    if (!enabled || !sessionId) {
      setIsLoading(false)
      return
    }

    const fetchBookmarks = async () => {
      try {
        const response = await fetch(
          `/api/bookmarks?sessionId=${sessionId}&sessionType=${sessionType}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch bookmarks')
        }

        const data = await response.json()
        const bookmarkIndices = new Set<number>(
          data.bookmarks.map((b: any) => b.question_index as number)
        )
        setBookmarks(bookmarkIndices)
      } catch (error) {
        console.error('Error fetching bookmarks:', error)
        toast.error('فشل في تحميل الإشارات المرجعية')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookmarks()
  }, [sessionId, sessionType, enabled])

  // Toggle bookmark for a question
  const toggleBookmark = useCallback(
    async (questionIndex: number) => {
      if (!enabled) return

      const wasBookmarked = bookmarks.has(questionIndex)

      // Optimistic update
      setBookmarks((prev) => {
        const next = new Set(prev)
        if (wasBookmarked) {
          next.delete(questionIndex)
        } else {
          next.add(questionIndex)
        }
        return next
      })

      try {
        if (wasBookmarked) {
          // Delete bookmark
          const response = await fetch(
            `/api/bookmarks?sessionId=${sessionId}&sessionType=${sessionType}&questionIndex=${questionIndex}`,
            {
              method: 'DELETE',
            }
          )

          if (!response.ok) {
            throw new Error('Failed to delete bookmark')
          }
        } else {
          // Create bookmark
          const response = await fetch('/api/bookmarks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId,
              sessionType,
              questionIndex,
            }),
          })

          if (!response.ok) {
            // Don't show error for duplicates (409)
            if (response.status !== 409) {
              throw new Error('Failed to create bookmark')
            }
          }
        }
      } catch (error) {
        console.error('Error toggling bookmark:', error)

        // Rollback optimistic update
        setBookmarks((prev) => {
          const next = new Set(prev)
          if (wasBookmarked) {
            next.add(questionIndex)
          } else {
            next.delete(questionIndex)
          }
          return next
        })

        toast.error('فشل في حفظ الإشارة المرجعية')
      }
    },
    [sessionId, sessionType, bookmarks, enabled]
  )

  // Check if a question is bookmarked
  const isBookmarked = useCallback(
    (questionIndex: number) => bookmarks.has(questionIndex),
    [bookmarks]
  )

  return {
    bookmarks,
    isLoading,
    toggleBookmark,
    isBookmarked,
  }
}

export default useBookmarks
