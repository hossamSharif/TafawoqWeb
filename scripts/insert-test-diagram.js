/**
 * Script to insert test diagram data into Question 2
 * Run with: node scripts/insert-test-diagram.js
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function insertDiagramData() {
  console.log('🔄 Inserting test diagram data into Question 2...')

  const examId = 'f0d2042d-3364-4bf6-b93a-6a8a41a00107'
  const questionId = 'quant_0_02'

  // 1. Fetch the exam session
  const { data: session, error: fetchError } = await supabase
    .from('exam_sessions')
    .select('questions')
    .eq('id', examId)
    .single()

  if (fetchError || !session) {
    console.error('❌ Error fetching exam session:', fetchError)
    process.exit(1)
  }

  console.log('✅ Fetched exam session')
  console.log('📊 Total questions:', session.questions.length)

  // 2. Find and update the specific question
  const questions = session.questions
  const questionIndex = questions.findIndex(q => q.id === questionId)

  if (questionIndex === -1) {
    console.error('❌ Question not found:', questionId)
    process.exit(1)
  }

  console.log(`✅ Found question at index ${questionIndex}`)

  // 3. Add diagram data to the question
  const diagramData = {
    type: 'composite-shape',
    data: {
      shapes: [
        {
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 12,
          height: 6
        },
        {
          type: 'circle',
          cx: 12,
          cy: 3,
          radius: 2,
          half: true
        }
      ],
      labels: ['12 سم', '6 سم', 'نق = 2 سم'],
      shaded: true
    },
    renderHint: 'SVG',
    caption: 'مستطيل متصل بنصف دائرة'
  }

  questions[questionIndex].diagram = diagramData

  // 4. Update the exam session with the modified questions array
  const { data: updateData, error: updateError } = await supabase
    .from('exam_sessions')
    .update({ questions })
    .eq('id', examId)
    .select('questions')
    .single()

  if (updateError) {
    console.error('❌ Error updating exam session:', updateError)
    process.exit(1)
  }

  console.log('✅ Diagram data inserted successfully')

  // 5. Verify the update
  const updatedQuestion = updateData.questions[questionIndex]
  console.log('🔍 Verification:', {
    question_id: updatedQuestion.id,
    question_type: updatedQuestion.questionType,
    has_diagram: !!updatedQuestion.diagram,
    diagram_type: updatedQuestion.diagram?.type,
    render_hint: updatedQuestion.diagram?.renderHint,
    shapes_count: updatedQuestion.diagram?.data?.shapes?.length,
    diagram_data: JSON.stringify(updatedQuestion.diagram, null, 2)
  })
}

insertDiagramData()
  .then(() => {
    console.log('✨ Done!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('💥 Unexpected error:', err)
    process.exit(1)
  })
