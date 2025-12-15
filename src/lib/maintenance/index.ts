/**
 * Maintenance mode utilities
 * T019: Maintenance utilities implementation
 */

import { createClient } from '@/lib/supabase/client'
import type {
  MaintenanceStatus,
  MaintenanceLog,
  MaintenanceLogResponse,
} from '@/types'
import { DEFAULT_MAINTENANCE_MESSAGE } from '@/types'

// Cache for maintenance status to avoid frequent DB calls
let maintenanceCache: {
  status: MaintenanceStatus | null
  timestamp: number
} = {
  status: null,
  timestamp: 0,
}

const CACHE_TTL = 30000 // 30 seconds

/**
 * Get current maintenance mode status
 */
export async function getMaintenanceStatus(): Promise<MaintenanceStatus> {
  const now = Date.now()

  // Return cached value if still valid
  if (maintenanceCache.status && now - maintenanceCache.timestamp < CACHE_TTL) {
    return maintenanceCache.status
  }

  const supabase = createClient()

  // Check feature_toggles for maintenance mode
  const { data, error } = await supabase
    .from('feature_toggles')
    .select('is_enabled, description, updated_at')
    .eq('feature_name', 'maintenance_mode')
    .maybeSingle()

  if (error) {
    console.error('Error fetching maintenance status:', error)
    return { isActive: false, message: null, enabledAt: null }
  }

  const status: MaintenanceStatus = {
    isActive: data?.is_enabled || false,
    message: data?.is_enabled ? (data.description || DEFAULT_MAINTENANCE_MESSAGE.ar) : null,
    enabledAt: data?.is_enabled ? data.updated_at : null,
  }

  // Update cache
  maintenanceCache = {
    status,
    timestamp: now,
  }

  return status
}

/**
 * Check if maintenance mode is currently active
 */
export async function isMaintenanceModeActive(): Promise<boolean> {
  const status = await getMaintenanceStatus()
  return status.isActive
}

/**
 * Clear the maintenance status cache (call after status change)
 */
export function clearMaintenanceCache(): void {
  maintenanceCache = {
    status: null,
    timestamp: 0,
  }
}

/**
 * Get maintenance log history
 */
export async function getMaintenanceLog(
  page = 1,
  limit = 20
): Promise<MaintenanceLogResponse> {
  const supabase = createClient()
  const offset = (page - 1) * limit

  const { data, error, count } = await supabase
    .from('maintenance_log')
    .select(`
      id,
      admin_id,
      action,
      message,
      created_at,
      user_profiles!maintenance_log_admin_id_fkey (
        display_name
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching maintenance log:', error)
    return {
      entries: [],
      pagination: { page, limit, total: 0, hasMore: false },
    }
  }

  const entries: MaintenanceLog[] = (data || []).map((entry) => {
    const profile = entry.user_profiles as { display_name: string | null } | null
    return {
      id: entry.id,
      adminId: entry.admin_id,
      adminName: profile?.display_name || undefined,
      action: entry.action as 'enabled' | 'disabled',
      message: entry.message,
      createdAt: entry.created_at,
    }
  })

  return {
    entries,
    pagination: {
      page,
      limit,
      total: count || 0,
      hasMore: offset + entries.length < (count || 0),
    },
  }
}

/**
 * Check if a specific operation is blocked by maintenance mode
 */
export async function isOperationBlockedByMaintenance(
  operation: string
): Promise<{ blocked: boolean; message: string | null }> {
  const status = await getMaintenanceStatus()

  if (!status.isActive) {
    return { blocked: false, message: null }
  }

  // Operations that are blocked during maintenance
  const blockedOperations = [
    'exam_generation',
    'practice_creation',
    'subscription_change',
    'content_sharing',
    'forum_post_creation',
  ]

  const isBlocked = blockedOperations.includes(operation)

  return {
    blocked: isBlocked,
    message: isBlocked ? status.message : null,
  }
}

/**
 * Server action: Enable maintenance mode
 */
export async function enableMaintenanceMode(
  adminId: string,
  message?: string
): Promise<{ success: boolean }> {
  const supabase = createClient()

  const maintenanceMessage = message || DEFAULT_MAINTENANCE_MESSAGE.ar

  // Update or insert feature toggle
  const { error: toggleError } = await supabase
    .from('feature_toggles')
    .upsert({
      feature_name: 'maintenance_mode',
      is_enabled: true,
      description: maintenanceMessage,
      updated_by: adminId,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'feature_name',
    })

  if (toggleError) {
    console.error('Error enabling maintenance mode:', toggleError)
    throw new Error('Failed to enable maintenance mode')
  }

  // Log the action
  await supabase
    .from('maintenance_log')
    .insert({
      admin_id: adminId,
      action: 'enabled',
      message: maintenanceMessage,
    })

  // Clear cache
  clearMaintenanceCache()

  return { success: true }
}

/**
 * Server action: Disable maintenance mode
 */
export async function disableMaintenanceMode(
  adminId: string
): Promise<{ success: boolean }> {
  const supabase = createClient()

  // Update feature toggle
  const { error: toggleError } = await supabase
    .from('feature_toggles')
    .update({
      is_enabled: false,
      updated_by: adminId,
      updated_at: new Date().toISOString(),
    })
    .eq('feature_name', 'maintenance_mode')

  if (toggleError) {
    console.error('Error disabling maintenance mode:', toggleError)
    throw new Error('Failed to disable maintenance mode')
  }

  // Log the action
  await supabase
    .from('maintenance_log')
    .insert({
      admin_id: adminId,
      action: 'disabled',
      message: null,
    })

  // Clear cache
  clearMaintenanceCache()

  return { success: true }
}
