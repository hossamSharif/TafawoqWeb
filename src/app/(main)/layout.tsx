'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { Home, FileText, Target, User, Settings, LogOut, Menu, X, Crown, MessageSquare, Bell, Library } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { NotificationBadge } from '@/components/notifications/NotificationBadge'
import { Logo } from '@/components/shared/Logo'

const navItems = [
  { href: '/dashboard', label: 'الرئيسية', icon: Home },
  { href: '/forum', label: 'المنتدى', icon: MessageSquare },
  { href: '/library', label: 'المكتبة', icon: Library },
  { href: '/exam', label: 'اختبار تجريبي', icon: FileText },
  { href: '/practice', label: 'تمارين مخصصة', icon: Target },
  { href: '/profile', label: 'الملف الشخصي', icon: User },
  { href: '/settings', label: 'الإعدادات', icon: Settings },
]

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, profile, isPremium, isLoading } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Logo size="sm" href="/dashboard" />

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-gray-100 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* User Info & Actions */}
            <div className="hidden md:flex items-center gap-3">
              {/* Notification Badge */}
              <NotificationBadge />

              {isPremium ? (
                <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                  <Crown className="h-4 w-4" />
                  مميز
                </span>
              ) : (
                <Link href="/subscription">
                  <Button variant="outline" size="sm">
                    ترقية الحساب
                  </Button>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                خروج
              </button>
            </div>

            {/* Mobile: Notification + Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <NotificationBadge />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-muted-foreground"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-white">
            <nav className="container mx-auto px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium',
                      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}
              {/* Notifications link in mobile menu */}
              <Link
                href="/notifications"
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium',
                  pathname === '/notifications' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                )}
              >
                <Bell className="h-5 w-5" />
                الإشعارات
              </Link>
              <hr className="my-2" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 w-full"
              >
                <LogOut className="h-5 w-5" />
                تسجيل الخروج
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </AuthProvider>
  )
}
