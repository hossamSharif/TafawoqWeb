import { createBrowserClient } from '@supabase/ssr'
import { clientEnv } from '@/lib/env'
import type { Database } from './types'

/**
 * Supabase client for browser/client-side usage
 * Uses createBrowserClient from @supabase/ssr for cookie-based session storage
 * This ensures session is shared between client and server (middleware, API routes)
 */
export const supabase = createBrowserClient<Database>(
  clientEnv.supabase.url,
  clientEnv.supabase.anonKey,
  {
    global: {
      headers: {
        'x-application-name': 'tafawqoq-web',
      },
    },
  }
)

// Debug: Log Supabase initialization
if (typeof window !== 'undefined') {
  console.log('[Supabase Client] Initialized with:', {
    url: clientEnv.supabase.url,
    hasAnonKey: !!clientEnv.supabase.anonKey,
    storage: 'cookies (via @supabase/ssr)',
  })
}

/**
 * Helper to get the current user session
 */
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error getting session:', error)
    return null
  }
  return session
}

/**
 * Helper to get the current user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  return user
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  return supabase.auth.onAuthStateChange(callback)
}
