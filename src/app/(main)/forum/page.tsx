'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PostList } from '@/components/forum/PostList'
import { ForumErrorBoundary } from '@/components/forum/ForumErrorBoundary'
import { PostCardSkeleton } from '@/components/forum/PostCardSkeleton'
import {
  Plus,
  Search,
  SlidersHorizontal,
  TrendingUp,
  Clock,
  Users,
  FileText,
  Loader2,
} from 'lucide-react'
import type { ForumPost, SortOption, PostType } from '@/lib/forum/types'

interface PostsResponse {
  posts: ForumPost[]
  next_cursor: string | null
  has_more: boolean
}

export default function ForumPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [posts, setPosts] = useState<ForumPost[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filterType, setFilterType] = useState<PostType | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)

  const fetchPosts = useCallback(
    async (cursor?: string) => {
      try {
        const params = new URLSearchParams()
        if (cursor) params.set('cursor', cursor)
        params.set('limit', '20')
        params.set('sort', sortBy)
        if (filterType !== 'all') params.set('type', filterType)
        if (searchQuery.trim()) params.set('search', searchQuery.trim())

        const response = await fetch(`/api/forum/posts?${params}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch posts')
        }

        const data: PostsResponse = await response.json()
        return data
      } catch (error) {
        console.error('Error fetching posts:', error)
        throw error
      }
    },
    [sortBy, filterType, searchQuery]
  )

  const loadInitialPosts = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchPosts()
      setPosts(data.posts)
      setNextCursor(data.next_cursor)
      setHasMore(data.has_more)
    } catch (error) {
      console.error('Failed to load posts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [fetchPosts])

  const loadMorePosts = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return

    setIsLoadingMore(true)
    try {
      const data = await fetchPosts(nextCursor)
      setPosts((prev) => [...prev, ...data.posts])
      setNextCursor(data.next_cursor)
      setHasMore(data.has_more)
    } catch (error) {
      console.error('Failed to load more posts:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [nextCursor, isLoadingMore, fetchPosts])

  useEffect(() => {
    loadInitialPosts()
  }, [loadInitialPosts])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadInitialPosts()
  }

  const handleReaction = async (postId: string, type: 'like' | 'love') => {
    if (!user) {
      router.push('/auth/login?redirect=/forum')
      return
    }

    const response = await fetch(`/api/forum/posts/${postId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reaction_type: type }),
    })

    if (!response.ok) {
      throw new Error('Failed to add reaction')
    }
  }

  const handleRemoveReaction = async (postId: string, type: 'like' | 'love') => {
    if (!user) return

    const response = await fetch(`/api/forum/posts/${postId}/reactions/${type}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to remove reaction')
    }
  }

  const handleEdit = (postId: string) => {
    router.push(`/forum/edit/${postId}`)
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنشور؟')) return

    const response = await fetch(`/api/forum/posts/${postId}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    }
  }

  const handleReport = (postId: string) => {
    // Will be implemented in US7
    console.log('Report post:', postId)
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">المنتدى</h1>
          <p className="text-muted-foreground">
            شارك تجربتك واستفد من تجارب الآخرين
          </p>
        </div>

        <Link href="/forum/create">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            منشور جديد
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="ابحث في المنشورات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Button type="submit" variant="outline">
            بحث
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-accent' : ''}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </form>

        {showFilters && (
          <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-sm font-medium">ترتيب حسب</label>
              <Select
                value={sortBy}
                onValueChange={(value: SortOption) => setSortBy(value)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      الأحدث
                    </span>
                  </SelectItem>
                  <SelectItem value="most_liked">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      الأكثر إعجاباً
                    </span>
                  </SelectItem>
                  <SelectItem value="most_completed">
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      الأكثر إكمالاً
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">نوع المنشور</label>
              <Select
                value={filterType}
                onValueChange={(value: PostType | 'all') => setFilterType(value)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="exam_share">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      اختبارات مشاركة
                    </span>
                  </SelectItem>
                  <SelectItem value="text">منشورات نصية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Posts List */}
      <ForumErrorBoundary>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <PostList
            posts={posts}
            currentUserId={user?.id}
            hasMore={hasMore}
            isLoading={isLoadingMore}
            onLoadMore={loadMorePosts}
            onReaction={handleReaction}
            onRemoveReaction={handleRemoveReaction}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReport={handleReport}
          />
        )}
      </ForumErrorBoundary>
    </div>
  )
}
