'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  MoreHorizontal,
  Ban,
  UserCheck,
  UserX,
  Key,
  Trash2,
  Shield,
  Crown,
  Loader2,
} from 'lucide-react'
import type { AdminUserInfo } from '@/lib/admin/types'

interface UserTableProps {
  users: AdminUserInfo[]
  onUpdateStatus: (userId: string, updates: { is_disabled?: boolean; is_banned?: boolean }) => Promise<void>
  onResetPassword: (userId: string) => Promise<void>
  onDeleteUser: (userId: string) => Promise<void>
  isLoading?: boolean
}

export function UserTable({
  users,
  onUpdateStatus,
  onResetPassword,
  onDeleteUser,
  isLoading,
}: UserTableProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    type: 'ban' | 'unban' | 'disable' | 'enable' | 'delete' | 'reset'
    userId: string
    userName: string
  } | null>(null)

  const handleAction = async (
    type: 'ban' | 'unban' | 'disable' | 'enable' | 'delete' | 'reset',
    userId: string
  ) => {
    setActionLoading(userId)
    try {
      switch (type) {
        case 'ban':
          await onUpdateStatus(userId, { is_banned: true })
          break
        case 'unban':
          await onUpdateStatus(userId, { is_banned: false })
          break
        case 'disable':
          await onUpdateStatus(userId, { is_disabled: true })
          break
        case 'enable':
          await onUpdateStatus(userId, { is_disabled: false })
          break
        case 'delete':
          await onDeleteUser(userId)
          break
        case 'reset':
          await onResetPassword(userId)
          break
      }
    } finally {
      setActionLoading(null)
      setConfirmDialog(null)
    }
  }

  const getStatusBadge = (user: AdminUserInfo) => {
    if (user.is_banned) {
      return <Badge variant="destructive">محظور</Badge>
    }
    if (user.is_disabled) {
      return <Badge variant="secondary">معطل</Badge>
    }
    return <Badge variant="outline" className="text-green-600 border-green-600">نشط</Badge>
  }

  const getSubscriptionBadge = (tier: string) => {
    if (tier === 'premium') {
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
          <Crown className="h-3 w-3 ml-1" />
          مميز
        </Badge>
      )
    }
    return <Badge variant="outline">مجاني</Badge>
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        لا يوجد مستخدمين
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">المستخدم</TableHead>
              <TableHead className="text-right">البريد الإلكتروني</TableHead>
              <TableHead className="text-right">المسار</TableHead>
              <TableHead className="text-right">الاشتراك</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">تاريخ التسجيل</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.display_name}</span>
                    {user.is_admin && (
                      <span title="مسؤول">
                        <Shield className="h-4 w-4 text-primary" />
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.email}
                </TableCell>
                <TableCell>
                  {user.academic_track === 'scientific' && 'علمي'}
                  {user.academic_track === 'literary' && 'أدبي'}
                  {user.academic_track === 'unknown' && '-'}
                </TableCell>
                <TableCell>{getSubscriptionBadge(user.subscription_tier)}</TableCell>
                <TableCell>{getStatusBadge(user)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(user.created_at)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={actionLoading === user.id || user.is_admin}
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* Ban/Unban */}
                      {user.is_banned ? (
                        <DropdownMenuItem
                          onClick={() =>
                            setConfirmDialog({
                              open: true,
                              type: 'unban',
                              userId: user.id,
                              userName: user.display_name,
                            })
                          }
                        >
                          <UserCheck className="h-4 w-4 ml-2" />
                          إلغاء الحظر
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() =>
                            setConfirmDialog({
                              open: true,
                              type: 'ban',
                              userId: user.id,
                              userName: user.display_name,
                            })
                          }
                          className="text-amber-600"
                        >
                          <Ban className="h-4 w-4 ml-2" />
                          حظر من المنتدى
                        </DropdownMenuItem>
                      )}

                      {/* Enable/Disable */}
                      {user.is_disabled ? (
                        <DropdownMenuItem
                          onClick={() =>
                            setConfirmDialog({
                              open: true,
                              type: 'enable',
                              userId: user.id,
                              userName: user.display_name,
                            })
                          }
                        >
                          <UserCheck className="h-4 w-4 ml-2" />
                          تفعيل الحساب
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() =>
                            setConfirmDialog({
                              open: true,
                              type: 'disable',
                              userId: user.id,
                              userName: user.display_name,
                            })
                          }
                        >
                          <UserX className="h-4 w-4 ml-2" />
                          تعطيل الحساب
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      {/* Reset Password */}
                      <DropdownMenuItem
                        onClick={() =>
                          setConfirmDialog({
                            open: true,
                            type: 'reset',
                            userId: user.id,
                            userName: user.display_name,
                          })
                        }
                      >
                        <Key className="h-4 w-4 ml-2" />
                        إعادة تعيين كلمة المرور
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {/* Delete */}
                      <DropdownMenuItem
                        onClick={() =>
                          setConfirmDialog({
                            open: true,
                            type: 'delete',
                            userId: user.id,
                            userName: user.display_name,
                          })
                        }
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 ml-2" />
                        حذف الحساب
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog?.open}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.type === 'ban' && 'حظر المستخدم'}
              {confirmDialog?.type === 'unban' && 'إلغاء حظر المستخدم'}
              {confirmDialog?.type === 'disable' && 'تعطيل الحساب'}
              {confirmDialog?.type === 'enable' && 'تفعيل الحساب'}
              {confirmDialog?.type === 'delete' && 'حذف الحساب'}
              {confirmDialog?.type === 'reset' && 'إعادة تعيين كلمة المرور'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.type === 'ban' &&
                `هل أنت متأكد من حظر "${confirmDialog.userName}" من المنتدى؟ لن يتمكن من المشاركة في المنتدى.`}
              {confirmDialog?.type === 'unban' &&
                `هل تريد إلغاء حظر "${confirmDialog.userName}"؟ سيتمكن من المشاركة في المنتدى مرة أخرى.`}
              {confirmDialog?.type === 'disable' &&
                `هل أنت متأكد من تعطيل حساب "${confirmDialog.userName}"؟ لن يتمكن من تسجيل الدخول.`}
              {confirmDialog?.type === 'enable' &&
                `هل تريد تفعيل حساب "${confirmDialog.userName}"؟`}
              {confirmDialog?.type === 'delete' &&
                `هل أنت متأكد من حذف حساب "${confirmDialog.userName}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
              {confirmDialog?.type === 'reset' &&
                `سيتم إرسال رابط إعادة تعيين كلمة المرور إلى "${confirmDialog.userName}".`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmDialog && handleAction(confirmDialog.type, confirmDialog.userId)
              }
              className={
                confirmDialog?.type === 'delete'
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
