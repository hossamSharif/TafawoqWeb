/**
 * Admin Review Queue Page
 * Display and manage flagged questions for expert review
 *
 * Features:
 * - List all flagged questions with flag type and priority
 * - Filter by flag type and status
 * - View question details
 * - Approve/reject actions
 * - Mark as reviewed
 *
 * @see User Story 2 (FR-003) - Quality assurance workflow
 * @see specs/1-gat-exam-v3/data-model.md - review_queue schema
 */

import { createClient } from '@/lib/supabase/server';
import { ReviewQueueTable } from './ReviewQueueTable';

export const dynamic = 'force-dynamic';

export default async function ReviewQueuePage() {
  const supabase = await createClient();

  // Fetch flagged questions with question details
  const { data: reviewQueue, error } = await supabase
    .from('review_queue')
    .select(
      `
      id,
      question_id,
      flag_type,
      flagged_at,
      status,
      priority,
      notes,
      reviewed_at,
      reviewed_by,
      questions (
        id,
        question_text,
        section,
        topic,
        subtopic,
        difficulty,
        error_count,
        question_type
      )
    `
    )
    .order('flagged_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Failed to fetch review queue:', error);
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">خطأ</h1>
        <p className="text-gray-600">فشل تحميل قائمة المراجعة</p>
      </div>
    );
  }

  // Get statistics
  const stats = {
    total: reviewQueue?.length || 0,
    pending: reviewQueue?.filter((q) => q.status === 'pending').length || 0,
    reviewed: reviewQueue?.filter((q) => q.status === 'reviewed').length || 0,
    approved: reviewQueue?.filter((q) => q.status === 'approved').length || 0,
    rejected: reviewQueue?.filter((q) => q.status === 'rejected').length || 0,
  };

  const flagTypeStats = reviewQueue?.reduce(
    (acc, item) => {
      acc[item.flag_type] = (acc[item.flag_type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="container mx-auto p-8" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">قائمة مراجعة الأسئلة</h1>
        <p className="text-gray-600">مراجعة والموافقة على الأسئلة المُبلّغ عنها أو المُشار إليها</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="الإجمالي" value={stats.total} color="gray" />
        <StatCard label="قيد المراجعة" value={stats.pending} color="yellow" />
        <StatCard label="تمت المراجعة" value={stats.reviewed} color="blue" />
        <StatCard label="موافق عليها" value={stats.approved} color="green" />
        <StatCard label="مرفوضة" value={stats.rejected} color="red" />
      </div>

      {/* Flag Type Distribution */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">توزيع أنواع الأخطاء</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {flagTypeStats &&
            Object.entries(flagTypeStats).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">{getFlagTypeLabel(type)}</span>
                <span className="text-lg font-bold text-gray-900">{count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Review Queue Table */}
      <div className="bg-white rounded-lg shadow">
        <ReviewQueueTable items={reviewQueue || []} />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colorClasses = {
    gray: 'bg-gray-100 text-gray-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
  };

  return (
    <div className={`rounded-lg shadow p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

function getFlagTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    mathematical: 'رياضي',
    grammatical: 'لغوي',
    diagram: 'رسم بياني',
    other: 'آخر',
  };
  return labels[type] || type;
}
