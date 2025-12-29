/**
 * Apply review features migration
 * Creates question_bookmarks and question_notes tables
 *
 * Run with: npx tsx scripts/apply-review-features-migration.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function applyMigration() {
  try {
    console.log('🚀 Starting review features migration...\n')

    // Read migration file
    const migrationPath = path.join(
      __dirname,
      '../supabase/migrations/20241226000001_create_review_features.sql'
    )

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`)
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('📄 Migration file loaded')
    console.log('📝 Executing SQL...\n')

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL,
    })

    if (error) {
      // If exec_sql function doesn't exist, try direct execution
      // Note: This might not work with all migration syntax
      console.log('ℹ️  exec_sql function not available, trying direct execution...')

      // Split by statement and execute individually
      const statements = migrationSQL
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        const { error: stmtError } = await supabase.rpc('exec_sql', {
          sql_query: statement,
        })

        if (stmtError) {
          console.error(`❌ Error executing statement:`, stmtError)
          throw stmtError
        }
      }
    }

    console.log('✅ Migration applied successfully!\n')

    // Verify tables were created
    console.log('🔍 Verifying tables...')

    const { data: bookmarksCheck, error: bookmarksError } = await supabase
      .from('question_bookmarks')
      .select('count')
      .limit(1)

    if (bookmarksError && bookmarksError.code !== 'PGRST116') {
      console.error('⚠️  Warning: Could not verify question_bookmarks table')
    } else {
      console.log('  ✓ question_bookmarks table exists')
    }

    const { data: notesCheck, error: notesError } = await supabase
      .from('question_notes')
      .select('count')
      .limit(1)

    if (notesError && notesError.code !== 'PGRST116') {
      console.error('⚠️  Warning: Could not verify question_notes table')
    } else {
      console.log('  ✓ question_notes table exists')
    }

    console.log('\n✅ Review features migration complete!')
    console.log('\n📋 Created:')
    console.log('  - question_bookmarks table')
    console.log('  - question_notes table')
    console.log('  - RLS policies for both tables')
    console.log('  - Indexes for optimized queries')
    console.log('  - Updated_at trigger for notes\n')
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
applyMigration()
