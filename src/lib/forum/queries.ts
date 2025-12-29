// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
// Forum Supabase Queries Helper
// Server-side database operations for forum functionality

import { createServerClient } from '@/lib/supabase/server';
import type {
  ForumPost,
  ForumPostRow,
  ForumPostInsert,
  ForumPostUpdate,
  Comment,
  CommentRow,
  CommentInsert,
  CommentUpdate,
  ReactionInsert,
  PostListParams,
  CommentListParams,
  PostAuthor,
  UserReaction,
  SharedExamInfo,
  SharedPracticeInfo,
  SharingStats,
  FORUM_LIMITS,
} from './types';

// ============================================
// Post Queries
// ============================================

interface GetPostsOptions extends PostListParams {
  userId?: string;
}

interface PostsResult {
  posts: ForumPost[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Get paginated list of forum posts with author info and user reactions
 */
export async function getPosts(options: GetPostsOptions): Promise<PostsResult> {
  const {
    cursor,
    limit = 20,
    sort = 'newest',
    type,
    search,
    userId,
  } = options;

  const supabase = await createServerClient();
  const pageSize = Math.min(limit, 50);

  let query = supabase
    .from('forum_posts')
    .select(`
      *,
      author:user_profiles!forum_posts_author_profile_fkey(
        user_id,
        display_name,
        profile_picture_url
      )
    `)
    .eq('status', 'active');

  // Apply type filter
  if (type) {
    query = query.eq('post_type', type);
  }

  // Apply search filter
  if (search) {
    query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`);
  }

  // Apply cursor pagination
  if (cursor) {
    const { data: cursorPost } = await supabase
      .from('forum_posts')
      .select('created_at, like_count, completion_count')
      .eq('id', cursor)
      .single();

    if (cursorPost) {
      switch (sort) {
        case 'most_liked':
          query = query.or(`like_count.lt.${cursorPost.like_count},and(like_count.eq.${cursorPost.like_count},id.lt.${cursor})`);
          break;
        case 'most_completed':
          query = query.or(`completion_count.lt.${cursorPost.completion_count},and(completion_count.eq.${cursorPost.completion_count},id.lt.${cursor})`);
          break;
        default:
          query = query.lt('created_at', cursorPost.created_at);
      }
    }
  }

  // Apply sorting
  switch (sort) {
    case 'most_liked':
      query = query.order('like_count', { ascending: false }).order('id', { ascending: false });
      break;
    case 'most_completed':
      query = query.order('completion_count', { ascending: false }).order('id', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  // Fetch one extra to check for more
  query = query.limit(pageSize + 1);

  const { data: postsData, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch posts: ${error.message}`);
  }

  const hasMore = postsData && postsData.length > pageSize;
  const posts = postsData?.slice(0, pageSize) || [];
  const nextCursor = hasMore && posts.length > 0 ? posts[posts.length - 1].id : null;

  // Get user reactions if userId provided
  const userReactions: Map<string, UserReaction> = new Map();
  if (userId && posts.length > 0) {
    const postIds = posts.map(p => p.id);
    const { data: reactions } = await supabase
      .from('reactions')
      .select('target_id, reaction_type')
      .eq('user_id', userId)
      .eq('target_type', 'post')
      .in('target_id', postIds);

    if (reactions) {
      for (const reaction of reactions) {
        const existing = userReactions.get(reaction.target_id) || { like: false, love: false };
        if (reaction.reaction_type === 'like') existing.like = true;
        if (reaction.reaction_type === 'love') existing.love = true;
        userReactions.set(reaction.target_id, existing);
      }
    }
  }

  // Transform to API response format
  const transformedPosts: ForumPost[] = posts.map(post => {
    const authorData = post.author as unknown as { user_id: string; display_name: string; profile_picture_url: string | null };
    return {
      id: post.id,
      post_type: post.post_type,
      title: post.title,
      body: post.body,
      author: {
        id: authorData?.user_id || post.author_id,
        display_name: authorData?.display_name || 'Unknown',
        profile_picture_url: authorData?.profile_picture_url || null,
      },
      shared_exam: null, // Will be populated separately if needed
      like_count: post.like_count,
      love_count: post.love_count,
      comment_count: post.comment_count,
      completion_count: post.completion_count,
      user_reaction: userReactions.get(post.id) || { like: false, love: false },
      is_edited: post.is_edited,
      created_at: post.created_at,
      updated_at: post.updated_at,
    };
  });

  return {
    posts: transformedPosts,
    nextCursor,
    hasMore,
  };
}

/**
 * Get a single post by ID with full details
 */
export async function getPostById(postId: string, userId?: string): Promise<ForumPost | null> {
  const supabase = await createServerClient();

  const { data: post, error } = await supabase
    .from('forum_posts')
    .select(`
      *,
      author:user_profiles!forum_posts_author_profile_fkey(
        user_id,
        display_name,
        profile_picture_url
      )
    `)
    .eq('id', postId)
    .eq('status', 'active')
    .single();

  if (error || !post) {
    return null;
  }

  // Get user reactions
  const userReaction: UserReaction = { like: false, love: false };
  let userCompleted = false;

  if (userId) {
    const { data: reactions } = await supabase
      .from('reactions')
      .select('reaction_type')
      .eq('user_id', userId)
      .eq('target_type', 'post')
      .eq('target_id', postId);

    if (reactions) {
      for (const r of reactions) {
        if (r.reaction_type === 'like') userReaction.like = true;
        if (r.reaction_type === 'love') userReaction.love = true;
      }
    }

    // Check if user completed this exam or practice
    if (post.post_type === 'exam_share' || post.post_type === 'practice_share') {
      const { data: completion } = await supabase
        .from('shared_exam_completions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      userCompleted = !!completion;
    }
  }

  // Get shared exam info if applicable
  let sharedExam: SharedExamInfo | null = null;
  if (post.shared_exam_id) {
    const { data: examSession } = await supabase
      .from('exam_sessions')
      .select('id, questions')
      .eq('id', post.shared_exam_id)
      .single();

    if (examSession && examSession.questions) {
      // Parse questions to get section and difficulty info
      const questions = examSession.questions as Array<{ section?: string; difficulty?: string }>;
      const sectionCounts = { verbal: 0, quantitative: 0 };
      const difficultyDistribution = { easy: 0, medium: 0, hard: 0 };

      for (const q of questions) {
        if (q.section === 'verbal') sectionCounts.verbal++;
        else if (q.section === 'quantitative') sectionCounts.quantitative++;

        if (q.difficulty === 'easy') difficultyDistribution.easy++;
        else if (q.difficulty === 'medium') difficultyDistribution.medium++;
        else if (q.difficulty === 'hard') difficultyDistribution.hard++;
      }

      sharedExam = {
        id: examSession.id,
        section_counts: sectionCounts,
        difficulty_distribution: difficultyDistribution,
        question_count: questions.length,
      };
    }
  }

  // Get shared practice info if applicable
  let sharedPractice: SharedPracticeInfo | null = null;
  if (post.shared_practice_id) {
    const { data: practiceSession } = await supabase
      .from('practice_sessions')
      .select('id, section, difficulty, categories, question_count, questions')
      .eq('id', post.shared_practice_id)
      .single();

    if (practiceSession) {
      // Get question count from questions array if question_count is not set
      const questionCount = practiceSession.question_count ||
        (Array.isArray(practiceSession.questions) ? practiceSession.questions.length : 0);

      sharedPractice = {
        id: practiceSession.id,
        section: practiceSession.section as 'quantitative' | 'verbal',
        difficulty: practiceSession.difficulty as 'easy' | 'medium' | 'hard',
        categories: practiceSession.categories || [],
        question_count: questionCount,
      };
    }
  }

  const authorData = post.author as unknown as { user_id: string; display_name: string; profile_picture_url: string | null };

  return {
    id: post.id,
    post_type: post.post_type,
    title: post.title,
    body: post.body,
    author: {
      id: authorData?.user_id || post.author_id,
      display_name: authorData?.display_name || 'Unknown',
      profile_picture_url: authorData?.profile_picture_url || null,
    },
    shared_exam: sharedExam,
    shared_practice: sharedPractice,
    like_count: post.like_count,
    love_count: post.love_count,
    comment_count: post.comment_count,
    completion_count: post.completion_count,
    user_reaction: userReaction,
    user_completed: userCompleted,
    is_edited: post.is_edited,
    created_at: post.created_at,
    updated_at: post.updated_at,
  };
}

/**
 * Create a new forum post
 */
export async function createPost(data: ForumPostInsert): Promise<ForumPostRow> {
  const supabase = await createServerClient();

  const { data: post, error } = await supabase
    .from('forum_posts')
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create post: ${error.message}`);
  }

  return post;
}

/**
 * Update an existing forum post
 */
export async function updatePost(postId: string, data: ForumPostUpdate): Promise<ForumPostRow> {
  const supabase = await createServerClient();

  const { data: post, error } = await supabase
    .from('forum_posts')
    .update({
      ...data,
      is_edited: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update post: ${error.message}`);
  }

