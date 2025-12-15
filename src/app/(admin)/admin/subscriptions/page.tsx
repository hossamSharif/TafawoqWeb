'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Search,
  RefreshCw,
  Crown,
  CreditCard,
  Plus,
  Loader2,
  MoreHorizontal,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import type { AdminUserInfo, SubscriptionAction } from '@/lib/admin/types'

interface UsersResponse {
  users: AdminUserInfo[]
  next_cursor: string | null
  has_more: boolean
}

export default function AdminSubscriptionsPage() {
  const [users, setUsers] = useState<AdminUserInfo[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [subscriptionFilter, setSubscriptionFilter] = useState<'all' | 'free' | 'premium'>('all')

  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    userId: string
    userName: string
    action: SubscriptionAction
  } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [creditsToAdd, setCreditsToAdd] = useState({ exam: 5, practice: 5 })
  const [daysToExtend, setDaysToExtend] = useState(7)

  const fetchUsers = useCallback(
    async (cursor?: string) => {
      const params = new URLSearchParams()
      if (cursor) params.set('cursor', cursor)
      params.set('limit', '20')
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      return response.json() as Promise<UsersResponse>
    },
    [searchQuery]
  )

  const loadInitialUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchUsers()
      let filteredUsers = data.users
      if (subscriptionFilter !== 'all') {
        filteredUsers = data.users.filter(
          (u) => u.subscription_tier === subscriptionFilter
        )
      }
      setUsers(filteredUsers)
      setNextCursor(data.next_cursor)
      setHasMore(data.has_more)
    } catch (error) {
      console.error('Failed to load users:', error)
      toast.error('فشل في تحميل المستخدمين')
    } finally {
      setIsLoading(false)
    }
  }, [fetchUsers, subscriptionFilter])

  const loadMoreUsers = async () => {
    if (!nextCursor || isLoadingMore) return

    setIsLoadingMore(true)
    try {
      const data = await fetchUsers(nextCursor)
      let filteredUsers = data.users
      if (subscriptionFilter !== 'all') {
        filteredUsers = data.users.filter(
          (u) => u.subscription_tier === subscriptionFilter
        )
      }
      setUsers((prev) => [...prev, ...filteredUsers])
      setNextCursor(data.next_cursor)
      setHasMore(data.has_more)
    } catch (error) {
      console.error('Failed to load more users:', error)
      toast.error('فشل في تحميل المزيد')
    } finally {
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    loadInitialUsers()
  }, [loadInitialUsers])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadInitialUsers()
  }

  const handleSubscriptionAction = async () => {
    if (!actionDialog) return

    setActionLoading(true)
    try {
      const body: Record<string, unknown> = {
        action: actionDialog.action,
      }

      if (actionDialog.action === 'add_credits') {
        body.credits = creditsToAdd
      } else if (actionDialog.action === 'extend_trial') {
        body.days = daysToExtend
      } else if (actionDialog.action === 'upgrade') {
        body.tier = 'premium'
      } else if (actionDialog.action === 'downgrade') {
        body.tier = 'free'
      }

      const response = await fetch(
        `/api/admin/users/${actionDialog.userId}/subscription`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update subscription')
      }

      // Update local state
      if (actionDialog.action === 'upgrade' || actionDialog.action === 'downgrade') {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === actionDialog.userId
              ? { ...u, subscription_tier: actionDialog.action === 'upgrade' ? 'premium' : 'free' }
              : u
          )
        )
      }

      const actionMessages: Record<SubscriptionAction, string> = {
        upgrade: 'تم ترقية الاشتراك',
        downgrade: 'تم تخفيض الاشتراك',
        add_credits: 'تم إضافة الرصيد',
        extend_trial: 'تم تمديد الفترة التجريبية',
        cancel: 'تم إلغاء الاشتراك',
      }
      toast.success(actionMessages[actionDialog.action])
    } catch (error) {
      console.error('Failed to update subscription:', error)
      toast.error('فشل في تحديث الاشتراك')
    } finally {
      setActionLoading(false)
      setActionDialog(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">إدارة الاشتراكات</h1>
          <p className="text-muted-foreground">
            إدارة اشتراكات المستخدمين والرصيد
          </p>
        </div>
        <Button variant="outline" onClick={loadInitialUsers}>
          <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="ابحث بالاسم أو البريد الإلكتروني..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Button type="submit">بحث</Button>
        </form>

        <Select
          value={subscriptionFilter}
          onValueChange={(value: 'all' | 'free' | 'premium') => {
            setSubscriptionFilter(value)
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="الاشتراك" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="free">مجاني</SelectItem>
            <SelectItem value="premium">مميز</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">المستخدم</TableHead>
                <TableHead className="text-right">البريد الإلكتروني</TableHead>
                <TableHead className="text-right">الاشتراك</TableHead>
                <TableHead className="text-right">تاريخ التسجيل</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.display_name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    {user.subscription_tier === 'premium' ? (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                        <Crown className="h-3 w-3 ml-1" />
                        مميز
                      </Badge>
                    ) : (
                      <Badge variant="outline">مجاني</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.subscription_tier === 'free' ? (
                          <DropdownMenuItem
                            onClick={() =>
                              setActionDialog({
                                open: true,
                                userId: user.id,
                                userName: user.display_name,
                                action: 'upgrade',
                              })
                            }
                          >
                            <Crown className="h-4 w-4 ml-2 text-amber-600" />
                            ترقية للمميز
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() =>
                              setActionDialog({
                                open: true,
                                userId: user.id,
                                userName: user.display_name,
                                action: 'downgrade',
                              })
                            }
                          >
                            <CreditCard className="h-4 w-4 ml-2" />
                            تخفيض للمجاني
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() =>
                            setActionDialog({
                              open: true,
                              userId: user.id,
                              userName: user.display_name,
                              action: 'add_credits',
                            })
                          }
                        >
                          <Plus className="h-4 w-4 ml-2" />
                          إضافة رصيد
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            setActionDialog({
                              open: true,
                              userId: user.id,
                              userName: user.display_name,
                              action: 'extend_trial',
                            })
                          }
                        >
                          <CreditCard className="h-4 w-4 ml-2" />
                          تمديد الفترة التجريبية
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={loadMoreUsers}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : null}
            تحميل المزيد
          </Button>
        </div>
      )}

      {/* Action Dialog */}
      <Dialog
        open={actionDialog?.open}
        onOpenChange={(open) => !open && setActionDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === 'upgrade' && 'ترقية الاشتراك'}
              {actionDialog?.action === 'downgrade' && 'تخفيض الاشتراك'}
              {actionDialog?.action === 'add_credits' && 'إضافة رصيد'}
              {actionDialog?.action === 'extend_trial' && 'تمديد الفترة التجريبية'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.userName}
            </DialogDescription>
          </DialogHeader>

          {actionDialog?.action === 'add_credits' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>رصيد الاختبارات</Label>
                <Input
                  type="number"
                  min="0"
                  value={creditsToAdd.exam}
                  onChange={(e) =>
                    setCreditsToAdd((prev) => ({
                      ...prev,
                      exam: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>رصيد التمارين</Label>
                <Input
                  type="number"
                  min="0"
                  value={creditsToAdd.practice}
                  onChange={(e) =>
                    setCreditsToAdd((prev) => ({
                      ...prev,
                      practice: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
          )}

          {actionDialog?.action === 'extend_trial' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>عدد الأيام</Label>
                <Input
                  type="number"
                  min="1"
                  value={daysToExtend}
                  onChange={(e) => setDaysToExtend(parseInt(e.target.value) || 7)}
                />
              </div>
            </div>
          )}

          {(actionDialog?.action === 'upgrade' || actionDialog?.action === 'downgrade') && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                {actionDialog.action === 'upgrade'
                  ? 'سيتم ترقية هذا المستخدم للاشتراك المميز.'
                  : 'سيتم تخفيض هذا المستخدم للاشتراك المجاني.'}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog(null)}
              disabled={actionLoading}
            >
              إلغاء
            </Button>
            <Button onClick={handleSubscriptionAction} disabled={actionLoading}>
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : null}
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
