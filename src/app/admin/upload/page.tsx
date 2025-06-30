"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { 
  Upload, 
  FileText, 
  ArrowRight, 
  CheckCircle,
  AlertCircle,
  X
} from "lucide-react"

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

export default function AdminUpload() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [formData, setFormData] = useState({
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    mainCategoryId: '',
    subCategoryId: '',
    file: null as File | null
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/admin/login")
      return
    }
    fetchCategories()
  }, [session, status, router])

  useEffect(() => {
    if (formData.mainCategoryId) {
      const selectedCategory = categories.find(cat => cat.id === formData.mainCategoryId)
      setSubCategories(selectedCategory?.subCategories || [])
      setFormData(prev => ({ ...prev, subCategoryId: '' }))
    }
  }, [formData.mainCategoryId, categories])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setMessage({ type: 'error', text: 'فشل في جلب التصنيفات' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (10MB max)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        setMessage({ type: 'error', text: 'حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)' })
        return
      }

      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif'
      ]

      if (!allowedTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'نوع الملف غير مدعوم. الأنواع المدعومة: PDF, Word, Excel, صور' })
        return
      }

      setFormData(prev => ({ ...prev, file }))
      setMessage({ type: '', text: '' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.file || !formData.title || !formData.titleAr || !formData.mainCategoryId) {
      setMessage({ type: 'error', text: 'يرجى ملء جميع الحقول المطلوبة' })
      return
    }

    setIsUploading(true)
    setMessage({ type: '', text: '' })

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', formData.file)
      uploadFormData.append('title', formData.title)
      uploadFormData.append('titleAr', formData.titleAr)
      uploadFormData.append('description', formData.description)
      uploadFormData.append('descriptionAr', formData.descriptionAr)
      uploadFormData.append('mainCategoryId', formData.mainCategoryId)
      if (formData.subCategoryId) {
        uploadFormData.append('subCategoryId', formData.subCategoryId)
      }

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: uploadFormData
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'تم رفع الملف بنجاح!' })
        setFormData({
          title: '',
          titleAr: '',
          description: '',
          descriptionAr: '',
          mainCategoryId: '',
          subCategoryId: '',
          file: null
        })
        // Reset file input
        const fileInput = document.getElementById('file') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        const errorData = await response.json()
        setMessage({ type: 'error', text: errorData.error || 'فشل في رفع الملف' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء رفع الملف' })
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 h-auto sm:h-16">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => router.push("/admin/dashboard")}
                className="mb-2 sm:mb-0 ml-0 sm:ml-4"
              >
                <ArrowRight className="h-4 w-4 ml-2" />
                العودة للوحة التحكم
              </Button>
              <div className="flex items-center gap-2">
                <Upload className="h-8 w-8 text-blue-600 ml-0 sm:ml-3" />
                <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
                  رفع ملف جديد
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-2 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-medium text-gray-900">معلومات الملف</h2>
            <p className="mt-1 text-xs sm:text-sm text-gray-600">
              قم بملء المعلومات المطلوبة لرفع الملف الجديد
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
            {/* Message */}
            {message.text && (
              <div className={`p-4 rounded-lg flex items-center ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 ml-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 ml-2" />
                )}
                {message.text}
                <button
                  type="button"
                  onClick={() => setMessage({ type: '', text: '' })}
                  className="mr-auto"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الملف <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>رفع ملف</span>
                      <input
                        id="file"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                      />
                    </label>
                    <p className="pr-1">أو اسحب وأفلت</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, Word, Excel, صور حتى 10MB
                  </p>
                  {formData.file && (
                    <div className="mt-2 text-sm text-gray-900">
                      <p className="font-medium">{formData.file.name}</p>
                      <p className="text-gray-500">{formatFileSize(formData.file.size)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Title Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label htmlFor="titleAr" className="block text-sm font-medium text-gray-700 mb-2">
                  العنوان بالعربية <span className="text-red-500">*</span>
                </label>
                <Input
                  id="titleAr"
                  value={formData.titleAr}
                  onChange={(e) => handleInputChange('titleAr', e.target.value)}
                  placeholder="أدخل العنوان بالعربية"
                  required
                />
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  العنوان بالإنجليزية <span className="text-red-500">*</span>
                </label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter title in English"
                  required
                />
              </div>
            </div>

            {/* Description Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label htmlFor="descriptionAr" className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف بالعربية
                </label>
                <Textarea
                  id="descriptionAr"
                  value={formData.descriptionAr}
                  onChange={(e) => handleInputChange('descriptionAr', e.target.value)}
                  placeholder="أدخل وصفاً مختصراً للملف"
                  rows={3}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف بالإنجليزية
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter description in English"
                  rows={3}
                />
              </div>
            </div>

            {/* Category Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label htmlFor="mainCategory" className="block text-sm font-medium text-gray-700 mb-2">
                  التصنيف الرئيسي <span className="text-red-500">*</span>
                </label>
                <Select
                  id="mainCategory"
                  value={formData.mainCategoryId}
                  onChange={(e) => handleInputChange('mainCategoryId', e.target.value)}
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
                <label htmlFor="subCategory" className="block text-sm font-medium text-gray-700 mb-2">
                  التصنيف الفرعي
                </label>
                <Select
                  id="subCategory"
                  value={formData.subCategoryId}
                  onChange={(e) => handleInputChange('subCategoryId', e.target.value)}
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

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/dashboard")}
                className="w-full sm:w-auto"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={isUploading}
                className="w-full sm:w-auto min-w-[120px]"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                    جاري الرفع...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 ml-2" />
                    رفع الملف
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
