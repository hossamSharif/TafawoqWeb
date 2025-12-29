import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/keys'
import type { ForumPost, SortOption, PostType } from '@/lib/forum/types'

interface PostsResponse {
  posts: ForumPost[]
  next_cursor: string | null
  has_more: boolean
}

interface UseForumPostsOptions {
  sortBy?: SortOption
  filterType?: PostType | 'all'
  searchQuery?: string
  limit?: number
  enabled?: boolean // Add enabled option to control when query runs
}

export function useForumPosts(options: UseForumPostsOptions = {}) {
  const {
    sortBy = 'newest',
    filterType = 'all',
    searchQuery = '',
    limit = 20,
    enabled = true, // Default to true for backward compatibility
  } = options

  return useInfiniteQuery({
    queryKey: queryKeys.forum.posts({ sortBy, filterType, searchQuery }),
    queryFn: async ({ pageParam }: { pageParam: string | undefined }): Promise<PostsResponse> => {
      const params = new URLSearchParams()
      if (pageParam) params.set('cursor', pageParam)
      params.set('limit', limit.toString())
      params.set('sort', sortBy)
      if (filterType !== 'all') params.set('type', filterType)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const response = await fetch(`/api/forum/posts?${params}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch posts')
      }

      return response.json()
    },
    enabled, // Only fetch when enabled is true
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    staleTime: 1000 * 60 * 2, // 2 minutes (forum updates frequently)
    gcTime: 1000 * 60 * 10, // 10 minutes cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

export function useForumPost(postId: string) {
  return useQuery({
    queryKey: queryKeys.forum.post(postId),
    queryFn: async (): Promise<ForumPost> => {
      const response = await fetch(`/api/forum/posts/${postId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch post')
      }
      return response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15,
  })
}

// Mutation hooks for forum actions
export function useAddReaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      postId,
      type,
    }: {
      postId: string
      type: 'like' | 'love'
    }) => {
      const response = await fetch(`/api/forum/posts/${postId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction_type: type }),
      })

      if (!response.ok) {
        throw new Error('Failed to add reaction')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate all forum posts queries to refetch with updated reaction counts
      queryClient.invalidateQueries({ queryKey: queryKeys.forum.all })
    },
  })
}

export function useRemoveReaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      postId,
      type,
    }: {
      postId: string
      type: 'like' | 'love'
    }) => {
      const response = await fetch(
        `/api/forum/posts/${postId}/reactions/${type}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error('Failed to remove reaction')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forum.all })
    },
  })
}

export function useDeletePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/forum/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete post')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forum.all })
    },
  })
}
