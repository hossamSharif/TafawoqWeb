'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import {
  FileText,
  MessageSquare,
  Users,
  Clock,
  MoreHorizontal,
  Edit2,
  Trash2,
  Flag,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ReactionButtons } from './ReactionButtons'
import { TakeExamButton } from './TakeExamButton'
import type { ForumPost, UserReaction } from '@/lib/forum/types'
import { cn, parsePostBody } from '@/lib/utils'

interface PostCardProps {
  post: ForumPost
  currentUserId?: string
  onReaction?: (postId: string, type: 'like' | 'love') => Promise<void>
  onRemoveReaction?: (postId: string, type: 'like' | 'love') => Promise<void>
  onEdit?: (postId: string) => void
  onDelete?: (postId: string) => void
  onReport?: (postId: string) => void
  isCompact?: boolean
}

export function PostCard({
  post,
  currentUserId,
  onReaction,
  onRemoveReaction,
  onEdit,
  onDelete,
  onReport,
  isCompact = false,
}: PostCardProps) {
  const [localReaction, setLocalReaction] = useState<UserReaction>(post.user_reaction)
  const [localLikeCount, setLocalLikeCount] = useState(post.like_count)
  const [localLoveCount, setLocalLoveCount] = useState(post.love_count)
  const [isReacting, setIsReacting] = useState(false)

  const isAuthor = currentUserId === post.author.id
  const isExamShare = post.post_type === 'exam_share'

  const handleReaction = async (type: 'like' | 'love') => {
    if (isReacting || !onReaction || !onRemoveReaction) return

    setIsReacting(true)
    const currentlyHas = type === 'like' ? localReaction.like : localReaction.love

    try {
      if (currentlyHas) {
        await onRemoveReaction(post.id, type)
        if (type === 'like') {
          setLocalReaction((prev) => ({ ...prev, like: false }))
          setLocalLikeCount((prev) => Math.max(0, prev - 1))
        } else {
          setLocalReaction((prev) => ({ ...prev, love: false }))
          setLocalLoveCount((prev) => Math.max(0, prev - 1))
        }
      } else {
        await onReaction(post.id, type)
        if (type === 'like') {
          setLocalReaction((prev) => ({ ...prev, like: true }))
          setLocalLikeCount((prev) => prev + 1)
        } else {
          setLocalReaction((prev) => ({ ...prev, love: true }))
          setLocalLoveCount((prev) => prev + 1)
        }
      }
    } catch (error) {
      console.error('Reaction error:', error)
    } finally {
      setIsReacting(false)
    }
  }

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: ar,
  })

  return (
    <Card className={cn(
      'hover:shadow-md transition-shadow',
      (isExamShare || post.post_type === 'practice_share') && 'animate-exam-glow'
    )}>
      <CardContent className={cn('p-4', isCompact && 'p-3')}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              {post.author.profile_picture_url ? (
                <Image
                  src={post.author.profile_picture_url}
                  alt={post.author.display_name}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              ) : (
                <span className="text-primary font-semibold">
                  {post.author.display_name.charAt(0)}
                </span>
              )}
            </div>

            {/* Author & Time */}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground truncate">
                {post.author.display_name}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>{timeAgo}</span>
                {post.is_edited && (
                  <span className="text-xs">(تم التعديل)</span>
                )}
              </div>
            </div>
          </div>

          {/* Post Type Badge & Menu */}
          <div className="flex items-center gap-2">
            {(isExamShare || post.post_type === 'practice_share') && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                <FileText className="w-3.5 h-3.5" />
                {post.post_type === 'exam_share' ? 'اختبار مشارك' : 'تمرين مشارك'}
              </span>
            )}

            {(isAuthor || onReport) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                    <span className="sr-only">خيارات</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isAuthor && (
                    <>
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(post.id)}>
                          <Edit2 className="w-4 h-4 ml-2" />
                          تعديل
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem
                          onClick={() => onDelete(post.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 ml-2" />
                          حذف
                        </DropdownMenuItem>
                      )}
                      {(onEdit || onDelete) && onReport && (
                        <DropdownMenuSeparator />
                      )}
                    </>
                  )}
                  {onReport && !isAuthor && (
                    <DropdownMenuItem onClick={() => onReport(post.id)}>
                      <Flag className="w-4 h-4 ml-2" />
                      إبلاغ
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Content */}
        <Link href={`/forum/post/${post.id}`} className="block mt-3">
          <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
          {parsePostBody(post.body) && !isCompact && (
            <p className="mt-2 text-muted-foreground line-clamp-3">{parsePostBody(post.body)}</p>
          )}
        </Link>

        {/* Exam/Practice Share Info */}
        {(isExamShare || post.post_type === 'practice_share') && !isCompact && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-3">
            {/* Stats Row */}
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-muted-foreground" />
                {(post.shared_exam?.question_count || post.shared_practice?.question_count)} سؤال
              </span>

              {/* Exam-specific stats */}
              {post.shared_exam?.section_counts && (
                <>
                  <span className="text-blue-600">
                    لفظي: {post.shared_exam.section_counts.verbal}
                  </span>
                  <span className="text-purple-600">
                    كمي: {post.shared_exam.section_counts.quantitative}
                  </span>
                </>
              )}

              {/* Practice-specific stats */}
              {post.shared_practice && (
                <>
                  <span className="text-blue-600">
                    القسم: {post.shared_practice.section === 'verbal' ? 'لفظي' : 'كمي'}
                  </span>
                  {post.shared_practice.difficulty && (
                    <span className="text-purple-600">
                      {
                        { easy: 'سهل', medium: 'متوسط', hard: 'صعب' }[
                          post.shared_practice.difficulty
                        ]
                      }
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Button Row */}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <TakeExamButton
                postId={post.id}
                postType={post.post_type as 'exam_share' | 'practice_share'}
                isAuthor={isAuthor}
                userCompleted={post.user_completed ?? false}
                isAuthenticated={!!currentUserId}
              />

              {post.user_completed && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  مكتمل
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          {/* Reactions */}
          <ReactionButtons
            likeCount={localLikeCount}
            loveCount={localLoveCount}
            userReaction={localReaction}
            onReaction={handleReaction}
            disabled={isReacting || !currentUserId}
          />

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link
              href={`/forum/post/${post.id}`}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{post.comment_count}</span>
            </Link>

            {(isExamShare || post.post_type === 'practice_share') && (
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>{post.completion_count} إكمال</span>
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
