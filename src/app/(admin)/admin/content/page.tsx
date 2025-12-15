'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { AdminContentUploader, type AdminContentUploadData } from '@/components/admin/AdminContentUploader'
import { AdminContentPreview } from '@/components/admin/AdminContentPreview'
import { AdminContentList, type AdminContent } from '@/components/admin/AdminContentList'
import { Plus, Library, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

type ViewMode = 'list' | 'upload' | 'preview'

export default function AdminContentPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [contents, setContents] = useState<AdminContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isValidating, setIsValidating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [previewData, setPreviewData] = useState<AdminContentUploadData | null>(null)

  const fetchContents = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/content')
      if (response.ok) {
        const data = await response.json()
        setContents(data.contents || [])
      }
    } catch (error) {
      console.error('Failed to fetch contents:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContents()
  }, [fetchContents])

  const handleValidate = async (data: AdminContentUploadData): Promise<{ valid: boolean; errors?: string[] }> => {
    setIsValidating(true)
    try {
      const response = await fetch('/api/admin/content/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      return { valid: result.valid, errors: result.errors }
    } catch {
      return { valid: false, errors: ['حدث خطأ أثناء التحقق من المحتوى'] }
    } finally {
      setIsValidating(false)
    }
  }

  const handlePreview = (data: AdminContentUploadData) => {
    setPreviewData(data)
    setViewMode('preview')
  }

  const handleSave = async () => {
    if (!previewData) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/content/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(previewData),
      })

      if (response.ok) {
        setPreviewData(null)
        setViewMode('list')
        await fetchContents()
      } else {
        const error = await response.json()
        alert(error.error || 'فشل في حفظ المحتوى')
      }
    } catch {
      alert('حدث خطأ أثناء حفظ المحتوى')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/admin/content/${id}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      setContents(contents.filter(c => c.id !== id))
    } else {
      const error = await response.json()
      alert(error.error || 'فشل في حذف المحتوى')
    }
  }

  const handleView = (id: string) => {
    router.push(`/forum/${id}`)
  }

  const handleCancel = () => {
    setPreviewData(null)
    setViewMode('list')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Library className="h-8 w-8" />
            إدارة المحتوى
          </h1>
          <p className="text-muted-foreground mt-1">
            رفع وإدارة محتوى الاختبارات والتمارين
          </p>
        </div>
        {viewMode === 'list' && (
          <Button onClick={() => setViewMode('upload')}>
            <Plus className="h-4 w-4 ml-2" />
            رفع محتوى جديد
          </Button>
        )}
        {(viewMode === 'upload' || viewMode === 'preview') && (
          <Button variant="outline" onClick={handleCancel}>
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للقائمة
          </Button>
        )}
      </div>

      {/* Content based on view mode */}
      {viewMode === 'list' && (
        <AdminContentList
          contents={contents}
          isLoading={isLoading}
          onDelete={handleDelete}
          onView={handleView}
        />
      )}

      {viewMode === 'upload' && (
        <AdminContentUploader
          onValidate={handleValidate}
          onPreview={handlePreview}
          isValidating={isValidating}
        />
      )}

      {viewMode === 'preview' && previewData && (
        <AdminContentPreview
          data={previewData}
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={isSaving}
        />
      )}
    </div>
  )
}
