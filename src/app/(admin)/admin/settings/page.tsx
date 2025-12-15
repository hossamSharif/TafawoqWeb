'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { FeatureToggles } from '@/components/admin/FeatureToggles'
import { MaintenanceToggle } from '@/components/admin/MaintenanceToggle'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import type { FeatureToggle } from '@/lib/admin/types'

interface SettingsResponse {
  features: FeatureToggle[]
}

export default function AdminSettingsPage() {
  const [features, setFeatures] = useState<FeatureToggle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [maintenanceKey, setMaintenanceKey] = useState(0)

  const fetchSettings = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/settings')
      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }
      const data: SettingsResponse = await response.json()
      // Filter out maintenance_mode from regular features as it has its own component
      setFeatures(data.features.filter(f => f.feature_name !== 'maintenance_mode'))
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

  const handleRefresh = () => {
    fetchSettings()
    // Force MaintenanceToggle to refetch its status
    setMaintenanceKey(prev => prev + 1)
  }

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">الإعدادات</h1>
          <p className="text-muted-foreground">
            إدارة ميزات المنصة ووضع الصيانة
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Maintenance Mode Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">وضع الصيانة</h2>
        <MaintenanceToggle key={maintenanceKey} />
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
