'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ReviewFilters } from '@/components/results/ReviewFilters'
import type { ReviewFiltersProps } from '@/components/results/ReviewFilters'

export interface FilterBottomSheetProps extends ReviewFiltersProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * FilterBottomSheet - Mobile-optimized filter sheet
 * Wraps ReviewFilters component in a bottom sheet for mobile devices
 */
export function FilterBottomSheet({
  isOpen,
  onOpenChange,
  filters,
  availableCategories,
  activeFilterCount,
  onStatusChange,
  onCategoryToggle,
  onDifficultyToggle,
  onSortChange,
  onReset,
}: FilterBottomSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto" dir="rtl">
        <SheetHeader className="text-right mb-4">
          <SheetTitle className="flex items-center justify-between">
            <span>تصفية الأسئلة</span>
            {activeFilterCount > 0 && (
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
                {activeFilterCount}
              </div>
            )}
          </SheetTitle>
        </SheetHeader>

        <ReviewFilters
          filters={filters}
          availableCategories={availableCategories}
          activeFilterCount={activeFilterCount}
          onStatusChange={onStatusChange}
          onCategoryToggle={onCategoryToggle}
          onDifficultyToggle={onDifficultyToggle}
          onSortChange={onSortChange}
          onReset={onReset}
          className="border-0 shadow-none"
        />
      </SheetContent>
    </Sheet>
  )
}

export default FilterBottomSheet
