// @ts-nocheck -- Regenerate Supabase types from database schema to fix type errors
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  addReaction,
  getPostReactionStatus,
  isUserBanned,
  isFeatureEnabled,
} from '@/lib/forum/queries'
import type { AddReactionRequest } from '@/lib/forum/types'

/**
 * POST /api/forum/posts/[id]/reactions - Add a reaction to a post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
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

    // Check if user is banned
    const banned = await isUserBanned(user.id)
    if (banned) {
      return NextResponse.json(
        { error: 'حسابك محظور من المشاركة في المنتدى' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: AddReactionRequest = await request.json()

    // Validate reaction type
    if (!body.reaction_type || !['like', 'love'].includes(body.reaction_type)) {
      return NextResponse.json(
        { error: 'نوع التفاعل غير صالح' },
        { status: 400 }
      )
    }

    // Verify post exists
    const { data: post, error: postError } = await supabase
      .from('forum_posts')
      .select('id, status')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'المنشور غير موجود' },
        { status: 404 }
      )
    }

    if (post.status !== 'active') {
      return NextResponse.json(
        { error: 'لا يمكن التفاعل مع منشور محذوف' },
        { status: 400 }
      )
    }

    // Add reaction
    await addReaction({
      user_id: user.id,
      target_type: 'post',
      target_id: postId,
      reaction_type: body.reaction_type,
    })

    // Get updated counts
    const reactionStatus = await getPostReactionStatus(postId, user.id)

    return NextResponse.json(reactionStatus)
  } catch (error) {
    console.error('Add reaction error:', error)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
