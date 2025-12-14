// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
// Admin Audit Logging Utility
// Server-side audit logging for admin actions

import { createServerClient } from '@/lib/supabase/server';
import type {
  AdminAuditLogRow,
  AdminAuditLogInsert,
  AdminActionType,
  AdminTargetType,
} from './types';

// ============================================
// Core Audit Logging
// ============================================

interface LogAdminActionParams {
  action_type: AdminActionType;
  target_type: AdminTargetType;
  target_id: string;
  details?: Record<string, unknown>;
}

/**
 * Log an admin action to the audit log
 */
export async function logAdminAction(
  adminId: string,
  params: LogAdminActionParams
): Promise<AdminAuditLogRow> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('admin_audit_log')
    .insert({
      admin_id: adminId,
      action_type: params.action_type,
      target_type: params.target_type,
      target_id: params.target_id,
      details: params.details || {},
    })
    .select()
    .single();

  if (error) {
    // Don't throw - audit logging should not break the main operation
    console.error('Failed to log admin action:', error);
    // Return a placeholder to allow the calling code to continue
    return {
      id: '',
      admin_id: adminId,
      action_type: params.action_type,
      target_type: params.target_type,
      target_id: params.target_id,
      details: params.details || {},
      created_at: new Date().toISOString(),
    };
  }

  return data;
}

// ============================================
// Specific Action Loggers
// ============================================

/**
 * Log user status change
 */
