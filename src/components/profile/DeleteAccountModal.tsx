'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2, X, Shield, Calendar, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string
  hasActiveSubscription?: boolean
  onConfirmDelete: (email: string, reason?: string) => Promise<void>
}

const deletionReasons = [
  { id: 'not_using', label: 'لم أعد أستخدم المنصة' },
  { id: 'found_alternative', label: 'وجدت بديل أفضل' },
  { id: 'too_expensive', label: 'الاشتراك مكلف' },
  { id: 'privacy', label: 'مخاوف تتعلق بالخصوصية' },
  { id: 'other', label: 'سبب آخر' },
]

export function DeleteAccountModal({
  isOpen,
  onClose,
  userEmail,
  hasActiveSubscription = false,
  onConfirmDelete,
}: DeleteAccountModalProps) {
  const [step, setStep] = useState<'info' | 'confirm' | 'success'>('info')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [selectedReason, setSelectedReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    if (!isLoading) {
      setStep('info')
      setConfirmEmail('')
      setSelectedReason('')
      setError(null)
      onClose()
    }
  }

  const handleProceedToConfirm = () => {
    setStep('confirm')
    setError(null)
  }

  const handleConfirmDelete = async () => {
    if (confirmEmail.toLowerCase() !== userEmail.toLowerCase()) {
      setError('البريد الإلكتروني غير متطابق')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await onConfirmDelete(confirmEmail, selectedReason || undefined)
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل جدولة حذف الحساب')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-gray-900">حذف الحساب</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'info' && (
            <>
              {/* Warning Banner */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-red-800">تحذير هام</h3>
                    <p className="text-sm text-red-700 mt-1">
                      حذف الحساب عملية لا يمكن التراجع عنها بعد انتهاء فترة السماح.
                    </p>
                  </div>
                </div>
              </div>

              {/* What will be deleted */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">ماذا سيحدث؟</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                    سيتم حذف جميع بياناتك الشخصية
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                    سيتم حذف سجل الاختبارات والتدريبات
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                    سيتم حذف إحصائيات الأداء
                  </li>
                  {hasActiveSubscription && (
                    <li className="flex items-center gap-2 text-yellow-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                      سيتم إلغاء اشتراكك المميز تلقائياً
                    </li>
                  )}
                </ul>
              </div>

              {/* PDPL Compliance Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-blue-800">حماية البيانات</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      وفقاً لنظام حماية البيانات الشخصية (PDPL)، لديك فترة سماح
                      <strong className="mx-1">30 يوماً</strong>
                      لإلغاء طلب الحذف قبل تنفيذه نهائياً.
                    </p>
                  </div>
                </div>
              </div>

              {/* Reason Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ما سبب رغبتك في الحذف؟ (اختياري)
                </label>
                <div className="space-y-2">
                  {deletionReasons.map((reason) => (
                    <button
                      key={reason.id}
                      onClick={() => setSelectedReason(reason.id)}
                      className={cn(
                        'w-full text-right px-4 py-2 rounded-lg border transition-colors',
                        selectedReason === reason.id
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      )}
                    >
                      {reason.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleProceedToConfirm}
                  className="flex-1"
                >
                  متابعة
                </Button>
              </div>
            </>
          )}

          {step === 'confirm' && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">تأكيد الحذف</h3>
                <p className="text-gray-600 text-sm mt-2">
                  للتأكيد، يرجى كتابة بريدك الإلكتروني
                </p>
                <p className="font-mono text-sm bg-gray-100 px-3 py-1 rounded inline-block mt-2">
                  {userEmail}
                </p>
              </div>

              {/* Email Confirmation Input */}
              <div className="mb-6">
                <input
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder="أدخل بريدك الإلكتروني للتأكيد"
                  className={cn(
                    'w-full px-4 py-3 rounded-lg border text-center',
                    error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  )}
                  dir="ltr"
                />
                {error && (
                  <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
                )}
              </div>

              {/* Timeline */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">
                      موعد الحذف النهائي:
                    </p>
                    <p className="font-bold text-gray-900">
                      {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('info')}
                  disabled={isLoading}
                  className="flex-1"
                >
                  رجوع
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  disabled={isLoading || !confirmEmail}
                  className="flex-1 gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري الحذف...
                    </>
                  ) : (
                    'تأكيد الحذف النهائي'
                  )}
                </Button>
              </div>
            </>
          )}

          {step === 'success' && (
            <>
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">تم جدولة الحذف</h3>
                <p className="text-gray-600 mt-2">
                  سيتم حذف حسابك نهائياً بعد 30 يوماً.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  يمكنك إلغاء هذا الطلب من إعدادات الحساب في أي وقت خلال هذه الفترة.
                </p>
              </div>

              <Button onClick={handleClose} className="w-full">
                فهمت
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
