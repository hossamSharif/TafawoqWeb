'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg">
      {/* Icon placeholder */}
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />

      <div className="flex-1 space-y-2">
        {/* Title */}
        <Skeleton className="h-4 w-3/4" />
        {/* Description */}
        <Skeleton className="h-3 w-full" />
        {/* Time */}
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

export function NotificationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <NotificationSkeleton key={i} />
      ))}
    </div>
  )
}
