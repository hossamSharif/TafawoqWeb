'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LibraryExamList } from '@/components/library/LibraryExamList'
import { LibraryEmptyState } from '@/components/library/LibraryEmptyState'
import {
  Library,
  Search,
  SlidersHorizontal,
  TrendingUp,
  Clock,
  Loader2,
  Crown,
} from 'lucide-react'
import { useLibrary } from '@/hooks/useLibrary'

export default function LibraryPage() {
  const router = useRouter()
  const { user, session, isLoading: authLoading, isAuthenticated, refreshSession } = useAuth()
  const [attemptedRecovery, setAttemptedRecovery] = useState(false)

  // Debug: Log auth state
  useEffect(() => {
    console.log('[Library] Auth state:', {
      user: !!user,
      userId: user?.id,
      hasSession: !!session,
      isAuthenticated,
      authLoading,
      attemptedRecovery
    })
  }, [user, session, isAuthenticated, authLoading, attemptedRecovery])

  // Attempt session recovery before redirecting to login
  useEffect(() => {
    const handleAuth = async () => {
      if (authLoading) return

      // If not authenticated and haven't attempted recovery yet
      if (!isAuthenticated && !user && !attemptedRecovery) {
        console.log('[Library] No session found, attempting recovery...')
        setAttemptedRecovery(true)

        const recovered = await refreshSession()

        if (!recovered) {
          console.log('[Library] Session recovery failed, redirecting to login...')
          router.push('/login')
        } else {
          console.log('[Library] Session recovered successfully!')
        }
      }
    }

    handleAuth()
  }, [authLoading, isAuthenticated, user, attemptedRecovery, refreshSession, router])

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'popular' | 'recent'>('popular')
  const [filterSection, setFilterSection] = useState<'all' | 'verbal' | 'quantitative'>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Use React Query hook for library data
  // Only fetch when user is authenticated and not loading
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useLibrary({
    sortBy,
    filterSection,
    searchQuery,
    enabled: !authLoading && !!user // Only fetch when auth is ready and user exists
  })

  // Flatten paginated data
  const exams = data?.pages.flatMap((page: any) => page.exams) ?? []
  const userAccess = data?.pages[0]?.userAccess ?? null
  const total = data?.pages[0]?.pagination.total ?? 0

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Query will automatically refetch when searchQuery changes
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <LibraryEmptyState
          title="سجّل الدخول للوصول للمكتبة"
          description="سجّل دخولك للاستفادة من اختبارات المجتمع المشاركة"
          showCreateAction={false}
        />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Library className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">مكتبة الاختبارات</h1>
          </div>
          <p className="text-muted-foreground">
            استفد من اختبارات المجتمع واكسب نقاط عند مشاركة محتواك
          </p>
        </div>

        {/* Access Status */}
        {userAccess && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
            {userAccess.tier === 'premium' ? (
              <>
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium">وصول غير محدود</span>
              </>
            ) : (
              <span className="text-sm">
                الوصول المتبقي:{' '}
                <span className="font-bold">
                  {(userAccess.accessLimit ?? 0) - userAccess.accessUsed} / {userAccess.accessLimit ?? 0}
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="ابحث في المكتبة..."
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
                onValueChange={(value: 'popular' | 'recent') => setSortBy(value)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      الأكثر إكمالاً
                    </span>
                  </SelectItem>
                  <SelectItem value="recent">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      الأحدث
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium">القسم</label>
              <Select
                value={filterSection}
                onValueChange={(value: 'all' | 'verbal' | 'quantitative') =>
                  setFilterSection(value)
                }
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="verbal">لفظي</SelectItem>
                  <SelectItem value="quantitative">كمي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      {!isLoading && total > 0 && (
        <p className="text-sm text-muted-foreground">
          عرض {exams.length} من {total} اختبار
        </p>
      )}

      {/* Exams List */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">فشل في تحميل المكتبة</p>
        </div>
      ) : (
        <LibraryExamList
          exams={exams}
          hasMore={hasNextPage ?? false}
          isLoading={isFetchingNextPage}
          onLoadMore={fetchNextPage}
        />
      )}
    </div>
  )
}
