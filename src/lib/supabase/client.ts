import { createClient } from '@supabase/supabase-js'
import { clientEnv } from '@/lib/env'
import type { Database } from './types'

/**
 * Supabase client for browser/client-side usage
 * Uses the anon key which has RLS policies applied
 */
export const supabase = createClient<Database>(
  clientEnv.supabase.url,
  clientEnv.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)

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
