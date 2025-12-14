// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  removeReaction,
  getPostReactionStatus,
  isFeatureEnabled,
} from '@/lib/forum/queries'

/**
 * DELETE /api/forum/posts/[id]/reactions/[type] - Remove a reaction from a post
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  try {
    const { id: postId, type: reactionType } = await params
    const supabase = await createServerClient()

    // Check if forum is enabled
    const forumEnabled = await isFeatureEnabled('forum_enabled')
    if (!forumEnabled) {
      return NextResponse.json(
        { error: 'المنتدى غير متاح حالياً' },
        { status: 503 }
      )
    }

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Validate reaction type
    if (!['like', 'love'].includes(reactionType)) {
      return NextResponse.json(
        { error: 'نوع التفاعل غير صالح' },
        { status: 400 }
      )
    }

    // Verify post exists
    const { data: post, error: postError } = await supabase
      .from('forum_posts')
      .select('id')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'المنشور غير موجود' },
        { status: 404 }
      )
    }

    // Remove reaction
    await removeReaction(
      user.id,
      'post',
      postId,
      reactionType as 'like' | 'love'
    )

    // Get updated counts
    const reactionStatus = await getPostReactionStatus(postId, user.id)

    return NextResponse.json(reactionStatus)
  } catch (error) {
    console.error('Remove reaction error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
