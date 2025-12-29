import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/keys'
import type { LibraryExam, UserLibraryAccess } from '@/types/library'

interface LibraryResponse {
  exams: LibraryExam[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  userAccess: UserLibraryAccess
}

interface UseLibraryOptions {
  sortBy?: 'popular' | 'recent'
  filterSection?: 'all' | 'verbal' | 'quantitative'
  searchQuery?: string
  limit?: number
  enabled?: boolean // Add enabled option to control when query runs
}

export function useLibrary(options: UseLibraryOptions = {}) {
  const {
    sortBy = 'popular',
    filterSection = 'all',
    searchQuery = '',
    limit = 12,
    enabled = true, // Default to true for backward compatibility
  } = options

  return useInfiniteQuery({
    queryKey: queryKeys.library.exams({ sortBy, filterSection, searchQuery }),
    queryFn: async ({ pageParam }: { pageParam: number }): Promise<LibraryResponse> => {
      const params = new URLSearchParams()
      params.set('page', String(pageParam))
      params.set('limit', limit.toString())
      params.set('sort', sortBy)
      if (filterSection !== 'all') params.set('section', filterSection)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const response = await fetch(`/api/library?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch library')
      }

      return response.json()
    },
    enabled, // Only fetch when enabled is true
    initialPageParam: 1 as number,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    staleTime: 1000 * 60 * 3, // 3 minutes (library content doesn't change rapidly)
    gcTime: 1000 * 60 * 15, // 15 minutes cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

export function useLibraryExam(postId: string) {
  return useQuery({
    queryKey: queryKeys.library.exam(postId),
    queryFn: async (): Promise<LibraryExam> => {
      const response = await fetch(`/api/library/${postId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch library exam')
      }
      return response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 20,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

export function useLibraryAccess(userId: string) {
  return useQuery({
    queryKey: queryKeys.library.access(userId),
    queryFn: async (): Promise<UserLibraryAccess> => {
      const response = await fetch(`/api/library/access`)
      if (!response.ok) {
        throw new Error('Failed to fetch library access')
      }
      return response.json()
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}
