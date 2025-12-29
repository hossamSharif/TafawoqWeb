/**
 * Seed Script: Add Science Exam to Library
 *
 * This script inserts the scientific track exam from examScience.json
 * into the database EXACTLY as if an admin uploaded it via the admin section.
 *
 * Matches: src/app/api/admin/content/upload/route.ts
 *
 * Run with: npx tsx scripts/seed-exam-science.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase client with service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function checkColumnsExist(): Promise<boolean> {
  // Try to select the library columns - if they exist, we can use them
  const { error } = await supabase
    .from('forum_posts')
    .select('is_library_visible, is_admin_upload')
    .limit(1)

  return !error
}

async function seedExam() {
  console.log('Starting exam seed process (matching admin upload flow)...')

  // Check if library columns exist
  const libraryColumnsExist = await checkColumnsExist()
  if (!libraryColumnsExist) {
    console.log('\n⚠️  Library columns (is_library_visible, is_admin_upload) do not exist yet.')
    console.log('   The exam will be added but may not appear in the library until migrations are run.')
    console.log('   To add the columns, run this SQL in Supabase Dashboard:\n')
    console.log('   ALTER TABLE public.forum_posts')
    console.log('   ADD COLUMN IF NOT EXISTS is_library_visible boolean DEFAULT false,')
    console.log('   ADD COLUMN IF NOT EXISTS is_admin_upload boolean DEFAULT false,')
    console.log('   ADD COLUMN IF NOT EXISTS library_access_count integer DEFAULT 0;\n')
  }

  // 1. Read the exam JSON file
  const examFilePath = path.join(__dirname, '../examAndPracticingTemplate/examScience.json')
  const examData = JSON.parse(fs.readFileSync(examFilePath, 'utf8'))

  console.log(`Loaded exam: ${examData.track} track with ${examData.totalQuestions} questions`)

  // 2. Find an admin user to use as the author (required for is_admin_upload = true)
  const { data: adminUsers, error: adminError } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('is_admin', true)
    .limit(1)

  let adminUserId: string

  if (adminError || !adminUsers || adminUsers.length === 0) {
    // If no admin found, use the first user in the system
    console.log('No admin user found. Checking for any user...')
    const { data: anyUser, error: anyUserError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .limit(1)
      .single()

    if (anyUserError || !anyUser) {
      console.error('No users found in the database. Please create a user first.')
      console.error('Error:', anyUserError)
      process.exit(1)
    }

    adminUserId = anyUser.user_id
    console.log(`Using user: ${adminUserId}`)
  } else {
    adminUserId = adminUsers[0].user_id
    console.log(`Using admin user: ${adminUserId}`)
  }

  // 3. Check if this exam already exists (by title match)
  const examTitle = 'اختبار تجريبي شامل - المسار العلمي (Altrathink)'
  const { data: existingPost } = await supabase
    .from('forum_posts')
    .select('id')
    .eq('title', examTitle)
    .eq('post_type', 'exam_share')
    .maybeSingle()

  if (existingPost) {
    console.log('Exam already exists in database. Skipping seed.')
    process.exit(0)
  }

  // 4. Create the exam_session record
  // EXACTLY matching: src/app/api/admin/content/upload/route.ts lines 48-61
  const section = 'quantitative' as const // Primary section for scientific track
  const track = 'scientific' as const // scientific track for quantitative section

  const { data: examSession, error: examSessionError } = await supabase
    .from('exam_sessions')
    .insert({
      user_id: adminUserId,
      status: 'completed',
      track: track,
      total_questions: examData.questions.length,
      questions: examData.questions,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (examSessionError || !examSession) {
    console.error('Failed to create exam session:', examSessionError)
    process.exit(1)
  }

  console.log(`Created exam session: ${examSession.id}`)

  // 5. Create the forum_post record
  // EXACTLY matching: src/app/api/admin/content/upload/route.ts lines 71-87
  const description = `اختبار تجريبي شامل للمسار العلمي من Altrathink يحتوي على ${examData.quantitativeQuestions} سؤال كمي و${examData.verbalQuestions} سؤال لفظي.`
  const body = JSON.stringify({ description, section })

  // Build the insert data based on available columns
  const forumPostData: Record<string, unknown> = {
    author_id: adminUserId,
    title: examTitle,
    body: body,
    post_type: 'exam_share',
    shared_exam_id: examSession.id,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Add library columns if they exist
  if (libraryColumnsExist) {
    forumPostData.is_library_visible = true
    forumPostData.is_admin_upload = true
  }

  const { data: forumPost, error: forumPostError } = await supabase
    .from('forum_posts')
    .insert(forumPostData)
    .select('id')
    .single()

  if (forumPostError || !forumPost) {
    console.error('Failed to create forum post:', forumPostError)
    // Cleanup: delete the exam session (matching admin route behavior)
    await supabase.from('exam_sessions').delete().eq('id', examSession.id)
    process.exit(1)
  }

  console.log(`Created forum post: ${forumPost.id}`)

  // 6. Log admin action
  // EXACTLY matching: src/app/api/admin/content/upload/route.ts lines 99-110
  await supabase.from('admin_audit_log').insert({
    admin_id: adminUserId,
    action_type: 'content_uploaded',
    target_type: 'forum_post',
    target_id: forumPost.id,
    details: {
      title: examTitle,
      section: section,
      questionCount: examData.questions.length,
      examSessionId: examSession.id,
    },
  })

  console.log('\n✅ Successfully seeded exam to library!')
  console.log(`   Title: ${examTitle}`)
  console.log(`   Questions: ${examData.questions.length}`)
  console.log(`   Track: ${track}`)
  console.log(`   Section: ${section}`)
  console.log(`   Post ID: ${forumPost.id}`)
  console.log(`   Exam Session ID: ${examSession.id}`)

  if (!libraryColumnsExist) {
    console.log('\n⚠️  After running the migration, update this post with:')
    console.log(`   UPDATE forum_posts SET is_library_visible = true, is_admin_upload = true WHERE id = '${forumPost.id}';`)
  }

  console.log('\n   This exam was added exactly as if an admin uploaded it via /admin/content')
}

seedExam().catch(console.error)
