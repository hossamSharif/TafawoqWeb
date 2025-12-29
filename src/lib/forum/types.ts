// Forum Types for Forum & Exam Sharing Platform
// Based on data-model.md and contracts/api.md specifications

// ============================================
// Enums and Constants
// ============================================

export type PostType = 'text' | 'exam_share' | 'practice_share';
export type PostStatus = 'active' | 'deleted';
export type CommentStatus = 'active' | 'deleted';
export type ReactionType = 'like' | 'love';
export type ReactionTargetType = 'post' | 'comment';
export type SortOption = 'newest' | 'most_liked' | 'most_completed';

// ============================================
// Database Row Types (matching Supabase schema)
// ============================================

export interface ForumPostRow {
  id: string;
  author_id: string;
  post_type: PostType;
  title: string;
  body: string | null;
  shared_exam_id: string | null;
  shared_practice_id: string | null;
  like_count: number;
  love_count: number;
  comment_count: number;
  completion_count: number;
  status: PostStatus;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommentRow {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  like_count: number;
  status: CommentStatus;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReactionRow {
  id: string;
  user_id: string;
  target_type: ReactionTargetType;
  target_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export interface SharedExamCompletionRow {
  id: string;
  post_id: string;
  user_id: string;
  exam_session_id: string | null;
  practice_session_id: string | null;
  created_at: string;
}

// ============================================
// Insert Types (for creating new records)
// ============================================

export interface ForumPostInsert {
  id?: string;
  author_id: string;
  post_type: PostType;
  title: string;
  body?: string | null;
  shared_exam_id?: string | null;
  shared_practice_id?: string | null;
  like_count?: number;
  love_count?: number;
  comment_count?: number;
  completion_count?: number;
  status?: PostStatus;
  is_edited?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CommentInsert {
  id?: string;
  post_id: string;
  author_id: string;
  parent_id?: string | null;
  content: string;
  like_count?: number;
  status?: CommentStatus;
  is_edited?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ReactionInsert {
  id?: string;
  user_id: string;
  target_type: ReactionTargetType;
  target_id: string;
  reaction_type: ReactionType;
  created_at?: string;
}

export interface SharedExamCompletionInsert {
  id?: string;
  post_id: string;
  user_id: string;
  exam_session_id?: string | null;
  practice_session_id?: string | null;
  created_at?: string;
}

// ============================================
// Update Types (for updating existing records)
// ============================================

export interface ForumPostUpdate {
  title?: string;
  body?: string | null;
  like_count?: number;
  love_count?: number;
  comment_count?: number;
  completion_count?: number;
  status?: PostStatus;
  is_edited?: boolean;
  updated_at?: string;
}

export interface CommentUpdate {
  content?: string;
  like_count?: number;
  status?: CommentStatus;
  is_edited?: boolean;
  updated_at?: string;
}

// ============================================
// API Response Types (enriched with relations)
// ============================================

export interface PostAuthor {
  id: string;
  display_name: string;
  profile_picture_url: string | null;
}

export interface SharedExamInfo {
  id: string;
  section_counts: {
    verbal: number;
    quantitative: number;
  };
  difficulty_distribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  question_count: number;
}

export interface SharedPracticeInfo {
  id: string;
  section: 'quantitative' | 'verbal';
  difficulty: 'easy' | 'medium' | 'hard';
  categories: string[];
  question_count: number;
}

export interface UserReaction {
  like: boolean;
  love: boolean;
}

export interface ForumPost {
  id: string;
  post_type: PostType;
  title: string;
  body: string | null;
  author: PostAuthor;
  shared_exam?: SharedExamInfo | null;
  shared_practice?: SharedPracticeInfo | null;
  like_count: number;
  love_count: number;
  comment_count: number;
  completion_count: number;
  user_reaction: UserReaction;
  user_completed?: boolean;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommentReply {
  id: string;
  content: string;
  author: PostAuthor;
  like_count: number;
  user_liked: boolean;
  is_edited: boolean;
  created_at: string;
}

export interface Comment {
  id: string;
  content: string;
  author: PostAuthor;
  like_count: number;
  user_liked: boolean;
  is_edited: boolean;
  replies: CommentReply[];
  created_at: string;
}

// ============================================
// API Request Types
// ============================================

export interface CreatePostRequest {
  post_type: PostType;
  title: string;
  body?: string;
  shared_exam_id?: string;
  shared_practice_id?: string;
}

export interface UpdatePostRequest {
  title?: string;
  body?: string;
}

export interface CreateCommentRequest {
  content: string;
  parent_id?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface AddReactionRequest {
  reaction_type: ReactionType;
}

// ============================================
// API Response Types
// ============================================

export interface PostListResponse {
  posts: ForumPost[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface CommentListResponse {
  comments: Comment[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface ReactionResponse {
  like_count: number;
  love_count: number;
  user_reaction: UserReaction;
}

export interface CommentLikeResponse {
  like_count: number;
  user_liked: boolean;
}

export interface StartExamResponse {
  session_id: string;
  session_type: 'exam' | 'practice';
  redirect_url: string;
}

// ============================================
// Query Parameters
// ============================================

export interface PostListParams {
  cursor?: string;
  limit?: number;
  sort?: SortOption;
  type?: PostType;
  search?: string;
}

export interface CommentListParams {
  cursor?: string;
  limit?: number;
}

// ============================================
// Sharing Stats (for dashboard)
// ============================================

export interface SharingStats {
  total_shares: number;
  total_completions: number;
  total_likes: number;
  total_loves: number;
  posts: Array<{
    id: string;
    title: string;
    completion_count: number;
    like_count: number;
    love_count: number;
    created_at: string;
  }>;
}

// ============================================
// Validation Constants
// ============================================

export const FORUM_LIMITS = {
  TITLE_MAX_LENGTH: 200,
  BODY_MAX_LENGTH: 5000,
  COMMENT_MAX_LENGTH: 2000,
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,
  MAX_COMMENT_DEPTH: 2,
} as const;
