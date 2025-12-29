import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyBugFixes() {
  console.log('🔧 Starting bug fixes...\n');

  // Bug #1: Apply check_exam_eligibility function
  console.log('📝 Bug #1: Creating check_exam_eligibility function...');

  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20241218000001_create_check_exam_eligibility_function.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  // Remove comments and split into statements
  const cleanSQL = migrationSQL
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');

  try {
    // Execute the function creation
    const { error: execError } = await supabase.rpc('exec', {
      sql: cleanSQL
    });

    if (execError) {
      console.log('⚠️  RPC exec not available, trying direct query...');

      // Try using the REST API directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ query: cleanSQL })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to execute via REST API:', errorText);
        console.log('\n⚠️  Please apply migration manually via Supabase dashboard:');
        console.log('   1. Go to Supabase Dashboard → SQL Editor');
        console.log('   2. Copy contents of: supabase/migrations/20241218000001_create_check_exam_eligibility_function.sql');
        console.log('   3. Execute the SQL\n');
        return false;
      }
    }

    console.log('✅ Function created successfully!\n');

    // Verify the function works
    console.log('🔍 Verifying function with test query...');
    const { data: testData, error: testError } = await supabase.rpc('check_exam_eligibility', {
      p_user_id: '42ca4e44-e668-4c95-86f9-1d9dfd30ee45'
    });

    if (testError) {
      console.error('❌ Error verifying function:', testError);
      return false;
    }

    console.log('✅ Function verified! Test result:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('');

    return true;
  } catch (error) {
    console.error('❌ Error applying Bug #1 fix:', error);
    return false;
  }
}

async function main() {
  const success = await applyBugFixes();

  if (success) {
    console.log('✅ All fixes applied successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Bug #2 (Library auth) requires code fix - checking AuthContext...');
    console.log('   2. Refresh browser to test exam creation');
    console.log('   3. Resume automated testing\n');
  } else {
    console.log('⚠️  Some fixes require manual intervention.');
    console.log('   See instructions above.\n');
  }
}

main().catch(console.error);
