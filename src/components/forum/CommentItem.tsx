'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import {
  ThumbsUp,
  Clock,
  MoreHorizontal,
  Edit2,
  Trash2,
  Flag,
  Reply,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Comment, CommentReply } from '@/lib/forum/types'
import { cn } from '@/lib/utils'
import { FORUM_LIMITS } from '@/lib/forum/types'

interface CommentItemProps {
  comment: Comment | CommentReply
  currentUserId?: string
  postId?: string
  isReply?: boolean
  onLike?: (commentId: string) => Promise<void>
  onUnlike?: (commentId: string) => Promise<void>
  onReply?: (parentId: string, content: string) => Promise<void>
  onEdit?: (commentId: string, content: string) => Promise<void>
  onDelete?: (commentId: string) => Promise<void>
  onReport?: (commentId: string) => void
}

export function CommentItem({
  comment,
  currentUserId,
  postId: _postId,
  isReply = false,
  onLike,
  onUnlike,
  onReply,
  onEdit,
  onDelete,
  onReport,
}: CommentItemProps) {
  const [isLiking, setIsLiking] = useState(false)
  const [localLikeCount, setLocalLikeCount] = useState(comment.like_count)
  const [localUserLiked, setLocalUserLiked] = useState(comment.user_liked)

  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)

  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isAuthor = currentUserId === comment.author.id
  const canReply = !isReply && onReply && currentUserId

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: ar,
  })

  const handleLikeToggle = async () => {
    if (isLiking || !currentUserId) return

    setIsLiking(true)
    try {
      if (localUserLiked) {
        if (onUnlike) {
          await onUnlike(comment.id)
          setLocalUserLiked(false)
          setLocalLikeCount((prev) => Math.max(0, prev - 1))
        }
      } else {
        if (onLike) {
          await onLike(comment.id)
          setLocalUserLiked(true)
          setLocalLikeCount((prev) => prev + 1)
        }
      }
    } catch (error) {
      console.error('Like toggle error:', error)
    } finally {
      setIsLiking(false)
    }
  }

  const handleSubmitEdit = async () => {
    if (!onEdit || !editContent.trim() || isSubmittingEdit) return

    setIsSubmittingEdit(true)
    try {
      await onEdit(comment.id, editContent.trim())
      setIsEditing(false)
    } catch (error) {
      console.error('Edit error:', error)
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent(comment.content)
  }

  const handleSubmitReply = async () => {
    if (!onReply || !replyContent.trim() || isSubmittingReply) return

    setIsSubmittingReply(true)
    try {
      await onReply(comment.id, replyContent.trim())
      setReplyContent('')
      setIsReplying(false)
    } catch (error) {
      console.error('Reply error:', error)
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const handleCancelReply = () => {
    setIsReplying(false)
    setReplyContent('')
  }

  const handleDelete = async () => {
    if (!onDelete || isDeleting) return

    setIsDeleting(true)
    try {
      await onDelete(comment.id)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Delete error:', error)
      setIsDeleting(false)
    }
  }

  return (
    <div className={cn('group', isReply && 'ms-8 mt-3')}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className={cn(
          'rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0',
          isReply ? 'w-8 h-8' : 'w-10 h-10'
        )}>
          {comment.author.profile_picture_url ? (
            <Image
              src={comment.author.profile_picture_url}
              alt={comment.author.display_name}
              width={isReply ? 32 : 40}
              height={isReply ? 32 : 40}
              className="rounded-full object-cover"
            />
          ) : (
            <span className={cn(
              'text-primary font-semibold',
              isReply ? 'text-sm' : 'text-base'
            )}>
              {comment.author.display_name.charAt(0)}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={cn(
                'font-medium text-foreground',
                isReply ? 'text-sm' : 'text-base'
              )}>
                {comment.author.display_name}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {timeAgo}
              </span>
              {comment.is_edited && (
                <span className="text-xs text-muted-foreground">(تم التعديل)</span>
              )}
            </div>

            {/* Actions Menu */}
            {(isAuthor || onReport) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                    <span className="sr-only">خيارات</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isAuthor && (
                    <>
                      {onEdit && (
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                          <Edit2 className="w-4 h-4 ml-2" />
                          تعديل
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem
                          onClick={() => setShowDeleteDialog(true)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 ml-2" />
                          حذف
                        </DropdownMenuItem>
                      )}
                      {(onEdit || onDelete) && onReport && <DropdownMenuSeparator />}
                    </>
                  )}
                  {onReport && !isAuthor && (
                    <DropdownMenuItem onClick={() => onReport(comment.id)}>
                      <Flag className="w-4 h-4 ml-2" />
                      إبلاغ
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Comment Content or Edit Form */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editContent}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditContent(e.target.value)}
                maxLength={FORUM_LIMITS.COMMENT_MAX_LENGTH}
                className="min-h-[80px] text-sm"
                disabled={isSubmittingEdit}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{editContent.length}/{FORUM_LIMITS.COMMENT_MAX_LENGTH}</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isSubmittingEdit}
                  >
                    إلغاء
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmitEdit}
                    disabled={isSubmittingEdit || !editContent.trim()}
                  >
                    {isSubmittingEdit ? (
                      <>
                        <Loader2 className="w-3 h-3 ml-1 animate-spin" />
                        جاري الحفظ
                      </>
                    ) : (
                      'حفظ'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className={cn(
              'mt-1 text-foreground whitespace-pre-wrap',
              isReply ? 'text-sm' : 'text-base'
            )}>
              {comment.content}
            </p>
          )}

          {/* Footer Actions */}
          {!isEditing && (
            <div className="flex items-center gap-3 mt-2">
              {/* Like Button */}
              <Button
                variant="ghost"
                size="sm"
                disabled={isLiking || !currentUserId}
                onClick={handleLikeToggle}
                className={cn(
                  'gap-1 h-7 px-2 text-xs',
                  localUserLiked
                    ? 'text-blue-600 hover:text-blue-700'
                    : 'text-muted-foreground hover:text-blue-600'
                )}
              >
                <ThumbsUp
                  className={cn(
                    'w-3.5 h-3.5',
                    localUserLiked && 'fill-current'
                  )}
                />
                {localLikeCount > 0 && <span>{localLikeCount}</span>}
              </Button>

              {/* Reply Button */}
              {canReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReplying(true)}
                  className="gap-1 h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Reply className="w-3.5 h-3.5" />
                  رد
                </Button>
              )}
            </div>
          )}

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-3 space-y-2">
              <Textarea
                value={replyContent}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyContent(e.target.value)}
                placeholder="اكتب ردك..."
                maxLength={FORUM_LIMITS.COMMENT_MAX_LENGTH}
                className="min-h-[60px] text-sm"
                disabled={isSubmittingReply}
                autoFocus
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{replyContent.length}/{FORUM_LIMITS.COMMENT_MAX_LENGTH}</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelReply}
                    disabled={isSubmittingReply}
                  >
                    إلغاء
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmitReply}
                    disabled={isSubmittingReply || !replyContent.trim()}
                  >
                    {isSubmittingReply ? (
                      <>
                        <Loader2 className="w-3 h-3 ml-1 animate-spin" />
                        جاري الإرسال
                      </>
                    ) : (
                      'إرسال'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف التعليق</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا التعليق؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isDeleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                'حذف'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
