/**
 * Error Correction Workflow Page
 * Admin interface for reviewing and fixing reported question errors
 *
 * Features:
 * - List all reported errors with question preview
 * - Filter by error type (mathematical, grammatical, diagram, other)
 * - View error details and reporter information
 * - Fix questions directly or mark as resolved
 * - Track correction history
 *
 * @see User Story 2 (T099) - Error correction workflow
 * @see specs/1-gat-exam-v3/data-model.md - question_errors schema
 */

import { createServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

interface QuestionError {
  id: string;
  question_id: string;
  error_type: string;
  description: string;
  reported_by: string | null;
  reported_at: string;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  question: {
    question_text: string;
    topic: string;
    difficulty: string;
    error_count: number;
  };
}

export default async function ErrorsPage() {
  const supabase = await createServerClient();

  // Fetch all question errors with question details
  const { data: errors, error: fetchError } = await supabase
    .from('question_errors')
    .select(`
      *,
      question:questions(
        question_text,
        topic,
        difficulty,
        error_count
      )
    `)
    .order('reported_at', { ascending: false });

  if (fetchError) {
    console.error('Error fetching question errors:', fetchError);
    return (
      <div className="container mx-auto p-8" dir="rtl">
        <div className="text-red-500">
          خطأ في تحميل الأخطاء: {fetchError.message}
        </div>
      </div>
    );
  }

  const questionErrors = (errors || []) as QuestionError[];

  // Calculate statistics
  const stats = {
    total: questionErrors.length,
    unresolved: questionErrors.filter(e => !e.resolved).length,
    resolved: questionErrors.filter(e => e.resolved).length,
    byType: questionErrors.reduce((acc: Record<string, number>, e) => {
      acc[e.error_type] = (acc[e.error_type] || 0) + 1;
      return acc;
    }, {}),
  };

  return (
    <div className="container mx-auto p-8" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">تصحيح أخطاء الأسئلة</h1>
        <p className="text-gray-600">مراجعة وتصحيح الأخطاء المُبلَّغ عنها في الأسئلة</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>إجمالي الأخطاء</CardTitle>
            <CardDescription>Total Errors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle>غير محلول</CardTitle>
            <CardDescription>Unresolved</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.unresolved}</div>
          </CardContent>
        </Card>

        <Card className="border-green-500">
          <CardHeader>
            <CardTitle>تم الحل</CardTitle>
            <CardDescription>Resolved</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.resolved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>معدل الحل</CardTitle>
            <CardDescription>Resolution Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Type Breakdown */}
      {Object.keys(stats.byType).length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">الأخطاء حسب النوع</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(stats.byType).map(([type, count]) => (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="capitalize">{type}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {((count / stats.total) * 100).toFixed(1)}% من الإجمالي
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Errors List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">قائمة الأخطاء المُبلَّغ عنها</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              تصفية حسب النوع
            </button>
            <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
              عرض المحلولة فقط
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {questionErrors.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                لا توجد أخطاء مُبلَّغ عنها
              </CardContent>
            </Card>
          ) : (
            questionErrors.map((error) => (
              <Card key={error.id} className={error.resolved ? 'bg-green-50' : 'bg-white'}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-sm ${
                          error.error_type === 'mathematical' ? 'bg-red-100 text-red-800' :
                          error.error_type === 'grammatical' ? 'bg-yellow-100 text-yellow-800' :
                          error.error_type === 'diagram' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {error.error_type}
                        </span>
                        {error.resolved && (
                          <span className="px-2 py-1 rounded text-sm bg-green-100 text-green-800">
                            ✓ تم الحل
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        معرف السؤال: {error.question_id} |
                        أُبلِغ في: {new Date(error.reported_at).toLocaleString('ar-SA')}
                        {error.resolved_at && ` | حُل في: ${new Date(error.resolved_at).toLocaleString('ar-SA')}`}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Question Preview */}
                  <div className="mb-4 p-4 bg-gray-50 rounded">
                    <div className="font-bold mb-2">نص السؤال:</div>
                    <div className="text-gray-700 mb-2">{error.question?.question_text || 'نص السؤال غير متوفر'}</div>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>الموضوع: {error.question?.topic}</span>
                      <span>الصعوبة: {error.question?.difficulty}</span>
                      <span>عدد الأخطاء المُبلَّغ عنها: {error.question?.error_count || 0}</span>
                    </div>
                  </div>

                  {/* Error Description */}
                  <div className="mb-4">
                    <div className="font-bold mb-2">وصف الخطأ:</div>
                    <div className="text-gray-700">{error.description || 'لم يتم توفير وصف'}</div>
                  </div>

                  {/* Reporter Info */}
                  {error.reported_by && (
                    <div className="mb-4 text-sm text-gray-600">
                      أبلغ عنه: {error.reported_by}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {!error.resolved && (
                      <>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                          تحرير السؤال
                        </button>
                        <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                          وضع علامة "تم الحل"
                        </button>
                        <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                          إضافة إلى قائمة المراجعة
                        </button>
                      </>
                    )}
                    {error.resolved && (
                      <>
                        <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                          عرض التفاصيل
                        </button>
                        <button className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">
                          إعادة فتح
                        </button>
                      </>
                    )}
                    <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                      حذف السؤال
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {questionErrors.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded">
          <h3 className="font-bold mb-4">إجراءات جماعية</h3>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              وضع علامة "تم الحل" للكل
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              تصدير إلى CSV
            </button>
            <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
              إرسال تقرير
            </button>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>إرشادات التصحيح</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><span className="font-bold">• أخطاء رياضية:</span> تحقق من الحسابات والصيغ والإجابة الصحيحة</div>
              <div><span className="font-bold">• أخطاء نحوية:</span> راجع اللغة العربية الفصحى والإملاء والتشكيل</div>
              <div><span className="font-bold">• أخطاء الرسومات:</span> تأكد من صحة المخططات والتصوير المرئي</div>
              <div><span className="font-bold">• أخطاء أخرى:</span> راجع السياق والمنطق والملاءمة الثقافية</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
