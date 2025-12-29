export default function LibraryLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Filter tabs skeleton */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>

      {/* Exam cards grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            {/* Title */}
            <div className="h-6 w-full bg-gray-200 rounded mb-3" />
            <div className="h-4 w-3/4 bg-gray-200 rounded mb-4" />

            {/* Metadata */}
            <div className="flex items-center gap-4 mb-4">
              <div className="h-4 w-20 bg-gray-100 rounded" />
              <div className="h-4 w-24 bg-gray-100 rounded" />
            </div>

            {/* Creator info */}
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 bg-gray-200 rounded-full" />
              <div className="h-4 w-32 bg-gray-200 rounded" />
            </div>

            {/* Action button */}
            <div className="h-10 w-full bg-gray-300 rounded" />
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex justify-center gap-2 mt-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  )
}