  return post;
}

/**
 * Delete a post (soft delete by setting status)
 */
export async function deletePost(postId: string): Promise<void> {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('forum_posts')
    .update({ status: 'deleted', updated_at: new Date().toISOString() })
    .eq('id', postId);

  if (error) {
    throw new Error(`Failed to delete post: ${error.message}`);
  }
}

// ============================================
// Comment Queries
// ============================================

interface CommentsResult {
  comments: Comment[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Get comments for a post with replies
 */
export async function getComments(
  postId: string,
  options: CommentListParams & { userId?: string }
): Promise<CommentsResult> {
  const { cursor, limit = 20, userId } = options;
  const supabase = await createServerClient();
  const pageSize = Math.min(limit, 50);

  // Get top-level comments
  let query = supabase
    .from('comments')
    .select(`
      *,
      author:user_profiles!comments_author_profile_fkey(
        user_id,
        display_name,
        profile_picture_url
      )
    `)
    .eq('post_id', postId)
    .eq('status', 'active')
    .is('parent_id', null)
    .order('created_at', { ascending: false });

  if (cursor) {
    const { data: cursorComment } = await supabase
      .from('comments')
      .select('created_at')
      .eq('id', cursor)
      .single();

    if (cursorComment) {
      query = query.lt('created_at', cursorComment.created_at);
    }
  }

  query = query.limit(pageSize + 1);

  const { data: commentsData, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch comments: ${error.message}`);
  }

  const hasMore = commentsData && commentsData.length > pageSize;
  const topLevelComments = commentsData?.slice(0, pageSize) || [];
  const nextCursor = hasMore && topLevelComments.length > 0
    ? topLevelComments[topLevelComments.length - 1].id
    : null;

  // Get all replies for these comments
  const commentIds = topLevelComments.map(c => c.id);
  let replies: typeof commentsData = [];

  if (commentIds.length > 0) {
    const { data: repliesData } = await supabase
      .from('comments')
      .select(`
        *,
        author:user_profiles!comments_author_profile_fkey(
          user_id,
          display_name,
          profile_picture_url
        )
      `)
      .eq('post_id', postId)
      .eq('status', 'active')
      .in('parent_id', commentIds)
      .order('created_at', { ascending: true });

    replies = repliesData || [];
  }

  // Get user likes if userId provided
  const allCommentIds = [...commentIds, ...replies.map(r => r.id)];
  let userLikes: Set<string> = new Set();

  if (userId && allCommentIds.length > 0) {
    const { data: reactions } = await supabase
      .from('reactions')
      .select('target_id')
      .eq('user_id', userId)
      .eq('target_type', 'comment')
      .eq('reaction_type', 'like')
      .in('target_id', allCommentIds);

    if (reactions) {
      userLikes = new Set(reactions.map(r => r.target_id));
    }
  }

  // Group replies by parent
  const repliesByParent = new Map<string, typeof replies>();
  for (const reply of replies) {
    const parentId = reply.parent_id!;
    if (!repliesByParent.has(parentId)) {
      repliesByParent.set(parentId, []);
    }
    repliesByParent.get(parentId)!.push(reply);
  }

  // Transform to API response format
  const transformedComments: Comment[] = topLevelComments.map(comment => {
    const authorData = comment.author as unknown as { user_id: string; display_name: string; profile_picture_url: string | null };
    const commentReplies = repliesByParent.get(comment.id) || [];

    return {
      id: comment.id,
      content: comment.content,
      author: {
        id: authorData?.user_id || comment.author_id,
        display_name: authorData?.display_name || 'Unknown',
        profile_picture_url: authorData?.profile_picture_url || null,
      },
      like_count: comment.like_count,
      user_liked: userLikes.has(comment.id),
      is_edited: comment.is_edited,
      replies: commentReplies.map(reply => {
        const replyAuthor = reply.author as unknown as { user_id: string; display_name: string; profile_picture_url: string | null };
        return {
          id: reply.id,
          content: reply.content,
          author: {
            id: replyAuthor?.user_id || reply.author_id,
            display_name: replyAuthor?.display_name || 'Unknown',
            profile_picture_url: replyAuthor?.profile_picture_url || null,
          },
          like_count: reply.like_count,
          user_liked: userLikes.has(reply.id),
          is_edited: reply.is_edited,
          created_at: reply.created_at,
        };
      }),
      created_at: comment.created_at,
    };
  });

  return {
    comments: transformedComments,
    nextCursor,
    hasMore,
  };
}

/**
 * Create a new comment
 */
export async function createComment(data: CommentInsert): Promise<CommentRow> {
  const supabase = await createServerClient();

  // Validate parent comment if reply
  if (data.parent_id) {
    const { data: parentComment } = await supabase
      .from('comments')
      .select('parent_id, post_id')
      .eq('id', data.parent_id)
      .single();

    // Don't allow replies to replies (max 2 levels)
    if (parentComment?.parent_id) {
      throw new Error('Cannot reply to a reply. Maximum nesting depth is 2 levels.');
    }

    // Ensure parent belongs to same post
    if (parentComment?.post_id !== data.post_id) {
      throw new Error('Parent comment belongs to a different post.');
    }
  }

  const { data: comment, error } = await supabase
    .from('comments')
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create comment: ${error.message}`);
  }

  return comment;
}

/**
 * Update a comment
 */
export async function updateComment(commentId: string, data: CommentUpdate): Promise<CommentRow> {
  const supabase = await createServerClient();

  const { data: comment, error } = await supabase
    .from('comments')
    .update({
      ...data,
      is_edited: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update comment: ${error.message}`);
  }

  return comment;
}

/**
 * Delete a comment (soft delete)
 */
export async function deleteComment(commentId: string): Promise<void> {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('comments')
    .update({ status: 'deleted', updated_at: new Date().toISOString() })
    .eq('id', commentId);

  if (error) {
    throw new Error(`Failed to delete comment: ${error.message}`);
  }
}

// ============================================
// Reaction Queries
// ============================================

/**
 * Add a reaction to a post or comment
 */
export async function addReaction(data: ReactionInsert): Promise<void> {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('reactions')
    .insert(data);

  if (error) {
    // Check if it's a duplicate key error (reaction already exists)
    if (error.code === '23505') {
      return; // Silently ignore duplicate reactions
    }
    throw new Error(`Failed to add reaction: ${error.message}`);
  }
}

/**
 * Remove a reaction from a post or comment
 */
export async function removeReaction(
  userId: string,
  targetType: 'post' | 'comment',
  targetId: string,
  reactionType: 'like' | 'love'
): Promise<void> {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('reactions')
    .delete()
    .eq('user_id', userId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('reaction_type', reactionType);

  if (error) {
    throw new Error(`Failed to remove reaction: ${error.message}`);
  }
}

/**
 * Get updated reaction counts and user status for a post
 */
export async function getPostReactionStatus(
  postId: string,
  userId?: string
): Promise<{ like_count: number; love_count: number; user_reaction: UserReaction }> {
  const supabase = await createServerClient();

  const { data: post } = await supabase
    .from('forum_posts')
    .select('like_count, love_count')
    .eq('id', postId)
    .single();

  const userReaction: UserReaction = { like: false, love: false };

  if (userId) {
    const { data: reactions } = await supabase
      .from('reactions')
      .select('reaction_type')
      .eq('user_id', userId)
      .eq('target_type', 'post')
      .eq('target_id', postId);

    if (reactions) {
      for (const r of reactions) {
        if (r.reaction_type === 'like') userReaction.like = true;
        if (r.reaction_type === 'love') userReaction.love = true;
      }
    }
  }

  return {
    like_count: post?.like_count || 0,
    love_count: post?.love_count || 0,
    user_reaction: userReaction,
  };
}

/**
 * Get updated like count and user status for a comment
 */
export async function getCommentLikeStatus(
  commentId: string,
  userId?: string
): Promise<{ like_count: number; user_liked: boolean }> {
  const supabase = await createServerClient();

  const { data: comment } = await supabase
    .from('comments')
    .select('like_count')
    .eq('id', commentId)
    .single();

  let userLiked = false;

  if (userId) {
    const { data: reaction } = await supabase
      .from('reactions')
      .select('id')
      .eq('user_id', userId)
      .eq('target_type', 'comment')
      .eq('target_id', commentId)
      .eq('reaction_type', 'like')
      .single();

    userLiked = !!reaction;
  }

  return {
    like_count: comment?.like_count || 0,
    user_liked: userLiked,
  };
}

// ============================================
// Sharing Stats Queries
// ============================================

/**
 * Get sharing statistics for a user
 */
export async function getUserSharingStats(userId: string): Promise<SharingStats> {
  const supabase = await createServerClient();

  // Get user's shared posts with stats
  const { data: posts, error } = await supabase
    .from('forum_posts')
    .select('id, title, completion_count, like_count, love_count, created_at')
    .eq('author_id', userId)
    .eq('post_type', 'exam_share')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get sharing stats: ${error.message}`);
  }

  const totalShares = posts?.length || 0;
  const totalCompletions = posts?.reduce((sum, p) => sum + p.completion_count, 0) || 0;
  const totalLikes = posts?.reduce((sum, p) => sum + p.like_count, 0) || 0;
  const totalLoves = posts?.reduce((sum, p) => sum + p.love_count, 0) || 0;

  return {
    total_shares: totalShares,
    total_completions: totalCompletions,
    total_likes: totalLikes,
    total_loves: totalLoves,
    posts: posts || [],
  };
}

// ============================================
// Utility Queries
// ============================================

/**
 * Check if user is banned from forum
 */
export async function isUserBanned(userId: string): Promise<boolean> {
  const supabase = await createServerClient();

  const { data } = await supabase
    .from('user_profiles')
    .select('is_banned')
    .eq('user_id', userId)
    .single();

  return data?.is_banned || false;
}

/**
 * Check if a feature is enabled
 */
export async function isFeatureEnabled(featureName: string): Promise<boolean> {
  const supabase = await createServerClient();

  const { data } = await supabase
    .from('feature_toggles')
    .select('is_enabled')
    .eq('feature_name', featureName)
    .single();

  return data?.is_enabled ?? true; // Default to enabled if not found
}

/**
 * Check if user has already shared an exam
 */
export async function hasUserSharedExam(
  userId: string,
  examSessionId: string
): Promise<boolean> {
  const supabase = await createServerClient();

  const { data } = await supabase
    .from('forum_posts')
    .select('id')
    .eq('author_id', userId)
    .eq('shared_exam_id', examSessionId)
    .single();

  return !!data;
}

/**
 * Check if user has already shared a practice
 */
export async function hasUserSharedPractice(
  userId: string,
  practiceSessionId: string
): Promise<boolean> {
  const supabase = await createServerClient();

  const { data } = await supabase
    .from('forum_posts')
    .select('id')
    .eq('author_id', userId)
    .eq('shared_practice_id', practiceSessionId)
    .single();

  return !!data;
}

/**
 * Get post author ID (for permission checks)
 */
export async function getPostAuthorId(postId: string): Promise<string | null> {
  const supabase = await createServerClient();

  const { data } = await supabase
    .from('forum_posts')
    .select('author_id')
    .eq('id', postId)
    .single();

  return data?.author_id || null;
}

/**
 * Get comment author ID and post ID (for permission checks)
 */
export async function getCommentInfo(commentId: string): Promise<{ authorId: string; postId: string } | null> {
  const supabase = await createServerClient();

  const { data } = await supabase
    .from('comments')
    .select('author_id, post_id')
    .eq('id', commentId)
    .single();

  if (!data) return null;

  return {
    authorId: data.author_id,
    postId: data.post_id,
  };
}
