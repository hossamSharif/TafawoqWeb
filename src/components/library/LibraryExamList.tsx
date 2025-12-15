'use client'

import { useState } from 'react'
import { LayoutGrid, List, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LibraryExamCard } from './LibraryExamCard'
import { LibraryEmptyState } from './LibraryEmptyState'
import type { LibraryExam } from '@/types/library'
import { cn } from '@/lib/utils'

interface LibraryExamListProps {
  exams: LibraryExam[]
  hasMore?: boolean
  isLoading?: boolean
  onLoadMore?: () => void
}

export function LibraryExamList({
  exams,
  hasMore = false,
  isLoading = false,
  onLoadMore,
}: LibraryExamListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  if (exams.length === 0 && !isLoading) {
    return <LibraryEmptyState />
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex justify-end">
        <div className="flex items-center border rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('grid')}
            className={cn(
              'h-8 w-8 p-0',
              viewMode === 'grid' && 'bg-accent'
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="sr-only">عرض شبكي</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('list')}
            className={cn(
              'h-8 w-8 p-0',
              viewMode === 'list' && 'bg-accent'
            )}
          >
            <List className="w-4 h-4" />
            <span className="sr-only">عرض قائمة</span>
          </Button>
        </div>
      </div>

      {/* Exams Grid/List */}
      <div
        className={cn(
          viewMode === 'grid'
            ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
            : 'flex flex-col gap-4'
        )}
      >
        {exams.map((exam) => (
          <LibraryExamCard key={exam.postId} exam={exam} />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري التحميل...
              </>
            ) : (
              'تحميل المزيد'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
