"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X } from "lucide-react"

interface Document {
  id: string
  titleAr: string
  originalName: string
}

interface DeleteConfirmModalProps {
  document: Document | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (documentId: string) => void
}

export default function DeleteConfirmModal({
  document,
  isOpen,
  onClose,
  onConfirm
}: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!document) return
    
    setLoading(true)
    try {
      await onConfirm(document.id)
      onClose()
    } catch (error) {
      console.error('Error deleting document:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !document) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">تأكيد الحذف</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                هل أنت متأكد من الحذف؟
              </h3>
              <p className="text-gray-600">
                سيتم حذف الملف نهائياً ولا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <span className="font-medium">الملف:</span> {document.titleAr}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              <span className="font-medium">اسم الملف:</span> {document.originalName}
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleConfirm}
              variant="destructive"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "جاري الحذف..." : "نعم، احذف الملف"}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={loading}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
