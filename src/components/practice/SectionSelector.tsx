'use client'

import { cn } from '@/lib/utils'
import type { QuestionSection } from '@/types/question'

interface SectionSelectorProps {
  value: QuestionSection | null
  onChange: (section: QuestionSection) => void
  disabled?: boolean
}

interface SectionOption {
  id: QuestionSection
  label: string
  description: string
  icon: React.ReactNode
}

const sections: SectionOption[] = [
  {
    id: 'quantitative',
    label: 'القسم الكمي',
    description: 'أسئلة الرياضيات والمنطق الكمي',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-8 w-8"
      >
        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
        <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
        <path d="M9 9h1" />
        <path d="M9 13h6" />
        <path d="M9 17h6" />
      </svg>
    ),
  },
  {
    id: 'verbal',
    label: 'القسم اللفظي',
    description: 'أسئلة اللغة العربية والفهم القرائي',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-8 w-8"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="m8 7 2 2-2 2" />
        <path d="M12 17h4" />
      </svg>
    ),
  },
]

export function SectionSelector({ value, onChange, disabled = false }: SectionSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">اختر القسم</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => onChange(section.id)}
            disabled={disabled}
            className={cn(
              'relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all duration-200',
              'hover:border-primary/50 hover:bg-primary/5',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              value === section.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-gray-200 bg-white text-gray-700',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            {/* Selected indicator */}
            {value === section.id && (
              <div className="absolute top-3 left-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6 w-6 text-primary"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path
                    d="m9 12 2 2 4-4"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
            )}

            {/* Icon */}
            <div
              className={cn(
                'rounded-full p-3',
                value === section.id ? 'bg-primary/20' : 'bg-gray-100'
              )}
            >
              {section.icon}
            </div>

            {/* Label */}
            <span className="text-lg font-semibold">{section.label}</span>

            {/* Description */}
            <span
              className={cn(
                'text-sm text-center',
                value === section.id ? 'text-primary/80' : 'text-gray-500'
              )}
            >
              {section.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default SectionSelector
