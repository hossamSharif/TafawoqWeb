'use client'

import { cn } from '@/lib/utils'
import { getScoreColor, getScoreLabel, SCORE_TIERS } from '@/lib/utils/scoring'

interface ScoreDisplayProps {
  score: number
  label?: string
  sublabel?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showTier?: boolean
  animated?: boolean
  className?: string
}

const SIZE_CONFIG = {
  sm: {
    container: 'w-16 h-16',
    scoreText: 'text-lg',
    labelText: 'text-[10px]',
    strokeWidth: 4,
    radius: 22,
  },
  md: {
    container: 'w-24 h-24',
    scoreText: 'text-xl',
    labelText: 'text-xs',
    strokeWidth: 6,
    radius: 34,
  },
  lg: {
    container: 'w-32 h-32',
    scoreText: 'text-3xl',
    labelText: 'text-sm',
    strokeWidth: 8,
    radius: 46,
  },
  xl: {
    container: 'w-40 h-40',
    scoreText: 'text-4xl',
    labelText: 'text-sm',
    strokeWidth: 10,
    radius: 58,
  },
}

/**
 * Circular score display with animated progress ring and color coding
 */
export function ScoreDisplay({
  score,
  label,
  sublabel,
  size = 'lg',
  showTier = true,
  animated = true,
  className,
}: ScoreDisplayProps) {
  const config = SIZE_CONFIG[size]
  const circumference = 2 * Math.PI * config.radius
  const strokeDashoffset = circumference - (score / 100) * circumference
  const color = getScoreColor(score)
  const tierLabel = showTier ? getScoreLabel(score) : null

  return (
    <div className={cn('relative', config.container, className)}>
      <svg className="w-full h-full transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="50%"
          cy="50%"
          r={`${(config.radius / (size === 'xl' ? 80 : size === 'lg' ? 64 : size === 'md' ? 48 : 32)) * 100}%`}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={config.strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx="50%"
          cy="50%"
          r={`${(config.radius / (size === 'xl' ? 80 : size === 'lg' ? 64 : size === 'md' ? 48 : 32)) * 100}%`}
          fill="none"
          stroke={color}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn(animated && 'transition-all duration-1000 ease-out')}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn('font-bold', config.scoreText)}
          style={{ color }}
        >
          {score}%
        </span>
        {(label || tierLabel) && (
          <span className={cn('text-gray-600 text-center', config.labelText)}>
            {label || tierLabel}
          </span>
        )}
        {sublabel && (
          <span className={cn('text-gray-400 text-center', 'text-[10px]')}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  )
}

interface ScoreBarProps {
  score: number
  label: string
  sublabel?: string
  showPercentage?: boolean
  className?: string
}

/**
 * Horizontal progress bar with score and label
 */
export function ScoreBar({
  score,
  label,
  sublabel,
  showPercentage = true,
  className,
}: ScoreBarProps) {
  const color = getScoreColor(score)

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {showPercentage && (
          <span className="text-sm text-gray-500">
            {sublabel && `${sublabel} • `}{score}%
          </span>
        )}
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${score}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  )
}

interface ScoreComparisonProps {
  current: number
  previous?: number
  label: string
  size?: 'sm' | 'md'
}

/**
 * Score display with optional comparison to previous score
 */
export function ScoreComparison({
  current,
  previous,
  label,
  size = 'md',
}: ScoreComparisonProps) {
  const color = getScoreColor(current)
  const diff = previous !== undefined ? current - previous : null
  const diffColor = diff !== null
    ? diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-500'
    : ''

  return (
    <div className="text-center">
      <div
        className={cn(
          'font-bold mb-1',
          size === 'sm' ? 'text-2xl' : 'text-4xl'
        )}
        style={{ color }}
      >
        {current}%
      </div>
      <div className="text-gray-600 text-sm">{label}</div>
      {diff !== null && (
        <div className={cn('text-xs mt-1', diffColor)}>
          {diff > 0 && '+'}
          {diff}% من السابق
        </div>
      )}
    </div>
  )
}

interface ScoreGridProps {
  scores: {
    value: number
    label: string
    sublabel?: string
  }[]
  size?: 'sm' | 'md' | 'lg'
  columns?: 2 | 3 | 4
  className?: string
}

/**
 * Grid layout for multiple score displays
 */
export function ScoreGrid({
  scores,
  size = 'md',
  columns = 3,
  className,
}: ScoreGridProps) {
  return (
    <div
      className={cn(
        'grid gap-6',
        columns === 2 && 'grid-cols-2',
        columns === 3 && 'grid-cols-3',
        columns === 4 && 'grid-cols-4',
        className
      )}
    >
      {scores.map((score, index) => (
        <div key={index} className="flex flex-col items-center">
          <ScoreDisplay
            score={score.value}
            label={score.label}
            sublabel={score.sublabel}
            size={size}
          />
        </div>
      ))}
    </div>
  )
}

export default ScoreDisplay
