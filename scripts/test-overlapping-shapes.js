/**
 * Test Script: Overlapping Shapes Rendering
 *
 * This script injects sample overlapping shapes questions into an exam session
 * to test the JSXGraphRenderer implementation.
 *
 * Usage: node scripts/test-overlapping-shapes.js
 *
 * After running, navigate to the exam session in the browser to verify rendering.
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fvstedbsjiqvryqpnmzl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2c3RlZGJzamlxdnJ5cXBubXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODEzNTI3OSwiZXhwIjoyMDczNzExMjc5fQ.KWmtmoPziqWBGMKzknqbA9K6zVnf6J5iQmu8HdbGnHY';

const supabase = createClient(supabaseUrl, supabaseKey);

// All 8 overlapping shape patterns with test data
const overlappingShapesQuestions = [
  // Pattern 1: Square with Corner Circles (Easy)
  {
    questionType: 'overlapping-diagram',
    topic: 'geometry',
    subtopic: 'overlapping-shapes',
    difficulty: 'easy',
    stem: 'في الشكل التالي، مربع طول ضلعه 10 سم، وفي كل زاوية ربع دائرة نصف قطرها 2 سم. أوجد مساحة المنطقة المظللة.',
    choices: [
      { text: '100 - 4π سم²', isCorrect: true },
      { text: '100 - 16π سم²', isCorrect: false },
      { text: '100 - π سم²', isCorrect: false },
      { text: '96 سم²', isCorrect: false },
    ],
    explanation: 'مساحة المربع = 10² = 100 سم². مساحة الأرباع الأربعة = 4 × (π × 2² / 4) = 4π سم². المنطقة المظللة = 100 - 4π سم²',
    diagram: {
      type: 'overlapping-shapes',
      renderHint: 'JSXGraph',
      data: {
        subtype: 'square-with-corner-circles',
        dimensions: { side: 10, radius: 2 },
        shading: {
          region: 'outer',
          color: '#3B82F6',
          opacity: 0.4
        }
      },
      caption: 'مربع مع أرباع دوائر في الزوايا - المنطقة المظللة هي المنطقة خارج الدوائر'
    },
    formulaUsed: 'المساحة المظللة = مساحة المربع - مساحة الأرباع الأربعة'
  },

  // Pattern 2: Square Vertex at Circle Center (Medium)
  {
    questionType: 'overlapping-diagram',
    topic: 'geometry',
    subtopic: 'overlapping-shapes',
    difficulty: 'medium',
    stem: 'مربع طول ضلعه 8 سم، مركز إحدى زواياه على محيط دائرة نصف قطرها 8 سم. أوجد مساحة المنطقة المشتركة.',
    choices: [
      { text: '16π سم²', isCorrect: true },
      { text: '64π سم²', isCorrect: false },
      { text: '8π سم²', isCorrect: false },
      { text: '32π سم²', isCorrect: false },
    ],
    explanation: 'المنطقة المشتركة هي ربع الدائرة. مساحة ربع الدائرة = (π × 8²) / 4 = 16π سم²',
    diagram: {
      type: 'overlapping-shapes',
      renderHint: 'JSXGraph',
      data: {
        subtype: 'square-vertex-at-circle-center',
        dimensions: { side: 8, radius: 8 },
        shading: {
          region: 'intersection',
          color: '#10B981',
          opacity: 0.4
        }
      },
      caption: 'مربع مع زاوية على مركز دائرة - المنطقة المشتركة مظللة'
    },
    formulaUsed: 'مساحة ربع الدائرة = πr²/4'
  },

  // Pattern 3: Rose Pattern in Square (Hard)
  {
    questionType: 'overlapping-diagram',
    topic: 'geometry',
    subtopic: 'overlapping-shapes',
    difficulty: 'hard',
    stem: 'في الشكل التالي، مربع طول ضلعه 12 سم، ومن كل زاوية رُسم ربع دائرة نصف قطرها يساوي طول ضلع المربع. أوجد مساحة المنطقة المظللة (البتلات).',
    choices: [
      { text: '144(π - 2) سم²', isCorrect: false },
      { text: '72(π - 2) سم²', isCorrect: true },
      { text: '144π - 288 سم²', isCorrect: false },
      { text: '36π سم²', isCorrect: false },
    ],
    explanation: 'نمط الوردة: البتلات = 2 × (مساحة نصف دائرة - مساحة المثلث). المساحة = 72(π - 2) سم²',
    diagram: {
      type: 'overlapping-shapes',
      renderHint: 'JSXGraph',
      data: {
        subtype: 'rose-pattern-in-square',
        dimensions: { side: 12 },
        shading: {
          region: 'petals',
          color: '#EC4899',
          opacity: 0.4
        }
      },
      caption: 'نمط الوردة في مربع - البتلات مظللة'
    },
    formulaUsed: 'مساحة البتلات = 2 × (مساحة نصف دائرة - مساحة مثلث قائم)'
  },

  // Pattern 4: Three Tangent Circles (Hard)
  {
    questionType: 'overlapping-diagram',
    topic: 'geometry',
    subtopic: 'overlapping-shapes',
    difficulty: 'hard',
    stem: 'ثلاث دوائر متماسة خارجياً، نصف قطر كل منها 5 سم. أوجد مساحة المنطقة المحصورة بين الدوائر الثلاث.',
    choices: [
      { text: '25√3 - 12.5π سم²', isCorrect: true },
      { text: '25√3 سم²', isCorrect: false },
      { text: '75π سم²', isCorrect: false },
      { text: '25(√3 - π) سم²', isCorrect: false },
    ],
    explanation: 'مساحة المثلث المتساوي الأضلاع = (√3/4) × (10)² = 25√3. مجموع القطاعات = 3 × (60°/360°) × π × 5² = 12.5π. المساحة = 25√3 - 12.5π',
    diagram: {
      type: 'overlapping-shapes',
      renderHint: 'JSXGraph',
      data: {
        subtype: 'three-tangent-circles',
        dimensions: { radius: 5 },
        shading: {
          region: 'center-gap',
          color: '#F59E0B',
          opacity: 0.4
        }
      },
      caption: 'ثلاث دوائر متماسة - المنطقة المحصورة مظللة'
    },
    formulaUsed: 'المساحة = مساحة المثلث - مجموع القطاعات الدائرية'
  },

  // Pattern 5: Inscribed Circle in Square (Easy)
  {
    questionType: 'overlapping-diagram',
    topic: 'geometry',
    subtopic: 'overlapping-shapes',
    difficulty: 'easy',
    stem: 'دائرة محاطة داخل مربع طول ضلعه 14 سم. أوجد مساحة المنطقة بين المربع والدائرة.',
    choices: [
      { text: '196 - 49π سم²', isCorrect: true },
      { text: '196 - 196π سم²', isCorrect: false },
      { text: '49π سم²', isCorrect: false },
      { text: '147 سم²', isCorrect: false },
    ],
    explanation: 'نصف قطر الدائرة = 14/2 = 7 سم. مساحة المربع = 196 سم². مساحة الدائرة = 49π سم². المنطقة = 196 - 49π سم²',
    diagram: {
      type: 'overlapping-shapes',
      renderHint: 'JSXGraph',
      data: {
        subtype: 'inscribed-circle-in-square',
        dimensions: { side: 14 },
        shading: {
          region: 'corners',
          color: '#8B5CF6',
          opacity: 0.4
        }
      },
      caption: 'دائرة داخل مربع - الزوايا مظللة'
    },
    formulaUsed: 'المساحة = مساحة المربع - مساحة الدائرة'
  },

  // Pattern 6: Inscribed Square in Circle (Easy)
  {
    questionType: 'overlapping-diagram',
    topic: 'geometry',
    subtopic: 'overlapping-shapes',
    difficulty: 'easy',
    stem: 'مربع محاط داخل دائرة نصف قطرها 10 سم. أوجد مساحة المنطقة بين الدائرة والمربع.',
    choices: [
      { text: '100π - 200 سم²', isCorrect: true },
      { text: '100π - 100 سم²', isCorrect: false },
      { text: '200 سم²', isCorrect: false },
      { text: '100π سم²', isCorrect: false },
    ],
    explanation: 'قطر المربع = قطر الدائرة = 20 سم. ضلع المربع = 20/√2 = 10√2. مساحة المربع = 200 سم². مساحة الدائرة = 100π سم². المنطقة = 100π - 200 سم²',
    diagram: {
      type: 'overlapping-shapes',
      renderHint: 'JSXGraph',
      data: {
        subtype: 'inscribed-square-in-circle',
        dimensions: { radius: 10 },
        shading: {
          region: 'crescents',
          color: '#14B8A6',
          opacity: 0.4
        }
      },
      caption: 'مربع داخل دائرة - الأقواس مظللة'
    },
    formulaUsed: 'المساحة = مساحة الدائرة - مساحة المربع'
  },

  // Pattern 7: Overlapping Semicircles (Medium)
  {
    questionType: 'overlapping-diagram',
    topic: 'geometry',
    subtopic: 'overlapping-shapes',
    difficulty: 'medium',
    stem: 'نصفا دائرتين متقاطعتين، نصف قطر كل منهما 6 سم، والمسافة بين مركزيهما 6 سم. أوجد مساحة التقاطع.',
    choices: [
      { text: '18π - 18√3 سم²', isCorrect: true },
      { text: '36π سم²', isCorrect: false },
      { text: '18π سم²', isCorrect: false },
      { text: '9π سم²', isCorrect: false },
    ],
    explanation: 'مساحة التقاطع = مساحة قطاعين - مساحة مثلثين. القطاع = 120° من دائرة. المساحة = 18π - 18√3 سم²',
    diagram: {
      type: 'overlapping-shapes',
      renderHint: 'JSXGraph',
      data: {
        subtype: 'overlapping-semicircles',
        dimensions: { radius: 6, distance: 6 },
        shading: {
          region: 'intersection',
          color: '#F97316',
          opacity: 0.4
        }
      },
      caption: 'نصفا دائرتين متقاطعتين - التقاطع مظلل'
    },
    formulaUsed: 'مساحة التقاطع = 2 × (مساحة القطاع - مساحة المثلث)'
  },

  // Pattern 8: Quarter Circles in Square (Medium)
  {
    questionType: 'overlapping-diagram',
    topic: 'geometry',
    subtopic: 'overlapping-shapes',
    difficulty: 'medium',
    stem: 'مربع طول ضلعه 8 سم، ومن كل زاوية متجاورة رُسم ربع دائرة. أوجد مساحة المنطقة المشتركة بين ربعي الدائرتين.',
    choices: [
      { text: '32π - 64 سم²', isCorrect: true },
      { text: '16π سم²', isCorrect: false },
      { text: '64 - 16π سم²', isCorrect: false },
      { text: '32π سم²', isCorrect: false },
    ],
    explanation: 'مساحة التقاطع = مساحة ربعي دائرة - مساحة المربع = 2 × (π × 64/4) - 64 = 32π - 64 سم²',
    diagram: {
      type: 'overlapping-shapes',
      renderHint: 'JSXGraph',
      data: {
        subtype: 'quarter-circles-in-square',
        dimensions: { side: 8 },
        shading: {
          region: 'lens',
          color: '#EF4444',
          opacity: 0.4
        }
      },
      caption: 'ربعا دائرة متقاطعان في مربع - منطقة العدسة مظللة'
    },
    formulaUsed: 'مساحة العدسة = مساحة ربعي الدائرة - مساحة المربع'
  }
];

async function injectTestData() {
  console.log('=== INJECTING OVERLAPPING SHAPES TEST DATA ===\n');

  // Create a test exam session with all 8 overlapping patterns
  const testSession = {
    id: crypto.randomUUID(),
    user_id: '00000000-0000-0000-0000-000000000000', // Test user
    status: 'completed',
    section: 'quantitative',
    track: 'scientific',
    questions: overlappingShapesQuestions.map((q, index) => ({
      ...q,
      index,
      id: crypto.randomUUID(),
    })),
    current_question_index: 0,
    time_remaining: 3600,
    answers: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    metadata: {
      test_type: 'overlapping-shapes-rendering-test',
      patterns_count: 8,
    }
  };

  console.log('Creating test exam session with', testSession.questions.length, 'overlapping shape questions...\n');

  // Insert into database
  const { data, error } = await supabase
    .from('exam_sessions')
    .insert(testSession)
    .select()
    .single();

  if (error) {
    console.error('Error inserting test session:', error);
    return;
  }

  console.log('SUCCESS! Test session created.\n');
  console.log('Session ID:', data.id);
  console.log('\n' + '='.repeat(60));
  console.log('TO TEST RENDERING:');
  console.log('='.repeat(60));
  console.log('\n1. Start the dev server: npm run dev');
  console.log('2. Navigate to: http://localhost:3000/exam/' + data.id);
  console.log('3. Check each question to verify JSXGraph diagrams render correctly');
  console.log('\nPatterns included:');
  overlappingShapesQuestions.forEach((q, i) => {
    console.log(`  ${i + 1}. ${q.diagram.data.subtype} (${q.difficulty})`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('EXPECTED BEHAVIOR:');
  console.log('='.repeat(60));
  console.log('- Each diagram should show shapes with correct shading');
  console.log('- JSXGraph library should load (no blank diagrams)');
  console.log('- Arabic captions should display correctly');
  console.log('- Shaded regions should match the question requirements');
  console.log('\nIf diagrams appear blank, check browser console for errors.');
}

// Also create a minimal test page component for direct rendering testing
async function createTestPage() {
  const testPageContent = `'use client';

import React from 'react';
import { DiagramRenderer } from '@/services/diagrams/DiagramRenderer';

const testDiagrams = ${JSON.stringify(overlappingShapesQuestions.map(q => q.diagram), null, 2)};

export default function OverlappingShapesTestPage() {
  return (
    <div className="p-8 space-y-8" dir="rtl">
      <h1 className="text-2xl font-bold text-center mb-8">
        اختبار رسم الأشكال المتداخلة
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testDiagrams.map((diagram, index) => (
          <div key={index} className="border rounded-lg p-4 bg-white shadow">
            <h3 className="text-lg font-semibold mb-2">
              {index + 1}. {diagram.data.subtype}
            </h3>
            <div className="w-full h-[400px]">
              <DiagramRenderer
                diagram={diagram}
                width={400}
                height={400}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">{diagram.caption}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
`;

  console.log('\n' + '='.repeat(60));
  console.log('OPTIONAL: Create a standalone test page');
  console.log('='.repeat(60));
  console.log('\nTo create a standalone test page, create this file:');
  console.log('src/app/test/overlapping-shapes/page.tsx');
  console.log('\nThen navigate to: http://localhost:3000/test/overlapping-shapes');
}

// Run the injection
injectTestData()
  .then(() => createTestPage())
  .catch(console.error);
