/**
 * Word Problem Categories and Configuration
 *
 * Defines the 5 categories of word problems for GAT quantitative reasoning:
 * 1. Speed-Time-Distance
 * 2. Work Problems
 * 3. Age Problems
 * 4. Profit/Loss
 * 5. Mixture
 *
 * Each category includes subtypes, formulas, and configuration for realistic scenarios.
 */

export type WordProblemCategory =
  | 'speed-time-distance'
  | 'work'
  | 'age'
  | 'profit-loss'
  | 'mixture';

export interface WordProblemSubtype {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string;
  formula?: string;
}

export interface WordProblemCategoryConfig {
  id: WordProblemCategory;
  nameAr: string;
  nameEn: string;
  percentage: number; // Distribution percentage in exam
  subtypes: WordProblemSubtype[];
  coreFormulas: string[];
}

/**
 * Arabic Names for Word Problems
 * Realistic Saudi/Gulf Arabic names to use in word problems
 */
export const ARABIC_NAMES = {
  male: [
    'أحمد',
    'محمد',
    'خالد',
    'عبدالله',
    'سعود',
    'فهد',
    'ناصر',
    'علي',
    'عمر',
    'يوسف',
  ],
  female: [
    'فاطمة',
    'نورة',
    'سارة',
    'مريم',
    'عائشة',
    'هدى',
    'ريم',
    'منى',
    'لمى',
    'شهد',
  ],
} as const;

/**
 * Saudi Cities for Contextual Word Problems
 */
export const SAUDI_CITIES = [
  'الرياض',
  'جدة',
  'مكة المكرمة',
  'المدينة المنورة',
  'الدمام',
  'الطائف',
  'تبوك',
  'أبها',
  'الخبر',
  'ينبع',
] as const;

/**
 * Common Products for Word Problems
 * Culturally appropriate items for Saudi/Gulf context
 */
export const COMMON_PRODUCTS = {
  electronics: ['هاتف', 'ساعة', 'جهاز', 'حاسوب'],
  books: ['كتاب', 'مجلة', 'دفتر'],
  accessories: ['حقيبة', 'قلم', 'محفظة'],
  food: ['قهوة', 'شاي', 'أرز', 'سكر', 'عسل', 'دقيق', 'ملح'],
  liquids: ['عصير', 'حليب', 'ماء', 'زيت', 'خل'],
  general: ['سلعة', 'بضاعة', 'منتج'],
} as const;

/**
 * Category 1: Speed-Time-Distance (السرعة والمسافة والزمن)
 */
export const SPEED_TIME_DISTANCE_CONFIG: WordProblemCategoryConfig = {
  id: 'speed-time-distance',
  nameAr: 'السرعة والمسافة والزمن',
  nameEn: 'Speed-Time-Distance',
  percentage: 25,
  subtypes: [
    {
      id: 'simple-travel',
      nameAr: 'السفر البسيط',
      nameEn: 'Simple Travel',
      description: 'Single direction travel with constant speed',
      formula: 'المسافة = السرعة × الزمن',
    },
    {
      id: 'meeting',
      nameAr: 'مسائل اللقاء',
      nameEn: 'Meeting Problems',
      description: 'Two objects moving towards each other',
      formula: 'السرعة النسبية = السرعة الأولى + السرعة الثانية',
    },
    {
      id: 'catching-up',
      nameAr: 'مسائل اللحاق',
      nameEn: 'Catching Up',
      description: 'One object chasing another',
      formula: 'السرعة النسبية = السرعة الأسرع - السرعة الأبطأ',
    },
    {
      id: 'relative-speed',
      nameAr: 'السرعة النسبية',
      nameEn: 'Relative Speed',
      description: 'Objects moving in same or opposite directions',
    },
  ],
  coreFormulas: [
    'المسافة = السرعة × الزمن',
    'السرعة = المسافة ÷ الزمن',
    'الزمن = المسافة ÷ السرعة',
  ],
};

/**
 * Mental-math-friendly values for speed-time-distance
 */
export const SPEED_TIME_DISTANCE_VALUES = {
  speeds: {
    car: [40, 50, 60, 80, 100, 120], // km/h
    plane: [500, 600, 700, 800, 900], // km/h
    train: [80, 100, 120, 150, 180], // km/h
  },
  distances: [100, 120, 150, 200, 240, 300, 400, 480, 600, 800, 960], // km
  times: [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12], // hours
} as const;

/**
 * Category 2: Work Problems (مسائل العمل)
 */
