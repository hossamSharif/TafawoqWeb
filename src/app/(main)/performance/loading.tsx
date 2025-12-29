import { PageLoadingSkeleton } from '@/components/shared'

export default function PerformanceLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <PageLoadingSkeleton />
      </div>
    </div>
  )
}
