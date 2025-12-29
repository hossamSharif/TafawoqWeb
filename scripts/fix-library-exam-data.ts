/**
 * Fix Script: Repair broken library exam data
 *
 * This script finds library-visible forum_posts with invalid shared_exam_id
 * and creates proper exam_sessions for them.
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixLibraryExams() {
  console.log('Finding library-visible posts with broken exam links...')

  // 1. Get all library-visible forum posts
  const { data: libraryPosts, error: postsError } = await supabase
    .from('forum_posts')
    .select('id, title, author_id, shared_exam_id, post_type')
    .eq('is_library_visible', true)
    .eq('post_type', 'exam_share')

  if (postsError) {
    console.error('Error fetching posts:', postsError)
    process.exit(1)
  }

  console.log(`Found ${libraryPosts?.length || 0} library-visible exam posts`)

  if (!libraryPosts || libraryPosts.length === 0) {
    console.log('No library posts to fix')
    return
  }

  // Load exam template
  const examPath = path.join(__dirname, '..', 'examAndPracticingTemplate', 'examScience.json')
  const examData = JSON.parse(fs.readFileSync(examPath, 'utf8'))
  console.log(`Loaded exam template with ${examData.questions.length} questions`)

  for (const post of libraryPosts) {
    console.log(`\nProcessing: ${post.title} (${post.id})`)

    // Check if the linked exam_session exists
    if (post.shared_exam_id) {
      const { data: existingExam } = await supabase
        .from('exam_sessions')
        .select('id, questions')
        .eq('id', post.shared_exam_id)
        .maybeSingle()

      if (existingExam && existingExam.questions) {
        console.log(`  ✓ Valid exam_session exists: ${post.shared_exam_id}`)
        continue
      }
      console.log(`  ✗ Broken exam_session: ${post.shared_exam_id}`)
    } else {
      console.log(`  ✗ No shared_exam_id set`)
    }

    // Create a new valid exam_session
    console.log(`  Creating new exam_session...`)
    const { data: newExamSession, error: examError } = await supabase
      .from('exam_sessions')
      .insert({
        user_id: post.author_id,
        status: 'completed',
        track: 'scientific',
        total_questions: examData.questions.length,
        questions: examData.questions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (examError || !newExamSession) {
      console.error(`  Error creating exam_session:`, examError)
      continue
    }

    console.log(`  Created exam_session: ${newExamSession.id}`)

    // Update the forum_post with the new shared_exam_id
    const { error: updateError } = await supabase
      .from('forum_posts')
      .update({ shared_exam_id: newExamSession.id })
      .eq('id', post.id)

    if (updateError) {
      console.error(`  Error updating forum_post:`, updateError)
      continue
    }

    console.log(`  ✓ Fixed: ${post.title}`)
  }

  console.log('\n✅ Done fixing library exam data!')
}

fixLibraryExams().catch(console.error)
