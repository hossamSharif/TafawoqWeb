'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  MessageSquare,
  FileText,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Trash2,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { REPORT_REASON_LABELS } from '@/lib/admin/types'
import type { ReportWithContent, ModerationAction, ReportReason } from '@/lib/admin/types'

interface ModerationQueueProps {
  reports: ReportWithContent[]
  onResolve: (reportId: string, action: ModerationAction, notes?: string) => Promise<void>
  isLoading?: boolean
}

export function ModerationQueue({ reports, onResolve, isLoading }: ModerationQueueProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [resolveDialog, setResolveDialog] = useState<{
    open: boolean
    reportId: string
    action: ModerationAction
  } | null>(null)
  const [notes, setNotes] = useState('')

  const handleResolve = async (reportId: string, action: ModerationAction) => {
    setActionLoading(reportId)
    try {
      await onResolve(reportId, action, notes)
    } finally {
      setActionLoading(null)
      setResolveDialog(null)
      setNotes('')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getReasonLabel = (reason: ReportReason) => {
    return REPORT_REASON_LABELS[reason] || reason
  }

  const getReasonBadgeColor = (reason: ReportReason) => {
    switch (reason) {
      case 'harassment':
        return 'bg-red-100 text-red-700'
      case 'spam':
        return 'bg-amber-100 text-amber-700'
      case 'inappropriate_content':
        return 'bg-orange-100 text-orange-700'
      case 'misinformation':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-lg font-medium">لا توجد بلاغات معلقة</h3>
        <p className="text-muted-foreground mt-1">
          جميع البلاغات تمت مراجعتها
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50 pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {report.content_type === 'post' ? (
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <span className="font-medium">
                      {report.content_type === 'post' ? 'منشور' : 'تعليق'}
                    </span>
                    <span className="text-muted-foreground text-sm mr-2">
                      بواسطة {report.content_author.display_name}
                    </span>
                  </div>
                </div>
                <Badge className={getReasonBadgeColor(report.reason)}>
                  {getReasonLabel(report.reason)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              {/* Content Preview */}
              <div className="bg-muted/30 rounded-lg p-4 mb-4">
                <p className="text-sm">{report.content_preview}</p>
              </div>

              {/* Report Details */}
              {report.details && (
                <div className="mb-4">
                  <span className="text-sm font-medium">تفاصيل البلاغ:</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {report.details}
                  </p>
                </div>
              )}

              {/* Reporter Info */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>أبلغ بواسطة: {report.reporter.display_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(report.created_at)}</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="bg-muted/30 gap-2">
              {/* Approve */}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setResolveDialog({
                    open: true,
                    reportId: report.id,
                    action: 'approve',
                  })
                }
                disabled={actionLoading === report.id}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4 text-green-600" />
                موافق
              </Button>

              {/* Delete Content */}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setResolveDialog({
                    open: true,
                    reportId: report.id,
                    action: 'delete_content',
                  })
                }
                disabled={actionLoading === report.id}
                className="gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                حذف المحتوى
              </Button>

              {/* Dismiss */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setResolveDialog({
                    open: true,
                    reportId: report.id,
                    action: 'dismiss',
                  })
                }
                disabled={actionLoading === report.id}
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                رفض البلاغ
              </Button>

              {actionLoading === report.id && (
                <Loader2 className="h-4 w-4 animate-spin mr-auto" />
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Resolve Dialog */}
      <AlertDialog
        open={resolveDialog?.open}
        onOpenChange={(open) => !open && setResolveDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {resolveDialog?.action === 'approve' && 'الموافقة على المحتوى'}
              {resolveDialog?.action === 'delete_content' && 'حذف المحتوى'}
              {resolveDialog?.action === 'dismiss' && 'رفض البلاغ'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {resolveDialog?.action === 'approve' &&
                'سيتم الإبقاء على المحتوى وإغلاق البلاغ.'}
              {resolveDialog?.action === 'delete_content' &&
                'سيتم حذف المحتوى المبلغ عنه وإشعار صاحب البلاغ.'}
              {resolveDialog?.action === 'dismiss' &&
                'سيتم رفض البلاغ كغير صحيح.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium">ملاحظات (اختياري)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أضف ملاحظات للسجل..."
              className="mt-2"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                resolveDialog &&
                handleResolve(resolveDialog.reportId, resolveDialog.action)
              }
              className={
                resolveDialog?.action === 'delete_content'
                  ? 'bg-red-600 hover:bg-red-700'
                  : ''
              }
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'تأكيد'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