export const WORK_PROBLEMS_CONFIG: WordProblemCategoryConfig = {
  id: 'work',
  nameAr: 'مسائل العمل',
  nameEn: 'Work Problems',
  percentage: 20,
  subtypes: [
    {
      id: 'joint-work',
      nameAr: 'العمل المشترك',
      nameEn: 'Joint Work',
      description: 'Two or more workers/machines working together',
      formula: 'المعدل المشترك = معدل A + معدل B',
    },
    {
      id: 'pipes-tanks',
      nameAr: 'الصنابير والخزانات',
      nameEn: 'Pipes and Tanks',
      description: 'Filling or emptying tanks with multiple pipes',
      formula: 'معدل الملء = 1/زمن الملء',
    },
    {
      id: 'partial-then-joint',
      nameAr: 'عمل جزئي ثم مشترك',
      nameEn: 'Partial Then Joint',
      description: 'One worker starts, then another joins',
    },
    {
      id: 'different-rates',
      nameAr: 'معدلات مختلفة',
      nameEn: 'Different Rates',
      description: 'Workers with varying efficiency rates',
    },
  ],
  coreFormulas: [
    'العمل = المعدل × الزمن',
    'إذا كان A ينجز العمل في x أيام، فمعدله = 1/x',
    'العمل المشترك = معدل A + معدل B',
  ],
};

/**
 * Mental-math-friendly values for work problems
 */
export const WORK_PROBLEM_VALUES = {
  daysToComplete: [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30],
  workRates: ['1/2', '1/3', '1/4', '1/5', '1/6', '1/8', '1/10', '1/12'],
  occupations: ['عامل', 'نجار', 'سباك', 'كهربائي', 'رسام', 'بناء', 'خياط', 'مزارع'],
} as const;

/**
 * Category 3: Age Problems (مسائل الأعمار)
 */
export const AGE_PROBLEMS_CONFIG: WordProblemCategoryConfig = {
  id: 'age',
  nameAr: 'مسائل الأعمار',
  nameEn: 'Age Problems',
  percentage: 20,
  subtypes: [
    {
      id: 'age-ratio',
      nameAr: 'نسبة الأعمار',
      nameEn: 'Age Ratio',
      description: 'Comparing ages using ratios',
      formula: 'عمر A : عمر B = نسبة معينة',
    },
    {
      id: 'age-over-time',
      nameAr: 'الأعمار عبر الزمن',
      nameEn: 'Age Over Time',
      description: 'Age relationships in past or future',
      formula: 'العمر المستقبلي = العمر الحالي + السنوات',
    },
    {
      id: 'sum-of-ages',
      nameAr: 'مجموع الأعمار',
      nameEn: 'Sum of Ages',
      description: 'Total age of multiple people',
      formula: 'مجموع الأعمار = عمر A + عمر B + ...',
    },
    {
      id: 'age-difference',
      nameAr: 'فرق الأعمار',
      nameEn: 'Age Difference',
      description: 'Constant difference between ages',
      formula: 'الفرق = عمر الأكبر - عمر الأصغر (ثابت)',
    },
  ],
  coreFormulas: [
    'العمر الحالي = العمر في الماضي + عدد السنوات',
    'العمر في المستقبل = العمر الحالي + عدد السنوات',
    'فرق الأعمار ثابت دائماً',
  ],
};

/**
 * Mental-math-friendly values for age problems
 */
export const AGE_PROBLEM_VALUES = {
  currentAges: [5, 8, 10, 12, 15, 18, 20, 24, 25, 30, 32, 36, 40, 45, 48, 50, 60],
  yearsAgoOrFuture: [2, 3, 4, 5, 8, 10, 12, 15, 20],
  ratios: [
    { ratio: '2:1', description: 'ضعف' },
    { ratio: '3:1', description: '3 أمثال' },
    { ratio: '3:2', description: 'نسبة 3 إلى 2' },
    { ratio: '4:1', description: '4 أمثال' },
    { ratio: '5:2', description: 'نسبة 5 إلى 2' },
  ],
  relationships: ['أب', 'أم', 'ابن', 'ابنة', 'أخ', 'أخت', 'جد', 'جدة'],
} as const;

/**
 * Category 4: Profit and Loss (الربح والخسارة)
 */
export const PROFIT_LOSS_CONFIG: WordProblemCategoryConfig = {
  id: 'profit-loss',
  nameAr: 'الربح والخسارة',
  nameEn: 'Profit and Loss',
  percentage: 20,
  subtypes: [
    {
      id: 'simple-profit',
      nameAr: 'الربح البسيط',
      nameEn: 'Simple Profit',
      description: 'Calculate profit or loss percentage',
      formula: 'الربح = سعر البيع - سعر الشراء',
    },
    {
      id: 'find-cost',
      nameAr: 'إيجاد التكلفة',
      nameEn: 'Find Cost',
      description: 'Given selling price and profit, find cost',
      formula: 'التكلفة = سعر البيع ÷ (1 + نسبة الربح)',
    },
    {
      id: 'successive-discounts',
      nameAr: 'الخصومات المتتالية',
      nameEn: 'Successive Discounts',
      description: 'Multiple discounts applied sequentially',
      formula: 'السعر النهائي = الأصلي × (1 - خصم1) × (1 - خصم2)',
    },
    {
      id: 'break-even',
      nameAr: 'نقطة التعادل',
      nameEn: 'Break-Even',
      description: 'Find price needed to achieve target profit',
    },
  ],
  coreFormulas: [
    'الربح = سعر البيع - التكلفة',
    'نسبة الربح = (الربح ÷ التكلفة) × 100%',
    'سعر البيع = التكلفة × (1 + نسبة الربح)',
  ],
};

