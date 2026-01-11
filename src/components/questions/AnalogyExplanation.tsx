/**
 * AnalogyExplanation.tsx
 * Component to display analogy question explanations with relationship type labels
 *
 * Features (FR-026):
 * - Displays the relationship type in Arabic
 * - Shows the full explanation with proper formatting
 * - Supports all 22 relationship types
 * - Responsive design with proper RTL support
 *
 * @see specs/1-gat-exam-v3/data-model.md - AnalogyRelationship
 * @see User Story 5 - Practice Analogy Questions with Relationship Types
 */

'use client';

import React from 'react';
import { getAnalogyRelationshipNameAr } from '@/lib/constants/analogy-relationships';

export interface AnalogyExplanationProps {
  /** The relationship type ID (e.g., 'synonymy', 'antonymy') */
  relationshipType: string;
  /** The full explanation text in Arabic */
  explanation: string;
  /** Optional CSS classes for styling */
  className?: string;
}

/**
 * AnalogyExplanation Component
 *
 * Displays the relationship type label and explanation for analogy questions.
 * The relationship type is highlighted to help students understand the pattern.
 *
 * @example
 * ```tsx
 * <AnalogyExplanation
 *   relationshipType="tool-user"
 *   explanation="القلم أداة يستخدمها الكاتب، والفرشاة أداة يستخدمها الرسام."
 * />
 * ```
 */
export function AnalogyExplanation({
  relationshipType,
  explanation,
  className = '',
}: AnalogyExplanationProps) {
  // Get the Arabic name for the relationship type
  const relationshipNameAr = getAnalogyRelationshipNameAr(relationshipType);

  return (
    <div
      className={`analogy-explanation space-y-2 ${className}`}
      dir="rtl"
      role="region"
      aria-label="شرح السؤال"
    >
      {/* Relationship Type Label */}
      <div className="relationship-type-label">
        <span className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-link-2"
            aria-hidden="true"
          >
            <path d="M9 17H7A5 5 0 0 1 7 7h2" />
            <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
            <line x1="8" x2="16" y1="12" y2="12" />
          </svg>
          <span>العلاقة: {relationshipNameAr}</span>
        </span>
      </div>

      {/* Explanation Text */}
      <div className="explanation-text">
        <p className="text-base leading-relaxed text-muted-foreground">
          {explanation}
        </p>
      </div>
    </div>
  );
}

/**
 * Helper component to format analogy pairs within explanations
 *
 * @example
 * ```tsx
 * <AnalogyPair word1="قلم" word2="كاتب" />
 * ```
 */
export function AnalogyPair({
  word1,
  word2,
  className = '',
}: {
  word1: string;
  word2: string;
  className?: string;
}) {
  return (
    <span className={`analogy-pair inline-flex items-center gap-1 font-semibold ${className}`}>
      <span>{word1}</span>
      <span className="text-muted-foreground">:</span>
      <span>{word2}</span>
    </span>
  );
}

/**
 * Enhanced AnalogyExplanation with visual relationship diagram
 *
 * @example
 * ```tsx
 * <AnalogyExplanationDetailed
 *   relationshipType="tool-user"
 *   explanation="القلم أداة يستخدمها الكاتب، والفرشاة أداة يستخدمها الرسام."
 *   questionPair={{ word1: "قلم", word2: "كاتب" }}
 *   answerPair={{ word1: "فرشاة", word2: "رسام" }}
 * />
 * ```
 */
export function AnalogyExplanationDetailed({
  relationshipType,
  explanation,
  questionPair,
  answerPair,
  className = '',
}: {
  relationshipType: string;
  explanation: string;
  questionPair: { word1: string; word2: string };
  answerPair: { word1: string; word2: string };
  className?: string;
}) {
  const relationshipNameAr = getAnalogyRelationshipNameAr(relationshipType);

  return (
    <div
      className={`analogy-explanation-detailed space-y-4 ${className}`}
      dir="rtl"
      role="region"
      aria-label="شرح تفصيلي للسؤال"
    >
      {/* Relationship Type Label */}
      <div className="relationship-type-header">
        <span className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-link-2"
            aria-hidden="true"
          >
            <path d="M9 17H7A5 5 0 0 1 7 7h2" />
            <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
            <line x1="8" x2="16" y1="12" y2="12" />
          </svg>
          <span>العلاقة: {relationshipNameAr}</span>
        </span>
      </div>

      {/* Visual Diagram */}
      <div className="relationship-diagram grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4">
        {/* Question Pair */}
        <div className="text-center">
          <p className="mb-2 text-xs font-medium text-muted-foreground">السؤال</p>
          <AnalogyPair
            word1={questionPair.word1}
            word2={questionPair.word2}
            className="text-lg"
          />
        </div>

        {/* Answer Pair */}
        <div className="text-center">
          <p className="mb-2 text-xs font-medium text-muted-foreground">الإجابة</p>
          <AnalogyPair
            word1={answerPair.word1}
            word2={answerPair.word2}
            className="text-lg text-green-600 dark:text-green-400"
          />
        </div>
      </div>

      {/* Explanation Text */}
      <div className="explanation-text">
        <p className="text-base leading-relaxed text-muted-foreground">
          {explanation}
        </p>
      </div>
    </div>
  );
}

export default AnalogyExplanation;
