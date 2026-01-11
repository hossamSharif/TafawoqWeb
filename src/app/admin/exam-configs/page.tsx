/**
 * page.tsx - Exam Configuration Management Page
 * Admin interface for creating and managing exam configurations
 *
 * Features:
 * - Create new exam configurations
 * - List existing configurations
 * - Generate full exams from configurations
 * - Real-time generation progress
 *
 * @see User Story 6 (T089) - Exam config creation interface
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExamGenerationProgress } from '@/components/admin/ExamGenerationProgress';
import {
  generateFullExamAction,
  listExamConfigsAction,
  type ExamConfiguration,
  type ExamGenerationProgress as ProgressType,
  type ExamGenerationResult,
} from '@/app/actions/generation-actions';
import { Loader2, Plus, Sparkles } from 'lucide-react';

// Default topic distributions (from topics.ts - updated for v3.0)
const DEFAULT_QUANT_DISTRIBUTION = {
  arithmetic: 0.34,
  geometry: 0.21,
  algebra: 0.20,
  statistics: 0.10,
  comparisons: 0.15, // NEW v3.0 - comparison questions (User Story 3)
};

const DEFAULT_VERBAL_DISTRIBUTION = {
  reading: 0.4,
  analogy: 0.25,
  completion: 0.15,
  error: 0.12,
  'odd-word': 0.08,
};

const DEFAULT_DIFFICULTY_DISTRIBUTION = {
  easy: 0.3,
  medium: 0.5,
  hard: 0.2,
};

export default function ExamConfigsPage() {
  // State
  const [configs, setConfigs] = useState<ExamConfiguration[]>([]);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<ProgressType | null>(null);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [generationError, setGenerationError] = useState<string | undefined>();

  // Form state for new config
  const [newConfig, setNewConfig] = useState<ExamConfiguration>({
    name: '',
    track: 'scientific',
    sectionSplit: {
      quantitative: 60,
      verbal: 60,
    },
    topicDistribution: {
      quantitative: DEFAULT_QUANT_DISTRIBUTION,
      verbal: DEFAULT_VERBAL_DISTRIBUTION,
    },
    difficultyDistribution: DEFAULT_DIFFICULTY_DISTRIBUTION,
    batchSize: 20,
  });

  // Load existing configs on mount
  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setIsLoadingConfigs(true);
    try {
      const loadedConfigs = await listExamConfigsAction();
      setConfigs(loadedConfigs);
    } catch (error) {
      console.error('Failed to load configs:', error);
    } finally {
      setIsLoadingConfigs(false);
    }
  };

  // Handle exam generation
  const handleGenerateExam = async (config: ExamConfiguration) => {
    setIsGenerating(true);
    setGenerationProgress(null);
    setGenerationComplete(false);
    setGenerationError(undefined);

    try {
      const result: ExamGenerationResult = await generateFullExamAction(
        config,
        (progress) => {
          setGenerationProgress(progress);
        }
      );

      if (result.success) {
        setGenerationComplete(true);
        console.log('Exam generated successfully!', result.stats);
      } else {
        setGenerationError(result.error);
      }
    } catch (error) {
      console.error('Generation failed:', error);
      setGenerationError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">إعدادات الاختبار</h1>
        <p className="text-muted-foreground mt-2">
          إنشاء وإدارة إعدادات الاختبارات الكاملة (120 سؤال)
        </p>
      </div>

      {/* Quick Generate Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            توليد اختبار كامل سريع
          </CardTitle>
          <CardDescription>
            توليد 120 سؤال في ~3 دقائق مع توفير 75% من التكلفة
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Config Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Track Selection */}
            <div className="space-y-2">
              <Label htmlFor="track">المسار الدراسي</Label>
              <Select
                value={newConfig.track}
                onValueChange={(value) =>
                  setNewConfig({ ...newConfig, track: value as 'scientific' | 'literary' })
                }
              >
                <SelectTrigger id="track">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scientific">علمي</SelectItem>
                  <SelectItem value="literary">أدبي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Exam Name */}
            <div className="space-y-2">
              <Label htmlFor="exam-name">اسم الاختبار</Label>
              <Input
                id="exam-name"
                placeholder="مثال: اختبار تجريبي 1"
                value={newConfig.name}
                onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
              />
            </div>

            {/* Quantitative Questions */}
            <div className="space-y-2">
              <Label htmlFor="quant-count">عدد أسئلة القسم الكمي</Label>
              <Input
                id="quant-count"
                type="number"
                min="0"
                max="120"
                value={newConfig.sectionSplit.quantitative}
                onChange={(e) =>
                  setNewConfig({
                    ...newConfig,
                    sectionSplit: {
                      ...newConfig.sectionSplit,
                      quantitative: parseInt(e.target.value) || 0,
                    },
                  })
                }
              />
            </div>

            {/* Verbal Questions */}
            <div className="space-y-2">
              <Label htmlFor="verbal-count">عدد أسئلة القسم اللفظي</Label>
              <Input
                id="verbal-count"
                type="number"
                min="0"
                max="120"
                value={newConfig.sectionSplit.verbal}
                onChange={(e) =>
                  setNewConfig({
                    ...newConfig,
                    sectionSplit: {
                      ...newConfig.sectionSplit,
                      verbal: parseInt(e.target.value) || 0,
                    },
                  })
                }
              />
            </div>
          </div>

          {/* Total Questions Display */}
          <div className="p-4 bg-muted rounded-md">
            <div className="text-sm font-medium">إجمالي الأسئلة</div>
            <div className="text-2xl font-bold text-primary">
              {newConfig.sectionSplit.quantitative + newConfig.sectionSplit.verbal} سؤال
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              الوقت المتوقع: ~
              {Math.ceil((newConfig.sectionSplit.quantitative + newConfig.sectionSplit.verbal) / 40)}{' '}
              دقيقة
            </div>
          </div>

          {/* Generate Button */}
          <Button
            size="lg"
            className="w-full"
            disabled={
              isGenerating ||
              !newConfig.name ||
              newConfig.sectionSplit.quantitative + newConfig.sectionSplit.verbal === 0
            }
            onClick={() => handleGenerateExam(newConfig)}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري التوليد...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                بدء التوليد
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Progress Display */}
      {(isGenerating || generationComplete || generationError) && (
        <ExamGenerationProgress
          progress={generationProgress}
          isGenerating={isGenerating}
          isComplete={generationComplete}
          error={generationError}
        />
      )}

      {/* Saved Configurations */}
      <Card>
        <CardHeader>
          <CardTitle>الإعدادات المحفوظة</CardTitle>
          <CardDescription>اختر إعدادًا محفوظًا لتوليد اختبار جديد</CardDescription>
        </CardHeader>

        <CardContent>
          {isLoadingConfigs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>لا توجد إعدادات محفوظة</p>
              <p className="text-sm mt-2">قم بإنشاء إعداد جديد أعلاه</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {configs.map((config) => (
                <Card key={config.configId} className="border-2 hover:border-primary transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">{config.name}</CardTitle>
                    <CardDescription>
                      {config.track === 'scientific' ? 'علمي' : 'أدبي'} •{' '}
                      {config.sectionSplit.quantitative + config.sectionSplit.verbal} سؤال
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      <div>كمي: {config.sectionSplit.quantitative} سؤال</div>
                      <div>لفظي: {config.sectionSplit.verbal} سؤال</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4"
                      disabled={isGenerating}
                      onClick={() => handleGenerateExam(config)}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      توليد اختبار
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <div className="font-medium">📋 ملاحظات هامة:</div>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>يتم توليد الأسئلة على دفعات متسلسلة (6 دفعات × 20 سؤال)</li>
              <li>متوسط الوقت: ~30 ثانية لكل دفعة = ~3 دقائق للاختبار الكامل</li>
              <li>التوفير المتوقع: ~75% من التكلفة باستخدام الذاكرة المؤقتة</li>
              <li>معدل نجاح الذاكرة المؤقتة المستهدف: ≥70%</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
