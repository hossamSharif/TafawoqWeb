import type { Recommendation } from '@/components/analytics/RecommendationsList'
import type { CategoryBreakdown, DetailedStrengthWeakness, SectionScores } from './scoring'

// Category labels for Arabic display
const CATEGORY_LABELS: Record<string, string> = {
  algebra: 'الجبر',
  geometry: 'الهندسة',
  statistics: 'الإحصاء',
  ratios: 'النسب والتناسب',
  'ratio-proportion': 'النسب والتناسب',
  probability: 'الاحتمالات',
  speed_distance_time: 'السرعة والمسافة',
  'speed-time-distance': 'السرعة والمسافة',
  reading_comprehension: 'استيعاب المقروء',
  'reading-comprehension': 'استيعاب المقروء',
  sentence_completion: 'إكمال الجمل',
  'sentence-completion': 'إكمال الجمل',
  contextual_error: 'الخطأ السياقي',
  'context-error': 'الخطأ السياقي',
  verbal_analogy: 'التناظر اللفظي',
  analogy: 'التناظر اللفظي',
  association_difference: 'الارتباط والاختلاف',
  'association-difference': 'الارتباط والاختلاف',
  vocabulary: 'المفردات',
}

// Category to section mapping
const CATEGORY_SECTIONS: Record<string, 'quantitative' | 'verbal'> = {
  algebra: 'quantitative',
  geometry: 'quantitative',
  statistics: 'quantitative',
  ratios: 'quantitative',
  'ratio-proportion': 'quantitative',
  probability: 'quantitative',
  speed_distance_time: 'quantitative',
  'speed-time-distance': 'quantitative',
  reading_comprehension: 'verbal',
  'reading-comprehension': 'verbal',
  sentence_completion: 'verbal',
  'sentence-completion': 'verbal',
  contextual_error: 'verbal',
  'context-error': 'verbal',
  verbal_analogy: 'verbal',
  analogy: 'verbal',
  association_difference: 'verbal',
  'association-difference': 'verbal',
  vocabulary: 'verbal',
}

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category
}

function getCategorySection(category: string): 'quantitative' | 'verbal' {
  return CATEGORY_SECTIONS[category] || 'quantitative'
}

