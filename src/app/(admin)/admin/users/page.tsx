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
import { UserTable } from '@/components/admin/UserTable'
import { Search, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import type { AdminUserInfo, UserStatus } from '@/lib/admin/types'

interface UsersResponse {
  users: AdminUserInfo[]
  next_cursor: string | null
  has_more: boolean
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserInfo[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all')

  const fetchUsers = useCallback(
    async (cursor?: string) => {
      const params = new URLSearchParams()
      if (cursor) params.set('cursor', cursor)
      params.set('limit', '20')
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      return response.json() as Promise<UsersResponse>
    },
    [searchQuery, statusFilter]
  )

  const loadInitialUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchUsers()
      setUsers(data.users)
      setNextCursor(data.next_cursor)
      setHasMore(data.has_more)
    } catch (error) {
      console.error('Failed to load users:', error)
      toast.error('فشل في تحميل المستخدمين')
    } finally {
      setIsLoading(false)
    }
  }, [fetchUsers])

  const loadMoreUsers = async () => {
    if (!nextCursor || isLoadingMore) return

    setIsLoadingMore(true)
    try {
      const data = await fetchUsers(nextCursor)
      setUsers((prev) => [...prev, ...data.users])
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

  const handleUpdateStatus = async (
    userId: string,
    updates: { is_disabled?: boolean; is_banned?: boolean }
  ) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update user')
      }

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, ...updates } : user
        )
      )

      toast.success('تم تحديث حالة المستخدم')
    } catch (error) {
      console.error('Failed to update user:', error)
      toast.error('فشل في تحديث المستخدم')
      throw error
    }
  }

  const handleResetPassword = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to reset password')
      }

      toast.success('تم إرسال رابط إعادة تعيين كلمة المرور')
    } catch (error) {
      console.error('Failed to reset password:', error)
      toast.error('فشل في إرسال رابط إعادة تعيين كلمة المرور')
      throw error
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      // Remove from local state
      setUsers((prev) => prev.filter((user) => user.id !== userId))

      toast.success('تم حذف الحساب')
    } catch (error) {
      console.error('Failed to delete user:', error)
      toast.error('فشل في حذف الحساب')
      throw error
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
          <p className="text-muted-foreground">
            عرض وإدارة حسابات المستخدمين
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
          value={statusFilter}
          onValueChange={(value: UserStatus | 'all') => {
            setStatusFilter(value)
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="disabled">معطل</SelectItem>
            <SelectItem value="banned">محظور</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <UserTable
        users={users}
        onUpdateStatus={handleUpdateStatus}
        onResetPassword={handleResetPassword}
        onDeleteUser={handleDeleteUser}
        isLoading={isLoading}
      />

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
    </div>
  )
}
