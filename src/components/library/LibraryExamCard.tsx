'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import { FileText, Users, CheckCircle2, Clock, BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { LibraryExam } from '@/types/library'
import { cn } from '@/lib/utils'

interface LibraryExamCardProps {
  exam: LibraryExam
  showAccessStatus?: boolean
}

export function LibraryExamCard({ exam, showAccessStatus = true }: LibraryExamCardProps) {
  const timeAgo = formatDistanceToNow(new Date(exam.createdAt), {
    addSuffix: true,
    locale: ar,
  })

  const sectionLabel = exam.section === 'verbal'
    ? 'لفظي'
    : exam.section === 'quantitative'
    ? 'كمي'
    : 'مختلط'

  const sectionColor = exam.section === 'verbal'
    ? 'bg-blue-100 text-blue-700'
    : exam.section === 'quantitative'
    ? 'bg-purple-100 text-purple-700'
    : 'bg-gray-100 text-gray-700'

  return (
    <Link href={`/library/${exam.postId}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-4">
          {/* Header with section badge */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <Badge variant="secondary" className={cn('text-xs', sectionColor)}>
              {sectionLabel}
            </Badge>
            {showAccessStatus && (
              <>
                {exam.userCompleted ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    مكتمل
                  </Badge>
                ) : exam.userHasAccess ? (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs gap-1">
                    <BookOpen className="w-3 h-3" />
                    متاح
                  </Badge>
                ) : null}
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-foreground line-clamp-2 mb-2 min-h-[2.5rem]">
            {exam.title}
          </h3>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {exam.questionCount} سؤال
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {exam.completionCount} إكمال
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">
              {exam.creator.displayName || 'مستخدم مجهول'}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
