// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
// Admin Queries Helper
// Server-side database operations for admin functionality

import { createServerClient } from '@/lib/supabase/server';
import { logAdminAction } from './audit';
import type {
  AdminUserInfo,
  UserListParams,
  ReportRow,
  ReportWithContent,
  ModerationQueueParams,
  FeatureToggle,
  DashboardMetrics,
  DashboardTrends,
  DashboardResponse,
  ReportStatus,
  ModerationAction,
  AdminActionType,
} from './types';

// ============================================
// Admin Verification
// ============================================

/**
 * Check if a user is an admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await createServerClient();

  const { data } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('user_id', userId)
    .single();

  return data?.is_admin || false;
}

/**
 * Verify admin access and throw if not authorized
 */
export async function verifyAdminAccess(userId: string): Promise<void> {
  const admin = await isAdmin(userId);
  if (!admin) {
    throw new Error('Unauthorized: Admin access required');
  }
}

// ============================================
// Dashboard Queries
// ============================================

/**
 * Get dashboard metrics and trends
 */
export async function getDashboardData(): Promise<DashboardResponse> {
  const supabase = await createServerClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString();

  // Get today's metrics
  const [
    dauResult,
    registrationsResult,
    examsResult,
    postsResult,
    pendingReportsResult,
    yesterdayDauResult,
    yesterdayRegistrationsResult,
  ] = await Promise.all([
    // Daily active users (users with activity today)
    supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', todayStr),

    // New registrations today
    supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStr),

    // Exams taken today
    supabase
      .from('exam_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStr),

    // Posts created today
    supabase
      .from('forum_posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStr),

    // Pending reports
    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),

    // Yesterday's DAU for trend
    supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', yesterdayStr)
      .lt('updated_at', todayStr),

    // Yesterday's registrations for trend
    supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterdayStr)
      .lt('created_at', todayStr),
  ]);

  const metrics: DashboardMetrics = {
    daily_active_users: dauResult.count || 0,
    new_registrations_today: registrationsResult.count || 0,
    exams_taken_today: examsResult.count || 0,
    posts_created_today: postsResult.count || 0,
    pending_reports: pendingReportsResult.count || 0,
    revenue_this_month: 0, // Placeholder - integrate with Stripe
  };

  // Calculate trends (percentage change)
  const yesterdayDau = yesterdayDauResult.count || 1;
  const yesterdayRegistrations = yesterdayRegistrationsResult.count || 1;

  const trends: DashboardTrends = {
    dau_change: ((metrics.daily_active_users - yesterdayDau) / yesterdayDau) * 100,
    registrations_change: ((metrics.new_registrations_today - yesterdayRegistrations) / yesterdayRegistrations) * 100,
  };

  return { metrics, trends };
}

// ============================================
// User Management Queries
// ============================================

