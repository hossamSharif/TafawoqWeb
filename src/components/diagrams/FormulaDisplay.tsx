/**
 * FormulaDisplay.tsx
 * Displays mathematical formulas for overlapping shape problems after answer submission
 *
 * Shows the formula used to calculate the shaded area in a readable Arabic format.
 * Only displayed after the user submits their answer (FR-013).
 *
 * @see specs/1-gat-exam-v3/plan.md - User Story 1
 * @see src/lib/constants/diagram-patterns.ts for formula templates
 */

'use client';

import React from 'react';
import { getPatternBySubtype, BASIC_FORMULAS } from '@/lib/constants/diagram-patterns';

export interface FormulaDisplayProps {
  /** Pattern subtype (e.g., 'square-with-corner-circles') */
  patternSubtype?: string;
  /** Specific formula to display (overrides pattern default) */
  formula?: string;
  /** Whether answer has been submitted (controls visibility) */
  showFormula: boolean;
  /** Optional calculation steps in Arabic */
  calculationSteps?: string[];
  /** Optional final result */
  result?: string | number;
  /** Additional CSS classes */
  className?: string;
}

export const FormulaDisplay: React.FC<FormulaDisplayProps> = ({
  patternSubtype,
  formula,
  showFormula,
  calculationSteps,
  result,
  className = '',
}) => {
  // Don't render anything if formula shouldn't be shown yet
  if (!showFormula) {
    return null;
  }

  // Get pattern configuration if subtype is provided
  const pattern = patternSubtype ? getPatternBySubtype(patternSubtype) : null;

  // Use provided formula or fall back to pattern's formula template
  const displayFormula = formula || pattern?.formulaTemplate || '';

  if (!displayFormula && !calculationSteps?.length) {
    return null;
  }

  return (
    <div
      className={`formula-display rounded-lg border border-blue-200 bg-blue-50 p-4 mt-4 ${className}`}
      role="region"
      aria-label="الصيغة الرياضية المستخدمة"
    >
      <div className="text-right" dir="rtl">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          الصيغة المستخدمة:
        </h3>

        {/* Main formula */}
        {displayFormula && (
          <div className="formula-main bg-white rounded-md p-3 mb-3 shadow-sm">
            <p className="text-base font-medium text-gray-800 text-center font-mono">
              {displayFormula}
            </p>
          </div>
        )}

        {/* Calculation steps if provided */}
        {calculationSteps && calculationSteps.length > 0 && (
          <div className="calculation-steps space-y-2">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">
              خطوات الحل:
            </h4>
            <ol className="list-decimal list-inside space-y-1">
              {calculationSteps.map((step, index) => (
                <li
                  key={index}
                  className="text-sm text-gray-700 bg-white rounded px-3 py-2"
                >
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Final result if provided */}
        {result !== undefined && result !== null && (
          <div className="result mt-3 bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm font-semibold text-green-900">
              المساحة المظللة = {' '}
              <span className="text-lg font-bold">{result}</span>
            </p>
          </div>
        )}

        {/* Pattern name if available */}
        {pattern && (
          <div className="pattern-info mt-3 text-xs text-gray-600">
            <p>النمط: {pattern.nameArabic}</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * FormulaGuide - Shows basic formulas reference
 * Can be used as a help tooltip or collapsible section
 */
export interface FormulaGuideProps {
  /** Show only specific formula types */
  formulaTypes?: ('circle' | 'sector' | 'triangle' | 'square' | 'equilateralTriangle' | 'rectangle')[];
  /** Whether to show in collapsed state initially */
  collapsed?: boolean;
  className?: string;
}

export const FormulaGuide: React.FC<FormulaGuideProps> = ({
  formulaTypes,
  collapsed = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = React.useState(!collapsed);

  // Filter formulas to display
  const formulasToShow = formulaTypes
    ? Object.entries(BASIC_FORMULAS).filter(([key]) =>
        formulaTypes.includes(key as any)
      )
    : Object.entries(BASIC_FORMULAS);

  return (
    <div className={`formula-guide border border-gray-300 rounded-lg ${className}`} dir="rtl">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-right hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-semibold text-gray-700">
          الصيغ الأساسية
        </span>
        <span className="text-gray-500">
          {isOpen ? '▼' : '◀'}
        </span>
      </button>

      {isOpen && (
        <div className="p-3 pt-0 space-y-2">
          {formulasToShow.map(([key, value]) => (
            <div
              key={key}
              className="formula-item bg-gray-50 rounded p-2 text-sm"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-800">
                  {getShapeNameArabic(key)}:
                </span>
                <span className="font-mono text-gray-700">
                  {value.arabic}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Helper function to get Arabic shape names
 */
function getShapeNameArabic(key: string): string {
  const names: Record<string, string> = {
    circle: 'دائرة',
    sector: 'قطاع',
    triangle: 'مثلث',
    square: 'مربع',
    equilateralTriangle: 'مثلث متساوي الأضلاع',
    rectangle: 'مستطيل'
  };
  return names[key] || key;
}

/**
 * FormulaWithValues - Display formula with actual values substituted
 */
export interface FormulaWithValuesProps {
  /** Formula template with placeholders */
  template: string;
  /** Values to substitute (e.g., { 'ض': 10, 'نق': 5 }) */
  values: Record<string, number>;
  /** Show the final calculation result */
  showResult?: boolean;
  className?: string;
}

export const FormulaWithValues: React.FC<FormulaWithValuesProps> = ({
  template,
  values,
  showResult = false,
  className = '',
}) => {
  // Replace variables in template with actual values
  let formulaWithValues = template;
  Object.entries(values).forEach(([variable, value]) => {
    const regex = new RegExp(variable, 'g');
    formulaWithValues = formulaWithValues.replace(regex, value.toString());
  });

  return (
    <div className={`formula-with-values ${className}`} dir="rtl">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600">{template}</span>
        <span className="text-gray-400">=</span>
        <span className="font-mono text-gray-800">{formulaWithValues}</span>
      </div>
    </div>
  );
};

export default FormulaDisplay;
