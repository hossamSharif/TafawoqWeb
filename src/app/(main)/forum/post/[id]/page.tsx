'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ReactionButtons } from '@/components/forum/ReactionButtons'
import { CommentSection } from '@/components/forum/CommentSection'
import { ReportModal } from '@/components/forum/ReportModal'
import { ForumErrorBoundary } from '@/components/forum/ForumErrorBoundary'
import {
  ArrowRight,
  FileText,
  BookOpen,
  MessageSquare,
  Users,
  Clock,
  MoreHorizontal,
  Edit2,
  Trash2,
  Flag,
  Play,
  Loader2,
} from 'lucide-react'
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
import type { ForumPost, UserReaction } from '@/lib/forum/types'
import { parsePostBody } from '@/lib/utils'

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const postId = params.id as string

  const [post, setPost] = useState<ForumPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isStartingExam, setIsStartingExam] = useState(false)

  const [localReaction, setLocalReaction] = useState<UserReaction>({ like: false, love: false })
  const [localLikeCount, setLocalLikeCount] = useState(0)
  const [localLoveCount, setLocalLoveCount] = useState(0)
  const [localCommentCount, setLocalCommentCount] = useState(0)
  const [isReacting, setIsReacting] = useState(false)

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false)

  useEffect(() => {
    fetchPost()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  const fetchPost = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/forum/posts/${postId}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('المنشور غير موجود')
        } else {
          const data = await response.json()
          setError(data.error || 'حدث خطأ أثناء تحميل المنشور')
        }
        return
      }

      const data = await response.json()
      setPost(data)
      setLocalReaction(data.user_reaction)
      setLocalLikeCount(data.like_count)
      setLocalLoveCount(data.love_count)
      setLocalCommentCount(data.comment_count)
    } catch {
      setError('حدث خطأ أثناء تحميل المنشور')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReaction = async (type: 'like' | 'love') => {
    if (isReacting || !user) {
      if (!user) router.push('/auth/login?redirect=/forum/post/' + postId)
      return
    }

    setIsReacting(true)
    const currentlyHas = type === 'like' ? localReaction.like : localReaction.love

    try {
      if (currentlyHas) {
        const response = await fetch(`/api/forum/posts/${postId}/reactions/${type}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          if (type === 'like') {
            setLocalReaction((prev) => ({ ...prev, like: false }))
            setLocalLikeCount((prev) => Math.max(0, prev - 1))
          } else {
            setLocalReaction((prev) => ({ ...prev, love: false }))
            setLocalLoveCount((prev) => Math.max(0, prev - 1))
          }
        }
      } else {
        const response = await fetch(`/api/forum/posts/${postId}/reactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reaction_type: type }),
        })
        if (response.ok) {
          if (type === 'like') {
            setLocalReaction((prev) => ({ ...prev, like: true }))
            setLocalLikeCount((prev) => prev + 1)
          } else {
            setLocalReaction((prev) => ({ ...prev, love: true }))
            setLocalLoveCount((prev) => prev + 1)
          }
        }
      }
    } catch (error) {
      console.error('Reaction error:', error)
    } finally {
      setIsReacting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/forum/posts/${postId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/forum')
      }
    } catch (error) {
      console.error('Delete error:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleStartExam = async () => {
    if (!user) {
      router.push('/auth/login?redirect=/forum/post/' + postId)
      return
    }

    setIsStartingExam(true)
    try {
      const response = await fetch(`/api/forum/posts/${postId}/start-exam`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        router.push(data.redirect_url)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'حدث خطأ أثناء بدء الاختبار')
      }
    } catch (error) {
      console.error('Start exam error:', error)
      alert('حدث خطأ أثناء بدء الاختبار')
    } finally {
      setIsStartingExam(false)
    }
  }

  const handleCommentCountChange = useCallback((delta: number) => {
    setLocalCommentCount((prev) => Math.max(0, prev + delta))
  }, [])

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button Skeleton */}
        <Skeleton className="h-10 w-32" />

        {/* Post Content Skeleton */}
        <Card>
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>

            {/* Title */}
            <Skeleton className="h-8 w-3/4 mt-4" />

            {/* Body */}
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-16 rounded-md" />
                <Skeleton className="h-8 w-16 rounded-md" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Skeleton */}
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-20 w-full mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-muted-foreground text-lg mb-4">
          {error || 'المنشور غير موجود'}
        </p>
        <Link href="/forum">
          <Button variant="outline">
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للمنتدى
          </Button>
        </Link>
      </div>
    )
  }

  const isAuthor = user?.id === post.author.id
  const isExamShare = post.post_type === 'exam_share'
  const isPracticeShare = post.post_type === 'practice_share'
  const isContentShare = isExamShare || isPracticeShare
  const canTakeExam = isContentShare && !isAuthor && !post.user_completed

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: ar,
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link href="/forum">
        <Button variant="ghost" className="gap-2">
          <ArrowRight className="w-4 h-4" />
          العودة للمنتدى
        </Button>
      </Link>

      {/* Post Content */}
      <Card>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {post.author.profile_picture_url ? (
                  <Image
                    src={post.author.profile_picture_url}
                    alt={post.author.display_name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-primary font-semibold text-lg">
                    {post.author.display_name.charAt(0)}
                  </span>
                )}
              </div>

              {/* Author & Time */}
              <div>
                <p className="font-semibold text-foreground">
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

            {/* Actions Menu */}
            <div className="flex items-center gap-2">
              {isExamShare && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <FileText className="w-4 h-4" />
                  اختبار مشارك
                </span>
              )}
              {isPracticeShare && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
                  <BookOpen className="w-4 h-4" />
                  تمرين مشارك
                </span>
              )}

              {(isAuthor || user) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isAuthor && (
                      <>
                        <DropdownMenuItem onClick={() => router.push(`/forum/edit/${postId}`)}>
                          <Edit2 className="w-4 h-4 ml-2" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setShowDeleteDialog(true)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 ml-2" />
                          حذف
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {!isAuthor && (
                      <DropdownMenuItem onClick={() => setShowReportModal(true)}>
                        <Flag className="w-4 h-4 ml-2" />
                        إبلاغ
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold mt-4">{post.title}</h1>

          {/* Body */}
          {parsePostBody(post.body) && (
            <p className="mt-4 text-foreground whitespace-pre-wrap leading-relaxed">
              {parsePostBody(post.body)}
            </p>
          )}

          {/* Exam Share Info */}
          {isExamShare && post.shared_exam && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-4">
              <h3 className="font-semibold">معلومات الاختبار</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">عدد الأسئلة</p>
                  <p className="font-medium">{post.shared_exam.question_count}</p>
                </div>
                {post.shared_exam.section_counts && (
                  <>
                    <div>
                      <p className="text-muted-foreground">أسئلة لفظية</p>
                      <p className="font-medium text-blue-600">
                        {post.shared_exam.section_counts.verbal}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">أسئلة كمية</p>
                      <p className="font-medium text-purple-600">
                        {post.shared_exam.section_counts.quantitative}
                      </p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-muted-foreground">عدد الإكمالات</p>
                  <p className="font-medium">{post.completion_count}</p>
                </div>
              </div>

              {/* Take Exam Button */}
              {canTakeExam && (
                <Button
                  onClick={handleStartExam}
                  disabled={isStartingExam}
                  className="w-full mt-4 gap-2"
                  size="lg"
                >
                  {isStartingExam ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري البدء...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      بدء الاختبار
                    </>
                  )}
                </Button>
              )}

              {post.user_completed && (
                <p className="text-center text-sm text-green-600 font-medium">
                  لقد أكملت هذا الاختبار سابقاً
                </p>
              )}

              {isAuthor && (
                <p className="text-center text-sm text-muted-foreground">
                  لا يمكنك حل اختبارك الخاص
                </p>
              )}
            </div>
          )}

          {/* Practice Share Info */}
          {isPracticeShare && post.shared_practice && (
            <div className="mt-6 p-4 bg-emerald-50 rounded-lg space-y-4">
              <h3 className="font-semibold text-emerald-800">معلومات التمرين</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">عدد الأسئلة</p>
                  <p className="font-medium">{post.shared_practice.question_count}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">القسم</p>
                  <p className="font-medium">
                    {post.shared_practice.section === 'quantitative' ? 'كمي' : 'لفظي'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">مستوى الصعوبة</p>
                  <p className={`font-medium ${
                    post.shared_practice.difficulty === 'easy' ? 'text-green-600' :
                    post.shared_practice.difficulty === 'medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {post.shared_practice.difficulty === 'easy' ? 'سهل' :
                     post.shared_practice.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">عدد الإكمالات</p>
                  <p className="font-medium">{post.completion_count}</p>
                </div>
              </div>

              {/* Take Practice Button */}
              {canTakeExam && (
                <Button
                  onClick={handleStartExam}
                  disabled={isStartingExam}
                  className="w-full mt-4 gap-2 bg-emerald-600 hover:bg-emerald-700"
                  size="lg"
                >
                  {isStartingExam ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري البدء...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      بدء التمرين
                    </>
                  )}
                </Button>
              )}

              {post.user_completed && (
                <p className="text-center text-sm text-green-600 font-medium">
                  لقد أكملت هذا التمرين سابقاً
                </p>
              )}

              {isAuthor && (
                <p className="text-center text-sm text-muted-foreground">
                  لا يمكنك حل تمرينك الخاص
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            {/* Reactions */}
            <ReactionButtons
              likeCount={localLikeCount}
              loveCount={localLoveCount}
              userReaction={localReaction}
              onReaction={handleReaction}
              disabled={isReacting || !user}
            />

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                {localCommentCount} تعليق
              </span>

              {isContentShare && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {post.completion_count} إكمال
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <ForumErrorBoundary>
        <CommentSection
          postId={postId}
          commentCount={localCommentCount}
          currentUserId={user?.id}
          onCommentCountChange={handleCommentCountChange}
        />
      </ForumErrorBoundary>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المنشور</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المنشور؟ لا يمكن التراجع عن هذا الإجراء.
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

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType="post"
        contentId={postId}
        contentPreview={post.title}
      />
    </div>
  )
}