/**
 * Mental-math-friendly values for profit/loss problems
 */
export const PROFIT_LOSS_VALUES = {
  costPrices: [100, 120, 150, 200, 240, 300, 400, 500, 600, 800, 1000], // ريال
  profitPercentages: [5, 10, 15, 20, 25, 30, 40, 50], // %
  lossPercentages: [5, 10, 15, 20, 25], // %
  discounts: [10, 15, 20, 25, 30, 40, 50], // %
} as const;

/**
 * Category 5: Mixture (مسائل الخلط والمزج)
 */
export const MIXTURE_CONFIG: WordProblemCategoryConfig = {
  id: 'mixture',
  nameAr: 'مسائل الخلط والمزج',
  nameEn: 'Mixture Problems',
  percentage: 15,
  subtypes: [
    {
      id: 'mixing-by-price',
      nameAr: 'الخلط بالسعر',
      nameEn: 'Mixing by Price',
      description: 'Weighted average of prices',
      formula: 'متوسط السعر = (كمية1 × سعر1 + كمية2 × سعر2) ÷ الكمية الكلية',
    },
    {
      id: 'concentration',
      nameAr: 'التركيز',
      nameEn: 'Concentration',
      description: 'Mixing solutions with different concentrations',
      formula: 'التركيز النهائي = إجمالي المادة النقية ÷ إجمالي الحجم',
    },
    {
      id: 'dilution',
      nameAr: 'التخفيف',
      nameEn: 'Dilution',
      description: 'Adding water to reduce concentration',
      formula: 'كمية المادة النقية تبقى ثابتة',
    },
    {
      id: 'alligation',
      nameAr: 'الخلط للحصول على متوسط',
      nameEn: 'Alligation',
      description: 'Mix to achieve target average',
    },
  ],
  coreFormulas: [
    'إجمالي القيمة = (كمية A × سعر A) + (كمية B × سعر B)',
    'متوسط السعر = إجمالي القيمة ÷ إجمالي الكمية',
    'إجمالي التركيز = (كمية A × تركيز A) + (كمية B × تركيز B)',
  ],
};

/**
 * Mental-math-friendly values for mixture problems
 */
export const MIXTURE_VALUES = {
  quantities: [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30], // kg or liters
  concentrations: [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100], // %
  pricesPerKg: [10, 12, 15, 20, 24, 25, 30, 40, 50], // ريال
} as const;

/**
 * All Word Problem Categories
 */
export const WORD_PROBLEM_CATEGORIES: WordProblemCategoryConfig[] = [
  SPEED_TIME_DISTANCE_CONFIG,
  WORK_PROBLEMS_CONFIG,
  AGE_PROBLEMS_CONFIG,
  PROFIT_LOSS_CONFIG,
  MIXTURE_CONFIG,
];

/**
 * Get category configuration by ID
 */
export function getWordProblemCategory(id: WordProblemCategory): WordProblemCategoryConfig | undefined {
  return WORD_PROBLEM_CATEGORIES.find(cat => cat.id === id);
}

/**
 * Get random Arabic name
 */
export function getRandomArabicName(gender: 'male' | 'female' = 'male'): string {
  const names = ARABIC_NAMES[gender];
  return names[Math.floor(Math.random() * names.length)];
}

/**
 * Get random Saudi city
 */
export function getRandomSaudiCity(): string {
  return SAUDI_CITIES[Math.floor(Math.random() * SAUDI_CITIES.length)];
}

/**
 * Get random product from category
 */
export function getRandomProduct(category?: keyof typeof COMMON_PRODUCTS): string {
  if (category) {
    const products = COMMON_PRODUCTS[category];
    return products[Math.floor(Math.random() * products.length)];
  }
  // Random from all categories
  const allCategories = Object.keys(COMMON_PRODUCTS) as (keyof typeof COMMON_PRODUCTS)[];
  const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];
  return getRandomProduct(randomCategory);
}

/**
 * Validate word problem distribution
 * Returns true if distribution matches target percentages (within ±5%)
 */
export function validateWordProblemDistribution(
  counts: Record<WordProblemCategory, number>,
  total: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const tolerance = 0.05; // ±5%

  WORD_PROBLEM_CATEGORIES.forEach(category => {
    const actualPercentage = (counts[category.id] / total) * 100;
    const targetPercentage = category.percentage;
    const diff = Math.abs(actualPercentage - targetPercentage);

    if (diff > tolerance * 100) {
      errors.push(
        `${category.nameAr}: ${actualPercentage.toFixed(1)}% (target: ${targetPercentage}%)`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
