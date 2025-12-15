'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FileText,
  MoreVertical,
  Trash2,
  Eye,
  Loader2,
  AlertTriangle,
  Library,
  Users,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import { SECTION_LABELS } from '@/types/question'

export interface AdminContent {
  id: string
  title: string
  section: 'quantitative' | 'verbal'
  questionCount: number
  accessCount: number
  completionCount: number
  createdAt: string
  isLibraryVisible: boolean
}

interface AdminContentListProps {
  contents: AdminContent[]
  isLoading?: boolean
  onDelete: (id: string) => Promise<void>
  onView: (id: string) => void
}

export function AdminContentList({
  contents,
  isLoading = false,
  onDelete,
  onView,
}: AdminContentListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (id: string) => {
    setSelectedContentId(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedContentId) return

    setIsDeleting(true)
    try {
      await onDelete(selectedContentId)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setSelectedContentId(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (contents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Library className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">لا يوجد محتوى</h3>
          <p className="text-muted-foreground max-w-sm">
            لم يتم رفع أي محتوى حتى الآن. قم برفع ملف JSON لإضافة محتوى جديد للمكتبة.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            المحتوى المرفوع
          </CardTitle>
          <CardDescription>
            {contents.length.toLocaleString('ar-SA')} محتوى تم رفعه
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">العنوان</TableHead>
                <TableHead className="text-right">القسم</TableHead>
                <TableHead className="text-right">الأسئلة</TableHead>
                <TableHead className="text-right">الإحصائيات</TableHead>
                <TableHead className="text-right">تاريخ الرفع</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contents.map((content) => (
                <TableRow key={content.id}>
                  <TableCell className="font-medium">
                    <button
                      onClick={() => onView(content.id)}
                      className="hover:text-primary transition-colors text-right"
                    >
                      {content.title}
                    </button>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {SECTION_LABELS[content.section]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {content.questionCount.toLocaleString('ar-SA')} سؤال
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {content.accessCount.toLocaleString('ar-SA')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {content.completionCount.toLocaleString('ar-SA')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDistanceToNow(new Date(content.createdAt), {
                      addSuffix: true,
                      locale: ar,
                    })}
                  </TableCell>
                  <TableCell>
                    {content.isLibraryVisible ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        مرئي
                      </Badge>
                    ) : (
                      <Badge variant="secondary">مخفي</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">القائمة</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(content.id)}>
                          <Eye className="h-4 w-4 ml-2" />
                          عرض التفاصيل
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(content.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 ml-2" />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              تأكيد الحذف
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المحتوى؟ سيتم إزالته من المكتبة ولن يتمكن المستخدمون من الوصول إليه. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel disabled={isDeleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
