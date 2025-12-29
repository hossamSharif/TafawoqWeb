#!/usr/bin/env node
/**
 * Verify the forum RLS fix is working
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Testing forum author display fix...\n');

const { data, error } = await supabase
  .from('forum_posts')
  .select('id, title, author:user_profiles(user_id, display_name)')
  .limit(1);

if (error) {
  console.error('❌ Query failed:', error.message);
  process.exit(1);
}

if (data && data.length > 0) {
  const post = data[0];
  console.log('Post:', post.title);
  console.log('Author:', post.author?.display_name || 'NULL');

  if (post.author?.display_name && post.author.display_name !== 'Unknown') {
    console.log('\n✅ SUCCESS! The fix is working!');
    console.log('   Now clear your .next cache and restart:');
    console.log('   rm -rf .next && npm run dev\n');
  } else {
    console.log('\n❌ Still showing as Unknown or NULL');
    console.log('   Make sure you ran the SQL in Supabase Dashboard\n');
  }
} else {
  console.log('⚠️  No forum posts found');
}
