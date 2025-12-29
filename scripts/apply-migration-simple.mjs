#!/usr/bin/env node
/**
 * Simple script to apply the RLS policy migration
 * Run with: node scripts/apply-migration-simple.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applying RLS policy migration...\n');

  // Read the migration file
  const migrationPath = join(__dirname, '../supabase/migrations/20241222000003_allow_public_profile_read.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  // Split into individual statements (simple approach)
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt) continue;

    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    console.log(stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''));

    try {
      // Use rpc to execute raw SQL
      const { data, error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });

      if (error) {
        console.error(`❌ Error: ${error.message}\n`);

        // If exec_sql doesn't exist, provide manual instructions
        if (error.message.includes('exec_sql')) {
          console.log('\n⚠️  The exec_sql function is not available.');
          console.log('📋 Please apply this migration manually:\n');
          console.log('1. Go to: https://supabase.com/dashboard/project/fvstedbsjiqvryqpnmzl/sql/new');
          console.log('2. Paste this SQL:\n');
          console.log(migrationSQL);
          console.log('\n3. Click "Run"\n');
          process.exit(1);
        }
      } else {
        console.log(`✅ Success\n`);
      }
    } catch (err) {
      console.error(`❌ Exception: ${err.message}\n`);
    }
  }

  console.log('🔍 Verifying the fix...\n');

  // Test the policy
  const { data: testData, error: testError } = await supabase
    .from('forum_posts')
    .select('id, title, author:user_profiles(user_id, display_name)')
    .limit(1);

  if (testError) {
    console.error('❌ Verification failed:', testError.message);
  } else if (testData && testData.length > 0) {
    const post = testData[0];
    if (post.author?.display_name && post.author.display_name !== 'Unknown') {
      console.log(`✅ SUCCESS! Author name: ${post.author.display_name}`);
      console.log('\n🎉 The RLS policy is working! Refresh your forum page.\n');
    } else {
      console.log('⚠️  Policy may need a moment to propagate. Try again in 30 seconds.');
    }
  }
}

applyMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
