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
  School
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

interface Document {
  id: string
  title: string
  titleAr: string
  description?: string
  descriptionAr?: string
  fileName: string
  fileSize: number
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
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterDocuments = () => {
    let filtered = documents

    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.titleAr.includes(searchTerm) ||
        (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (doc.descriptionAr && doc.descriptionAr.includes(searchTerm))
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-800 font-medium arabic-text">جاري تحميل الملفات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="p-2 bg-blue-600 rounded-lg ml-4">
                  <School className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    نظام إدارة الملفات المدرسية
                  </h1>
                  <p className="text-sm text-gray-800 arabic-text font-medium">
                    الوصول السهل لجميع الملفات والوثائق المدرسية
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="text-right">
                <p className="text-sm text-gray-500">إجمالي الملفات</p>
                <p className="text-xl font-bold text-blue-600">{documents.length}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البحث في الملفات
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
                <Input
                  type="text"
                  placeholder="ابحث بالعنوان أو الوصف..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Main Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التصنيف الرئيسي
              </label>
              <Select
                value={selectedMainCategory}
                onChange={(e) => setSelectedMainCategory(e.target.value)}
              >
                <option value="">جميع التصنيفات</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nameAr} ({category._count.documents})
                  </option>
                ))}
              </Select>
            </div>

            {/* Sub Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التصنيف الفرعي
              </label>
              <Select
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                disabled={!selectedMainCategory || selectedSubCategories.length === 0}
              >
                <option value="">جميع التصنيفات الفرعية</option>
                {selectedSubCategories.map((subCategory) => (
                  <option key={subCategory.id} value={subCategory.id}>
                    {subCategory.nameAr} ({subCategory._count.documents})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-sm text-gray-800 arabic-text font-medium">عرض النتائج:</span>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:text-gray-900'}`}
              >
                <div className="grid grid-cols-2 gap-1 w-4 h-4">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:text-gray-900'}`}
              >
                <div className="space-y-1 w-4 h-4">
                  <div className="bg-current h-1 rounded-sm"></div>
                  <div className="bg-current h-1 rounded-sm"></div>
                  <div className="bg-current h-1 rounded-sm"></div>
                </div>
              </button>
            </div>
            <p className="text-sm text-gray-600">
              عرض {startIndex + 1}-{Math.min(endIndex, filteredDocuments.length)} من أصل {filteredDocuments.length} ملف
            </p>
          </div>
        </div>

        {/* Documents Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentDocuments.map((doc) => (
              <div key={doc.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                <div className="p-6">
                  {/* File Icon */}
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">{getFileIcon(doc.fileName)}</div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {formatFileSize(doc.fileSize)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 text-lg leading-tight line-clamp-2">
                      {doc.titleAr}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {doc.title}
                    </p>
                    
                    {doc.descriptionAr && (
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {doc.descriptionAr}
                      </p>
                    )}

                    {/* Category */}
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {doc.mainCategory.nameAr}
                      </span>
                      {doc.subCategory && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {doc.subCategory.nameAr}
                        </span>
                      )}
                    </div>

                    {/* Date */}
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 ml-1" />
                      {new Date(doc.uploadDate).toLocaleDateString('ar-SA')}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex space-x-2 space-x-reverse">
                    <Button
                      onClick={() => handleDownload(doc.id)}
                      className="flex-1 text-sm"
                    >
                      <Download className="h-4 w-4 ml-2" />
                      تنزيل
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الملف
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التصنيف
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحجم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الإضافة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تنزيل
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-2xl ml-4">{getFileIcon(doc.fileName)}</div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {doc.titleAr}
                            </div>
                            <div className="text-sm text-gray-500">
                              {doc.title}
                            </div>
                            {doc.descriptionAr && (
                              <div className="text-xs text-gray-400 mt-1 line-clamp-1">
                                {doc.descriptionAr}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {doc.mainCategory.nameAr}
                          </span>
                          {doc.subCategory && (
                            <div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {doc.subCategory.nameAr}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatFileSize(doc.fileSize)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(doc.uploadDate).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          onClick={() => handleDownload(doc.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="h-4 w-4 ml-2" />
                          تنزيل
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد ملفات</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedMainCategory || selectedSubCategory 
                ? 'لا توجد ملفات تطابق معايير البحث المحددة' 
                : 'لا توجد ملفات متاحة حالياً'
              }
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center">
            <nav className="flex items-center space-x-2 space-x-reverse">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                السابق
              </Button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  onClick={() => setCurrentPage(page)}
                  className="w-10"
                >
                  {page}
                </Button>
              ))}
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                التالي
              </Button>
            </nav>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600">
              نظام إدارة الملفات المدرسية - جميع الحقوق محفوظة © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
