/**
 * Server-side phone validation utilities
 * Used for database uniqueness checks and server-side validation
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Checks if a phone number is already in use by another user
 *
 * @param supabase Supabase client instance
 * @param phoneNumber Phone number in E.164 format (966501234567)
 * @param excludeUserId Optional user ID to exclude from check (for updates)
 * @returns true if phone is unique (available), false if already in use
 */
export async function checkPhoneUnique(
  supabase: SupabaseClient,
  phoneNumber: string,
  excludeUserId?: string
): Promise<boolean> {
  try {
    let query = supabase
      .from('user_profiles')
      .select('id, user_id')
      .eq('phone_number', phoneNumber)

    // Exclude current user if updating their own phone
    if (excludeUserId) {
      query = query.neq('user_id', excludeUserId)
    }

    const { data, error } = await query.single()

    if (error) {
      // PGRST116 means no rows found, which is good (phone is unique)
      if (error.code === 'PGRST116') {
        return true
      }
      // Other errors should be logged but we'll be conservative
      console.error('[checkPhoneUnique] Database error:', error)
      return false
    }

    // If we found a record, phone is not unique
    return !data
  } catch (error) {
    console.error('[checkPhoneUnique] Unexpected error:', error)
    return false
  }
}

/**
 * Gets the user profile associated with a phone number
 *
 * @param supabase Supabase client instance
 * @param phoneNumber Phone number in E.164 format (966501234567)
 * @returns User profile if found, null otherwise
 */
export async function getUserByPhone(
  supabase: SupabaseClient,
  phoneNumber: string
): Promise<{ user_id: string; display_name: string | null } | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, display_name')
      .eq('phone_number', phoneNumber)
      .single()

    if (error || !data) {
      return null
    }

    return data
  } catch (error) {
    console.error('[getUserByPhone] Error:', error)
    return null
  }
}
