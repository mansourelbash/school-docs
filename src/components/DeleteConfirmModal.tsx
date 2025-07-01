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
  document?: Document | null; // <-- made optional
  isOpen: boolean;          
  title?: string;          
  description?: string;   
  confirmText?: string;     
  cancelText?: string;    
  onConfirm: (id?: string) => Promise<void>; // id is now optional
  onClose: () => void; 
  isLoading?: boolean;  
}

export default function DeleteConfirmModal({
  document = null,
  isOpen,
  onClose,
  onConfirm,
  title = "تأكيد الحذف",
  description = "سيتم حذف الملف نهائياً ولا يمكن التراجع عن هذا الإجراء.",
  confirmText = "نعم، احذف الملف",
  cancelText = "إلغاء",
  isLoading
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading || isLoading}
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
                {title}
              </h3>
              <p className="text-gray-600">
                {description}
              </p>
            </div>
          </div>

          {document && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <span className="font-medium">الملف:</span> {document.titleAr}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                <span className="font-medium">اسم الملف:</span> {document.originalName}
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              onClick={handleConfirm}
              variant="destructive"
              disabled={loading || isLoading}
              className="flex-1"
            >
              {loading || isLoading ? "جاري الحذف..." : confirmText}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={loading || isLoading}
              className="flex-1"
            >
              {cancelText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
