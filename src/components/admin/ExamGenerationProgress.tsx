/**
 * ExamGenerationProgress.tsx
 * Real-time progress indicator for full exam generation
 *
 * Features:
 * - Batch-by-batch progress visualization
 * - Cache hit rate tracking
 * - Cost savings display
 * - Estimated time remaining
 * - Success/error states
 *
 * @see User Story 6 (T088) - Progress UI for batch generation
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import type { ExamGenerationProgress } from '@/app/actions/generation-actions';

export interface ExamGenerationProgressProps {
  /** Current progress data */
  progress: ExamGenerationProgress | null;
  /** Whether generation is active */
  isGenerating: boolean;
  /** Whether generation completed successfully */
  isComplete: boolean;
  /** Error message if generation failed */
  error?: string;
}

export function ExamGenerationProgress({
  progress,
  isGenerating,
  isComplete,
  error,
}: ExamGenerationProgressProps) {
  // Calculate overall progress percentage
  const progressPercent = progress
    ? (progress.questionsGenerated / progress.targetQuestions) * 100
    : 0;

  // Calculate estimated time remaining (rough estimate: 30s per batch)
  const estimatedTimeRemaining = progress
    ? (progress.totalBatches - progress.currentBatch) * 30
    : 0;

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate cost savings based on cache hit rate
  const estimatedSavings = progress
    ? progress.cacheHitRate * 100 // Percentage savings approximation
    : 0;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isGenerating && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          {isComplete && !error && <CheckCircle2 className="h-5 w-5 text-green-600" />}
          {error && <XCircle className="h-5 w-5 text-red-600" />}
          <span>توليد الاختبار الكامل</span>
        </CardTitle>
        <CardDescription>
          {isGenerating && progress && (
            <span>الدفعة {progress.currentBatch} من {progress.totalBatches} • {progress.status}</span>
          )}
          {isComplete && !error && <span>تم التوليد بنجاح!</span>}
          {error && <span>حدث خطأ: {error}</span>}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">التقدم الإجمالي</span>
            <span className="text-muted-foreground">
              {progress?.questionsGenerated || 0} / {progress?.targetQuestions || 120} سؤال
            </span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progressPercent.toFixed(1)}%</span>
            {isGenerating && estimatedTimeRemaining > 0 && (
              <span>الوقت المتبقي المتوقع: {formatTime(estimatedTimeRemaining)}</span>
            )}
          </div>
        </div>

        {/* Batch Progress Indicators */}
        {progress && (
          <div className="space-y-2">
            <div className="text-sm font-medium">دفعات التوليد</div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: progress.totalBatches }, (_, i) => {
                const batchNum = i + 1;
                const isCompleted = batchNum < progress.currentBatch;
                const isCurrent = batchNum === progress.currentBatch;
                const isPending = batchNum > progress.currentBatch;

                return (
                  <div
                    key={batchNum}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border ${
                      isCompleted
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : isCurrent
                          ? 'bg-primary/10 border-primary text-primary animate-pulse'
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                    }`}
                  >
                    {isCompleted && <CheckCircle2 className="h-4 w-4" />}
                    {isCurrent && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isPending && <Circle className="h-4 w-4" />}
                    <span className="text-xs font-medium">دفعة {batchNum}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        {progress && (
          <div className="grid grid-cols-2 gap-4">
            {/* Cache Hit Rate */}
            <Card className="border-2">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-primary">
                  {(progress.cacheHitRate * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">معدل استخدام الذاكرة المؤقتة</div>
                <Badge variant={progress.cacheHitRate >= 0.7 ? 'default' : 'secondary'} className="mt-2">
                  {progress.cacheHitRate >= 0.7 ? 'ممتاز' : 'جيد'}
                </Badge>
              </CardContent>
            </Card>

            {/* Cost So Far */}
            <Card className="border-2">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-primary">
                  ${progress.estimatedCostSoFar.toFixed(4)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">التكلفة حتى الآن</div>
                {estimatedSavings > 0 && (
                  <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-300">
                    توفير ~{estimatedSavings.toFixed(0)}%
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success Summary */}
        {isComplete && !error && progress && (
          <Card className="border-2 border-green-300 bg-green-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-medium text-green-900">تم توليد الاختبار بنجاح!</div>
                  <div className="text-sm text-green-700 space-y-1">
                    <div>• {progress.questionsGenerated} سؤال تم توليده</div>
                    <div>• معدل استخدام الذاكرة: {(progress.cacheHitRate * 100).toFixed(1)}%</div>
                    <div>• التكلفة الإجمالية: ${progress.estimatedCostSoFar.toFixed(4)}</div>
                    {estimatedSavings > 0 && (
                      <div>• التوفير المقدر: ~{estimatedSavings.toFixed(0)}% مقارنة بدون الذاكرة المؤقتة</div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="border-2 border-red-300 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-medium text-red-900">فشل التوليد</div>
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Text */}
        {isGenerating && (
          <div className="text-xs text-muted-foreground p-4 bg-muted/50 rounded-md space-y-1">
            <div>💡 <strong>ملاحظة:</strong> يتم توليد الأسئلة على دفعات متسلسلة (وليس متوازية) لتحقيق أقصى استفادة من الذاكرة المؤقتة.</div>
            <div>⏱️ <strong>الوقت المتوقع:</strong> ~3 دقائق لتوليد 120 سؤال</div>
            <div>💰 <strong>التوفير:</strong> توفير ~75% من التكلفة باستخدام الذاكرة المؤقتة للنصوص</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
