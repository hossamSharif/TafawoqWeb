import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'

export interface UseQuestionNotesOptions {
  sessionId: string
  sessionType: 'exam' | 'practice'
  enabled?: boolean
  autoSaveDelay?: number // milliseconds
}

export interface UseQuestionNotesReturn {
  notes: Map<number, string>
  isLoading: boolean
  isSaving: Map<number, boolean>
  getNote: (questionIndex: number) => string | undefined
  setNote: (questionIndex: number, text: string) => void
  deleteNote: (questionIndex: number) => Promise<void>
  hasNote: (questionIndex: number) => boolean
}

/**
 * useQuestionNotes - Manage question notes with auto-save
 *
 * Features:
 * - Fetches notes on mount
 * - Debounced auto-save (2 seconds default)
 * - Local state for immediate updates
 * - Saving indicators per question
 * - Toast notifications
 */
export function useQuestionNotes({
  sessionId,
  sessionType,
  enabled = true,
  autoSaveDelay = 2000,
}: UseQuestionNotesOptions): UseQuestionNotesReturn {
  const [notes, setNotes] = useState<Map<number, string>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState<Map<number, boolean>>(new Map())

  // Refs for debounced save
  const saveTimeouts = useRef<Map<number, NodeJS.Timeout>>(new Map())
  const pendingSaves = useRef<Map<number, string>>(new Map())

  // Fetch notes on mount
  useEffect(() => {
    if (!enabled || !sessionId) {
      setIsLoading(false)
      return
    }

    const fetchNotes = async () => {
      try {
        const response = await fetch(
          `/api/notes?sessionId=${sessionId}&sessionType=${sessionType}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch notes')
        }

        const data = await response.json()
        const notesMap = new Map<number, string>(
          data.notes.map((n: any) => [n.question_index as number, n.note_text as string])
        )
        setNotes(notesMap)
      } catch (error) {
        console.error('Error fetching notes:', error)
        toast.error('فشل في تحميل الملاحظات')
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotes()
  }, [sessionId, sessionType, enabled])

  // Save note to API
  const saveNoteToAPI = useCallback(
    async (questionIndex: number, text: string) => {
      if (!enabled) return

      // Mark as saving
      setIsSaving((prev) => new Map(prev).set(questionIndex, true))

      try {
        if (text.trim().length === 0) {
          // Delete empty note
          const response = await fetch(
            `/api/notes?sessionId=${sessionId}&sessionType=${sessionType}&questionIndex=${questionIndex}`,
            {
              method: 'DELETE',
            }
          )

          if (!response.ok) {
            throw new Error('Failed to delete note')
          }

          // Remove from local state
          setNotes((prev) => {
            const next = new Map(prev)
            next.delete(questionIndex)
            return next
          })
        } else {
          // Save note
          const response = await fetch('/api/notes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId,
              sessionType,
              questionIndex,
              noteText: text,
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to save note')
          }
        }
      } catch (error) {
        console.error('Error saving note:', error)
        toast.error('فشل في حفظ الملاحظة')
      } finally {
        // Mark as not saving
        setIsSaving((prev) => {
          const next = new Map(prev)
          next.delete(questionIndex)
          return next
        })
      }
    },
    [sessionId, sessionType, enabled]
  )

  // Set note with debounced auto-save
  const setNote = useCallback(
    (questionIndex: number, text: string) => {
      if (!enabled) return

      // Update local state immediately
      setNotes((prev) => {
        const next = new Map(prev)
        if (text.trim().length === 0) {
          next.delete(questionIndex)
        } else {
          next.set(questionIndex, text)
        }
        return next
      })

      // Clear existing timeout for this question
      const existingTimeout = saveTimeouts.current.get(questionIndex)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }

      // Store pending save
      pendingSaves.current.set(questionIndex, text)

      // Set new timeout for auto-save
      const timeout = setTimeout(() => {
        const textToSave = pendingSaves.current.get(questionIndex)
        if (textToSave !== undefined) {
          saveNoteToAPI(questionIndex, textToSave)
          pendingSaves.current.delete(questionIndex)
        }
        saveTimeouts.current.delete(questionIndex)
      }, autoSaveDelay)

      saveTimeouts.current.set(questionIndex, timeout)
    },
    [enabled, autoSaveDelay, saveNoteToAPI]
  )

  // Delete note immediately
  const deleteNote = useCallback(
    async (questionIndex: number) => {
      if (!enabled) return

      // Cancel any pending save
      const existingTimeout = saveTimeouts.current.get(questionIndex)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
        saveTimeouts.current.delete(questionIndex)
      }
      pendingSaves.current.delete(questionIndex)

      // Update local state
      setNotes((prev) => {
        const next = new Map(prev)
        next.delete(questionIndex)
        return next
      })

      // Delete from API
      await saveNoteToAPI(questionIndex, '')
    },
    [enabled, saveNoteToAPI]
  )

  // Get note for a question
  const getNote = useCallback(
    (questionIndex: number) => notes.get(questionIndex),
    [notes]
  )

  // Check if question has a note
  const hasNote = useCallback(
    (questionIndex: number) => notes.has(questionIndex),
    [notes]
  )

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      saveTimeouts.current.forEach((timeout) => clearTimeout(timeout))
    }
  }, [])

  return {
    notes,
    isLoading,
    isSaving,
    getNote,
    setNote,
    deleteNote,
    hasNote,
  }
}

export default useQuestionNotes
