'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { Home, FileText, Target, User, Settings, LogOut, Menu, X, Crown, MessageSquare, Bell, Library, BarChart3, ChevronDown, ChevronUp, Star } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { NotificationBadge } from '@/components/notifications/NotificationBadge'
import { Logo } from '@/components/shared/Logo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CreditsBadge } from '@/components/subscription/CreditsDisplay'
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/keys'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const navItems = [
  { href: '/dashboard', label: 'الرئيسية', icon: Home },
  { href: '/exam', label: 'اختبار تجريبي', icon: FileText },
  { href: '/practice', label: 'تمارين مخصصة', icon: Target },
  { href: '/performance', label: 'الأداء', icon: BarChart3 },
  { href: '/forum', label: 'المنتدى', icon: MessageSquare },
  { href: '/library', label: 'المكتبة', icon: Library },
  { href: '/reviews', label: 'التقييمات', icon: Star },
]

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, profile, isPremium, isLoading } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSubheaderCollapsed, setIsSubheaderCollapsed] = useState(false)
  const queryClient = useQueryClient()

  // Use React Query hook for cached subscription limits
  const { data: limits, isLoading: limitsLoading } = useSubscriptionLimits()

  // Check if user is on exam or practice page
  const isExamOrPracticePage = pathname.match(/^\/(exam|practice)\/[^/]+$/)

  // Auto-collapse subheader on exam/practice pages
  useEffect(() => {
    if (isExamOrPracticePage) {
      setIsSubheaderCollapsed(true)
    } else {
      setIsSubheaderCollapsed(false)
    }
  }, [isExamOrPracticePage])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  // Prefetch data for navigation links on hover
  const handlePrefetch = (href: string) => {
    if (href === '/forum') {
      // Prefetch forum posts with default filters
      queryClient.prefetchInfiniteQuery({
        queryKey: queryKeys.forum.posts({ sortBy: 'newest', filterType: 'all', searchQuery: '' }),
        queryFn: async () => {
          const response = await fetch('/api/forum/posts?limit=20&sort=newest')
          if (!response.ok) throw new Error('Failed to prefetch forum posts')
          return response.json()
        },
        initialPageParam: undefined,
      })
    } else if (href === '/library') {
      // Prefetch library exams with default filters
      queryClient.prefetchInfiniteQuery({
        queryKey: queryKeys.library.exams({ sortBy: 'popular', filterSection: 'all', searchQuery: '' }),
        queryFn: async () => {
          const response = await fetch('/api/library?page=1&limit=12&sort=popular')
          if (!response.ok) throw new Error('Failed to prefetch library')
          return response.json()
        },
        initialPageParam: 1,
      })
    }
    // Dashboard, exam, and practice pages use cached auth/limits data which is already loaded
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (profile?.display_name) {
      const names = profile.display_name.split(' ')
      if (names.length >= 2) {
        return names[0][0] + names[1][0]
      }
      return names[0].substring(0, 2)
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase()
    }
    return 'م'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Right Side */}
            <div className="hidden md:flex items-center">
              <Logo size="sm" href="/dashboard" />
            </div>

            {/* Desktop Navigation - Center */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onMouseEnter={() => handlePrefetch(item.href)}
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

            {/* User Actions - Left Side */}
            <div className="hidden md:flex items-center gap-3">
              <NotificationBadge />

              {/* Premium Badge or Upgrade Button */}
              {isPremium ? (
                <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                  <Crown className="h-4 w-4" />
                  مميز
                </span>
              ) : (
                <Link href="/subscription">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Crown className="h-4 w-4" />
                    ترقية
                  </Button>
                </Link>
              )}

              {/* User Avatar Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <Avatar className="h-9 w-9 border-2 border-primary/20">
                      <AvatarImage src={profile?.profile_picture_url || undefined} alt={profile?.display_name || 'المستخدم'} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-right">
                    <div className="flex flex-col">
                      <span className="font-medium">{profile?.display_name || 'المستخدم'}</span>
                      <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/profile" className="flex items-center gap-2 w-full">
                      <User className="h-4 w-4" />
                      <span>الملف الشخصي</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/settings" className="flex items-center gap-2 w-full">
                      <Settings className="h-4 w-4" />
                      <span>الإعدادات</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 ml-2" />
                    <span>تسجيل الخروج</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile: Logo on Right */}
            <div className="md:hidden flex items-center">
              <Logo size="sm" href="/dashboard" />
            </div>

            {/* Mobile: User Actions on Left */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-muted-foreground"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <NotificationBadge />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none">
                    <Avatar className="h-8 w-8 border border-primary/20">
                      <AvatarImage src={profile?.profile_picture_url || undefined} alt={profile?.display_name || 'المستخدم'} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-right">
                    <span className="font-medium text-sm">{profile?.display_name || 'المستخدم'}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/profile" className="flex items-center gap-2 w-full">
                      <User className="h-4 w-4" />
                      <span>الملف الشخصي</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/settings" className="flex items-center gap-2 w-full">
                      <Settings className="h-4 w-4" />
                      <span>الإعدادات</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 ml-2" />
                    <span>تسجيل الخروج</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                    onTouchStart={() => handlePrefetch(item.href)}
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
              {/* Premium/Upgrade in mobile */}
              {!isPremium && (
                <Link
                  href="/subscription"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-amber-600 bg-amber-50"
                >
                  <Crown className="h-5 w-5" />
                  ترقية الحساب
                </Link>
              )}
            </nav>
          </div>
        )}

        {/* Global Credits Badge - Expandable/Collapsible Subheader */}
        <div className="border-t border-border/30 relative">
          {/* Collapsible Credits Display */}
          <div
            className={cn(
              'overflow-hidden transition-all duration-300 ease-in-out',
              isSubheaderCollapsed ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100 py-1.5'
            )}
          >
            <CreditsBadge
              limits={limits!}
              isLoading={limitsLoading || !limits}
              showShareCredits={true}
            />
          </div>

          {/* Toggle Button - Always visible */}
          <button
            onClick={() => setIsSubheaderCollapsed(!isSubheaderCollapsed)}
            className={cn(
              'absolute left-1/2 -translate-x-1/2 p-1 bg-white border border-border/50 rounded-full shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/20',
              isSubheaderCollapsed ? '-bottom-3 z-10' : 'bottom-0.5'
            )}
            aria-label={isSubheaderCollapsed ? 'إظهار الأرصدة' : 'إخفاء الأرصدة'}
            title={isSubheaderCollapsed ? 'إظهار الأرصدة' : 'إخفاء الأرصدة'}
          >
            {isSubheaderCollapsed ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <MainLayoutContent>{children}</MainLayoutContent>
}
