/**
 * ReviewQueueTable.tsx
 * Table component for displaying review queue items
 *
 * Features:
 * - Sortable columns
 * - Filter by status and flag type
 * - View question details
 * - Approve/reject actions
 */

'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, XCircle, Eye, AlertTriangle } from 'lucide-react';

interface ReviewQueueItem {
  id: string;
  question_id: string;
  flag_type: string;
  flagged_at: string;
  status: string;
  priority: string;
  notes?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  questions: {
    id: string;
    question_text: string;
    section: string;
    topic: string;
    subtopic: string;
    difficulty: string;
    error_count: number;
    question_type: string;
  };
}

interface ReviewQueueTableProps {
  items: ReviewQueueItem[];
}

export function ReviewQueueTable({ items }: ReviewQueueTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [flagTypeFilter, setFlagTypeFilter] = useState<string>('all');

  // Apply filters
  const filteredItems = items.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (flagTypeFilter !== 'all' && item.flag_type !== flagTypeFilter) return false;
    return true;
  });

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="تصفية حسب الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="pending">قيد المراجعة</SelectItem>
              <SelectItem value="reviewed">تمت المراجعة</SelectItem>
              <SelectItem value="approved">موافق عليها</SelectItem>
              <SelectItem value="rejected">مرفوضة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Select value={flagTypeFilter} onValueChange={setFlagTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="تصفية حسب نوع الخطأ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="mathematical">رياضي</SelectItem>
              <SelectItem value="grammatical">لغوي</SelectItem>
              <SelectItem value="diagram">رسم بياني</SelectItem>
              <SelectItem value="other">آخر</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-600 mb-4">
        عرض {filteredItems.length} من {items.length} سؤال
      </p>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الأولوية</TableHead>
              <TableHead className="text-right">نوع الخطأ</TableHead>
              <TableHead className="text-right">نص السؤال</TableHead>
              <TableHead className="text-right">القسم/الموضوع</TableHead>
              <TableHead className="text-right">الصعوبة</TableHead>
              <TableHead className="text-right">عدد الأخطاء</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">تاريخ الإبلاغ</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  لا توجد أسئلة للمراجعة
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <PriorityBadge priority={item.priority} />
                  </TableCell>
                  <TableCell>
                    <FlagTypeBadge type={item.flag_type} />
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="truncate text-sm">{item.questions.question_text}</p>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{item.questions.section}</p>
                      <p className="text-gray-500 text-xs">{item.questions.topic}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DifficultyBadge difficulty={item.questions.difficulty} />
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-800 text-sm font-medium">
                      {item.questions.error_count}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(item.flagged_at).toLocaleDateString('ar-SA')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        عرض
                      </Button>
                      {item.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" className="text-green-600">
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            قبول
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600">
                            <XCircle className="w-4 h-4 mr-1" />
                            رفض
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const variants: Record<string, { color: string; icon: React.ReactNode }> = {
    high: { color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="w-3 h-3" /> },
    medium: { color: 'bg-yellow-100 text-yellow-800', icon: null },
    low: { color: 'bg-gray-100 text-gray-800', icon: null },
  };

  const variant = variants[priority] || variants.medium;

  return (
    <Badge variant="secondary" className={variant.color}>
      {variant.icon}
      {priority === 'high' ? 'عالية' : priority === 'medium' ? 'متوسطة' : 'منخفضة'}
    </Badge>
  );
}

function FlagTypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    mathematical: 'رياضي',
    grammatical: 'لغوي',
    diagram: 'رسم',
    other: 'آخر',
  };

  return <Badge variant="outline">{labels[type] || type}</Badge>;
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
  };

  const labels: Record<string, string> = {
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'صعب',
  };

  return (
    <Badge variant="secondary" className={colors[difficulty]}>
      {labels[difficulty] || difficulty}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    reviewed: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const labels: Record<string, string> = {
    pending: 'قيد المراجعة',
    reviewed: 'تمت المراجعة',
    approved: 'موافق عليها',
    rejected: 'مرفوضة',
  };

  return (
    <Badge variant="secondary" className={colors[status]}>
      {labels[status] || status}
    </Badge>
  );
}
