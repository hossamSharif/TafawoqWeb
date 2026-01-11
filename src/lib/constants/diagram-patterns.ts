/**
 * Overlapping Shape Pattern Configurations
 *
 * Defines the 8 standard overlapping geometric shape patterns used in GAT quantitative questions.
 * Each pattern includes shading operations and formulas for calculating shaded regions.
 *
 * @see src/skills/qudurat-diagrams/references/overlapping-shapes.md for detailed examples
 */

export interface ShadingConfig {
  type: 'difference' | 'intersection' | 'intersection-of-all' | 'curvilinear-triangle';
  operation?: string;
  description?: string;
  fillColor?: string;
  fillOpacity?: number;
}

export interface OverlappingPattern {
  id: string;
  subtype: string;
  nameArabic: string;
  description: string;
  renderHint: 'SVG' | 'JSXGraph' | 'Chart.js';
  shading: ShadingConfig;
  formulaTemplate: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * الأنماط الثمانية للأشكال المتداخلة
 * Eight standard overlapping shape patterns for GAT geometry questions
 */
export const OVERLAPPING_PATTERNS: Record<string, OverlappingPattern> = {
  'square-with-corner-circles': {
    id: 'pattern-1',
    subtype: 'square-with-corner-circles',
    nameArabic: 'مربع مع أرباع دوائر عند الرؤوس',
    description: 'مربع رؤوسه الأربعة مراكز لأربع دوائر متطابقة',
    renderHint: 'JSXGraph',
    shading: {
      type: 'difference',
      operation: 'square - 4_quarter_circles',
      fillColor: '#e74c3c',
      fillOpacity: 0.4
    },
    formulaTemplate: 'ض² - πنق²',
    difficulty: 'medium'
  },

  'square-vertex-at-circle-center': {
    id: 'pattern-2',
    subtype: 'square-vertex-at-circle-center',
    nameArabic: 'رأس مربع في مركز دائرة',
    description: 'رأس المربع يقع في مركز الدائرة',
    renderHint: 'JSXGraph',
    shading: {
      type: 'difference',
      operation: 'quarter-circle-inside-square',
      fillColor: '#e74c3c',
      fillOpacity: 0.45
    },
    formulaTemplate: 'ض² - ¼πنق²',
    difficulty: 'hard'
  },

  'rose-pattern-in-square': {
    id: 'pattern-3',
    subtype: 'rose-pattern-in-square',
    nameArabic: 'وردة في مربع',
    description: '4 أنصاف دوائر من منتصفات الأضلاع تشكل وردة',
    renderHint: 'JSXGraph',
    shading: {
      type: 'intersection-of-all',
      description: 'الوردة في المنتصف',
      fillColor: '#e74c3c',
      fillOpacity: 0.5
    },
    formulaTemplate: 'معقدة - تعتمد على التقاطعات',
    difficulty: 'hard'
  },

  'three-tangent-circles': {
    id: 'pattern-4',
    subtype: 'three-tangent-circles',
    nameArabic: 'ثلاث دوائر متماسة',
    description: '3 دوائر متماسة، مراكزها مثلث متساوي الأضلاع',
    renderHint: 'JSXGraph',
    shading: {
      type: 'curvilinear-triangle',
      fillColor: '#e74c3c',
      fillOpacity: 0.4
    },
    formulaTemplate: '√3 - π/2',
    difficulty: 'hard'
  },

  'sector-minus-triangle': {
    id: 'pattern-5',
    subtype: 'sector-minus-triangle',
    nameArabic: 'قطاع ناقص مثلث',
    description: 'قطاع دائري (عادة 90°) ناقص مثلث داخله',
    renderHint: 'SVG',
    shading: {
      type: 'difference',
      operation: 'sector - triangle',
      fillColor: '#e74c3c',
      fillOpacity: 0.3
    },
    formulaTemplate: '(θ/360)πنق² - ½قاعدة×ارتفاع',
    difficulty: 'medium'
  },

  'circles-in-rectangle': {
    id: 'pattern-6',
    subtype: 'circles-in-rectangle',
    nameArabic: 'دوائر في مستطيل',
    description: 'مستطيل يحتوي دوائر متماسة',
    renderHint: 'SVG',
    shading: {
      type: 'difference',
      operation: 'rectangle - circles',
      fillColor: '#e74c3c',
      fillOpacity: 0.35
    },
    formulaTemplate: 'طول×عرض - عدد×πنق²',
    difficulty: 'easy'
  },

  'inscribed-circle-in-square': {
    id: 'pattern-7',
    subtype: 'inscribed-circle-in-square',
    nameArabic: 'دائرة داخل مربع',
    description: 'دائرة داخل مربع تمس أضلاعه الأربعة',
    renderHint: 'SVG',
    shading: {
      type: 'difference',
      fillColor: '#e74c3c',
      fillOpacity: 0.3
    },
    formulaTemplate: 'ض² - π(ض/2)²',
    difficulty: 'easy'
  },

  'inscribed-square-in-circle': {
    id: 'pattern-8',
    subtype: 'inscribed-square-in-circle',
    nameArabic: 'مربع داخل دائرة',
    description: 'مربع داخل دائرة رؤوسه على المحيط',
    renderHint: 'SVG',
    shading: {
      type: 'difference',
      fillColor: '#e74c3c',
      fillOpacity: 0.35
    },
    formulaTemplate: 'πنق² - ض²',
    difficulty: 'easy'
  }
};

/**
 * Default shading configuration for overlapping shapes
 */
export const DEFAULT_SHADING_CONFIG: ShadingConfig = {
  type: 'difference',
  fillColor: '#e74c3c',  // Primary red color for shaded regions
  fillOpacity: 0.4        // Opacity range 0.3-0.6 as per FR-016
};

/**
 * Get pattern by subtype
 */
export function getPatternBySubtype(subtype: string): OverlappingPattern | undefined {
  return OVERLAPPING_PATTERNS[subtype];
}

/**
 * Get all patterns by difficulty level
 */
export function getPatternsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): OverlappingPattern[] {
  return Object.values(OVERLAPPING_PATTERNS).filter(p => p.difficulty === difficulty);
}

/**
 * Get random pattern (optionally filtered by difficulty)
 */
export function getRandomPattern(difficulty?: 'easy' | 'medium' | 'hard'): OverlappingPattern {
  const patterns = difficulty
    ? getPatternsByDifficulty(difficulty)
    : Object.values(OVERLAPPING_PATTERNS);

  const randomIndex = Math.floor(Math.random() * patterns.length);
  return patterns[randomIndex];
}

/**
 * القاعدة الذهبية للمساحة المظللة
 * Golden rule: Shaded area = Outer shape area - Inner shape area
 */
export const GOLDEN_RULE = {
  arabic: 'المساحة المظللة = مساحة الشكل الخارجي - مساحة الشكل الداخلي',
  english: 'Shaded area = Outer shape area - Inner shape area'
};

/**
 * الصيغ الأساسية المستخدمة في الحسابات
 * Basic formulas used in calculations
 */
export const BASIC_FORMULAS = {
  circle: {
    arabic: 'πنق²',
    english: 'πr²'
  },
  sector: {
    arabic: '(θ/360) × πنق²',
    english: '(θ/360) × πr²'
  },
  triangle: {
    arabic: '½ × قاعدة × ارتفاع',
    english: '½ × base × height'
  },
  square: {
    arabic: 'ض²',
    english: 's²'
  },
  equilateralTriangle: {
    arabic: '(√3/4) × ض²',
    english: '(√3/4) × s²'
  },
  rectangle: {
    arabic: 'طول × عرض',
    english: 'length × width'
  }
};
