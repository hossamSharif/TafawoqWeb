'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  Loader2,
  Wrench,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { DEFAULT_MAINTENANCE_MESSAGE } from '@/types'

interface MaintenanceStatus {
  enabled: boolean
  message: string | null
  enabledAt: string | null
  enabledBy: string | null
}

interface MaintenanceLog {
  id: string
  adminId: string
  adminName?: string
  action: 'enabled' | 'disabled'
  message: string | null
  createdAt: string
}

interface MaintenanceToggleProps {
  initialStatus?: MaintenanceStatus
  onStatusChange?: (status: MaintenanceStatus) => void
}

export function MaintenanceToggle({ initialStatus, onStatusChange }: MaintenanceToggleProps) {
  const [status, setStatus] = useState<MaintenanceStatus | null>(initialStatus || null)
  const [customMessage, setCustomMessage] = useState('')
  const [isLoading, setIsLoading] = useState(!initialStatus)
  const [isToggling, setIsToggling] = useState(false)
  const [recentLogs, setRecentLogs] = useState<MaintenanceLog[]>([])
  const [showLogs, setShowLogs] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/maintenance')
      if (!response.ok) {
        throw new Error('Failed to fetch maintenance status')
      }
      const data: MaintenanceStatus = await response.json()
      setStatus(data)
      if (data.message) {
        setCustomMessage(data.message)
      }
    } catch (error) {
      console.error('Failed to fetch maintenance status:', error)
      toast.error('فشل في تحميل حالة الصيانة')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/maintenance?logs=true')
      if (!response.ok) {
        throw new Error('Failed to fetch maintenance logs')
      }
      const data = await response.json()
      setRecentLogs(data.logs || [])
    } catch (error) {
      console.error('Failed to fetch maintenance logs:', error)
    }
  }, [])

  useEffect(() => {
    if (!initialStatus) {
      fetchStatus()
    }
  }, [fetchStatus, initialStatus])

  useEffect(() => {
    if (showLogs) {
      fetchLogs()
    }
  }, [showLogs, fetchLogs])

  const handleToggle = async (enabled: boolean) => {
    setIsToggling(true)
    try {
      const response = await fetch('/api/admin/maintenance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          message: enabled ? (customMessage || DEFAULT_MAINTENANCE_MESSAGE.ar) : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update maintenance mode')
      }

      const updatedStatus: MaintenanceStatus = await response.json()
      setStatus(updatedStatus)
      onStatusChange?.(updatedStatus)

      toast.success(
        enabled
          ? 'تم تفعيل وضع الصيانة'
          : 'تم تعطيل وضع الصيانة',
        {
          description: enabled
            ? 'العمليات الكتابية محجوبة الآن'
            : 'تم استعادة جميع العمليات',
        }
      )

      // Refresh logs if visible
      if (showLogs) {
        fetchLogs()
      }
    } catch (error) {
      console.error('Failed to toggle maintenance mode:', error)
      toast.error('فشل في تحديث وضع الصيانة')
    } finally {
      setIsToggling(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className={status?.enabled ? 'border-amber-300 bg-amber-50' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${status?.enabled ? 'bg-amber-100' : 'bg-muted'}`}>
                <Wrench className={`h-5 w-5 ${status?.enabled ? 'text-amber-600' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <CardTitle className="text-base">وضع الصيانة</CardTitle>
                <CardDescription className="text-sm mt-0.5">
                  {status?.enabled
                    ? 'النظام في وضع الصيانة - العمليات الكتابية محجوبة'
                    : 'النظام يعمل بشكل طبيعي'}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isToggling && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <div className="flex items-center gap-2">
                <Switch
                  id="maintenance-mode"
                  checked={status?.enabled || false}
                  onCheckedChange={handleToggle}
                  disabled={isToggling}
                />
                <Label
                  htmlFor="maintenance-mode"
                  className={`text-sm ${
                    status?.enabled ? 'text-amber-600 font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {status?.enabled ? 'مفعل' : 'معطل'}
                </Label>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status Info */}
          {status?.enabled && status.enabledAt && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-100 p-3 rounded-lg">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                تم تفعيل وضع الصيانة في {formatDate(status.enabledAt)}
                {status.enabledBy && ` بواسطة ${status.enabledBy}`}
              </span>
            </div>
          )}

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="maintenance-message">رسالة الصيانة</Label>
            <Textarea
              id="maintenance-message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={DEFAULT_MAINTENANCE_MESSAGE.ar}
              rows={2}
              dir="rtl"
              disabled={status?.enabled}
              className={status?.enabled ? 'bg-muted' : ''}
            />
            <p className="text-xs text-muted-foreground">
              سيتم عرض هذه الرسالة للمستخدمين عند محاولة القيام بعمليات محجوبة
            </p>
          </div>

          {/* Blocked Operations List */}
          <div className="space-y-2">
            <Label>العمليات المحجوبة أثناء الصيانة</Label>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                <div className={`w-2 h-2 rounded-full ${status?.enabled ? 'bg-red-500' : 'bg-green-500'}`} />
                <span>توليد الاختبارات</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                <div className={`w-2 h-2 rounded-full ${status?.enabled ? 'bg-red-500' : 'bg-green-500'}`} />
                <span>إنشاء التمارين</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                <div className={`w-2 h-2 rounded-full ${status?.enabled ? 'bg-red-500' : 'bg-green-500'}`} />
                <span>الاشتراكات</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                <div className={`w-2 h-2 rounded-full ${status?.enabled ? 'bg-red-500' : 'bg-green-500'}`} />
                <span>مشاركة المحتوى</span>
              </div>
            </div>
          </div>

          {/* Toggle Logs Section */}
          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLogs(!showLogs)}
              className="text-muted-foreground"
            >
              <Clock className="h-4 w-4 ml-2" />
              {showLogs ? 'إخفاء السجل' : 'عرض سجل الصيانة'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Logs */}
      {showLogs && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">سجل الصيانة</CardTitle>
            <CardDescription>آخر التغييرات على وضع الصيانة</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">لا توجد سجلات</p>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className={`p-1.5 rounded-full ${
                      log.action === 'enabled' ? 'bg-amber-100' : 'bg-green-100'
                    }`}>
                      {log.action === 'enabled' ? (
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {log.action === 'enabled' ? 'تفعيل وضع الصيانة' : 'تعطيل وضع الصيانة'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.adminName || 'مسؤول'} - {formatDate(log.createdAt)}
                      </p>
                      {log.message && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          &quot;{log.message}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
