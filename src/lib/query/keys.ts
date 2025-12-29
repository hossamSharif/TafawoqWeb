/**
 * Centralized query key structure for React Query
 * Uses hierarchical keys for efficient cache invalidation
 */

export const queryKeys = {
  // Auth & User
  auth: {
    all: ['auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    profile: (userId: string) => [...queryKeys.auth.all, 'profile', userId] as const,
  },

  // Subscription
  subscription: {
    all: ['subscription'] as const,
    current: (userId: string) => [...queryKeys.subscription.all, userId] as const,
    limits: (userId: string) => [...queryKeys.subscription.all, 'limits', userId] as const,
    usage: (userId: string) => [...queryKeys.subscription.all, 'usage', userId] as const,
    invoices: (userId: string) => [...queryKeys.subscription.all, 'invoices', userId] as const,
  },

  // Forum
  forum: {
    all: ['forum'] as const,
    posts: (filters?: any) => [...queryKeys.forum.all, 'posts', filters] as const,
    post: (postId: string) => [...queryKeys.forum.all, 'post', postId] as const,
    comments: (postId: string, cursor?: string) =>
      [...queryKeys.forum.all, 'comments', postId, cursor] as const,
  },

  // Library
  library: {
    all: ['library'] as const,
    exams: (filters?: any) => [...queryKeys.library.all, 'exams', filters] as const,
    exam: (postId: string) => [...queryKeys.library.all, 'exam', postId] as const,
    access: (userId: string) => [...queryKeys.library.all, 'access', userId] as const,
  },

  // Sessions
  sessions: {
    all: ['sessions'] as const,
    active: (userId: string) => [...queryKeys.sessions.all, 'active', userId] as const,
    exam: (sessionId: string) => [...queryKeys.sessions.all, 'exam', sessionId] as const,
    practice: (sessionId: string) => [...queryKeys.sessions.all, 'practice', sessionId] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: (userId: string, filters?: any) =>
      [...queryKeys.notifications.all, userId, filters] as const,
    unreadCount: (userId: string) =>
      [...queryKeys.notifications.all, 'unread', userId] as const,
  },
}
