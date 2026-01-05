/**
 * ComparisonQuestion.tsx
 * Display component for comparison questions (المقارنة)
 *
 * Features:
 * - Displays two values with Arabic labels (القيمة الأولى، القيمة الثانية)
 * - Shows the four standard Arabic answer choices in correct order
 * - RTL (right-to-left) layout for Arabic text
 * - Responsive design for mobile and desktop
 *
 * @see User Story 3 (FR-020, FR-021) - Comparison questions
 * @see specs/1-gat-exam-v3/spec.md - Comparison question requirements
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export interface ComparisonValues {
  value1: {
    expression: string;
    label: string;
  };
  value2: {
    expression: string;
    label: string;
  };
}

export interface ComparisonQuestionProps {
  /** Question stem text */
  stem: string;
  /** The two values to compare */
  comparisonValues: ComparisonValues;
  /** The four standard answer choices (should always be the same) */
  choices: string[];
  /** Currently selected answer (0-3, or null if not answered) */
  selectedAnswer: number | null;
  /** Callback when user selects an answer */
  onAnswerSelect: (answerIndex: number) => void;
  /** Whether to show the correct answer (after submission) */
  showCorrectAnswer?: boolean;
  /** The correct answer index (0-3) */
  correctAnswerIndex?: number;
  /** Whether the question is disabled (viewing only) */
  disabled?: boolean;
}

/**
 * Comparison Question Component
 *
 * Displays a comparison question with two labeled values and four standard answer choices.
 * All text is displayed in Arabic with RTL (right-to-left) layout.
 */
export function ComparisonQuestion({
  stem,
  comparisonValues,
  choices,
  selectedAnswer,
  onAnswerSelect,
  showCorrectAnswer = false,
  correctAnswerIndex,
  disabled = false,
}: ComparisonQuestionProps) {
  return (
    <div className="space-y-6" dir="rtl">
      {/* Question Stem */}
      <div className="text-lg font-semibold text-right">{stem}</div>

      {/* Comparison Values */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Value 1 */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="text-sm text-blue-700 mb-2 font-medium text-right">
              {comparisonValues.value1.label}
            </div>
            <div className="text-2xl font-bold text-blue-900 text-center">
              {comparisonValues.value1.expression}
            </div>
          </CardContent>
        </Card>

        {/* Value 2 */}
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-6">
            <div className="text-sm text-purple-700 mb-2 font-medium text-right">
              {comparisonValues.value2.label}
            </div>
            <div className="text-2xl font-bold text-purple-900 text-center">
              {comparisonValues.value2.expression}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Answer Choices */}
      <div className="mt-6">
        <RadioGroup
          value={selectedAnswer !== null ? selectedAnswer.toString() : undefined}
          onValueChange={(value) => !disabled && onAnswerSelect(parseInt(value))}
          disabled={disabled}
        >
          <div className="space-y-3">
            {choices.map((choice, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = showCorrectAnswer && correctAnswerIndex === index;
              const isWrong = showCorrectAnswer && isSelected && selectedAnswer !== correctAnswerIndex;

              return (
                <div
                  key={index}
                  className={`flex items-center space-x-3 space-x-reverse p-4 rounded-lg border-2 transition-colors ${
                    isCorrect
                      ? 'bg-green-50 border-green-500'
                      : isWrong
                      ? 'bg-red-50 border-red-500'
                      : isSelected
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <RadioGroupItem value={index.toString()} id={`choice-${index}`} />
                  <Label
                    htmlFor={`choice-${index}`}
                    className={`flex-1 text-right cursor-pointer text-base ${
                      isCorrect
                        ? 'text-green-900 font-semibold'
                        : isWrong
                        ? 'text-red-900 font-semibold'
                        : 'text-gray-900'
                    }`}
                  >
                    {choice}
                    {isCorrect && (
                      <span className="mr-2 text-green-600">✓</span>
                    )}
                    {isWrong && (
                      <span className="mr-2 text-red-600">✗</span>
                    )}
                  </Label>
                </div>
              );
            })}
          </div>
        </RadioGroup>
      </div>

      {/* Helper Text */}
      {!showCorrectAnswer && selectedAnswer === null && (
        <p className="text-sm text-gray-500 text-right mt-2">
          اختر إجابة واحدة من الخيارات الأربعة
        </p>
      )}
    </div>
  );
}

export default ComparisonQuestion;
