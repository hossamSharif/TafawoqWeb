'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Filter, Calendar, BookOpen, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PerformanceFiltersProps {
  dateRange: 'all' | '7d' | '30d' | '90d'
  onDateRangeChange: (range: 'all' | '7d' | '30d' | '90d') => void
  trackFilter: 'all' | 'scientific' | 'literary'
  onTrackFilterChange: (track: 'all' | 'scientific' | 'literary') => void
  scoreRange: [number, number]
  onScoreRangeChange: (range: [number, number]) => void
  className?: string
}

export function PerformanceFilters({
  dateRange,
  onDateRangeChange,
  trackFilter,
  onTrackFilterChange,
  scoreRange,
  onScoreRangeChange,
  className,
}: PerformanceFiltersProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-gray-900">تصفية النتائج</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              الفترة الزمنية
            </Label>
            <Select value={dateRange} onValueChange={onDateRangeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="7d">آخر 7 أيام</SelectItem>
                <SelectItem value="30d">آخر 30 يوماً</SelectItem>
                <SelectItem value="90d">آخر 90 يوماً</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Track Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-gray-500" />
              المسار الأكاديمي
            </Label>
            <Select value={trackFilter} onValueChange={onTrackFilterChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المسارات</SelectItem>
                <SelectItem value="scientific">علمي</SelectItem>
                <SelectItem value="literary">أدبي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Score Range Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-gray-500" />
              نطاق الدرجات: {scoreRange[0]}% - {scoreRange[1]}%
            </Label>
            <div className="pt-2">
              <Slider
                min={0}
                max={100}
                step={5}
                value={scoreRange}
                onValueChange={(value) => onScoreRangeChange(value as [number, number])}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(dateRange !== 'all' || trackFilter !== 'all' || scoreRange[0] !== 0 || scoreRange[1] !== 100) && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500">
              الفلاتر النشطة:{' '}
              {dateRange !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs mr-1">
                  {dateRange === '7d' && 'آخر 7 أيام'}
                  {dateRange === '30d' && 'آخر 30 يوماً'}
                  {dateRange === '90d' && 'آخر 90 يوماً'}
                </span>
              )}
              {trackFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs mr-1">
                  {trackFilter === 'scientific' ? 'علمي' : 'أدبي'}
                </span>
              )}
              {(scoreRange[0] !== 0 || scoreRange[1] !== 100) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs mr-1">
                  {scoreRange[0]}% - {scoreRange[1]}%
                </span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
