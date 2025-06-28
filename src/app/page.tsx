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
  TrendingUp,
  Archive
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import FilePreview from "@/components/FilePreview"
import ThemeChanger from "@/components/ThemeChanger"

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
      
      // التحقق من نجاح الاستجابة HTTP قبل محاولة تحليل JSON
      let docsData = { documents: [] }
      let catsData = []
      
      if (docsResponse.ok) {
        docsData = await docsResponse.json()
      } else {
        docsData = { documents: [] }
      }
      
      if (catsResponse.ok) {
        catsData = await catsResponse.json()
        // التأكد من أن الاستجابة array وليس object خطأ
        if (catsData && typeof catsData === 'object' && catsData.error) {
          catsData = []
        }
      } else {
        catsData = []
      }
      
      // التأكد من أن البيانات arrays
      setDocuments(Array.isArray(docsData.documents) ? docsData.documents : [])
      setCategories(Array.isArray(catsData) ? catsData : [])
      setFilteredDocuments(Array.isArray(docsData.documents) ? docsData.documents : [])
    } catch (error) {
      // تعيين قيم افتراضية في حالة الخطأ
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

  const handleDownloadFolder = async (categoryId: string, type: 'category' | 'subcategory') => {
    try {
      const response = await fetch(`/api/categories/${categoryId}/download`)
      
      if (response.ok) {
        const blob = await response.blob()
        
        if (blob.size === 0) {
          alert('المجلد فارغ أو لا يحتوي على ملفات')
          return
        }
        
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        
        // Get category name for filename
        let categoryName = ''
        if (type === 'category') {
          const category = categories.find(cat => cat.id === categoryId)
          categoryName = category?.nameAr || 'التصنيف'
        } else {
          const category = categories.find(cat => 
            cat.subCategories.some(sub => sub.id === categoryId)
          )
          const subCategory = category?.subCategories.find(sub => sub.id === categoryId)
          categoryName = subCategory?.nameAr || 'التصنيف الفرعي'
        }
        
        a.download = `${categoryName}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const errorText = await response.text()
        alert(`فشل في تحميل المجلد: ${response.status}`)
      }
    } catch (error) {
      alert('حدث خطأ أثناء تحميل المجلد')
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentDocuments = Array.isArray(filteredDocuments) ? filteredDocuments.slice(startIndex, endIndex) : []

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-gradient-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-theme-primary-light border-t-theme-primary mx-auto"></div>
          <p className="mt-6 gulf-text-lg theme-text font-medium">جاري تحميل الملفات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen theme-gradient-bg">
      {/* Header المحدث */}
      <header className="header-theme sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="p-3 gulf-gradient rounded-2xl shadow-lg">
                <School className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="gulf-text-2xl text-theme-primary font-bold">
                  مكتبة الملفات المدرسية
                </h1>
                <p className="gulf-text-sm text-theme-muted mt-1">
                  نظام إدارة الوثائق التعليمية المتطور
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6 space-x-reverse">
              <ThemeChanger />
              <div className="hidden md:flex items-center space-x-8 space-x-reverse">
                <div className="text-center">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <TrendingUp className="h-5 w-5 text-theme-primary" />
                    <div className="gulf-text-lg font-bold text-theme-primary">{documents.length}</div>
                  </div>
                  <div className="gulf-text-sm text-theme-muted">ملف</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <FolderOpen className="h-5 w-5 text-theme-success" />
                    <div className="gulf-text-lg font-bold text-theme-success">{categories.length}</div>
                  </div>
                  <div className="gulf-text-sm text-theme-muted">تصنيف</div>
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
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-theme-muted h-5 w-5" />
                <Input
                  type="text"
                  placeholder="ابحث في الملفات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="gulf-text-base pr-12 h-14 input-theme rounded-xl"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Select
                value={selectedMainCategory}
                onChange={(e) => setSelectedMainCategory(e.target.value)}
                className="gulf-text-base min-w-[200px] h-14 select-theme"
              >
                <option value="">جميع التصنيفات</option>
                {Array.isArray(categories) && categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nameAr} ({category._count?.documents || 0})
                  </option>
                ))}
              </Select>

              {selectedSubCategories.length > 0 && (
                <Select
                  value={selectedSubCategory}
                  onChange={(e) => setSelectedSubCategory(e.target.value)}
                  className="gulf-text-base min-w-[200px] h-14 select-theme"
                >
                  <option value="">جميع التصنيفات الفرعية</option>
                  {Array.isArray(selectedSubCategories) && selectedSubCategories.map((subCategory) => (
                    <option key={subCategory.id} value={subCategory.id}>
                      {subCategory.nameAr} ({subCategory._count?.documents || 0})
                    </option>
                  ))}
                </Select>
              )}

              {/* أزرار تحميل المجلدات */}
              <div className="action-buttons">
                {selectedSubCategory && (
                  <button
                    onClick={() => handleDownloadFolder(selectedSubCategory, 'subcategory')}
                    className="gulf-button bg-theme-success hover:bg-theme-success text-white rounded-lg"
                    title="تحميل التصنيف الفرعي كأرشيف"
                  >
                    <Download className="h-4 w-4 ml-2" />
                    تحميل المجلد الفرعي
                  </button>
                )}
                
                {selectedMainCategory && (
                  <button
                    onClick={() => handleDownloadFolder(selectedMainCategory, 'category')}
                    className="gulf-button btn-primary rounded-lg"
                    title="تحميل التصنيف الرئيسي كأرشيف"
                  >
                    <Archive className="h-4 w-4 ml-2" />
                    تحميل المجلد الرئيسي
                  </button>
                )}
              </div>
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
                      ? 'bg-theme-primary-light text-theme-primary' 
                      : 'text-theme-muted hover-theme-primary'
                  }`}
                >
                  <Grid3X3 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-theme-primary-light text-theme-primary' 
                      : 'text-theme-muted hover-theme-primary'
                  }`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
              <p className="gulf-text-base text-theme-secondary">
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
                    <h3 className="gulf-text-lg font-bold theme-text line-clamp-2 group-hover:text-theme-primary transition-colors">
                      {doc.titleAr}
                    </h3>
                    <p className="gulf-text-sm text-theme-secondary line-clamp-1">
                      {doc.title}
                    </p>
                    
                    {doc.descriptionAr && (
                      <p className="gulf-text-sm text-theme-muted line-clamp-2">
                        {doc.descriptionAr}
                      </p>
                    )}

                    {/* التصنيفات */}
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full gulf-text-sm font-medium bg-theme-primary-light text-theme-primary">
                        {doc.mainCategory.nameAr}
                      </span>
                      {doc.subCategory && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full gulf-text-sm font-medium bg-theme-success text-white">
                          {doc.subCategory.nameAr}
                        </span>
                      )}
                    </div>

                    {/* التاريخ والحجم */}
                    <div className="flex items-center justify-between gulf-text-sm text-theme-muted">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(doc.uploadDate).toLocaleDateString('ar-SA')}</span>
                      </div>
                      <span className="theme-secondary px-2 py-1 rounded-lg">
                        {formatFileSize(doc.fileSize)}
                      </span>
                    </div>
                  </div>

                  {/* زر التحميل */}
                  <div className="mt-6">
                    <Button
                      onClick={() => handleDownload(doc.id)}
                      className="w-full h-12 gulf-text-base btn-primary rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
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
              <table className="min-w-full divide-y border-theme table-theme">
                <thead className="theme-secondary">
                  <tr>
                    <th className="px-6 py-4 text-right gulf-text-sm font-bold text-theme-secondary uppercase tracking-wider">
                      الملف
                    </th>
                    <th className="px-6 py-4 text-right gulf-text-sm font-bold text-theme-secondary uppercase tracking-wider">
                      التصنيف
                    </th>
                    <th className="px-6 py-4 text-right gulf-text-sm font-bold text-theme-secondary uppercase tracking-wider">
                      الحجم
                    </th>
                    <th className="px-6 py-4 text-right gulf-text-sm font-bold text-theme-secondary uppercase tracking-wider">
                      التاريخ
                    </th>
                    <th className="px-6 py-4 text-right gulf-text-sm font-bold text-theme-secondary uppercase tracking-wider">
                      تحميل
                    </th>
                  </tr>
                </thead>
                <tbody className="theme-bg divide-y border-theme">
                  {currentDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-theme-secondary transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4 space-x-reverse">
                          <div className="h-12 w-12 bg-theme-primary-light rounded-lg flex items-center justify-center">
                            <span className="text-xl">{getFileIcon(doc.fileName)}</span>
                          </div>
                          <div>
                            <div className="gulf-text-base font-semibold theme-text">
                              {doc.titleAr}
                            </div>
                            <div className="gulf-text-sm text-theme-muted">
                              {doc.title}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full gulf-text-sm font-medium bg-theme-primary-light text-theme-primary">
                            {doc.mainCategory.nameAr}
                          </span>
                          {doc.subCategory && (
                            <br />
                          )}
                          {doc.subCategory && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full gulf-text-sm font-medium bg-theme-success text-white">
                              {doc.subCategory.nameAr}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 gulf-text-sm text-theme-muted">
                        {formatFileSize(doc.fileSize)}
                      </td>
                      <td className="px-6 py-4 gulf-text-sm text-theme-muted">
                        {new Date(doc.uploadDate).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          onClick={() => handleDownload(doc.id)}
                          className="btn-primary px-4 py-2 rounded-lg gulf-text-sm font-medium"
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
              <div className="h-24 w-24 theme-secondary rounded-full flex items-center justify-center mx-auto">
                <FileText className="h-12 w-12 text-theme-muted" />
              </div>
            </div>
            <h3 className="gulf-text-xl font-bold theme-text mb-2">لا توجد ملفات</h3>
            <p className="gulf-text-base text-theme-muted">
              لم يتم العثور على ملفات تطابق معايير البحث الخاصة بك
            </p>
          </div>
        )}

        {/* التنقل بين الصفحات */}
        {totalPages > 1 && (
          <div className="modern-card p-6 mt-8">
            <div className="flex items-center justify-between">
              <p className="gulf-text-base theme-text">
                الصفحة {currentPage} من {totalPages}
              </p>
              <div className="action-buttons">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="gulf-button btn-secondary px-4 py-2"
                >
                  السابق
                </Button>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="gulf-button btn-primary px-4 py-2"
                >
                  التالي
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="header-theme border-theme mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 space-x-reverse mb-4">
              <div className="p-2 bg-theme-primary-light rounded-lg">
                <School className="h-6 w-6 text-theme-primary" />
              </div>
              <h3 className="gulf-text-lg font-bold theme-text">
                نظام إدارة الملفات المدرسية
              </h3>
            </div>
            <p className="gulf-text-base text-theme-secondary">
              نظام متطور لإدارة وتنظيم الوثائق التعليمية مع دعم التخزين السحابي
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
