"use client"

import { useState, useEffect } from "react"
import { 
  FileText, 
  Download, 
  Search, 
  Filter,
  Calendar,
  FolderOpen,
  ChevronDown,
  Eye,
  School,
  Grid3X3,
  List,
  Star,
  TrendingUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import FilePreview from "@/components/FilePreview"

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
  _count: {
    documents: number
  }
}

interface SubCategory {
  id: string
  name: string
  nameAr: string
  _count: {
    documents: number
  }
}

export default function PublicPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMainCategory, setSelectedMainCategory] = useState("")
  const [selectedSubCategory, setSelectedSubCategory] = useState("")
  const [selectedSubCategories, setSelectedSubCategories] = useState<SubCategory[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  const itemsPerPage = 12

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterDocuments()
  }, [documents, searchTerm, selectedMainCategory, selectedSubCategory])

  useEffect(() => {
    if (selectedMainCategory) {
      const category = categories.find(cat => cat.id === selectedMainCategory)
      setSelectedSubCategories(category?.subCategories || [])
      setSelectedSubCategory("")
    } else {
      setSelectedSubCategories([])
      setSelectedSubCategory("")
    }
  }, [selectedMainCategory, categories])

  const fetchData = async () => {
    try {
      const [docsResponse, catsResponse] = await Promise.all([
        fetch('/api/documents?limit=1000'),
        fetch('/api/categories')
      ])
      
      const docsData = await docsResponse.json()
      const catsData = await catsResponse.json()
      
      setDocuments(docsData.documents || [])
      setCategories(catsData || [])
      setFilteredDocuments(docsData.documents || [])
    } catch (error) {
      // Set default values on error
      setDocuments([])
      setCategories([])
      setFilteredDocuments([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterDocuments = () => {
    let filtered = documents

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.titleAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.descriptionAr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedMainCategory) {
      filtered = filtered.filter(doc => doc.mainCategory.id === selectedMainCategory)
    }

    if (selectedSubCategory) {
      filtered = filtered.filter(doc => doc.subCategory?.id === selectedSubCategory)
    }

    setFilteredDocuments(filtered)
    setCurrentPage(1)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return '📄'
      case 'doc':
      case 'docx':
        return '📝'
      case 'xls':
      case 'xlsx':
        return '📊'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️'
      default:
        return '📎'
    }
  }

  const handleDownload = (documentId: string) => {
    window.open(`/api/documents/${documentId}/download`, '_blank')
  }

  // Pagination
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentDocuments = filteredDocuments.slice(startIndex, endIndex)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-6 gulf-text-lg text-gray-700 font-medium">جاري تحميل الملفات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header المحدث */}
      <header className="bg-white/95 backdrop-blur-lg shadow-xl border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="p-3 gulf-gradient rounded-2xl shadow-lg">
                <School className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="gulf-text-2xl text-gray-900 font-bold">
                  مكتبة الملفات المدرسية
                </h1>
                <p className="gulf-text-sm text-gray-600 mt-1">
                  نظام إدارة الوثائق التعليمية المتطور
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6 space-x-reverse">
              <div className="hidden md:flex items-center space-x-8 space-x-reverse">
                <div className="text-center">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <div className="gulf-text-lg font-bold text-blue-600">{documents.length}</div>
                  </div>
                  <div className="gulf-text-sm text-gray-500">ملف</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <FolderOpen className="h-5 w-5 text-green-600" />
                    <div className="gulf-text-lg font-bold text-green-600">{categories.length}</div>
                  </div>
                  <div className="gulf-text-sm text-gray-500">تصنيف</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* البحث والفلاتر المحدثة */}
        <div className="modern-card p-8 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="ابحث في الملفات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="gulf-text-base pr-12 h-14 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Select
                value={selectedMainCategory}
                onChange={(e) => setSelectedMainCategory(e.target.value)}
                className="gulf-text-base min-w-[200px] h-14"
              >
                <option value="">جميع التصنيفات</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nameAr} ({category._count.documents})
                  </option>
                ))}
              </Select>

              {selectedSubCategories.length > 0 && (
                <Select
                  value={selectedSubCategory}
                  onChange={(e) => setSelectedSubCategory(e.target.value)}
                  className="gulf-text-base min-w-[200px] h-14"
                >
                  <option value="">جميع التصنيفات الفرعية</option>
                  {selectedSubCategories.map((subCategory) => (
                    <option key={subCategory.id} value={subCategory.id}>
                      {subCategory.nameAr} ({subCategory._count.documents})
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        {filteredDocuments.length > 0 && (
          <div className="modern-card p-6 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center space-x-4 space-x-reverse">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <Grid3X3 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
              <p className="gulf-text-base text-gray-600">
                عرض {startIndex + 1}-{Math.min(endIndex, filteredDocuments.length)} من أصل {filteredDocuments.length} ملف
              </p>
            </div>
          </div>
        )}

        {/* عرض الملفات المحدث */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {currentDocuments.map((doc) => (
              <div key={doc.id} className="modern-card group hover:scale-105 transition-all duration-300 overflow-hidden">
                {/* معاينة الملف */}
                <div className="relative">
                  <FilePreview
                    fileName={doc.originalName || doc.fileName}
                    mimeType={doc.mimeType}
                    cloudinaryUrl={doc.cloudinaryUrl}
                    fileSize={doc.fileSize}
                    className="h-48 w-full"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-black/60 text-white text-xs rounded-lg gulf-text-sm">
                      {doc.fileExtension.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    <h3 className="gulf-text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {doc.titleAr}
                    </h3>
                    <p className="gulf-text-sm text-gray-600 line-clamp-1">
                      {doc.title}
                    </p>
                    
                    {doc.descriptionAr && (
                      <p className="gulf-text-sm text-gray-500 line-clamp-2">
                        {doc.descriptionAr}
                      </p>
                    )}

                    {/* التصنيفات */}
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full gulf-text-sm font-medium bg-blue-100 text-blue-800">
                        {doc.mainCategory.nameAr}
                      </span>
                      {doc.subCategory && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full gulf-text-sm font-medium bg-green-100 text-green-800">
                          {doc.subCategory.nameAr}
                        </span>
                      )}
                    </div>

                    {/* التاريخ والحجم */}
                    <div className="flex items-center justify-between gulf-text-sm text-gray-500">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(doc.uploadDate).toLocaleDateString('ar-SA')}</span>
                      </div>
                      <span className="bg-gray-100 px-2 py-1 rounded-lg">
                        {formatFileSize(doc.fileSize)}
                      </span>
                    </div>
                  </div>

                  {/* زر التحميل */}
                  <div className="mt-6">
                    <Button
                      onClick={() => handleDownload(doc.id)}
                      className="w-full h-12 gulf-text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Download className="h-5 w-5 ml-2" />
                      تحميل الملف
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="modern-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-right gulf-text-sm font-bold text-gray-700 uppercase tracking-wider">
                      الملف
                    </th>
                    <th className="px-6 py-4 text-right gulf-text-sm font-bold text-gray-700 uppercase tracking-wider">
                      التصنيف
                    </th>
                    <th className="px-6 py-4 text-right gulf-text-sm font-bold text-gray-700 uppercase tracking-wider">
                      الحجم
                    </th>
                    <th className="px-6 py-4 text-right gulf-text-sm font-bold text-gray-700 uppercase tracking-wider">
                      التاريخ
                    </th>
                    <th className="px-6 py-4 text-right gulf-text-sm font-bold text-gray-700 uppercase tracking-wider">
                      تحميل
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4 space-x-reverse">
                          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-xl">{getFileIcon(doc.fileName)}</span>
                          </div>
                          <div>
                            <div className="gulf-text-base font-semibold text-gray-900">
                              {doc.titleAr}
                            </div>
                            <div className="gulf-text-sm text-gray-500">
                              {doc.title}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full gulf-text-sm font-medium bg-blue-100 text-blue-800">
                            {doc.mainCategory.nameAr}
                          </span>
                          {doc.subCategory && (
                            <br />
                          )}
                          {doc.subCategory && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full gulf-text-sm font-medium bg-green-100 text-green-800">
                              {doc.subCategory.nameAr}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 gulf-text-sm text-gray-500">
                        {formatFileSize(doc.fileSize)}
                      </td>
                      <td className="px-6 py-4 gulf-text-sm text-gray-500">
                        {new Date(doc.uploadDate).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          onClick={() => handleDownload(doc.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg gulf-text-sm font-medium"
                        >
                          <Download className="h-4 w-4 ml-2" />
                          تحميل
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* رسالة عدم وجود ملفات */}
        {filteredDocuments.length === 0 && (
          <div className="modern-card p-12 text-center">
            <div className="mb-6">
              <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <FileText className="h-12 w-12 text-gray-400" />
              </div>
            </div>
            <h3 className="gulf-text-xl font-bold text-gray-900 mb-2">لا توجد ملفات</h3>
            <p className="gulf-text-base text-gray-500">
              لم يتم العثور على ملفات تطابق معايير البحث الخاصة بك
            </p>
          </div>
        )}

        {/* التنقل بين الصفحات */}
        {totalPages > 1 && (
          <div className="modern-card p-6 mt-8">
            <div className="flex items-center justify-between">
              <p className="gulf-text-base text-gray-700">
                الصفحة {currentPage} من {totalPages}
              </p>
              <div className="flex space-x-2 space-x-reverse">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 gulf-text-base"
                >
                  السابق
                </Button>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 gulf-text-base"
                >
                  التالي
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur-lg border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 space-x-reverse mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <School className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="gulf-text-lg font-bold text-gray-900">
                نظام إدارة الملفات المدرسية
              </h3>
            </div>
            <p className="gulf-text-base text-gray-600">
              نظام متطور لإدارة وتنظيم الوثائق التعليمية مع دعم التخزين السحابي
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