function generateId(): string {
  return `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export interface RecommendationContext {
  sectionScores?: SectionScores
  categoryBreakdown?: CategoryBreakdown[]
  weaknesses?: DetailedStrengthWeakness[]
  strengths?: DetailedStrengthWeakness[]
  examCount?: number
  practiceHours?: number
  lastExamScore?: number
  previousExamScore?: number
  timeSpentPerQuestion?: number
  questionsSkipped?: number
  totalQuestions?: number
}

/**
 * Generate personalized recommendations based on performance data
 */
export function generateRecommendations(
  context: RecommendationContext
): Recommendation[] {
  const recommendations: Recommendation[] = []

  const {
    sectionScores,
    categoryBreakdown,
    weaknesses,
    strengths,
    examCount = 0,
    practiceHours = 0,
    lastExamScore,
    previousExamScore,
    timeSpentPerQuestion,
    questionsSkipped = 0,
    totalQuestions = 96,
  } = context

  // 1. Recommendations based on weak categories
  if (weaknesses && weaknesses.length > 0) {
    const topWeakness = weaknesses[0]
    const section = getCategorySection(topWeakness.category)
    const normalizedCategory = topWeakness.category.replace(/_/g, '-')

    recommendations.push({
      id: generateId(),
      type: 'practice',
      title: `تدريب على ${getCategoryLabel(topWeakness.category)}`,
      description: `نتيجتك في ${getCategoryLabel(topWeakness.category)} هي ${topWeakness.score}%. ننصح بجلسة تدريب مركزة لتحسين أدائك في هذا المجال.`,
      priority: topWeakness.score < 30 ? 'high' : 'medium',
      category: topWeakness.category,
      actionUrl: `/practice/new?section=${section}&category=${normalizedCategory}&difficulty=easy`,
      actionLabel: 'ابدأ التدريب',
    })

    // Add second weakness if significantly different
    if (weaknesses.length > 1 && weaknesses[1].score < 45) {
      const secondWeakness = weaknesses[1]
      const secondSection = getCategorySection(secondWeakness.category)
      const secondNormalizedCategory = secondWeakness.category.replace(/_/g, '-')

      recommendations.push({
        id: generateId(),
        type: 'practice',
        title: `تحسين ${getCategoryLabel(secondWeakness.category)}`,
        description: `${getCategoryLabel(secondWeakness.category)} يحتاج مزيداً من الممارسة. نتيجتك الحالية ${secondWeakness.score}%.`,
        priority: 'medium',
        category: secondWeakness.category,
        actionUrl: `/practice/new?section=${secondSection}&category=${secondNormalizedCategory}&difficulty=easy`,
        actionLabel: 'تدريب',
      })
    }
  }

  // 2. Section balance recommendations
  if (sectionScores) {
    const scoreDiff = Math.abs(sectionScores.verbalScore - sectionScores.quantitativeScore)

    if (scoreDiff > 20) {
      const weakerSection = sectionScores.verbalScore < sectionScores.quantitativeScore ? 'verbal' : 'quantitative'
      const weakerLabel = weakerSection === 'verbal' ? 'اللفظي' : 'الكمي'
      const strongerLabel = weakerSection === 'verbal' ? 'الكمي' : 'اللفظي'
      const weakerScore = weakerSection === 'verbal' ? sectionScores.verbalScore : sectionScores.quantitativeScore

      recommendations.push({
        id: generateId(),
        type: 'focus',
        title: `تعزيز القسم ${weakerLabel}`,
        description: `أداؤك في القسم ${weakerLabel} (${weakerScore}%) أقل بكثير من ${strongerLabel}. التوازن بين القسمين مهم للنتيجة الإجمالية.`,
        priority: 'high',
        actionUrl: `/practice/new?section=${weakerSection}`,
        actionLabel: 'تدريب مخصص',
      })
    }
  }

  // 3. Time management recommendations
  if (timeSpentPerQuestion !== undefined) {
    if (timeSpentPerQuestion > 90) { // More than 90 seconds per question
      recommendations.push({
        id: generateId(),
        type: 'time',
        title: 'تحسين إدارة الوقت',
        description: 'متوسط وقتك للسؤال الواحد مرتفع. حاول التدرب على الإجابة بشكل أسرع مع الحفاظ على الدقة.',
        priority: 'medium',
        actionUrl: '/practice/new?difficulty=easy',
        actionLabel: 'تدريب سريع',
      })
    } else if (timeSpentPerQuestion < 30) { // Less than 30 seconds per question
      recommendations.push({
        id: generateId(),
        type: 'strategy',
        title: 'قراءة الأسئلة بتمعن',
        description: 'أنت تجيب بسرعة كبيرة. تأكد من قراءة السؤال والخيارات بعناية قبل الإجابة.',
        priority: 'low',
      })
    }
  }

  // 4. Skipped questions recommendations
  if (questionsSkipped > 0) {
    const skipPercentage = (questionsSkipped / totalQuestions) * 100

    if (skipPercentage > 10) {
      recommendations.push({
        id: generateId(),
        type: 'strategy',
        title: 'تقليل الأسئلة المتروكة',
        description: `تركت ${questionsSkipped} سؤال (${Math.round(skipPercentage)}%). حاول الإجابة على جميع الأسئلة حتى لو لم تكن متأكداً.`,
        priority: skipPercentage > 20 ? 'high' : 'medium',
      })
    }
  }

  // 5. Practice consistency recommendations
  if (practiceHours < 5 && examCount > 0) {
    recommendations.push({
      id: generateId(),
      type: 'general',
      title: 'زيادة ساعات التدريب',
      description: 'ساعات تدريبك قليلة. التدريب المنتظم يساعد على تحسين الأداء بشكل ملحوظ.',
      priority: 'medium',
      actionUrl: '/practice/new',
      actionLabel: 'ابدأ الآن',
    })
  }

  // 6. Score improvement recommendations
  if (lastExamScore !== undefined && previousExamScore !== undefined) {
    const improvement = lastExamScore - previousExamScore

    if (improvement < -10) {
      recommendations.push({
        id: generateId(),
        type: 'focus',
        title: 'استعادة المستوى',
        description: `انخفضت نتيجتك ${Math.abs(improvement)}% عن الاختبار السابق. راجع المجالات التي تحتاج تحسين.`,
        priority: 'high',
      })
    } else if (improvement > 10) {
      // Positive reinforcement
      recommendations.push({
        id: generateId(),
        type: 'general',
        title: 'استمر في التقدم',
        description: `تحسنت نتيجتك بـ ${improvement}%! استمر على هذا المستوى وحافظ على روتين التدريب.`,
        priority: 'low',
      })
    }
  }

  // 7. First exam recommendations
  if (examCount === 1) {
    recommendations.push({
      id: generateId(),
      type: 'general',
      title: 'مبروك على اختبارك الأول',
      description: 'هذا اختبارك الأول! استخدم النتائج لتحديد نقاط القوة والضعف والتركيز على التحسين.',
      priority: 'low',
    })
  }

  // 8. Low overall score recommendations
  if (sectionScores && sectionScores.overallScore < 50) {
    recommendations.push({
      id: generateId(),
      type: 'strategy',
      title: 'خطة تحسين شاملة',
      description: 'نتيجتك الإجمالية تحتاج تحسين. ننصح بالتركيز على الأساسيات والتدريب المكثف على الأسئلة السهلة أولاً.',
      priority: 'high',
      actionUrl: '/practice/new?difficulty=easy',
      actionLabel: 'ابدأ من الأساسيات',
    })
  }

  // 9. Strength maintenance recommendations
  if (strengths && strengths.length > 0 && sectionScores && sectionScores.overallScore >= 70) {
    const topStrength = strengths[0]
    recommendations.push({
      id: generateId(),
      type: 'general',
      title: `حافظ على تميزك في ${getCategoryLabel(topStrength.category)}`,
      description: `أداؤك ممتاز في ${getCategoryLabel(topStrength.category)} (${topStrength.score}%). استمر على هذا المستوى.`,
      priority: 'low',
    })
  }

  // Sort by priority and limit to reasonable number
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
  return recommendations
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 6)
}

/**
 * Generate recommendations specifically for exam results
 */
export function generateExamRecommendations(
  sectionScores: SectionScores,
  categoryBreakdown: CategoryBreakdown[],
  weaknesses: DetailedStrengthWeakness[],
  strengths: DetailedStrengthWeakness[],
  timeSpentSeconds: number,
  questionsAnswered: number,
  totalQuestions: number = 96
): Recommendation[] {
  const timeSpentPerQuestion = questionsAnswered > 0
    ? timeSpentSeconds / questionsAnswered
    : 0

  const questionsSkipped = totalQuestions - questionsAnswered

  return generateRecommendations({
    sectionScores,
    categoryBreakdown,
    weaknesses,
    strengths,
    timeSpentPerQuestion,
    questionsSkipped,
    totalQuestions,
  })
}

/**
 * Generate recommendations for practice session results
 */
export function generatePracticeRecommendations(
  categoryBreakdown: CategoryBreakdown[],
  score: number,
  category: string,
  difficulty: 'easy' | 'medium' | 'hard'
): Recommendation[] {
  const recommendations: Recommendation[] = []
  const section = getCategorySection(category)
  const normalizedCategory = category.replace(/_/g, '-')

  if (score < 50) {
    // Poor performance
    recommendations.push({
      id: generateId(),
      type: 'practice',
      title: 'إعادة التدريب',
      description: `نتيجتك ${score}% تحتاج تحسين. ننصح بإعادة التدريب على مستوى أسهل.`,
      priority: 'high',
      actionUrl: `/practice/new?section=${section}&category=${normalizedCategory}&difficulty=easy`,
      actionLabel: 'تدريب سهل',
    })
  } else if (score >= 80 && difficulty !== 'hard') {
    // Good performance, suggest harder level
    const nextDifficulty = difficulty === 'easy' ? 'medium' : 'hard'
    recommendations.push({
      id: generateId(),
      type: 'practice',
      title: 'تحدي أكبر',
      description: `أداء ممتاز! جرب المستوى ${nextDifficulty === 'medium' ? 'المتوسط' : 'الصعب'} لتحدي نفسك.`,
      priority: 'medium',
      actionUrl: `/practice/new?section=${section}&category=${normalizedCategory}&difficulty=${nextDifficulty}`,
      actionLabel: 'ارفع المستوى',
    })
  }

  return recommendations
}
