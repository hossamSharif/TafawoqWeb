'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowRight, Loader2, Save, AlertCircle } from 'lucide-react'
import { FORUM_LIMITS } from '@/lib/forum/types'
import type { ForumPost, UpdatePostRequest } from '@/lib/forum/types'

export default function EditPostPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const postId = params.id as string

  const [post, setPost] = useState<ForumPost | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth/login?redirect=/forum/edit/${postId}`)
    }
  }, [user, authLoading, router, postId])

  useEffect(() => {
    if (user && postId) {
      fetchPost()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, postId])

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

      const data: ForumPost = await response.json()

      // Check if user is the author
      if (data.author.id !== user?.id) {
        setError('ليس لديك صلاحية تعديل هذا المنشور')
        return
      }

      setPost(data)
      setTitle(data.title)
      setBody(data.body || '')
    } catch {
      setError('حدث خطأ أثناء تحميل المنشور')
    } finally {
      setIsLoading(false)
    }
  }

  const titleLength = title.length
  const bodyLength = body.length
  const isTitleValid = titleLength > 0 && titleLength <= FORUM_LIMITS.TITLE_MAX_LENGTH
  const isBodyValid = post?.post_type === 'text'
    ? bodyLength > 0 && bodyLength <= FORUM_LIMITS.BODY_MAX_LENGTH
    : bodyLength <= FORUM_LIMITS.BODY_MAX_LENGTH

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isTitleValid) {
      setError('يرجى إدخال عنوان صالح')
      return
    }

    if (!isBodyValid) {
      setError('محتوى المنشور غير صالح')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const requestBody: UpdatePostRequest = {
        title: title.trim(),
        body: body.trim() || undefined,
      }

      const response = await fetch(`/api/forum/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'فشل في تحديث المنشور')
      }

      router.push(`/forum/post/${postId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (error && !post) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Link href="/forum">
          <Button variant="outline">
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للمنتدى
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <Link href={`/forum/post/${postId}`}>
        <Button variant="ghost" className="gap-2">
          <ArrowRight className="w-4 h-4" />
          العودة للمنشور
        </Button>
      </Link>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>تعديل المنشور</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                العنوان <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="اكتب عنوان المنشور..."
                maxLength={FORUM_LIMITS.TITLE_MAX_LENGTH}
                disabled={isSubmitting}
                className={!isTitleValid && title.length > 0 ? 'border-destructive' : ''}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>عنوان واضح يجذب القراء</span>
                <span className={titleLength > FORUM_LIMITS.TITLE_MAX_LENGTH ? 'text-destructive' : ''}>
                  {titleLength}/{FORUM_LIMITS.TITLE_MAX_LENGTH}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="space-y-2">
              <Label htmlFor="body">
                المحتوى {post?.post_type === 'text' && <span className="text-destructive">*</span>}
              </Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={post?.post_type === 'exam_share' ? 'أضف وصفاً للاختبار (اختياري)...' : 'اكتب محتوى المنشور...'}
                rows={8}
                maxLength={FORUM_LIMITS.BODY_MAX_LENGTH}
                disabled={isSubmitting}
                className={!isBodyValid && body.length > 0 ? 'border-destructive' : ''}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{post?.post_type === 'exam_share' ? 'وصف الاختبار المشارك' : 'محتوى المنشور'}</span>
                <span className={bodyLength > FORUM_LIMITS.BODY_MAX_LENGTH ? 'text-destructive' : ''}>
                  {bodyLength}/{FORUM_LIMITS.BODY_MAX_LENGTH}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Link href={`/forum/post/${postId}`}>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  إلغاء
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isSubmitting || !isTitleValid || !isBodyValid}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    حفظ التعديلات
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
