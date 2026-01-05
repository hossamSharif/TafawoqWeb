/**
 * Topic Hierarchy Constants
 * Classification structure for GAT exam questions
 *
 * Defines:
 * - Quantitative topics with 29 subtopics
 * - Verbal topics with subtopics
 * - Topic weights for distribution matching GAT standards
 *
 * @see specs/1-gat-exam-v3/data-model.md - TopicHierarchy
 */

export interface TopicDefinition {
  label: string; // Arabic label
  subtopics: Record<string, string>; // key -> Arabic label
  weight: number; // Distribution weight (0-1)
}

/**
 * Quantitative Topics
 * Total: 29 subtopics across 4 main topics
 * Distribution: 40% arithmetic, 24% geometry, 23% algebra, 13% statistics
 */
export const QUANTITATIVE_TOPICS: Record<string, TopicDefinition> = {
  arithmetic: {
    label: 'الحساب',
    subtopics: {
      'basic-operations': 'العمليات الأساسية',
      'number-properties': 'خصائص الأعداد',
      'fractions': 'الكسور',
      'decimals': 'الأعداد العشرية',
      'exponents-roots': 'الأسس والجذور',
      'ratio-proportion': 'النسبة والتناسب',
      'percentages': 'النسب المئوية',
    },
    weight: 0.40, // 40% of quantitative questions
  },
  geometry: {
    label: 'الهندسة',
    subtopics: {
      angles: 'الزوايا',
      triangles: 'المثلثات',
      circles: 'الدوائر',
      polygons: 'المضلعات',
      'area-perimeter': 'المساحة والمحيط',
      '3d-shapes': 'الأشكال ثلاثية الأبعاد',
      'coordinate-geometry': 'الهندسة الإحداثية',
      'overlapping-shapes': 'الأشكال المتداخلة', // NEW v3.0
    },
    weight: 0.24, // 24% of quantitative questions
  },
  algebra: {
    label: 'الجبر',
    subtopics: {
      'linear-equations': 'المعادلات الخطية',
      'quadratic-equations': 'المعادلات التربيعية',
      inequalities: 'المتباينات',
      'algebraic-expressions': 'العبارات الجبرية',
      sequences: 'المتتاليات',
      functions: 'الدوال',
    },
    weight: 0.23, // 23% of quantitative questions
  },
  statistics: {
    label: 'الإحصاء',
    subtopics: {
      'central-tendency': 'مقاييس النزعة المركزية',
      dispersion: 'مقاييس التشتت',
      charts: 'الرسوم البيانية', // NEW v3.0 enhanced
      probability: 'الاحتمالات',
      permutations: 'التباديل والتوافيق',
    },
    weight: 0.13, // 13% of quantitative questions
  },
};

/**
 * Verbal Topics
 * Distribution varies by track (scientific vs literary)
 */
export const VERBAL_TOPICS: Record<string, TopicDefinition> = {
  reading: {
    label: 'فهم المقروء',
    subtopics: {
      'main-idea': 'الفكرة الرئيسية',
      details: 'التفاصيل',
      inference: 'الاستنتاج',
      vocabulary: 'المفردات',
      purpose: 'غرض الكاتب',
    },
    weight: 0.40, // 40% of verbal questions
  },
  analogy: {
    label: 'التناظر اللفظي',
    subtopics: {
      synonymy: 'ترادف', // Synonymy
      antonymy: 'تضاد', // Antonymy
      'part-whole': 'جزء من كل', // Part-Whole
      'cause-effect': 'سبب ونتيجة', // Cause-Effect
      'function-object': 'وظيفة ومادة', // Function-Object
      'characteristic-object': 'صفة وموصوف', // Characteristic-Object
      'tool-action': 'أداة وفعل', // Tool-Action
      'degree-intensity': 'درجة وشدة', // Degree-Intensity
      'category-member': 'فئة وفرد', // Category-Member
      'location-object': 'مكان وشيء', // Location-Object
      // 22 total relationship types defined in analogy-relationships.ts
    },
    weight: 0.25, // 25% of verbal questions
  },
  completion: {
    label: 'إكمال الجمل',
    subtopics: {
      'context-clues': 'القرائن السياقية',
      'logical-flow': 'التسلسل المنطقي',
      'vocabulary-context': 'المفردات في السياق',
    },
    weight: 0.15, // 15% of verbal questions
  },
  error: {
    label: 'الخطأ السياقي',
    subtopics: {
      'grammatical-error': 'الخطأ النحوي',
      'contextual-error': 'الخطأ السياقي',
      'word-choice-error': 'الخطأ في اختيار الكلمة',
    },
    weight: 0.12, // 12% of verbal questions
  },
  'odd-word': {
    label: 'الاستثناء',
    subtopics: {
      'semantic-category': 'الفئة الدلالية',
      'thematic-group': 'المجموعة الموضوعية',
    },
    weight: 0.08, // 8% of verbal questions
  },
};

/**
 * Get all subtopic keys for a given topic
 */
export function getSubtopicKeys(
  topicKey: string,
  section: 'quantitative' | 'verbal'
): string[] {
  const topics = section === 'quantitative' ? QUANTITATIVE_TOPICS : VERBAL_TOPICS;
  const topic = topics[topicKey];
  return topic ? Object.keys(topic.subtopics) : [];
}

/**
 * Get Arabic label for a topic
 */
export function getTopicLabel(
  topicKey: string,
  section: 'quantitative' | 'verbal'
): string {
  const topics = section === 'quantitative' ? QUANTITATIVE_TOPICS : VERBAL_TOPICS;
  return topics[topicKey]?.label || topicKey;
}

/**
 * Get Arabic label for a subtopic
 */
export function getSubtopicLabel(
  topicKey: string,
  subtopicKey: string,
  section: 'quantitative' | 'verbal'
): string {
  const topics = section === 'quantitative' ? QUANTITATIVE_TOPICS : VERBAL_TOPICS;
  return topics[topicKey]?.subtopics[subtopicKey] || subtopicKey;
}

/**
 * Validate topic distribution matches target weights
 * @param distribution - Object with topic keys and counts
 * @param section - Question section
 * @param tolerance - Allowed deviation (default ±5%)
 * @returns Validation result
 */
export function validateTopicDistribution(
  distribution: Record<string, number>,
  section: 'quantitative' | 'verbal',
  tolerance: number = 0.05
): { valid: boolean; errors: string[] } {
  const topics = section === 'quantitative' ? QUANTITATIVE_TOPICS : VERBAL_TOPICS;
  const errors: string[] = [];

  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  if (total === 0) {
    return { valid: false, errors: ['No questions in distribution'] };
  }

  for (const [topicKey, targetWeight] of Object.entries(topics)) {
    const actualCount = distribution[topicKey] || 0;
    const actualWeight = actualCount / total;
    const deviation = Math.abs(actualWeight - targetWeight.weight);

    if (deviation > tolerance) {
      errors.push(
        `Topic '${topicKey}' (${topics[topicKey].label}) has ${(actualWeight * 100).toFixed(1)}% ` +
        `but target is ${(targetWeight.weight * 100).toFixed(1)}% (deviation: ${(deviation * 100).toFixed(1)}%)`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get expected count for a topic given total questions
 */
export function getExpectedTopicCount(
  topicKey: string,
  totalQuestions: number,
  section: 'quantitative' | 'verbal'
): number {
  const topics = section === 'quantitative' ? QUANTITATIVE_TOPICS : VERBAL_TOPICS;
  const topic = topics[topicKey];
  return topic ? Math.round(totalQuestions * topic.weight) : 0;
}
