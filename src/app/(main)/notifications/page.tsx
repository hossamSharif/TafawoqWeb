'use client'

import { Bell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NotificationList } from '@/components/notifications/NotificationList'
import { ForumErrorBoundary } from '@/components/forum/ForumErrorBoundary'

export default function NotificationsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            الإشعارات
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <ForumErrorBoundary>
            <NotificationList />
          </ForumErrorBoundary>
        </CardContent>
      </Card>
    </div>
  )
}
