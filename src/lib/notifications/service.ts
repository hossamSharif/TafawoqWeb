// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
// Notification Service
// Server-side notification creation and management

import { createServerClient } from '@/lib/supabase/server';
import type {
  Notification,
  NotificationRow,
  NotificationInsert,
  NotificationListParams,
  NotificationType,
  NotificationTargetType,
  ExamCompletedNotificationData,
  NewCommentNotificationData,
  CommentReplyNotificationData,
  ReportResolvedNotificationData,
  RewardEarnedNotificationData,
  NOTIFICATION_TEMPLATES,
} from './types';

// ============================================
// Core Notification Functions
// ============================================

interface NotificationListResult {
  notifications: Notification[];
  unreadCount: number;
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Get paginated list of notifications for a user
 */
export async function getNotifications(
  userId: string,
  options: NotificationListParams
): Promise<NotificationListResult> {
  const { cursor, limit = 20, unread_only = false } = options;
  const supabase = await createServerClient();
  const pageSize = Math.min(limit, 50);

  // Get unread count first
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  // Build notifications query
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (unread_only) {
    query = query.eq('is_read', false);
  }

  if (cursor) {
    const { data: cursorNotification } = await supabase
      .from('notifications')
      .select('created_at')
      .eq('id', cursor)
      .single();

    if (cursorNotification) {
      query = query.lt('created_at', cursorNotification.created_at);
    }
  }

  query = query.limit(pageSize + 1);

  const { data: notificationsData, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }

  const hasMore = notificationsData && notificationsData.length > pageSize;
  const notifications = notificationsData?.slice(0, pageSize) || [];
  const nextCursor = hasMore && notifications.length > 0
    ? notifications[notifications.length - 1].id
    : null;

  return {
    notifications: notifications.map(transformNotification),
    unreadCount: unreadCount || 0,
    nextCursor,
    hasMore,
  };
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createServerClient();

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    throw new Error(`Failed to get unread count: ${error.message}`);
  }

  return count || 0;
}

/**
 * Mark a notification as read
 */
export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<Notification> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId) // Ensure user owns this notification
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }

  return transformNotification(data);
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<number> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .select('id');

  if (error) {
    throw new Error(`Failed to mark all as read: ${error.message}`);
  }

  return data?.length || 0;
}

// ============================================
// Notification Creation Functions
// ============================================

/**
 * Create a notification directly
 */
export async function createNotification(data: NotificationInsert): Promise<NotificationRow> {
  const supabase = await createServerClient();

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }

  return notification;
}

/**
 * Create notification when someone completes a shared exam
 */
export async function notifyExamCompleted(
  postAuthorId: string,
  data: ExamCompletedNotificationData
): Promise<void> {
  await createNotification({
    user_id: postAuthorId,
    type: 'exam_completed',
    title: 'إكمال اختبار',
    message: `${data.completedByName} أكمل اختبارك "${data.postTitle}"`,
    target_type: 'post',
    target_id: data.postId,
  });
}

/**
 * Create notification when someone comments on a post
 */
export async function notifyNewComment(
  postAuthorId: string,
  data: NewCommentNotificationData
): Promise<void> {
  await createNotification({
    user_id: postAuthorId,
    type: 'new_comment',
    title: 'تعليق جديد',
    message: `${data.commentAuthorName} علق على منشورك "${data.postTitle}"`,
    target_type: 'post',
    target_id: data.postId,
  });
}

/**
 * Create notification when someone replies to a comment
 */
export async function notifyCommentReply(
  commentAuthorId: string,
  data: CommentReplyNotificationData
): Promise<void> {
  await createNotification({
    user_id: commentAuthorId,
    type: 'comment_reply',
    title: 'رد على تعليقك',
    message: `${data.replyAuthorName} رد على تعليقك`,
    target_type: 'comment',
    target_id: data.commentId,
  });
}

/**
 * Create notification when a report is resolved
 */
export async function notifyReportResolved(
  reporterId: string,
  data: ReportResolvedNotificationData
): Promise<void> {
  const resolutionMessages: Record<string, string> = {
    approved: 'تمت الموافقة على المحتوى',
    deleted: 'تم حذف المحتوى المبلغ عنه',
    dismissed: 'تم رفض البلاغ',
  };

  await createNotification({
    user_id: reporterId,
    type: 'report_resolved',
    title: 'تم معالجة البلاغ',
    message: resolutionMessages[data.resolution] || 'تمت معالجة البلاغ',
    target_type: 'report',
    target_id: data.reportId,
  });
}

/**
 * Create notification when user earns rewards
 * Note: This is also triggered by the database trigger, but can be called manually
 */
export async function notifyRewardEarned(
  userId: string,
  data: RewardEarnedNotificationData
): Promise<void> {
  await createNotification({
    user_id: userId,
    type: 'reward_earned',
    title: 'مكافأة جديدة!',
    message: `تهانينا! حققت ${data.milestone} إكمال وحصلت على ${data.examCredits} رصيد اختبار و ${data.practiceCredits} رصيد تدريب`,
    target_type: 'reward',
    target_id: null,
  });
}

// ============================================
// Bulk Notification Functions
// ============================================

/**
 * Create multiple notifications at once
 */
export async function createBulkNotifications(
  notifications: NotificationInsert[]
): Promise<void> {
  if (notifications.length === 0) return;

  const supabase = await createServerClient();

  const { error } = await supabase
    .from('notifications')
    .insert(notifications);

  if (error) {
    throw new Error(`Failed to create bulk notifications: ${error.message}`);
  }
}

// ============================================
// Notification Preference Helpers
// ============================================

/**
 * Check if user has email notifications enabled for forum activity
 */
export async function isForumEmailEnabled(userId: string): Promise<boolean> {
  const supabase = await createServerClient();

  const { data } = await supabase
    .from('user_profiles')
    .select('forum_email_enabled')
    .eq('user_id', userId)
    .single();

  return data?.forum_email_enabled ?? true; // Default to enabled
}

/**
 * Check if user has email notifications enabled for new exams
 */
export async function isNewExamEmailEnabled(userId: string): Promise<boolean> {
  const supabase = await createServerClient();

  const { data } = await supabase
    .from('user_profiles')
    .select('new_exam_email_enabled')
    .eq('user_id', userId)
    .single();

  return data?.new_exam_email_enabled ?? true; // Default to enabled
}

// ============================================
// Cleanup Functions
// ============================================

/**
 * Delete old read notifications (for cleanup jobs)
 * Keeps notifications for the last 30 days
 */
export async function cleanupOldNotifications(daysToKeep: number = 30): Promise<number> {
  const supabase = await createServerClient();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const { data, error } = await supabase
    .from('notifications')
    .delete()
    .eq('is_read', true)
    .lt('created_at', cutoffDate.toISOString())
    .select('id');

  if (error) {
    throw new Error(`Failed to cleanup notifications: ${error.message}`);
  }

  return data?.length || 0;
}

// ============================================
// Helper Functions
// ============================================

function transformNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    target_type: row.target_type,
    target_id: row.target_id,
    is_read: row.is_read,
    created_at: row.created_at,
  };
}
