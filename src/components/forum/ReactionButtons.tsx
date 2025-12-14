'use client'

import { ThumbsUp, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { UserReaction } from '@/lib/forum/types'
import { cn } from '@/lib/utils'

interface ReactionButtonsProps {
  likeCount: number
  loveCount: number
  userReaction: UserReaction
  onReaction: (type: 'like' | 'love') => void
  disabled?: boolean
  size?: 'sm' | 'default'
}

export function ReactionButtons({
  likeCount,
  loveCount,
  userReaction,
  onReaction,
  disabled = false,
  size = 'default',
}: ReactionButtonsProps) {
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  const buttonPadding = size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5'
  const fontSize = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <div className="flex items-center gap-2">
      {/* Like Button */}
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => onReaction('like')}
        className={cn(
          'gap-1.5 h-auto',
          buttonPadding,
          fontSize,
          userReaction.like
            ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700'
            : 'text-muted-foreground hover:text-blue-600 hover:bg-blue-50'
        )}
      >
        <ThumbsUp
          className={cn(
            iconSize,
            userReaction.like && 'fill-current'
          )}
        />
        <span>{likeCount > 0 ? likeCount : ''}</span>
        {likeCount === 0 && <span>إعجاب</span>}
      </Button>

      {/* Love Button */}
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => onReaction('love')}
        className={cn(
          'gap-1.5 h-auto',
          buttonPadding,
          fontSize,
          userReaction.love
            ? 'text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-600'
            : 'text-muted-foreground hover:text-red-500 hover:bg-red-50'
        )}
      >
        <Heart
          className={cn(
            iconSize,
            userReaction.love && 'fill-current'
          )}
        />
        <span>{loveCount > 0 ? loveCount : ''}</span>
        {loveCount === 0 && <span>حب</span>}
      </Button>
    </div>
  )
}
