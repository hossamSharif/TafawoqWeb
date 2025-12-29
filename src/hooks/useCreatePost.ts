import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { queryKeys } from '@/lib/query/keys'
import type { CreatePostRequest, ForumPost } from '@/lib/forum/types'

export function useCreatePost() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: CreatePostRequest): Promise<ForumPost> => {
      const response = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'فشل في إنشاء المنشور')
      }

      return response.json()
    },
    onSuccess: (newPost) => {
      // Invalidate and refetch forum posts to show the new post
      queryClient.invalidateQueries({ queryKey: queryKeys.forum.all })

      // Optionally, add optimistic update to immediately show the post
      queryClient.setQueryData(
        queryKeys.forum.posts({ sortBy: 'newest', filterType: 'all', searchQuery: '' }),
        (old: any) => {
          if (!old) return old

          return {
            ...old,
            pages: old.pages.map((page: any, index: number) => {
              // Add to first page
              if (index === 0) {
                return {
                  ...page,
                  posts: [newPost, ...page.posts],
                }
              }
              return page
            }),
          }
        }
      )

      // Redirect to forum page to see the new post
      router.push('/forum')
    },
  })
}
