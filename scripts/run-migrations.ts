/**
 * Migration Runner for GAT Exam Platform v3.0
 * Runs database migrations using Supabase service role
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface Migration {
  name: string;
  sql: string;
}

async function runMigration(migration: Migration): Promise<boolean> {
  console.log(`\n📝 Running migration: ${migration.name}`);
  console.log('─'.repeat(60));

  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migration.sql
    });

    if (error) {
      // If exec_sql function doesn't exist, try direct query
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('⚠️  exec_sql function not found, trying direct query...');

        // Split migration into statements and execute one by one
        const statements = migration.sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
          const { error: stmtError } = await (supabase as any)
            .from('_migrations')
            .select('*')
            .limit(0)
            .then(() => supabase.rpc('exec', { query: statement }));

          if (stmtError) {
            throw stmtError;
          }
        }
      } else {
        throw error;
      }
    }

    console.log(`✅ Migration completed: ${migration.name}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Migration failed: ${migration.name}`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 GAT Exam Platform v3.0 - Database Migration Runner');
  console.log('='.repeat(60));

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

  // Read all migration files in order
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  if (migrationFiles.length === 0) {
    console.log('⚠️  No migration files found');
    return;
  }

  console.log(`\n📁 Found ${migrationFiles.length} migration files:`);
  migrationFiles.forEach(file => console.log(`   - ${file}`));

  const migrations: Migration[] = migrationFiles.map(file => ({
    name: file,
    sql: fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
  }));

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (success) {
      successCount++;
    } else {
      failCount++;
      console.log('\n⚠️  Migration failed. Stopping execution.');
      break;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📝 Total: ${migrations.length}`);

  if (failCount > 0) {
    console.log('\n⚠️  Some migrations failed. Please check the errors above.');
    console.log('   You may need to run migrations manually via Supabase Dashboard.');
    process.exit(1);
  } else {
    console.log('\n✅ All migrations completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify tables: npm run verify-schema');
    console.log('   2. Generate types: npm run generate:types');
    console.log('   3. Continue with Phase 2 implementation');
  }
}

main().catch(error => {
  console.error('\n❌ Migration runner error:', error);
  process.exit(1);
});
