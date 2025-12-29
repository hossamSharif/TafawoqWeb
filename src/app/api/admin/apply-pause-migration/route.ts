import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  // Verify admin access via secret header
  const authHeader = request.headers.get('x-admin-secret')
  const adminSecret = process.env.ADMIN_SECRET || 'apply-migration-secret'

  if (authHeader !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Missing Supabase configuration' },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  })

  const results: { sql: string; success: boolean; error?: string }[] = []

  // Migration SQL statements
  const migrations = [
    {
      name: 'Add paused_at to exam_sessions',
      sql: `ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ NULL`
    },
    {
      name: 'Add remaining_time_seconds to exam_sessions',
      sql: `ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS remaining_time_seconds INTEGER NULL`
    },
    {
      name: 'Add paused_at to practice_sessions',
      sql: `ALTER TABLE practice_sessions ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ NULL`
    },
  ]

  // Try to execute each migration using the postgres extension
  for (const migration of migrations) {
    try {
      // Use the query method which can run raw SQL with service role
      const { error } = await supabase.rpc('exec_raw_sql', {
        query: migration.sql
      }).maybeSingle()

      if (error) {
        results.push({
          sql: migration.name,
          success: false,
          error: error.message
        })
      } else {
        results.push({
          sql: migration.name,
          success: true
        })
      }
    } catch (err) {
      results.push({
        sql: migration.name,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }

  // Check if columns exist now
  const { error: checkError } = await supabase
    .from('exam_sessions')
    .select('paused_at, remaining_time_seconds')
    .limit(1)

  const columnsExist = !checkError?.message?.includes('does not exist')

  return NextResponse.json({
    results,
    columnsExist,
    message: columnsExist
      ? 'Migration columns exist'
      : 'Please run the migration manually in Supabase SQL Editor',
    migrationSql: migrations.map(m => m.sql + ';').join('\n')
  })
}