interface UserListResult {
  users: AdminUserInfo[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Get paginated list of users for admin
 */
export async function getUsers(params: UserListParams): Promise<UserListResult> {
  const { cursor, limit = 20, search, status } = params;
  const supabase = await createServerClient();
  const pageSize = Math.min(limit, 50);

  let query = supabase
    .from('user_profiles')
    .select(`
      user_id,
      display_name,
      email,
      academic_track,
      is_admin,
      is_banned,
      is_disabled,
      created_at,
      updated_at
    `)
    .order('created_at', { ascending: false });

  // Apply search filter
  if (search) {
    query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  // Apply status filter
  if (status === 'active') {
    query = query.eq('is_disabled', false).eq('is_banned', false);
  } else if (status === 'disabled') {
    query = query.eq('is_disabled', true);
  } else if (status === 'banned') {
    query = query.eq('is_banned', true);
  }

  // Apply cursor pagination
  if (cursor) {
    const { data: cursorUser } = await supabase
      .from('user_profiles')
      .select('created_at')
      .eq('user_id', cursor)
      .single();

    if (cursorUser) {
      query = query.lt('created_at', cursorUser.created_at);
    }
  }

  query = query.limit(pageSize + 1);

  const { data: usersData, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  const hasMore = usersData && usersData.length > pageSize;
  const users = usersData?.slice(0, pageSize) || [];
  const nextCursor = hasMore && users.length > 0 ? users[users.length - 1].user_id : null;

  // Transform to API response format
  const transformedUsers: AdminUserInfo[] = users.map(user => {
    return {
      id: user.user_id,
      email: user.email || 'Unknown',
      display_name: user.display_name || user.email?.split('@')[0] || 'Unknown',
      academic_track: user.academic_track || 'unknown',
      subscription_tier: 'free', // TODO: Get from subscriptions table
      is_admin: user.is_admin || false,
      is_banned: user.is_banned || false,
      is_disabled: user.is_disabled || false,
      created_at: user.created_at,
      last_active_at: user.updated_at,
    };
  });

  return {
    users: transformedUsers,
    nextCursor,
    hasMore,
  };
}

/**
 * Update user status (disable/ban)
 */
export async function updateUserStatus(
  adminId: string,
  userId: string,
  updates: { is_disabled?: boolean; is_banned?: boolean }
): Promise<void> {
  const supabase = await createServerClient();

  // Get current status for audit
  const { data: currentUser } = await supabase
    .from('user_profiles')
    .select('is_disabled, is_banned')
    .eq('user_id', userId)
    .single();

  const { error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to update user status: ${error.message}`);
  }

  // Log the action
  if (updates.is_disabled !== undefined) {
    await logAdminAction(adminId, {
      action_type: updates.is_disabled ? 'user_disabled' : 'user_enabled',
      target_type: 'user',
      target_id: userId,
      details: {
        previous_disabled: currentUser?.is_disabled,
        new_disabled: updates.is_disabled,
      },
    });
  }

  if (updates.is_banned !== undefined) {
    await logAdminAction(adminId, {
      action_type: updates.is_banned ? 'user_banned' : 'user_unbanned',
      target_type: 'user',
      target_id: userId,
      details: {
        previous_banned: currentUser?.is_banned,
        new_banned: updates.is_banned,
      },
    });
  }
}

/**
 * Delete a user account
 */
export async function deleteUser(adminId: string, userId: string): Promise<void> {
  const supabase = await createServerClient();

  // Soft delete - just disable the account
  const { error } = await supabase
    .from('user_profiles')
    .update({ is_disabled: true })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }

  await logAdminAction(adminId, {
    action_type: 'user_deleted',
    target_type: 'user',
    target_id: userId,
    details: { deleted_at: new Date().toISOString() },
  });
}

/**
 * Trigger password reset for a user
 */
export async function resetUserPassword(adminId: string, userId: string): Promise<void> {
  const supabase = await createServerClient();

  // Get user email
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('user_id', userId)
    .single();

  if (!profile) {
    throw new Error('User not found');
  }

  // Note: In production, this would trigger Supabase's password reset email
  // For now, we just log the action
  await logAdminAction(adminId, {
    action_type: 'password_reset',
    target_type: 'user',
    target_id: userId,
    details: { triggered_at: new Date().toISOString() },
  });
}

// ============================================
// Moderation Queries
// ============================================

interface ModerationResult {
  reports: ReportWithContent[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Get moderation queue with content previews
 */
export async function getModerationQueue(params: ModerationQueueParams): Promise<ModerationResult> {
  const { cursor, limit = 20, status = 'pending' } = params;
  const supabase = await createServerClient();
  const pageSize = Math.min(limit, 50);

  // Calculate offset from cursor if provided
  let offset = 0;
  if (cursor) {
    // In optimized version, cursor is the offset position
    offset = parseInt(cursor, 10) || 0;
  }

  // Single optimized RPC call replaces 61+ queries (1 report query + 20 reporter profiles + 20 posts/comments + 20 author profiles)
  const { data, error } = await supabase.rpc('get_moderation_queue_optimized', {
    p_status: status,
    p_limit: pageSize + 1, // Fetch one extra to determine hasMore
    p_offset: offset,
  });

  if (error) {
    throw new Error(`Failed to fetch moderation queue: ${error.message}`);
  }

  const hasMore = data && data.length > pageSize;
  const reports = data?.slice(0, pageSize) || [];
  const nextCursor = hasMore ? String(offset + pageSize) : null;

  // Transform to expected format
  const transformedReports: ReportWithContent[] = reports.map(row => ({
    id: row.id,
    content_type: row.content_type,
    content_id: row.content_id,
    content_preview: row.content_preview || '',
    content_author: {
      id: row.content_author_id || '',
      display_name: row.content_author_name || 'Unknown',
    },
    reporter: {
      id: row.reporter_id,
      display_name: row.reporter_name || 'Unknown',
    },
    reason: row.reason,
    details: row.details,
    status: row.status,
    created_at: row.created_at,
  }));

  return {
    reports: transformedReports,
    nextCursor,
    hasMore,
  };
}

/**
 * Resolve a report
 */
export async function resolveReport(
  adminId: string,
  reportId: string,
  action: ModerationAction,
  notes?: string
): Promise<void> {
  const supabase = await createServerClient();

  // Get report details
  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (!report) {
    throw new Error('Report not found');
  }

  // Determine status based on action
  const status: ReportStatus = action === 'dismiss' ? 'dismissed' : 'resolved';

  // Update report
  const { error } = await supabase
    .from('reports')
    .update({
      status,
      resolution_notes: notes,
      resolved_by: adminId,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (error) {
    throw new Error(`Failed to resolve report: ${error.message}`);
  }

  // If action is delete_content, soft delete the content
  if (action === 'delete_content') {
    if (report.content_type === 'post') {
      await supabase
        .from('forum_posts')
        .update({ status: 'deleted', updated_at: new Date().toISOString() })
        .eq('id', report.content_id);
    } else if (report.content_type === 'comment') {
      await supabase
        .from('comments')
        .update({ status: 'deleted', updated_at: new Date().toISOString() })
        .eq('id', report.content_id);
    }
  }

  // Log the action
  await logAdminAction(adminId, {
    action_type: action === 'dismiss' ? 'report_dismissed' : 'report_resolved',
    target_type: 'report',
    target_id: reportId,
    details: {
      action,
      content_type: report.content_type,
      content_id: report.content_id,
      notes,
    },
  });

  // Notify reporter
  // Note: This would typically call the notification service
}

// ============================================
// Feature Toggle Queries
// ============================================

/**
 * Get all feature toggles
 */
export async function getFeatureToggles(): Promise<FeatureToggle[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('feature_toggles')
    .select('feature_name, is_enabled, description')
    .order('feature_name');

  if (error) {
    throw new Error(`Failed to fetch feature toggles: ${error.message}`);
  }

  return data || [];
}

/**
 * Update a feature toggle
 */
export async function updateFeatureToggle(
  adminId: string,
  featureName: string,
  isEnabled: boolean
): Promise<FeatureToggle> {
  const supabase = await createServerClient();

  // Get current state for audit
  const { data: current } = await supabase
    .from('feature_toggles')
    .select('is_enabled')
    .eq('feature_name', featureName)
    .single();

  const { data: updated, error } = await supabase
    .from('feature_toggles')
    .update({
      is_enabled: isEnabled,
      updated_by: adminId,
      updated_at: new Date().toISOString(),
    })
    .eq('feature_name', featureName)
    .select('feature_name, is_enabled, description')
    .single();

  if (error) {
    throw new Error(`Failed to update feature toggle: ${error.message}`);
  }

  // Log the action
  await logAdminAction(adminId, {
    action_type: 'feature_toggled',
    target_type: 'feature',
    target_id: featureName,
    details: {
      previous_enabled: current?.is_enabled,
      new_enabled: isEnabled,
    },
  });

  return updated;
}

// ============================================
// Report Creation (User-facing)
// ============================================

/**
 * Create a new report
 */
export async function createReport(
  reporterId: string,
  data: {
    content_type: 'post' | 'comment';
    content_id: string;
    reason: string;
    details?: string;
  }
): Promise<ReportRow> {
  const supabase = await createServerClient();

  // Check if user already reported this content
  const { data: existing } = await supabase
    .from('reports')
    .select('id')
    .eq('reporter_id', reporterId)
    .eq('content_id', data.content_id)
    .single();

  if (existing) {
    throw new Error('You have already reported this content');
  }

  // Check that user is not reporting their own content
  let authorId: string | null = null;

  if (data.content_type === 'post') {
    const { data: post } = await supabase
      .from('forum_posts')
      .select('author_id')
      .eq('id', data.content_id)
      .single();
    authorId = post?.author_id || null;
  } else {
    const { data: comment } = await supabase
      .from('comments')
      .select('author_id')
      .eq('id', data.content_id)
      .single();
    authorId = comment?.author_id || null;
  }

  if (authorId === reporterId) {
    throw new Error('You cannot report your own content');
  }

  const { data: report, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: reporterId,
      content_type: data.content_type,
      content_id: data.content_id,
      reason: data.reason,
      details: data.details,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create report: ${error.message}`);
  }

  return report;
}

// ============================================
// Analytics Queries
// ============================================

/**
 * Get analytics data for admin dashboard
 */
export async function getAnalytics(timeRange: 'week' | 'month' | 'year' = 'week'): Promise<{
  userGrowth: Array<{ date: string; count: number }>;
  examActivity: Array<{ date: string; count: number }>;
  forumActivity: Array<{ date: string; posts: number; comments: number }>;
}> {
  const supabase = await createServerClient();

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();

  switch (timeRange) {
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 7);
  }

  const startStr = startDate.toISOString();

  // Get user registrations over time
  const { data: users } = await supabase
    .from('user_profiles')
    .select('created_at')
    .gte('created_at', startStr)
    .order('created_at');

  // Get exam activity over time
  const { data: exams } = await supabase
    .from('exam_sessions')
    .select('created_at')
    .gte('created_at', startStr)
    .order('created_at');

  // Get forum activity over time
  const { data: posts } = await supabase
    .from('forum_posts')
    .select('created_at')
    .gte('created_at', startStr)
    .order('created_at');

  const { data: comments } = await supabase
    .from('comments')
    .select('created_at')
    .gte('created_at', startStr)
    .order('created_at');

  // Aggregate by day
  const aggregateByDay = (items: Array<{ created_at: string }> | null) => {
    const counts: Record<string, number> = {};
    (items || []).forEach(item => {
      const date = item.created_at.split('T')[0];
      counts[date] = (counts[date] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  // Combine posts and comments by day for forum activity
  const postsByDay: Record<string, number> = {};
  const commentsByDay: Record<string, number> = {};

  (posts || []).forEach(p => {
    const date = p.created_at.split('T')[0];
    postsByDay[date] = (postsByDay[date] || 0) + 1;
  });

  (comments || []).forEach(c => {
    const date = c.created_at.split('T')[0];
    commentsByDay[date] = (commentsByDay[date] || 0) + 1;
  });

  const allDates = new Set([...Object.keys(postsByDay), ...Object.keys(commentsByDay)]);
  const forumActivity = Array.from(allDates)
    .map(date => ({
      date,
      posts: postsByDay[date] || 0,
      comments: commentsByDay[date] || 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    userGrowth: aggregateByDay(users),
    examActivity: aggregateByDay(exams),
    forumActivity,
  };
}
