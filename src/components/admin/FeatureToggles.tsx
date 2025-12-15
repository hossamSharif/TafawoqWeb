'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Loader2, MessageSquare, Gift, Bell, Share2, FileText } from 'lucide-react'
import type { FeatureToggle } from '@/lib/admin/types'

interface FeatureTogglesProps {
  features: FeatureToggle[]
  onToggle: (featureName: string, isEnabled: boolean) => Promise<void>
  isLoading?: boolean
}

const FEATURE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  forum_enabled: MessageSquare,
  forum_posting_enabled: FileText,
  forum_sharing_enabled: Share2,
  rewards_enabled: Gift,
  notifications_enabled: Bell,
}

const FEATURE_DESCRIPTIONS: Record<string, { title: string; description: string }> = {
  forum_enabled: {
    title: 'المنتدى',
    description: 'تفعيل أو تعطيل الوصول إلى المنتدى للمستخدمين',
  },
  forum_posting_enabled: {
    title: 'النشر في المنتدى',
    description: 'السماح للمستخدمين بإنشاء منشورات جديدة',
  },
  forum_sharing_enabled: {
    title: 'مشاركة الاختبارات',
    description: 'السماح للمستخدمين بمشاركة اختباراتهم في المنتدى',
  },
  rewards_enabled: {
    title: 'نظام المكافآت',
    description: 'تفعيل نظام المكافآت والرصيد للمستخدمين',
  },
  notifications_enabled: {
    title: 'الإشعارات',
    description: 'تفعيل إشعارات المنتدى للمستخدمين',
  },
}

export function FeatureToggles({ features, onToggle, isLoading }: FeatureTogglesProps) {
  const [loadingFeature, setLoadingFeature] = useState<string | null>(null)

  const handleToggle = async (featureName: string, isEnabled: boolean) => {
    setLoadingFeature(featureName)
    try {
      await onToggle(featureName, isEnabled)
    } finally {
      setLoadingFeature(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {features.map((feature) => {
        const Icon = FEATURE_ICONS[feature.feature_name] || MessageSquare
        const info = FEATURE_DESCRIPTIONS[feature.feature_name] || {
          title: feature.feature_name,
          description: feature.description || '',
        }
        const isToggling = loadingFeature === feature.feature_name

        return (
          <Card key={feature.feature_name}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${feature.is_enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`h-5 w-5 ${feature.is_enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{info.title}</CardTitle>
                    <CardDescription className="text-sm mt-0.5">
                      {info.description}
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isToggling && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  <div className="flex items-center gap-2">
                    <Switch
                      id={feature.feature_name}
                      checked={feature.is_enabled}
                      onCheckedChange={(checked: boolean) =>
                        handleToggle(feature.feature_name, checked)
                      }
                      disabled={isToggling}
                    />
                    <Label
                      htmlFor={feature.feature_name}
                      className={`text-sm ${
                        feature.is_enabled ? 'text-green-600' : 'text-muted-foreground'
                      }`}
                    >
                      {feature.is_enabled ? 'مفعل' : 'معطل'}
                    </Label>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        )
      })}
    </div>
  )
}
