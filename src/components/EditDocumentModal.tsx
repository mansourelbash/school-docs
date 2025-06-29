"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { X } from "lucide-react"

interface Document {
  id: string
  title: string
  titleAr: string
  description?: string
  descriptionAr?: string
  fileName: string
  originalName: string
  filePath: string
  cloudinaryUrl?: string
  cloudinaryId?: string
  fileSize: number
  mimeType: string
  fileExtension: string
  uploadDate: string
  mainCategoryId: string
  subCategoryId?: string
  mainCategory: {
    id: string
    name: string
    nameAr: string
  }
  subCategory?: {
    id: string
    name: string
    nameAr: string
  }
}

interface Category {
  id: string
  name: string
  nameAr: string
  subCategories: SubCategory[]
}

interface SubCategory {
  id: string
  name: string
  nameAr: string
}

interface EditDocumentModalProps {
  document: Document
  categories: Category[]
  isOpen: boolean
  onClose: () => void
  onSave: (updatedDocument: Document) => void
}

export default function EditDocumentModal({
  document,
  categories,
  isOpen,
  onClose,
  onSave
}: EditDocumentModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    titleAr: "",
    description: "",
    descriptionAr: "",
    mainCategoryId: "",
    subCategoryId: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])

  useEffect(() => {
    if (document) {
      setFormData({
        title: document.title,
        titleAr: document.titleAr,
        description: document.description || "",
        descriptionAr: document.descriptionAr || "",
        mainCategoryId: document.mainCategoryId,
        subCategoryId: document.subCategoryId || ""
      })
      
      // Set subcategories based on main category
      const mainCategory = categories.find(cat => cat.id === document.mainCategoryId)
      if (mainCategory) {
        setSubCategories(mainCategory.subCategories)
      }
    }
  }, [document, categories])

  const handleMainCategoryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      mainCategoryId: value,
      subCategoryId: "" // Reset subcategory when main category changes
    }))

    const selectedCategory = categories.find(cat => cat.id === value)
    if (selectedCategory) {
      setSubCategories(selectedCategory.subCategories)
    } else {
      setSubCategories([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "فشل في تحديث الملف")
      }

      const updatedDocument = await response.json()
      onSave(updatedDocument)
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : "حدث خطأ غير متوقع")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">تعديل الملف</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العنوان بالعربية *
              </label>
              <Input
                value={formData.titleAr}
                onChange={(e) => setFormData(prev => ({ ...prev, titleAr: e.target.value }))}
                placeholder="أدخل العنوان بالعربية"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العنوان بالإنجليزية *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter title in English"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الوصف بالعربية
              </label>
              <Textarea
                value={formData.descriptionAr}
                onChange={(e) => setFormData(prev => ({ ...prev, descriptionAr: e.target.value }))}
                placeholder="أدخل الوصف بالعربية"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الوصف بالإنجليزية
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description in English"
                rows={3}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التصنيف الرئيسي *
              </label>
              <Select
                value={formData.mainCategoryId}
                onChange={(e) => handleMainCategoryChange(e.target.value)}
                required
              >
                <option value="">اختر التصنيف الرئيسي</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nameAr}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التصنيف الفرعي
              </label>
              <Select
                value={formData.subCategoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, subCategoryId: e.target.value }))}
                disabled={!formData.mainCategoryId || subCategories.length === 0}
              >
                <option value="">اختر التصنيف الفرعي (اختياري)</option>
                {subCategories.map((subCategory) => (
                  <option key={subCategory.id} value={subCategory.id}>
                    {subCategory.nameAr}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "جاري الحفظ..." : "حفظ التعديلات"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
