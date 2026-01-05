/**
 * WordProblemSolution.tsx
 * Display component for word problem step-by-step solutions
 *
 * Features:
 * - Displays structured solution with المعطيات, المطلوب, الحل sections
 * - Shows step-by-step explanation in Arabic
 * - Highlights the final answer
 * - RTL (right-to-left) layout for Arabic text
 * - Responsive design for mobile and desktop
 *
 * @see User Story 4 (FR-022, FR-023, FR-024) - Word problems with step-by-step solutions
 * @see specs/1-gat-exam-v3/spec.md - Word problem requirements
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Info } from 'lucide-react';

export interface WordProblemSolutionProps {
  /** Full explanation text with step-by-step solution in markdown format */
  explanation: string;
  /** Word problem category for badge display */
  category?: string;
  /** Category name in Arabic */
  categoryNameAr?: string;
  /** Whether to show the solution (after answer submission) */
  show: boolean;
  /** Arabic names used in the problem (for context) */
  arabicNames?: string[];
  /** Saudi context elements (cities, products) */
  saudiContext?: string[];
}

/**
 * Parse step-by-step explanation into structured sections
 * Expected format:
 * **المعطيات:** ...
 * **المطلوب:** ...
 * **الحل:**
 * **الخطوة 1:** ...
 * **الخطوة 2:** ...
 * **الإجابة النهائية:** ...
 */
function parseExplanation(explanation: string) {
  const sections = {
    given: '',
    required: '',
    steps: [] as string[],
    finalAnswer: '',
  };

  // Split by bold markers
  const lines = explanation.split('\n');
  let currentSection: 'given' | 'required' | 'steps' | 'final' | null = null;
  let stepContent: string[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (trimmed.includes('**المعطيات:**')) {
      currentSection = 'given';
      sections.given = trimmed.replace('**المعطيات:**', '').trim();
    } else if (trimmed.includes('**المطلوب:**')) {
      currentSection = 'required';
      sections.required = trimmed.replace('**المطلوب:**', '').trim();
    } else if (trimmed.includes('**الحل:**')) {
      currentSection = 'steps';
    } else if (trimmed.match(/\*\*الخطوة \d+:/)) {
      if (currentSection === 'steps') {
        stepContent.push(trimmed);
      }
    } else if (trimmed.includes('**الإجابة النهائية:**')) {
      currentSection = 'final';
      sections.finalAnswer = trimmed.replace('**الإجابة النهائية:**', '').trim();
    } else if (trimmed && currentSection) {
      // Continuation of current section
      switch (currentSection) {
        case 'given':
          sections.given += '\n' + trimmed;
          break;
        case 'required':
          sections.required += '\n' + trimmed;
          break;
        case 'steps':
          if (stepContent.length > 0) {
            stepContent[stepContent.length - 1] += '\n' + trimmed;
          }
          break;
        case 'final':
          sections.finalAnswer += '\n' + trimmed;
          break;
      }
    }
  });

  sections.steps = stepContent;

  return sections;
}

/**
 * Word Problem Solution Component
 *
 * Displays a step-by-step solution for word problems with structured sections.
 * All text is displayed in Arabic with RTL (right-to-left) layout.
 */
export function WordProblemSolution({
  explanation,
  category,
  categoryNameAr,
  show,
  arabicNames,
  saudiContext,
}: WordProblemSolutionProps) {
  if (!show) {
    return null;
  }

  const sections = parseExplanation(explanation);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header with category badge */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 text-right">
          الحل التفصيلي
        </h3>
        {categoryNameAr && (
          <Badge variant="secondary" className="text-sm">
            {categoryNameAr}
          </Badge>
        )}
      </div>

      {/* Context badges (Arabic names, Saudi context) */}
      {(arabicNames?.length || saudiContext?.length) && (
        <div className="flex flex-wrap gap-2 justify-end">
          {arabicNames?.map((name, idx) => (
            <Badge key={`name-${idx}`} variant="outline" className="text-xs">
              {name}
            </Badge>
          ))}
          {saudiContext?.map((context, idx) => (
            <Badge key={`context-${idx}`} variant="outline" className="text-xs text-blue-700 border-blue-300">
              {context}
            </Badge>
          ))}
        </div>
      )}

      {/* Given Information (المعطيات) */}
      {sections.given && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-end gap-2">
              <span>المعطيات</span>
              <Info className="w-5 h-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-right text-gray-800 whitespace-pre-wrap">
              {sections.given}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Required (المطلوب) */}
      {sections.required && (
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-right">المطلوب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-right text-gray-800 font-medium">
              {sections.required}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Solution Steps (الحل) */}
      {sections.steps.length > 0 && (
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-right">الحل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sections.steps.map((step, index) => {
                // Extract step number and content
                const stepMatch = step.match(/\*\*الخطوة (\d+):\*\*(.*)/s);
                const stepNumber = stepMatch ? stepMatch[1] : (index + 1).toString();
                const stepContent = stepMatch ? stepMatch[2].trim() : step;

                return (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                      {stepNumber}
                    </div>
                    <div className="flex-1 text-right text-gray-800 whitespace-pre-wrap">
                      {stepContent}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final Answer (الإجابة النهائية) */}
      {sections.finalAnswer && (
        <Card className="bg-green-50 border-green-300 border-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 justify-end">
              <div className="text-right">
                <div className="text-sm text-green-700 font-medium mb-1">
                  الإجابة النهائية
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {sections.finalAnswer}
                </div>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fallback: Show raw explanation if parsing failed */}
      {!sections.given && !sections.required && sections.steps.length === 0 && !sections.finalAnswer && (
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-right">الشرح</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-right text-gray-800 whitespace-pre-wrap">
              {explanation}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default WordProblemSolution;
