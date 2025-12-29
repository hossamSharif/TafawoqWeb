/**
 * Apply RLS fix using direct Supabase REST API
 */

import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

async function applyRLSFix() {
  console.log('🔧 Applying RLS fix to user_profiles...\n')

  // Extract project ref from URL
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  console.log(`Project: ${projectRef}\n`)

  const sql = `DROP POLICY IF EXISTS "Public profile read for forum" ON public.user_profiles;
CREATE POLICY "Public profile read for forum"
  ON public.user_profiles
  FOR SELECT
  TO public
  USING (true);`

  console.log('📝 SQL to execute:')
  console.log(sql)
  console.log('\n🚀 Executing...\n')

  try {
    // Use Supabase SQL endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Request failed:', response.status, response.statusText)
      console.error('Response:', errorText)

      console.log('\n⚠️  The REST API approach did not work.')
      console.log('📋 Please apply this SQL manually in Supabase Dashboard:\n')
      console.log('1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql/new')
      console.log('2. Paste this SQL:\n')
      console.log(sql)
      console.log('\n3. Click "Run"\n')
    } else {
      const result = await response.json()
      console.log('✅ SQL executed successfully!')
      console.log('Result:', result)
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.log('\n⚠️  Automated application failed.')
    console.log('📋 Please apply this SQL manually in Supabase Dashboard:\n')
    console.log('1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql/new')
    console.log('2. Paste this SQL:\n')
    console.log(sql)
    console.log('\n3. Click "Run"\n')
  }

  // Verify after a short delay
  console.log('\n⏳ Waiting 2 seconds before verification...')
  await new Promise(resolve => setTimeout(resolve, 2000))

  console.log('\n🔍 Verifying the fix...')

  try {
    const verifyResponse = await fetch(
      `${supabaseUrl}/rest/v1/forum_posts?select=id,title,author:user_profiles(user_id,display_name)&limit=1`,
      {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        }
      }
    )

    if (verifyResponse.ok) {
      const data = await verifyResponse.json()
      console.log('✅ Verification successful!')
      console.log('Sample post with author:')
      console.log(JSON.stringify(data, null, 2))

      if (data[0]?.author?.display_name && data[0].author.display_name !== 'Unknown') {
        console.log('\n✅✅✅ SUCCESS! Username is now showing correctly!')
      } else {
        console.log('\n⚠️  Still showing "Unknown" - the policy may need a moment to propagate')
        console.log('   Try refreshing your forum page in 10-30 seconds')
      }
    } else {
      console.log('⚠️  Verification query failed')
    }
  } catch (verifyError: any) {
    console.log('⚠️  Verification failed:', verifyError.message)
  }
}

applyRLSFix()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Fatal error:', err)
    process.exit(1)
  })
