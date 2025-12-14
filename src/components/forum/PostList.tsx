'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { PostCard } from './PostCard'
import type { ForumPost } from '@/lib/forum/types'

interface PostListProps {
  posts: ForumPost[]
  currentUserId?: string
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  onReaction?: (postId: string, type: 'like' | 'love') => Promise<void>
  onRemoveReaction?: (postId: string, type: 'like' | 'love') => Promise<void>
  onEdit?: (postId: string) => void
  onDelete?: (postId: string) => void
  onReport?: (postId: string) => void
  isCompact?: boolean
}

export function PostList({
  posts,
  currentUserId,
  hasMore,
  isLoading,
  onLoadMore,
  onReaction,
  onRemoveReaction,
  onEdit,
  onDelete,
  onReport,
  isCompact = false,
}: PostListProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && hasMore && !isLoading) {
        onLoadMore()
      }
    },
    [hasMore, isLoading, onLoadMore]
  )

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: '100px',
      threshold: 0,
    })

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [handleIntersection])

  if (posts.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          لا توجد منشورات حالياً
        </p>
        <p className="text-muted-foreground text-sm mt-2">
          كن أول من يشارك في المنتدى!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onReaction={onReaction}
          onRemoveReaction={onRemoveReaction}
          onEdit={onEdit}
          onDelete={onDelete}
          onReport={onReport}
          isCompact={isCompact}
        />
      ))}

      {/* Loading indicator / Infinite scroll trigger */}
      <div ref={loadMoreRef} className="py-4">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>جاري التحميل...</span>
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <p className="text-center text-muted-foreground text-sm">
            لقد وصلت إلى نهاية المنشورات
          </p>
        )}
      </div>
    </div>
  )
}
