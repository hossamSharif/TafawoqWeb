'use client'

import * as React from 'react'
import { Eye, EyeOff, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getPasswordStrength, type PasswordStrength } from '@/lib/utils/password'

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  showStrength?: boolean
  showRequirements?: boolean
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showStrength = false, showRequirements = false, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [strength, setStrength] = React.useState<PasswordStrength | null>(null)
    const value = props.value as string

    React.useEffect(() => {
      if ((showStrength || showRequirements) && value) {
        setStrength(getPasswordStrength(value))
      } else {
        setStrength(null)
      }
    }, [value, showStrength, showRequirements])

    const strengthColors: Record<PasswordStrength['color'], string> = {
      red: 'bg-red-500',
      orange: 'bg-orange-500',
      yellow: 'bg-yellow-500',
      lime: 'bg-lime-500',
      green: 'bg-green-500',
    }

    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            className={cn('pl-10', className)}
            ref={ref}
            {...props}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="sr-only">
              {showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            </span>
          </Button>
        </div>

        {/* Password Strength Indicator */}
        {showStrength && strength && value && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    index <= strength.score
                      ? strengthColors[strength.color]
                      : 'bg-muted'
                  )}
                />
              ))}
            </div>
            <p
              className={cn(
                'text-xs font-medium',
                strength.color === 'red' && 'text-red-500',
                strength.color === 'orange' && 'text-orange-500',
                strength.color === 'yellow' && 'text-yellow-500',
                strength.color === 'lime' && 'text-lime-500',
                strength.color === 'green' && 'text-green-500'
              )}
            >
              قوة كلمة المرور: {strength.label}
            </p>
          </div>
        )}

        {/* Password Requirements */}
        {showRequirements && strength && (
          <ul className="space-y-1 text-xs">
            {strength.requirements.map((req, index) => (
              <li
                key={index}
                className={cn(
                  'flex items-center gap-2',
                  req.met ? 'text-green-600' : 'text-muted-foreground'
                )}
              >
                {req.met ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                {req.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
)
PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
