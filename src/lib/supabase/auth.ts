import { supabase } from './client'
import type { User, Session, AuthError } from '@supabase/supabase-js'

/**
 * Authentication helpers for Supabase Auth
 * Provides wrapper functions for common auth operations
 */

export interface AuthResponse {
  user: User | null
  session: Session | null
  error: AuthError | null
}

export interface SignUpData {
  email: string
  password: string
  academicTrack?: 'scientific' | 'literary'
}

export interface SignInData {
  email: string
  password: string
}

/**
 * Sign up a new user with email and password
 */
export async function signUp({ email, password, academicTrack }: SignUpData): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        academic_track: academicTrack || 'scientific',
      },
    },
  })

  return {
    user: data.user,
    session: data.session,
    error,
  }
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn({ email, password }: SignInData): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return {
    user: data.user,
    session: data.session,
    error,
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Get the current session
 */
export async function getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.getSession()
  return {
    session: data.session,
    error,
  }
}

/**
 * Get the current user
 */
export async function getUser(): Promise<{ user: User | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.getUser()
  return {
    user: data.user,
    error,
  }
}

/**
 * Send a password reset email
 */
export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset-password`,
  })
  return { error }
}

/**
 * Update user password (when user is already authenticated)
 */
export async function updatePassword(newPassword: string): Promise<{ user: User | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  return {
    user: data.user,
    error,
  }
}

/**
 * Update user metadata
 */
export async function updateUserMetadata(
  metadata: Record<string, unknown>
): Promise<{ user: User | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  })
  return {
    user: data.user,
    error,
  }
}

/**
 * Refresh the current session
 */
export async function refreshSession(): Promise<{ session: Session | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.refreshSession()
  return {
    session: data.session,
    error,
  }
}

/**
 * Sign in with OAuth provider
 */
export async function signInWithOAuth(provider: 'google'): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
    },
  })
  return { error }
}

/**
 * Verify OTP token (for email verification)
 */
export async function verifyOtp(
  email: string,
  token: string,
  type: 'signup' | 'recovery' | 'email'
): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type,
  })
  return {
    user: data.user,
    session: data.session,
    error,
  }
}
