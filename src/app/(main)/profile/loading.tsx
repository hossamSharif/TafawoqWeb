export default function ProfileLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Profile header skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-20 w-20 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="h-7 w-48 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-64 bg-gray-100 rounded" />
          </div>
          <div className="h-10 w-24 bg-gray-200 rounded" />
        </div>

        {/* Profile stats */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <div className="h-8 w-16 bg-gray-300 rounded mx-auto mb-2" />
              <div className="h-4 w-24 bg-gray-200 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-28 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>

      {/* Content area skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 bg-gray-200 rounded" />
              <div className="flex-1">
                <div className="h-5 w-48 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-32 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-5/6 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
