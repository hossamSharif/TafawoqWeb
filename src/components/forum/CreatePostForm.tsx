'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useCreatePost } from '@/hooks/useCreatePost'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Send, AlertCircle } from 'lucide-react'
import { FORUM_LIMITS } from '@/lib/forum/types'
import type { CreatePostRequest, ForumPost } from '@/lib/forum/types'

interface CreatePostFormProps {
  onSuccess?: (post: ForumPost) => void
  onCancel?: () => void
}

export function CreatePostForm({ onSuccess, onCancel }: CreatePostFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const createPost = useCreatePost()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)

  const titleLength = title.length
  const bodyLength = body.length
  const isTitleValid = titleLength > 0 && titleLength <= FORUM_LIMITS.TITLE_MAX_LENGTH
  const isBodyValid = bodyLength > 0 && bodyLength <= FORUM_LIMITS.BODY_MAX_LENGTH

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      router.push('/auth/login?redirect=/forum/create')
      return
    }

    if (!isTitleValid) {
      setError('يرجى إدخال عنوان صالح')
      return
    }

    if (!isBodyValid) {
      setError('يرجى إدخال محتوى المنشور')
      return
    }

    setError(null)

    try {
      const requestBody: CreatePostRequest = {
        post_type: 'text',
        title: title.trim(),
        body: body.trim(),
      }

      const post = await createPost.mutateAsync(requestBody)

      if (onSuccess) {
        onSuccess(post)
      }
      // Router.push('/forum') is handled in the mutation's onSuccess
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>إنشاء منشور جديد</CardTitle>
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
              disabled={createPost.isPending}
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
              المحتوى <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="اكتب محتوى المنشور..."
              rows={8}
              maxLength={FORUM_LIMITS.BODY_MAX_LENGTH}
              disabled={createPost.isPending}
              className={!isBodyValid && body.length > 0 ? 'border-destructive' : ''}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>شارك أفكارك أو اسأل سؤالاً</span>
              <span className={bodyLength > FORUM_LIMITS.BODY_MAX_LENGTH ? 'text-destructive' : ''}>
                {bodyLength}/{FORUM_LIMITS.BODY_MAX_LENGTH}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={createPost.isPending}
              >
                إلغاء
              </Button>
            )}
            <Button
              type="submit"
              disabled={createPost.isPending || !isTitleValid || !isBodyValid}
              className="gap-2"
            >
              {createPost.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري النشر...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  نشر
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
