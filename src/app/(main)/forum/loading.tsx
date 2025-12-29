export default function ForumLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header with create button skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-primary/20 rounded animate-pulse" />
      </div>

      {/* Filter/Sort bar skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Post cards skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            {/* Post header */}
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-24 bg-gray-100 rounded" />
              </div>
            </div>

            {/* Post title and content */}
            <div className="space-y-2 mb-4">
              <div className="h-6 w-full bg-gray-200 rounded" />
              <div className="h-4 w-5/6 bg-gray-100 rounded" />
              <div className="h-4 w-4/6 bg-gray-100 rounded" />
            </div>

            {/* Post metadata */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
              <div className="h-4 w-16 bg-gray-200 rounded" />
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
