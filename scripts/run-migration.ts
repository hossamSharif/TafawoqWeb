import { config } from 'dotenv'
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function runMigration() {
  console.log('Running migration to add generation_in_progress column...')
  console.log('Supabase URL:', supabaseUrl)

  const sql = `ALTER TABLE practice_sessions ADD COLUMN IF NOT EXISTS generation_in_progress BOOLEAN DEFAULT FALSE;`

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ sql_query: sql })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.log('RPC exec_sql not available:', errorText)
      console.log('')
      console.log('Please run this SQL manually in the Supabase Dashboard SQL Editor:')
      console.log('')
      console.log(sql)
      return
    }

    console.log('Migration applied successfully!')
  } catch (error) {
    console.error('Error:', error)
    console.log('')
    console.log('Please run this SQL manually in the Supabase Dashboard SQL Editor:')
    console.log('')
    console.log(sql)
  }
}

runMigration()
