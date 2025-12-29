import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please check .env.local');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'set' : 'missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'set' : 'missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// User IDs
const HALABIJA_USER_ID = 'dc92cefa-b9f2-40ca-b794-418bf26fb29b';
const ADMIN_USER_ID = '8c826d8b-a2ec-4fd3-971c-a34e2a87fa2f';

// Exam session ID we created
const LITERARY_EXAM_SESSION_ID = '44281697-127d-467a-bf06-e275920734e5';

async function seedLiteraryExam() {
  console.log('Seeding literary exam for halabija@gmail.com...');

  // Read the literary exam JSON
  const examPath = path.join(__dirname, '..', 'examAndPracticingTemplate', 'examLeteraly.json');
  const examData = JSON.parse(fs.readFileSync(examPath, 'utf8'));

  // Update the exam session with actual questions
  const { error: updateError } = await supabase
    .from('exam_sessions')
    .update({
      questions: examData.questions
    })
    .eq('id', LITERARY_EXAM_SESSION_ID);

  if (updateError) {
    console.error('Error updating exam session:', updateError);
    return;
  }

  console.log('Updated exam session with questions');

  // Generate answers - simulate ~76% correct overall
  // Verbal: ~78% correct (52/67)
  // Quantitative: ~72% correct (21/29)
  const answers = [];
  let verbalCorrect = 0;
  let quantCorrect = 0;

  for (let i = 0; i < examData.questions.length; i++) {
    const question = examData.questions[i];
    const isVerbal = question.section === 'verbal';

    // Determine if answer should be correct based on target percentages
    let shouldBeCorrect: boolean;
    if (isVerbal) {
      shouldBeCorrect = verbalCorrect < 52 && Math.random() < 0.78;
      if (shouldBeCorrect) verbalCorrect++;
    } else {
      shouldBeCorrect = quantCorrect < 21 && Math.random() < 0.72;
      if (shouldBeCorrect) quantCorrect++;
    }

    const selectedAnswer = shouldBeCorrect
      ? question.answerIndex
      : (question.answerIndex + 1 + Math.floor(Math.random() * 3)) % 4;

    answers.push({
      user_id: HALABIJA_USER_ID,
      session_id: LITERARY_EXAM_SESSION_ID,
      session_type: 'exam',
      question_id: question.id,
      question_index: i,
      selected_answer: selectedAnswer,
      is_correct: selectedAnswer === question.answerIndex,
      time_spent_seconds: Math.floor(30 + Math.random() * 90),
      explanation_viewed: Math.random() < 0.3
    });
  }

  // Insert answers
  const { error: answersError } = await supabase
    .from('answers')
    .insert(answers);

  if (answersError) {
    console.error('Error inserting answers:', answersError);
    return;
  }

  // Count actual correct answers
  const actualVerbalCorrect = answers.filter((a, i) =>
    examData.questions[i].section === 'verbal' && a.is_correct
  ).length;
  const actualQuantCorrect = answers.filter((a, i) =>
    examData.questions[i].section === 'quantitative' && a.is_correct
  ).length;

  const verbalScore = Math.round((actualVerbalCorrect / 67) * 100);
  const quantScore = Math.round((actualQuantCorrect / 29) * 100);
  const overallScore = Math.round(((actualVerbalCorrect + actualQuantCorrect) / 96) * 100);

  console.log(`Verbal: ${actualVerbalCorrect}/67 = ${verbalScore}%`);
  console.log(`Quantitative: ${actualQuantCorrect}/29 = ${quantScore}%`);
  console.log(`Overall: ${overallScore}%`);

  // Update exam session with final scores
  const { error: scoreError } = await supabase
    .from('exam_sessions')
    .update({
      verbal_score: verbalScore,
      quantitative_score: quantScore,
      overall_score: overallScore
    })
    .eq('id', LITERARY_EXAM_SESSION_ID);

  if (scoreError) {
    console.error('Error updating scores:', scoreError);
    return;
  }

  // Create exam_results record
  const { error: resultsError } = await supabase
    .from('exam_results')
    .insert({
      exam_session_id: LITERARY_EXAM_SESSION_ID,
      user_id: HALABIJA_USER_ID,
      verbal_score: verbalScore,
      quantitative_score: quantScore,
      strengths: ['vocabulary', 'analogy', 'reading-comprehension'],
      weaknesses: ['probability', 'algebra'],
      improvement_advice: 'ركز على تحسين مهارات الجبر والاحتمالات من خلال حل المزيد من المسائل المتنوعة.'
    });

  if (resultsError) {
    console.error('Error creating exam results:', resultsError);
    return;
  }

  // Upsert user_analytics
  const { error: analyticsError } = await supabase
    .from('user_analytics')
    .upsert({
      user_id: HALABIJA_USER_ID,
      last_exam_verbal_score: verbalScore,
      last_exam_quantitative_score: quantScore,
      last_exam_overall_average: overallScore,
      total_exams_completed: 1,
      total_practices_completed: 0,
      strongest_category: 'vocabulary',
      weakest_category: 'probability',
      last_activity_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

  if (analyticsError) {
    console.error('Error updating analytics:', analyticsError);
    return;
  }

  console.log('Literary exam seeded successfully!');
}

async function seedScienceExamLibrary() {
  console.log('\nSeeding science exam for admin library...');

  // Read the science exam JSON
  const examPath = path.join(__dirname, '..', 'examAndPracticingTemplate', 'examScience.json');
  const examData = JSON.parse(fs.readFileSync(examPath, 'utf8'));

  // Create exam session for admin library content
  const { data: examSession, error: examError } = await supabase
    .from('exam_sessions')
    .insert({
      user_id: ADMIN_USER_ID,
      track: 'scientific',
      status: 'completed',
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      total_questions: examData.questions.length,
      questions_answered: 0,
      time_spent_seconds: 0,
      questions: examData.questions,
      generated_batches: 10,
      generation_context: {},
      generation_in_progress: false
    })
    .select()
    .single();

  if (examError) {
    console.error('Error creating science exam session:', examError);
    return;
  }

  console.log('Created science exam session:', examSession.id);

  // Create forum post for library visibility
  const { data: forumPost, error: postError } = await supabase
    .from('forum_posts')
    .insert({
      author_id: ADMIN_USER_ID,
      post_type: 'exam_share',
      title: 'اختبار قدرات علمي شامل - 96 سؤال',
      body: 'اختبار قدرات كامل للمسار العلمي يحتوي على 57 سؤال كمي و 39 سؤال لفظي. يغطي جميع المواضيع المطلوبة في اختبار القدرات.',
      shared_exam_id: examSession.id,
      like_count: 15,
      love_count: 8,
      comment_count: 3,
      completion_count: 25,
      status: 'active'
    })
    .select()
    .single();

  if (postError) {
    console.error('Error creating forum post:', postError);
    return;
  }

  console.log('Created forum post:', forumPost.id);
  console.log('Science exam library content seeded successfully!');
}

async function main() {
  try {
    await seedLiteraryExam();
    await seedScienceExamLibrary();
    console.log('\n✅ All test data seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

main();
