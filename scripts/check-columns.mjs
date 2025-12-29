import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkColumns() {
  console.log('Checking for monthly limit columns...\n')

  const { data, error } = await supabase
    .from('user_credits')
    .select('share_credits_exam_monthly_limit, share_credits_practice_monthly_limit')
    .limit(1)

  if (error) {
    if (error.message.includes('column') || error.message.includes('does not exist')) {
      console.log('❌ Columns DO NOT exist yet')
      console.log('Error:', error.message)
      console.log('\n💡 You need to add these columns in Supabase SQL Editor:')
      console.log('\nALTER TABLE public.user_credits')
      console.log('ADD COLUMN IF NOT EXISTS share_credits_exam_monthly_limit integer,')
      console.log('ADD COLUMN IF NOT EXISTS share_credits_practice_monthly_limit integer;')
      return false
    } else {
      console.log('❌ Unexpected error:', error.message)
      return false
    }
  }

  console.log('✅ Columns exist!')
  console.log('Sample data:', data)
  return true
}

checkColumns()
