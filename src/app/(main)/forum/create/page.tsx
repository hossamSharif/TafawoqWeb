'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { CreatePostForm } from '@/components/forum/CreatePostForm'
import { Button } from '@/components/ui/button'
import { ArrowRight, Loader2 } from 'lucide-react'

export default function CreatePostPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login?redirect=/forum/create')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <Link href="/forum">
        <Button variant="ghost" className="gap-2">
          <ArrowRight className="w-4 h-4" />
          العودة للمنتدى
        </Button>
      </Link>

      {/* Create Post Form */}
      <CreatePostForm onCancel={() => router.push('/forum')} />
    </div>
  )
}
