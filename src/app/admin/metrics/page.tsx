/**
 * Admin Metrics Dashboard
 * Displays cache hit rate, cost savings, error rates, and generation statistics
 *
 * Features:
 * - Prompt caching efficiency metrics
 * - Cost analysis and savings
 * - Question generation statistics
 * - Error tracking and quality metrics
 *
 * @see User Story 6 (T098) - Metrics dashboard
 * @see specs/1-gat-exam-v3/data-model.md - generation_metadata schema
 */

import { createServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

interface MetricsData {
  cacheMetrics: {
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    hitRate: number;
  };
  costMetrics: {
    totalCost: number;
    costWithoutCache: number;
    totalSavings: number;
    savingsPercentage: number;
  };
  generationMetrics: {
    totalQuestions: number;
    questionsToday: number;
    questionsThisWeek: number;
    avgGenerationTime: number;
  };
  errorMetrics: {
    totalErrors: number;
    errorRate: number;
    errorsByType: Record<string, number>;
    flaggedQuestions: number;
  };
  qualityMetrics: {
    grammarFlagged: number;
    qualityFlagged: number;
    approvalRate: number;
  };
}

async function getMetricsData(): Promise<MetricsData> {
  const supabase = await createServerClient();

  // Get cache metrics from generation_metadata
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('generation_metadata, created_at')
    .not('generation_metadata', 'is', null);

  if (questionsError) {
    console.error('Error fetching questions:', questionsError);
  }

  // Calculate cache metrics
  let totalRequests = 0;
  let cacheHits = 0;
  let totalCost = 0;
  let costWithoutCache = 0;

  questions?.forEach((q: any) => {
    const metadata = q.generation_metadata;
    if (metadata) {
      totalRequests++;
      if (metadata.cacheHit === true || metadata.cache_hit === true) {
        cacheHits++;
      }
      if (metadata.cost) {
        totalCost += parseFloat(metadata.cost);
        // Estimate cost without cache (cache gives ~75% savings)
        if (metadata.cacheHit || metadata.cache_hit) {
          costWithoutCache += parseFloat(metadata.cost) * 4; // 4x cost without cache
        } else {
          costWithoutCache += parseFloat(metadata.cost);
        }
      }
    }
  });

  const hitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;
  const totalSavings = costWithoutCache - totalCost;
  const savingsPercentage = costWithoutCache > 0 ? (totalSavings / costWithoutCache) * 100 : 0;

  // Get generation metrics
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const totalQuestions = questions?.length || 0;
  const questionsToday = questions?.filter((q: any) =>
    new Date(q.created_at) >= today
  ).length || 0;
  const questionsThisWeek = questions?.filter((q: any) =>
    new Date(q.created_at) >= weekAgo
  ).length || 0;

  // Get error metrics
  const { data: errors, error: errorsError } = await supabase
    .from('question_errors')
    .select('error_type');

  if (errorsError) {
    console.error('Error fetching errors:', errorsError);
  }

  const totalErrors = errors?.length || 0;
  const errorRate = totalQuestions > 0 ? (totalErrors / totalQuestions) * 100 : 0;

  const errorsByType: Record<string, number> = {};
  errors?.forEach((e: any) => {
    errorsByType[e.error_type] = (errorsByType[e.error_type] || 0) + 1;
  });

  // Get quality metrics
  const { data: reviewQueue, error: reviewError } = await supabase
    .from('review_queue')
    .select('flag_type, status');

  if (reviewError) {
    console.error('Error fetching review queue:', reviewError);
  }

  const flaggedQuestions = reviewQueue?.length || 0;
  const grammarFlagged = reviewQueue?.filter((r: any) => r.flag_type === 'grammar').length || 0;
  const qualityFlagged = reviewQueue?.filter((r: any) => r.flag_type === 'quality').length || 0;
  const approvedCount = reviewQueue?.filter((r: any) => r.status === 'approved').length || 0;
  const approvalRate = flaggedQuestions > 0 ? (approvedCount / flaggedQuestions) * 100 : 0;

  return {
    cacheMetrics: {
      totalRequests,
      cacheHits,
      cacheMisses: totalRequests - cacheHits,
      hitRate,
    },
    costMetrics: {
      totalCost,
      costWithoutCache,
      totalSavings,
      savingsPercentage,
    },
    generationMetrics: {
      totalQuestions,
      questionsToday,
      questionsThisWeek,
      avgGenerationTime: 0, // Would need timing data in metadata
    },
    errorMetrics: {
      totalErrors,
      errorRate,
      errorsByType,
      flaggedQuestions,
    },
    qualityMetrics: {
      grammarFlagged,
      qualityFlagged,
      approvalRate,
    },
  };
}

export default async function MetricsPage() {
  const metrics = await getMetricsData();

  return (
    <div className="container mx-auto p-8" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">لوحة مقاييس الأداء</h1>
        <p className="text-gray-600">مراقبة كفاءة التخزين المؤقت، التكاليف، والجودة</p>
      </div>

      {/* Cache Performance Metrics */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">كفاءة التخزين المؤقت (Prompt Caching)</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>إجمالي الطلبات</CardTitle>
              <CardDescription>Total Requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.cacheMetrics.totalRequests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>نجاحات التخزين</CardTitle>
              <CardDescription>Cache Hits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {metrics.cacheMetrics.cacheHits}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {metrics.cacheMetrics.hitRate.toFixed(1)}% معدل النجاح
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>إخفاقات التخزين</CardTitle>
              <CardDescription>Cache Misses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {metrics.cacheMetrics.cacheMisses}
              </div>
            </CardContent>
          </Card>

          <Card className={metrics.cacheMetrics.hitRate >= 75 ? 'border-green-500' : 'border-orange-500'}>
            <CardHeader>
              <CardTitle>معدل الإصابة</CardTitle>
              <CardDescription>Hit Rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${metrics.cacheMetrics.hitRate >= 75 ? 'text-green-600' : 'text-orange-600'}`}>
                {metrics.cacheMetrics.hitRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {metrics.cacheMetrics.hitRate >= 75 ? '✓ ممتاز' : '⚠ يحتاج تحسين'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cost Savings Metrics */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">تحليل التكاليف والتوفير</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>التكلفة الفعلية</CardTitle>
              <CardDescription>Actual Cost</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${metrics.costMetrics.totalCost.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>التكلفة بدون تخزين</CardTitle>
              <CardDescription>Cost Without Cache</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                ${metrics.costMetrics.costWithoutCache.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500">
            <CardHeader>
              <CardTitle>إجمالي التوفير</CardTitle>
              <CardDescription>Total Savings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${metrics.costMetrics.totalSavings.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500">
            <CardHeader>
              <CardTitle>نسبة التوفير</CardTitle>
              <CardDescription>Savings Percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {metrics.costMetrics.savingsPercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {metrics.costMetrics.savingsPercentage >= 70 ? '✓ هدف متحقق' : '⚠ أقل من المستهدف'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Generation Statistics */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">إحصائيات التوليد</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>إجمالي الأسئلة</CardTitle>
              <CardDescription>Total Questions Generated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.generationMetrics.totalQuestions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>اليوم</CardTitle>
              <CardDescription>Questions Today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {metrics.generationMetrics.questionsToday}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>هذا الأسبوع</CardTitle>
              <CardDescription>Questions This Week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {metrics.generationMetrics.questionsThisWeek}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Error Metrics */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">مقاييس الأخطاء والجودة</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>إجمالي الأخطاء</CardTitle>
              <CardDescription>Total Errors Reported</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {metrics.errorMetrics.totalErrors}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>معدل الخطأ</CardTitle>
              <CardDescription>Error Rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${metrics.errorMetrics.errorRate < 5 ? 'text-green-600' : 'text-orange-600'}`}>
                {metrics.errorMetrics.errorRate.toFixed(2)}%
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {metrics.errorMetrics.errorRate < 5 ? '✓ ضمن المعدل المقبول' : '⚠ يحتاج مراجعة'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>أسئلة مُعلّمة</CardTitle>
              <CardDescription>Flagged Questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {metrics.errorMetrics.flaggedQuestions}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                نحوي: {metrics.qualityMetrics.grammarFlagged} | جودة: {metrics.qualityMetrics.qualityFlagged}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>معدل القبول</CardTitle>
              <CardDescription>Approval Rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${metrics.qualityMetrics.approvalRate >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
                {metrics.qualityMetrics.approvalRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Error Breakdown */}
      {Object.keys(metrics.errorMetrics.errorsByType).length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">تفصيل الأخطاء حسب النوع</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {Object.entries(metrics.errorMetrics.errorsByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">{type}</span>
                    <span className="text-lg font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary and Recommendations */}
      <div>
        <h2 className="text-2xl font-bold mb-4">الملخص والتوصيات</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {metrics.cacheMetrics.hitRate >= 75 ? (
                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-2xl">✓</span>
                  <div>
                    <div className="font-bold">كفاءة التخزين المؤقت ممتازة</div>
                    <div className="text-gray-600">معدل الإصابة {metrics.cacheMetrics.hitRate.toFixed(1)}% يتجاوز المستهدف (75%)</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <span className="text-orange-600 text-2xl">⚠</span>
                  <div>
                    <div className="font-bold">كفاءة التخزين تحتاج تحسين</div>
                    <div className="text-gray-600">معدل الإصابة {metrics.cacheMetrics.hitRate.toFixed(1)}% أقل من المستهدف (75%). تأكد من التوليد المتسلسل وليس المتوازي.</div>
                  </div>
                </div>
              )}

              {metrics.costMetrics.savingsPercentage >= 70 ? (
                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-2xl">✓</span>
                  <div>
                    <div className="font-bold">التوفير في التكلفة ممتاز</div>
                    <div className="text-gray-600">تم توفير ${metrics.costMetrics.totalSavings.toFixed(2)} ({metrics.costMetrics.savingsPercentage.toFixed(1)}%)</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <span className="text-orange-600 text-2xl">⚠</span>
                  <div>
                    <div className="font-bold">التوفير أقل من المتوقع</div>
                    <div className="text-gray-600">نسبة التوفير {metrics.costMetrics.savingsPercentage.toFixed(1)}% أقل من المستهدف (70%)</div>
                  </div>
                </div>
              )}

              {metrics.errorMetrics.errorRate < 5 ? (
                <div className="flex items-start gap-3">
                  <span className="text-green-600 text-2xl">✓</span>
                  <div>
                    <div className="font-bold">معدل الأخطاء منخفض</div>
                    <div className="text-gray-600">معدل الخطأ {metrics.errorMetrics.errorRate.toFixed(2)}% ضمن المعدل المقبول</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <span className="text-orange-600 text-2xl">⚠</span>
                  <div>
                    <div className="font-bold">معدل الأخطاء مرتفع</div>
                    <div className="text-gray-600">معدل الخطأ {metrics.errorMetrics.errorRate.toFixed(2)}% يتطلب مراجعة Skills أو معايير الجودة</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
