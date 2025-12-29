'use client'

import { useState } from 'react'
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
import type { SortOption, PostType } from '@/lib/forum/types'
import {
  useForumPosts,
  useAddReaction,
  useRemoveReaction,
  useDeletePost,
} from '@/hooks/useForumPosts'

export default function ForumPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filterType, setFilterType] = useState<PostType | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Use React Query hook for posts
  // Only fetch when auth is ready (we allow forum posts for both authenticated and unauthenticated users)
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useForumPosts({
    sortBy,
    filterType,
    searchQuery,
    enabled: !authLoading // Only fetch when auth state is determined
  })

  // Mutations
  const addReaction = useAddReaction()
  const removeReaction = useRemoveReaction()
  const deletePost = useDeletePost()

  // Flatten paginated data
  const posts = data?.pages.flatMap((page: any) => page.posts) ?? []

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Query will automatically refetch when searchQuery changes
  }

  const handleReaction = async (postId: string, type: 'like' | 'love') => {
    if (!user) {
      router.push('/auth/login?redirect=/forum')
      return
    }

    await addReaction.mutateAsync({ postId, type })
  }

  const handleRemoveReaction = async (postId: string, type: 'like' | 'love') => {
    if (!user) return

    await removeReaction.mutateAsync({ postId, type })
  }

  const handleEdit = (postId: string) => {
    router.push(`/forum/edit/${postId}`)
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنشور؟')) return

    await deletePost.mutateAsync(postId)
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
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">فشل في تحميل المنشورات</p>
          </div>
        ) : (
          <PostList
            posts={posts}
            currentUserId={user?.id}
            hasMore={hasNextPage ?? false}
            isLoading={isFetchingNextPage}
            onLoadMore={fetchNextPage}
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
