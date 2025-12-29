import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

/**
 * Protected routes that require authentication
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/exam',
  '/practice',
  '/results',
  '/profile',
  '/subscription',
  '/settings',
  '/onboarding',
  '/library',
]

/**
 * Routes blocked during maintenance mode (write operations)
 * Read operations (browsing) are still allowed
 */
const MAINTENANCE_BLOCKED_ROUTES = [
  '/exam/start',
  '/exam/generate',
  '/exam/new',
  '/practice/start',
  '/practice/create',
  '/practice/new',
  '/subscription/checkout',
  '/subscription/manage',
  '/subscription/upgrade',
  '/forum/new',
  '/forum/share',
  '/library/access', // Prevent accessing new library exams during maintenance
]

/**
 * Map of blocked routes to their operation types for specific error messages
 */
const ROUTE_OPERATION_MAP: Record<string, string> = {
  '/exam/start': 'exam_generation',
  '/exam/generate': 'exam_generation',
  '/exam/new': 'exam_generation',
  '/practice/start': 'practice_creation',
  '/practice/create': 'practice_creation',
  '/practice/new': 'practice_creation',
  '/subscription/checkout': 'subscription_change',
  '/subscription/manage': 'subscription_change',
  '/subscription/upgrade': 'subscription_change',
  '/forum/new': 'forum_post_creation',
  '/forum/share': 'content_sharing',
  '/library/access': 'content_sharing',
}

/**
 * Routes that require premium subscription
 * Note: /exam/start is NOT premium-only - free users have a weekly limit
 * The exam API handles the weekly limit check, not the middleware
 */
const PREMIUM_ROUTES: string[] = [
  // '/exam/start', - removed: handled by exam API with weekly limit
  // '/practice/start', - removed: handled by practice API
]

/**
 * Auth routes - redirect to dashboard if already authenticated
 */
const AUTH_ROUTES = [
  '/login',
  '/register',
]

/**
 * Main routes that require onboarding to be completed
 */
const MAIN_ROUTES = [
  '/dashboard',
  '/exam',
  '/practice',
  '/results',
  '/profile',
  '/subscription',
  '/settings',
  '/library',
  '/forum',
  '/performance',
  '/notifications',
]

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const pathname = request.nextUrl.pathname

  // Allow OAuth callback route to proceed without authentication checks
  if (pathname === '/auth/callback') {
    return response
  }

  // Check if current path matches any protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  const isPremiumRoute = PREMIUM_ROUTES.some(route => pathname.startsWith(route))
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))
  const isMaintenanceBlockedRoute = MAINTENANCE_BLOCKED_ROUTES.some(route => pathname.startsWith(route))
  const isOnboardingRoute = pathname.startsWith('/onboarding')
  const isMainRoute = MAIN_ROUTES.some(route => pathname.startsWith(route))

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Check onboarding status for authenticated users
  if (session) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('user_id', session.user.id)
      .single()

    const hasCompletedOnboarding = profile?.onboarding_completed === true

    // If user has completed onboarding but tries to access onboarding pages, redirect to dashboard
    if (hasCompletedOnboarding && isOnboardingRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // If user hasn't completed onboarding but tries to access main routes, redirect to onboarding
    if (!hasCompletedOnboarding && isMainRoute) {
      return NextResponse.redirect(new URL('/onboarding/track', request.url))
    }
  }

  // Check maintenance mode for blocked routes
  if (isMaintenanceBlockedRoute && session) {
    const { data: maintenanceToggle } = await supabase
      .from('feature_toggles')
      .select('is_enabled, description')
      .eq('feature_name', 'maintenance_mode')
      .maybeSingle()

    if (maintenanceToggle?.is_enabled) {
      // Find the matching route to get the operation type
      const matchedRoute = MAINTENANCE_BLOCKED_ROUTES.find(route => pathname.startsWith(route))
      const operation = matchedRoute ? ROUTE_OPERATION_MAP[matchedRoute] : 'unknown'

      // Redirect to dashboard with maintenance info
      const maintenanceUrl = new URL('/dashboard', request.url)
      maintenanceUrl.searchParams.set('maintenance', 'true')
      maintenanceUrl.searchParams.set('message', maintenanceToggle.description || 'النظام قيد الصيانة')
      maintenanceUrl.searchParams.set('blocked_operation', operation)
      return NextResponse.redirect(maintenanceUrl)
    }
  }

  // Check premium access for premium routes
  if (isPremiumRoute && session) {
    // Check subscription status via RPC
    const { data: hasPremium } = await supabase.rpc('has_premium_access', {
      check_user_id: session.user.id,
    })

    if (!hasPremium) {
      const subscriptionUrl = new URL('/subscription', request.url)
      subscriptionUrl.searchParams.set('upgrade', 'true')
      return NextResponse.redirect(subscriptionUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
