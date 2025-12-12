'use client'

import { User, Mail, BookOpen, Crown, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileHeaderProps {
  email: string
  academicTrack: 'scientific' | 'literary'
  subscriptionTier: 'free' | 'premium'
  memberSince: string
  className?: string
}

export function ProfileHeader({
  email,
  academicTrack,
  subscriptionTier,
  memberSince,
  className,
}: ProfileHeaderProps) {
  const trackLabel = academicTrack === 'scientific' ? 'علمي' : 'أدبي'
  const tierLabel = subscriptionTier === 'premium' ? 'مميز' : 'مجاني'

  return (
    <div className={cn('bg-white rounded-xl shadow-sm', className)}>
      {/* Header Section */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">الملف الشخصي</h1>
            <p className="text-gray-500 text-sm">{email}</p>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Email */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">البريد الإلكتروني</p>
              <p className="font-medium text-sm truncate" title={email}>
                {email}
              </p>
            </div>
          </div>

          {/* Academic Track */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <BookOpen className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">المسار الأكاديمي</p>
              <p className="font-medium text-sm">{trackLabel}</p>
            </div>
          </div>

          {/* Subscription */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Crown
              className={cn(
                'w-5 h-5 flex-shrink-0',
                subscriptionTier === 'premium' ? 'text-yellow-500' : 'text-gray-400'
              )}
            />
            <div>
              <p className="text-xs text-gray-500">الاشتراك</p>
              <p
                className={cn(
                  'font-medium text-sm',
                  subscriptionTier === 'premium' && 'text-yellow-600'
                )}
              >
                {tierLabel}
              </p>
            </div>
          </div>

          {/* Member Since */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">عضو منذ</p>
              <p className="font-medium text-sm">{memberSince}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
