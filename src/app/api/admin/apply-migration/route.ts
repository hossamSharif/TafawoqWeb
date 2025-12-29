import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Force Node.js runtime for file system access
export const runtime = 'nodejs'

/**
 * POST /api/admin/apply-migration
 * Applies the check_exam_eligibility migration using service role key
 * This is a one-time admin endpoint to fix Bug #1
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20241218000001_create_check_exam_eligibility_function.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    // Remove comment lines and execute
    const cleanSQL = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n')

    // Execute the SQL directly using the service role
    const { data, error } = await supabase
      .from('_metadata')
      .select('*')
      .limit(1)

    // Try to execute via raw SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ sql: cleanSQL })
    })

    if (!response.ok) {
      // If RPC doesn't exist, return the SQL for manual execution
      return NextResponse.json({
        success: false,
        message: 'RPC exec not available. Please execute SQL manually.',
        sql: migrationSQL,
        instructions: [
          '1. Go to Supabase Dashboard → SQL Editor',
          '2. Copy the SQL below',
          '3. Execute in SQL Editor',
          '4. Verify with: SELECT * FROM check_exam_eligibility(\'42ca4e44-e668-4c95-86f9-1d9dfd30ee45\');'
        ]
      }, { status: 200 })
    }

    const result = await response.json()

    // Verify the function was created
    const { data: testData, error: testError } = await supabase.rpc('check_exam_eligibility', {
      p_user_id: '42ca4e44-e668-4c95-86f9-1d9dfd30ee45'
    })

    if (testError) {
      return NextResponse.json({
        success: false,
        message: 'Function created but verification failed',
        error: testError.message,
        sql: migrationSQL
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Migration applied successfully!',
      testResult: testData
    })

  } catch (error: any) {
    console.error('Migration error:', error)

    // Return SQL for manual execution
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20241218000001_create_check_exam_eligibility_function.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    return NextResponse.json({
      success: false,
      message: 'Migration failed. Please apply manually.',
      error: error.message,
      sql: migrationSQL,
      instructions: [
        '1. Go to Supabase Dashboard → SQL Editor',
        '2. Copy the SQL from the response',
        '3. Execute in SQL Editor'
      ]
    }, { status: 500 })
  }
}
