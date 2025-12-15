/**
 * Test Claude API connection
 * Run: npx tsx scripts/test-claude.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

import Anthropic from '@anthropic-ai/sdk'

async function testConnection() {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY environment variable not set')
    console.log('Set it with: export ANTHROPIC_API_KEY=sk-ant-...')
    process.exit(1)
  }

  console.log('Testing Claude API connection...')
  console.log('API Key prefix:', apiKey.substring(0, 15) + '...')

  const anthropic = new Anthropic({
    apiKey,
  })

  try {
    const startTime = Date.now()
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{ role: 'user', content: 'مرحبا، هل يمكنك التحدث بالعربية؟ اجب بجملة واحدة فقط.' }],
    })
    const durationMs = Date.now() - startTime

    console.log('\n--- Response ---')
    const textContent = response.content.find((block) => block.type === 'text')
    if (textContent && textContent.type === 'text') {
      console.log('Response:', textContent.text)
    }

    console.log('\n--- Usage ---')
    console.log('Input tokens:', response.usage.input_tokens)
    console.log('Output tokens:', response.usage.output_tokens)
    console.log('Duration:', durationMs, 'ms')

    console.log('\n✅ Claude API connection successful!')
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

testConnection()
