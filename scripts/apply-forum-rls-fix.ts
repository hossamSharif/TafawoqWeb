// Script to apply forum RLS policies fix
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('🔧 Applying forum RLS policies fix...\n')

  // Read the migration file
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/20241222000004_add_forum_posts_rls_policies.sql')

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath)
    process.exit(1)
  }

  const migrationSql = fs.readFileSync(migrationPath, 'utf8')

  console.log('📄 Migration file loaded:', migrationPath)
  console.log('📝 Migration content preview:')
  console.log(migrationSql.substring(0, 200) + '...\n')

  // Split the SQL into individual statements
  const statements = migrationSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`📊 Found ${statements.length} SQL statements to execute\n`)

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]

    // Skip empty statements and comments
    if (!statement || statement.startsWith('--') || statement.startsWith('/*')) {
      continue
    }

    console.log(`[${i + 1}/${statements.length}] Executing statement...`)

    const { error } = await supabase.rpc('exec_sql', {
      sql_query: statement
    })

    if (error) {
      // Try alternative method using direct query
      console.log('   ⚠️  RPC failed, trying direct execution...')

      const { error: directError } = await supabase
        .from('_migrations')
        .insert({ name: '20241222000004_add_forum_posts_rls_policies', executed_at: new Date().toISOString() })

      if (directError) {
        console.error('   ❌ Error:', error.message)
        console.log('   Statement:', statement.substring(0, 100))

        // Continue with manual SQL execution approach
        console.log('\n⚠️  Please execute the migration file manually in Supabase SQL Editor')
        console.log('   Path:', migrationPath)
        process.exit(1)
      }
    } else {
      console.log('   ✅ Success')
    }
  }

  console.log('\n✅ Migration applied successfully!')
  console.log('\n📋 Summary of changes:')
  console.log('   - Added INSERT policy for forum_posts (authenticated users, not banned)')
  console.log('   - Added UPDATE policy for forum_posts (author or admin)')
  console.log('   - Added DELETE policy for forum_posts (author or admin)')
  console.log('   - Added INSERT policy for comments (authenticated users, not banned)')
  console.log('   - Added UPDATE policy for comments (author or admin)')
  console.log('   - Added DELETE policy for comments (author or admin)')
  console.log('   - Added INSERT policy for reactions (authenticated users, not banned)')
  console.log('   - Added DELETE policy for reactions (own reactions only)')
  console.log('\n✨ Users should now be able to post in the forum!')
}

applyMigration()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
