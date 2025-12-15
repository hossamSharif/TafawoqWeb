/**
 * Maintenance mode type definitions
 */

export type MaintenanceAction = 'enabled' | 'disabled'

export interface MaintenanceConfig {
  enabled: boolean
  message: string | null
  enabledAt: string | null
  enabledBy: string | null
}

export interface MaintenanceLog {
  id: string
  adminId: string
  adminName?: string
  action: MaintenanceAction
  message: string | null
  createdAt: string
}

export interface MaintenanceStatus {
  isActive: boolean
  message: string | null
  enabledAt: string | null
}

// API request/response types
export interface EnableMaintenanceRequest {
  message?: string
}

export interface MaintenanceStatusResponse {
  enabled: boolean
  message: string | null
  enabledAt: string | null
  enabledBy: string | null
}

export interface MaintenanceLogResponse {
  entries: MaintenanceLog[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

// Operations blocked during maintenance
export const MAINTENANCE_BLOCKED_OPERATIONS = [
  'exam_generation',
  'practice_creation',
  'subscription_change',
  'content_sharing',
  'forum_post_creation',
] as const

export type MaintenanceBlockedOperation = typeof MAINTENANCE_BLOCKED_OPERATIONS[number]

// Default maintenance message
export const DEFAULT_MAINTENANCE_MESSAGE = {
  ar: 'النظام قيد الصيانة حالياً. يمكنك تصفح المحتوى الموجود، لكن بعض العمليات غير متاحة مؤقتاً.',
  en: 'System is currently under maintenance. You can browse existing content, but some operations are temporarily unavailable.',
}

// Helper to check if operation is blocked
export function isOperationBlocked(operation: string): operation is MaintenanceBlockedOperation {
  return MAINTENANCE_BLOCKED_OPERATIONS.includes(operation as MaintenanceBlockedOperation)
}