export async function logUserStatusChange(
  adminId: string,
  userId: string,
  action: 'disabled' | 'enabled' | 'banned' | 'unbanned' | 'deleted',
  previousState?: Record<string, unknown>
): Promise<void> {
  const actionMap: Record<string, AdminActionType> = {
    disabled: 'user_disabled',
    enabled: 'user_enabled',
    banned: 'user_banned',
    unbanned: 'user_unbanned',
    deleted: 'user_deleted',
  };

  await logAdminAction(adminId, {
    action_type: actionMap[action],
    target_type: 'user',
    target_id: userId,
    details: {
      ...previousState,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log password reset trigger
 */
export async function logPasswordReset(
  adminId: string,
  userId: string
): Promise<void> {
  await logAdminAction(adminId, {
    action_type: 'password_reset',
    target_type: 'user',
    target_id: userId,
    details: {
      triggered_at: new Date().toISOString(),
    },
  });
}

/**
 * Log content moderation (post/comment delete/edit)
 */
export async function logContentModeration(
  adminId: string,
  contentType: 'post' | 'comment',
  contentId: string,
  action: 'deleted' | 'edited',
  reason?: string
): Promise<void> {
  const actionType: AdminActionType = contentType === 'post'
    ? (action === 'deleted' ? 'post_deleted' : 'post_edited')
    : (action === 'deleted' ? 'comment_deleted' : 'comment_edited');

  await logAdminAction(adminId, {
    action_type: actionType,
    target_type: contentType,
    target_id: contentId,
    details: {
      reason,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log report resolution
 */
export async function logReportResolution(
  adminId: string,
  reportId: string,
  resolution: 'resolved' | 'dismissed',
  details: {
    contentType: string;
    contentId: string;
    action: string;
    notes?: string;
  }
): Promise<void> {
  await logAdminAction(adminId, {
    action_type: resolution === 'dismissed' ? 'report_dismissed' : 'report_resolved',
    target_type: 'report',
    target_id: reportId,
    details: {
      ...details,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log subscription modification
 */
export async function logSubscriptionChange(
  adminId: string,
  userId: string,
  action: string,
  details: Record<string, unknown>
): Promise<void> {
  await logAdminAction(adminId, {
    action_type: 'subscription_modified',
    target_type: 'subscription',
    target_id: userId,
    details: {
      action,
      ...details,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log credits added
 */
export async function logCreditsAdded(
  adminId: string,
  userId: string,
  examCredits: number,
  practiceCredits: number,
  reason: string
): Promise<void> {
  await logAdminAction(adminId, {
    action_type: 'credits_added',
    target_type: 'user',
    target_id: userId,
    details: {
      exam_credits: examCredits,
      practice_credits: practiceCredits,
      reason,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log feature toggle change
 */
export async function logFeatureToggle(
  adminId: string,
  featureName: string,
  previousEnabled: boolean,
  newEnabled: boolean
): Promise<void> {
  await logAdminAction(adminId, {
    action_type: 'feature_toggled',
    target_type: 'feature',
    target_id: featureName,
    details: {
      previous_enabled: previousEnabled,
      new_enabled: newEnabled,
      timestamp: new Date().toISOString(),
    },
  });
}

// ============================================
// Audit Log Queries
// ============================================

interface AuditLogQueryParams {
  adminId?: string;
  actionType?: AdminActionType;
  targetType?: AdminTargetType;
  targetId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  cursor?: string;
}

interface AuditLogResult {
  logs: AdminAuditLogRow[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(params: AuditLogQueryParams): Promise<AuditLogResult> {
  const {
    adminId,
    actionType,
    targetType,
    targetId,
    startDate,
    endDate,
    limit = 50,
    cursor,
  } = params;

  const supabase = await createServerClient();
  const pageSize = Math.min(limit, 100);

  let query = supabase
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false });

  // Apply filters
  if (adminId) {
    query = query.eq('admin_id', adminId);
  }

  if (actionType) {
    query = query.eq('action_type', actionType);
  }

  if (targetType) {
    query = query.eq('target_type', targetType);
  }

  if (targetId) {
    query = query.eq('target_id', targetId);
  }

  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  // Apply cursor pagination
  if (cursor) {
    const { data: cursorLog } = await supabase
      .from('admin_audit_log')
      .select('created_at')
      .eq('id', cursor)
      .single();

    if (cursorLog) {
      query = query.lt('created_at', cursorLog.created_at);
    }
  }

  query = query.limit(pageSize + 1);

  const { data: logsData, error } = await query;

  if (error) {
    throw new Error(`Failed to query audit logs: ${error.message}`);
  }

  const hasMore = logsData && logsData.length > pageSize;
  const logs = logsData?.slice(0, pageSize) || [];
  const nextCursor = hasMore && logs.length > 0 ? logs[logs.length - 1].id : null;

  return {
    logs,
    nextCursor,
    hasMore,
  };
}

/**
 * Get audit logs for a specific target
 */
export async function getTargetAuditHistory(
  targetType: AdminTargetType,
  targetId: string,
  limit: number = 20
): Promise<AdminAuditLogRow[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('*')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get target audit history: ${error.message}`);
  }

  return data || [];
}

/**
 * Get recent actions by a specific admin
 */
export async function getAdminActionHistory(
  adminId: string,
  limit: number = 20
): Promise<AdminAuditLogRow[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('*')
    .eq('admin_id', adminId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get admin action history: ${error.message}`);
  }

  return data || [];
}

// ============================================
// Audit Statistics
// ============================================

/**
 * Get audit log statistics
 */
export async function getAuditStats(
  startDate?: string,
  endDate?: string
): Promise<{
  totalActions: number;
  actionsByType: Record<string, number>;
  actionsByAdmin: Array<{ adminId: string; count: number }>;
}> {
  const supabase = await createServerClient();

  let query = supabase
    .from('admin_audit_log')
    .select('admin_id, action_type');

  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get audit stats: ${error.message}`);
  }

  const logs = data || [];

  // Count by action type
  const actionsByType: Record<string, number> = {};
  const actionsByAdminMap: Record<string, number> = {};

  for (const log of logs) {
    actionsByType[log.action_type] = (actionsByType[log.action_type] || 0) + 1;
    actionsByAdminMap[log.admin_id] = (actionsByAdminMap[log.admin_id] || 0) + 1;
  }

  const actionsByAdmin = Object.entries(actionsByAdminMap)
    .map(([adminId, count]) => ({ adminId, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalActions: logs.length,
    actionsByType,
    actionsByAdmin,
  };
}
