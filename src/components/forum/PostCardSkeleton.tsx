'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface PostCardSkeletonProps {
  isCompact?: boolean
}

export function PostCardSkeleton({ isCompact = false }: PostCardSkeletonProps) {
  return (
    <Card>
      <CardContent className={isCompact ? 'p-3' : 'p-4'}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />

            {/* Author & Time */}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>

          {/* Badge placeholder */}
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        {/* Content */}
        <div className="mt-3 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          {!isCompact && (
            <>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          {/* Reactions */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
