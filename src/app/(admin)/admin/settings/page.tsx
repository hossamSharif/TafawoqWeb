'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { FeatureToggles } from '@/components/admin/FeatureToggles'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import type { FeatureToggle } from '@/lib/admin/types'

interface SettingsResponse {
  features: FeatureToggle[]
}

export default function AdminSettingsPage() {
  const [features, setFeatures] = useState<FeatureToggle[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/settings')
      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }
      const data: SettingsResponse = await response.json()
      setFeatures(data.features)
    } catch (error) {
      console.error('Failed to load settings:', error)
      toast.error('فشل في تحميل الإعدادات')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleToggle = async (featureName: string, isEnabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/settings/${featureName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: isEnabled }),
      })

      if (!response.ok) {
        throw new Error('Failed to update setting')
      }

      // Update local state
      setFeatures((prev) =>
        prev.map((f) =>
          f.feature_name === featureName ? { ...f, is_enabled: isEnabled } : f
        )
      )

      toast.success(
        isEnabled ? `تم تفعيل ${featureName}` : `تم تعطيل ${featureName}`
      )
    } catch (error) {
      console.error('Failed to update setting:', error)
      toast.error('فشل في تحديث الإعداد')
      throw error
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">الإعدادات</h1>
          <p className="text-muted-foreground">
            إدارة ميزات المنصة
          </p>
        </div>
        <Button variant="outline" onClick={fetchSettings}>
          <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Feature Toggles */}
      <div>
        <h2 className="text-lg font-semibold mb-4">الميزات</h2>
        <FeatureToggles
          features={features}
          onToggle={handleToggle}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
