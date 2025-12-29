/**
 * Test the actual forum API endpoint
 */

import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env.local') })

async function testForumAPI() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? 'http://localhost:3000'
    : 'http://localhost:3000'

  const apiUrl = `${baseUrl}/api/forum/posts?limit=5&sort=newest`

  console.log('🔍 Testing forum API endpoint...')
  console.log(`URL: ${apiUrl}\n`)

  try {
    const response = await fetch(apiUrl)
    const data = await response.json()

    console.log('✅ API Response:')
    console.log(JSON.stringify(data, null, 2))

    if (data.posts && data.posts.length > 0) {
      console.log('\n📊 Author data from first post:')
      const firstPost = data.posts[0]
      console.log(`Post ID: ${firstPost.id}`)
      console.log(`Title: ${firstPost.title}`)
      console.log(`Author ID: ${firstPost.author?.id}`)
      console.log(`Display Name: ${firstPost.author?.display_name}`)
      console.log(`Profile Picture: ${firstPost.author?.profile_picture_url}`)
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testForumAPI()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
