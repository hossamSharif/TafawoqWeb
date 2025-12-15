'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CommentItem } from './CommentItem'
import type { Comment, CommentListResponse } from '@/lib/forum/types'
import { ReportModal } from './ReportModal'
import { FORUM_LIMITS } from '@/lib/forum/types'

interface CommentSectionProps {
  postId: string
  commentCount: number
  currentUserId?: string
  onCommentCountChange?: (delta: number) => void
}

export function CommentSection({
  postId,
  commentCount,
  currentUserId,
  onCommentCountChange,
}: CommentSectionProps) {
  const router = useRouter()
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null)
  const [reportingCommentContent, setReportingCommentContent] = useState<string | undefined>(undefined)

  const fetchComments = useCallback(async (cursor?: string) => {
    const isInitial = !cursor
    if (isInitial) {
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
    }
    setError(null)

    try {
      const params = new URLSearchParams()
      if (cursor) params.set('cursor', cursor)
      params.set('limit', '20')

      const response = await fetch(`/api/forum/posts/${postId}/comments?${params}`)

      if (!response.ok) {
        throw new Error('فشل في تحميل التعليقات')
      }

      const data: CommentListResponse = await response.json()

      if (isInitial) {
        setComments(data.comments)
      } else {
        setComments((prev) => [...prev, ...data.comments])
      }
      setNextCursor(data.next_cursor)
      setHasMore(data.has_more)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [postId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleLoadMore = () => {
    if (nextCursor && !isLoadingMore) {
      fetchComments(nextCursor)
    }
  }

  const handleSubmitComment = async () => {
    if (!currentUserId) {
      router.push(`/auth/login?redirect=/forum/post/${postId}`)
      return
    }

    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch(`/api/forum/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'فشل في إضافة التعليق')
      }

      const newCommentData = await response.json()

      // Add new comment to the beginning of the list
      setComments((prev) => [{
        ...newCommentData,
        replies: [],
      }, ...prev])
      setNewComment('')
      onCommentCountChange?.(1)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReply = async (parentId: string, content: string) => {
    if (!currentUserId) {
      router.push(`/auth/login?redirect=/forum/post/${postId}`)
      return
    }

    const response = await fetch(`/api/forum/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, parent_id: parentId }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'فشل في إضافة الرد')
    }

    const replyData = await response.json()

    // Add the reply to the parent comment
    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...comment.replies, {
              id: replyData.id,
              content: replyData.content,
              author: replyData.author,
              like_count: 0,
              user_liked: false,
              is_edited: false,
              created_at: replyData.created_at,
            }],
          }
        }
        return comment
      })
    )
    onCommentCountChange?.(1)
  }

  const handleLike = async (commentId: string) => {
    const response = await fetch(`/api/forum/comments/${commentId}/like`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('فشل في إضافة الإعجاب')
    }
  }

  const handleUnlike = async (commentId: string) => {
    const response = await fetch(`/api/forum/comments/${commentId}/like`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('فشل في إزالة الإعجاب')
    }
  }

  const handleEdit = async (commentId: string, content: string) => {
    const response = await fetch(`/api/forum/comments/${commentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'فشل في تعديل التعليق')
    }

    const updatedComment = await response.json()

    // Update the comment in state
    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id === commentId) {
          return { ...comment, content: updatedComment.content, is_edited: true }
        }
        // Check in replies
        return {
          ...comment,
          replies: comment.replies.map((reply) =>
            reply.id === commentId
              ? { ...reply, content: updatedComment.content, is_edited: true }
              : reply
          ),
        }
      })
    )
  }

  const handleDelete = async (commentId: string) => {
    const response = await fetch(`/api/forum/comments/${commentId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('فشل في حذف التعليق')
    }

    // Remove the comment from state
    setComments((prev) => {
      // Check if it's a top-level comment
      const isTopLevel = prev.some((c) => c.id === commentId)

      if (isTopLevel) {
        const deletedComment = prev.find((c) => c.id === commentId)
        // Count the comment and its replies for decrement
        const decrementCount = 1 + (deletedComment?.replies.length || 0)
        onCommentCountChange?.(-decrementCount)
        return prev.filter((c) => c.id !== commentId)
      }

      // It's a reply
      onCommentCountChange?.(-1)
      return prev.map((comment) => ({
        ...comment,
        replies: comment.replies.filter((r) => r.id !== commentId),
      }))
    })
  }

  const handleReport = (commentId: string) => {
    // Find the comment content for preview
    let commentContent: string | undefined
    for (const comment of comments) {
      if (comment.id === commentId) {
        commentContent = comment.content
        break
      }
      const reply = comment.replies.find((r) => r.id === commentId)
      if (reply) {
        commentContent = reply.content
        break
      }
    }

    setReportingCommentId(commentId)
    setReportingCommentContent(commentContent)
    setReportModalOpen(true)
  }

  const handleCloseReportModal = () => {
    setReportModalOpen(false)
    setReportingCommentId(null)
    setReportingCommentContent(undefined)
  }

  return (
    <Card>
      <CardContent className="p-6">
        {/* Header */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          التعليقات ({commentCount})
        </h2>

        {/* New Comment Form */}
        <div className="mb-6 space-y-3">
          <Textarea
            value={newComment}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
            placeholder={currentUserId ? "اكتب تعليقك..." : "سجل دخولك للتعليق"}
            maxLength={FORUM_LIMITS.COMMENT_MAX_LENGTH}
            className="min-h-[80px]"
            disabled={isSubmitting || !currentUserId}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {newComment.length}/{FORUM_LIMITS.COMMENT_MAX_LENGTH}
            </span>
            <Button
              onClick={handleSubmitComment}
              disabled={isSubmitting || !newComment.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                'إرسال التعليق'
              )}
            </Button>
          </div>
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Comments List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={() => fetchComments()}>
              إعادة المحاولة
            </Button>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              لا توجد تعليقات بعد. كن أول من يعلق!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id}>
                <CommentItem
                  comment={comment}
                  currentUserId={currentUserId}
                  postId={postId}
                  onLike={handleLike}
                  onUnlike={handleUnlike}
                  onReply={handleReply}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onReport={handleReport}
                />

                {/* Replies */}
                {comment.replies.length > 0 && (
                  <div className="space-y-3 mt-3">
                    {comment.replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        currentUserId={currentUserId}
                        postId={postId}
                        isReply
                        onLike={handleLike}
                        onUnlike={handleUnlike}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onReport={handleReport}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري التحميل...
                    </>
                  ) : (
                    'تحميل المزيد'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Report Modal */}
      {reportingCommentId && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={handleCloseReportModal}
          contentType="comment"
          contentId={reportingCommentId}
          contentPreview={reportingCommentContent}
        />
      )}
    </Card>
  )
}
