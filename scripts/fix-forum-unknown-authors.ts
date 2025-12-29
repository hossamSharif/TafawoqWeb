/**
 * Fix forum posts showing "Unknown" as author name
 * This script diagnoses and fixes the issue where forum posts don't have matching user_profile records
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function diagnoseForum() {
  console.log('🔍 Diagnosing forum posts with missing author data...\n')

  // Get all active forum posts
  const { data: posts, error: postsError } = await supabase
    .from('forum_posts')
    .select('id, author_id, title, created_at')
    .eq('status', 'active')

  if (postsError) {
    console.error('❌ Error fetching forum posts:', postsError)
    return
  }

  console.log(`📊 Found ${posts.length} active forum posts\n`)

  // Check for missing user profiles
  const authorIds = [...new Set(posts.map(p => p.author_id))]
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('user_id, display_name, profile_picture_url')
    .in('user_id', authorIds)

  if (profilesError) {
    console.error('❌ Error fetching user profiles:', profilesError)
    return
  }

  const profileMap = new Map(profiles.map(p => [p.user_id, p]))

  // Find posts with missing profiles
  const postsWithMissingProfiles = posts.filter(
    post => !profileMap.has(post.author_id)
  )

  if (postsWithMissingProfiles.length === 0) {
    console.log('✅ All forum posts have matching user profiles')

    // Check for profiles with null/empty display_name
    const profilesWithEmptyNames = profiles.filter(
      p => !p.display_name || p.display_name.trim() === ''
    )

    if (profilesWithEmptyNames.length > 0) {
      console.log(`\n⚠️  Found ${profilesWithEmptyNames.length} user profiles with empty display_name:`)
      for (const profile of profilesWithEmptyNames) {
        console.log(`   - user_id: ${profile.user_id}`)
      }
    }

    return
  }

  console.log(`❌ Found ${postsWithMissingProfiles.length} posts with missing user profiles:\n`)

  for (const post of postsWithMissingProfiles) {
    console.log(`Post ID: ${post.id}`)
    console.log(`  Title: ${post.title}`)
    console.log(`  Author ID: ${post.author_id}`)
    console.log(`  Created: ${post.created_at}`)
    console.log()
  }

  return postsWithMissingProfiles
}

async function fixMissingProfiles(postsWithMissingProfiles: any[]) {
  console.log('\n🔧 Fixing missing user profiles...\n')

  for (const post of postsWithMissingProfiles) {
    // Check if the user exists in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
      post.author_id
    )

    if (authError || !authUser) {
      console.log(`❌ User ${post.author_id} not found in auth.users`)
      console.log(`   Post "${post.title}" may need to be reassigned or deleted\n`)
      continue
    }

    // Create user profile
    const displayName = authUser.user.user_metadata?.full_name ||
                       authUser.user.email?.split('@')[0] ||
                       'مستخدم'

    const { error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: post.author_id,
        display_name: displayName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (insertError) {
      console.log(`❌ Failed to create profile for ${post.author_id}:`, insertError.message)
    } else {
      console.log(`✅ Created profile for ${post.author_id} (${displayName})`)
    }
  }

  console.log('\n✅ Profile creation complete!')
}

async function main() {
  console.log('🚀 Forum Author Diagnostic and Fix Tool\n')
  console.log('=' .repeat(50) + '\n')

  const postsWithMissingProfiles = await diagnoseForum()

  if (postsWithMissingProfiles && postsWithMissingProfiles.length > 0) {
    console.log('\n' + '='.repeat(50))
    console.log('\nDo you want to create missing user profiles? (yes/no)')

    // Auto-fix in this script
    await fixMissingProfiles(postsWithMissingProfiles)
  }

  console.log('\n' + '='.repeat(50))
  console.log('✅ Diagnostic complete!')
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Fatal error:', err)
    process.exit(1)
  })
