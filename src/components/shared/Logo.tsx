'use client'

import Image from 'next/image'
import Link from 'next/link'
import { brand } from '@/lib/brand'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
  href?: string
  variant?: 'default' | 'light' | 'dark'
}

const sizeMap = {
  sm: { logo: 32, text: 'text-lg' },
  md: { logo: 48, text: 'text-xl' },
  lg: { logo: 64, text: 'text-2xl' },
  xl: { logo: 80, text: 'text-3xl' },
}

export function Logo({
  size = 'md',
  showText = true,
  className,
  href = '/',
  variant = 'default',
}: LogoProps) {
  const { logo, text } = sizeMap[size]

  const textColorClass = {
    default: 'text-foreground',
    light: 'text-white',
    dark: 'text-slate-900',
  }[variant]

  const content = (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative" style={{ width: logo, height: logo }}>
        <Image
          src="/logo.svg"
          alt={brand.name.full}
          width={logo}
          height={logo}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={cn('font-bold', text, textColorClass)}>
            {brand.name.arabic}
          </span>
          <span
            className={cn(
              'text-xs font-medium',
              variant === 'light' ? 'text-white/80' : 'text-muted-foreground'
            )}
          >
            {brand.tagline.secondary}
          </span>
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="hover:opacity-90 transition-opacity">
        {content}
      </Link>
    )
  }

  return content
}
