"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
  Archive,
  LogIn,
  User,
  Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import FilePreview from "@/components/FilePreview"
// import ThemeChanger from "@/components/ThemeChanger"
import Avatar from "@/components/ui/Avatar"
import UserMenu from "@/components/ui/UserMenu"

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
  const { data: session, status } = useSession()
  const router = useRouter()
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
  const [userPermissions, setUserPermissions] = useState<any>(null)
  
  const itemsPerPage = 12

  useEffect(() => {
    fetchData()
  }, [])

  // التحقق من الجلسة والصلاحيات
  useEffect(() => {
    if (status === 'loading') return
    
    // التحقق من الصلاحيات للمستخدمين المسجلين
    const checkPermissions = async () => {
      if (session?.user) {
        try {
          const response = await fetch('/api/auth/check-permissions')
          if (response.ok) {
            const permissions = await response.json()
            setUserPermissions(permissions)
          }
        } catch (error) {
          console.error('Error checking permissions:', error)
        }
      }
    }
    
    checkPermissions()
  }, [session, status])

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
      {/* Header المحدث مع تصميم UX محسن */}
      <header className="header-theme border-b border-theme">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* الشعار والعنوان */}
            <div className="flex items-center space-x-4 space-x-reverse pl-2">
              <div className="p-3 gulf-gradient rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300">
                <School className="h-8 w-8 !text-white" />
              </div>
              <div>
                <h1 className="gulf-text-xl sm:gulf-text-2xl text-theme-primary font-bold">
                  مكتبة الملفات المدرسية
                </h1>
                <p className="gulf-text-xs sm:gulf-text-sm text-theme-muted mt-1 hidden sm:block">
                  نظام إدارة الوثائق التعليمية المتطور
                </p>
              </div>
            </div>

            {/* مجموعة الأزرار والأدوات */}
            <div className="flex items-center space-x-2 sm:space-x-4 space-x-reverse">
              {/* معلومات المستخدم مع قائمة منسدلة */}
              {session && (
                <UserMenu 
                  user={session.user}
                  userRole={userPermissions?.role}
                />
              )}

              {/* الإحصائيات السريعة - على الشاشات الكبيرة */}
              <div className="hidden xl:flex items-center space-x-6 space-x-reverse bg-theme-secondary rounded-xl px-4 py-2">
                <div className="text-center group">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className="p-1.5 bg-theme-primary/10 rounded-lg group-hover:bg-theme-primary/20 transition-colors">
                      <TrendingUp className="h-4 w-4 text-theme-primary" />
                    </div>
                    <div className="gulf-text-sm font-bold text-theme-primary">{documents.length}</div>
                  </div>
                  <div className="gulf-text-xs text-theme-muted">ملف</div>
                </div>
                <div className="w-px h-8 bg-theme-border"></div>
                <div className="text-center group">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className="p-1.5 bg-theme-success/10 rounded-lg group-hover:bg-theme-success/20 transition-colors">
                      <FolderOpen className="h-4 w-4 text-theme-success" />
                    </div>
                    <div className="gulf-text-sm font-bold text-theme-success">{categories.length}</div>
                  </div>
                  <div className="gulf-text-xs text-theme-muted">تصنيف</div>
                </div>
              </div>

              {/* مجموعة أزرار الإدارة */}
              <div className="flex items-center space-x-2 space-x-reverse">
                {/* زر تسجيل الدخول - يظهر فقط للمستخدمين غير المسجلين */}
                {!session && (
                  <Link href="/admin/login">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="admin-btn-login group flex items-center space-x-2 space-x-reverse"
                      title="تسجيل الدخول لوحة الإدارة"
                    >
                      <LogIn className="h-4 w-4 transition-transform group-hover:rotate-12" />
                      <span className="hidden lg:inline gulf-text-sm font-medium">تسجيل الدخول</span>
                      <span className="hidden md:inline lg:hidden gulf-text-xs">دخول</span>
                      <span className="md:hidden">⊳</span>
                    </Button>
                  </Link>
                )}

                {/* زر إدارة المستخدمين - يظهر فقط للمستخدمين المسجلين مع الصلاحيات */}
                {session && userPermissions?.canManageUsers && (
                  <Link href="/admin/users">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="admin-btn-users group flex items-center space-x-2 space-x-reverse"
                      title="إدارة المستخدمين والصلاحيات"
                    >
                      <User className="h-4 w-4 transition-transform group-hover:scale-110" />
                      <span className="hidden xl:inline gulf-text-sm font-medium">إدارة المستخدمين</span>
                      <span className="hidden lg:inline xl:hidden gulf-text-xs">مستخدمين</span>
                      <span className="hidden md:inline lg:hidden gulf-text-xs">إدارة</span>
                      <span className="md:hidden">◈</span>
                    </Button>
                  </Link>
                )}

                {/* زر الداشبورد للمستخدمين المسجلين */}
                {session && (
                  <Link href="/dashboard">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="admin-btn-dashboard group flex items-center space-x-2 space-x-reverse"
                      title="الانتقال للوحة التحكم"
                    >
                      <Settings className="h-4 w-4 transition-transform group-hover:rotate-90" />
                      <span className="hidden lg:inline gulf-text-sm font-medium">لوحة التحكم</span>
                      <span className="hidden md:inline lg:hidden gulf-text-xs">التحكم</span>
                      <span className="md:hidden">⚙</span>
                    </Button>
                  </Link>
                )}
              </div>
              
              {/* فاصل */}
              <div className="w-px h-8 bg-theme-border hidden sm:block"></div>
              
              {/* تغيير الثيم أصبح في الهيدر الأساسي */}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* البحث والفلاتر المحدثة مع تصميم UX محسن */}
        <div className="modern-card p-6 sm:p-8 mb-8">
          {/* شريط البحث المحسن */}
          <div className="mb-6">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-theme-muted h-5 w-5 z-10" />
              <Input
                type="text"
                placeholder="ابحث في الملفات والوثائق..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="gulf-text-base pr-12 h-14 input-theme rounded-2xl text-center border-2 focus:border-theme-primary focus:ring-4 focus:ring-theme-primary/20 transition-all duration-300"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-theme-muted hover:text-theme-primary transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* فلاتر التصنيف */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <label className="gulf-text-sm font-medium text-theme-secondary flex items-center space-x-2 space-x-reverse">
                <Filter className="h-4 w-4" />
                <span>التصنيف الرئيسي</span>
              </label>
              <Select
                value={selectedMainCategory}
                onChange={(e) => setSelectedMainCategory(e.target.value)}
                className="gulf-text-base h-12 select-theme rounded-xl border-2 focus:border-theme-primary transition-colors"
              >
                <option value="">جميع التصنيفات</option>
                {Array.isArray(categories) && categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nameAr} ({category._count?.documents || 0})
                  </option>
                ))}
              </Select>
            </div>

            {selectedSubCategories.length > 0 && (
              <div className="space-y-2">
                <label className="gulf-text-sm font-medium text-theme-secondary flex items-center space-x-2 space-x-reverse">
                  <FolderOpen className="h-4 w-4" />
                  <span>التصنيف الفرعي</span>
                </label>
                <Select
                  value={selectedSubCategory}
                  onChange={(e) => setSelectedSubCategory(e.target.value)}
                  className="gulf-text-base h-12 select-theme rounded-xl border-2 focus:border-theme-primary transition-colors"
                >
                  <option value="">جميع التصنيفات الفرعية</option>
                  {Array.isArray(selectedSubCategories) && selectedSubCategories.map((subCategory) => (
                    <option key={subCategory.id} value={subCategory.id}>
                      {subCategory.nameAr} ({subCategory._count?.documents || 0})
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          {/* أزرار العمليات المحسنة */}
          <div className="flex flex-wrap gap-3 justify-center">
            {/* أزرار تحميل المجلدات */}
            {selectedSubCategory && (
              <button
                onClick={() => handleDownloadFolder(selectedSubCategory, 'subcategory')}
                className="action-btn-download-sub group"
                title="تحميل التصنيف الفرعي كأرشيف مضغوط"
              >
                <Download className="h-4 w-4 group-hover:animate-bounce" />
                <span className="gulf-text-sm">تحميل المجلد الفرعي</span>
              </button>
            )}
            
            {selectedMainCategory && (
              <button
                onClick={() => handleDownloadFolder(selectedMainCategory, 'category')}
                className="action-btn-download-main group"
                title="تحميل التصنيف الرئيسي كأرشيف مضغوط"
              >
                <Archive className="h-4 w-4 group-hover:animate-bounce" />
                <span className="gulf-text-sm">تحميل المجلد الرئيسي</span>
              </button>
            )}

            {/* زر مسح الفلاتر */}
            {(searchTerm || selectedMainCategory || selectedSubCategory) && (
              <button
                onClick={() => {
                  setSearchTerm("")
                  setSelectedMainCategory("")
                  setSelectedSubCategory("")
                }}
                className="action-btn-clear group"
                title="مسح جميع الفلاتر"
              >
                <span className="text-lg group-hover:rotate-180 transition-transform duration-300">🔄</span>
                <span className="gulf-text-sm">مسح الفلاتر</span>
              </button>
            )}
          </div>
        </div>

        {/* شريط التحكم المحسن مع معلومات العرض */}
        {filteredDocuments.length > 0 && (
          <div className="modern-card p-4 sm:p-6 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {/* أزرار التحكم في العرض */}
              <div className="flex items-center space-x-3 space-x-reverse gap-3">
                <span className="gulf-text-sm font-medium text-theme-secondary">طريقة العرض:</span>
                <div className="flex items-center bg-theme-secondary rounded-lg p-1 gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    title="عرض الشبكة"
                  >
                    <Grid3X3 className="h-4 w-4" />
                    <span className="gulf-text-sm font-medium hidden sm:inline">شبكة</span>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                    title="عرض القائمة"
                  >
                    <List className="h-4 w-4" />
                    <span className="gulf-text-sm font-medium hidden sm:inline">قائمة</span>
                  </button>
                </div>
              </div>

              {/* معلومات النتائج */}
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="flex items-center space-x-2 space-x-reverse bg-theme-primary-light/20 px-3 py-2 rounded-lg">
                  <Eye className="h-4 w-4 text-theme-primary" />
                  <span className="gulf-text-sm font-medium text-theme-primary">
                    {startIndex + 1}-{Math.min(endIndex, filteredDocuments.length)} من {filteredDocuments.length}
                  </span>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center space-x-2 space-x-reverse bg-theme-success/20 px-3 py-2 rounded-lg">
                    <span className="gulf-text-sm font-medium text-theme-success">
                      صفحة {currentPage} من {totalPages}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* عرض الملفات المحدث */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {currentDocuments.map((doc) => (
              <div key={doc.id} className="document-card modern-card group overflow-hidden">
                {/* معاينة الملف */}
                <div className="document-preview relative">
                  <FilePreview
                    fileName={doc.originalName || doc.fileName}
                    mimeType={doc.mimeType}
                    cloudinaryUrl={doc.cloudinaryUrl}
                    fileSize={doc.fileSize}
                    className="h-48 w-full"
                  />
                  <div className="file-extension-badge absolute top-3 left-3">
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

                  {/* زر التحميل المحسن */}
                  <div className="download-button-container mt-6">
                    <Button
                      onClick={() => handleDownload(doc.id)}
                      className="download-button group w-full h-12 gulf-text-base text-white font-medium rounded-xl shadow-lg transition-all duration-300"
                    >
                      <Download className="h-5 w-5 ml-2 group-hover:animate-bounce" />
                      <span>تحميل الملف</span>
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
                          className="group flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        >
                          <Download className="h-4 w-4 group-hover:animate-bounce" />
                          <span className="gulf-text-sm">تحميل</span>
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

        {/* التنقل بين الصفحات المحسن */}
        {totalPages > 1 && (
          <div className="modern-card p-6 mt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* معلومات الصفحة */}
              <div className="flex items-center space-x-3 space-x-reverse gap-3">
                <div className="flex items-center space-x-2 space-x-reverse bg-theme-secondary px-3 py-2 rounded-lg">
                  <span className="gulf-text-sm font-medium text-theme-primary">الصفحة {currentPage}</span>
                  <span className="text-theme-muted">/</span>
                  <span className="gulf-text-sm font-medium text-theme-muted">{totalPages}</span>
                </div>
              </div>

              {/* أزرار التنقل */}
              <div className="flex items-center space-x-2 space-x-reverse">
                {/* الذهاب للصفحة الأولى */}
                <Button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className={`group px-3 py-2 rounded-lg transition-all duration-300 ${
                    currentPage === 1 
                      ? 'bg-theme-secondary text-theme-muted cursor-not-allowed' 
                      : 'bg-theme-primary text-white hover:bg-theme-primary-dark shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}
                  title="الصفحة الأولى"
                >
                  <span className="text-sm">⏮️</span>
                </Button>

                {/* الصفحة السابقة */}
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`group flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg transition-all duration-300 ${
                    currentPage === 1 
                      ? 'bg-theme-secondary text-theme-muted cursor-not-allowed' 
                      : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}
                  title="الصفحة السابقة"
                >
                  <span className="text-lg group-hover:-translate-x-1 transition-transform">⏪</span>
                  <span className="gulf-text-sm font-medium hidden sm:inline">السابق</span>
                </Button>

                {/* أرقام الصفحات */}
                <div className="flex items-center space-x-1 space-x-reverse">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg transition-all duration-300 ${
                          currentPage === pageNum
                            ? 'bg-theme-primary text-white shadow-lg scale-110'
                            : 'bg-theme-secondary text-theme-primary hover:bg-theme-primary-light hover:text-theme-primary-dark hover:scale-105'
                        }`}
                      >
                        <span className="gulf-text-sm font-bold">{pageNum}</span>
                      </Button>
                    )
                  })}
                </div>

                {/* الصفحة التالية */}
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`group flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg transition-all duration-300 ${
                    currentPage === totalPages 
                      ? 'bg-theme-secondary text-theme-muted cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}
                  title="الصفحة التالية"
                >
                  <span className="gulf-text-sm font-medium hidden sm:inline">التالي</span>
                  <span className="text-lg group-hover:translate-x-1 transition-transform">⏩</span>
                </Button>

                {/* الذهاب للصفحة الأخيرة */}
                <Button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`group px-3 py-2 rounded-lg transition-all duration-300 ${
                    currentPage === totalPages 
                      ? 'bg-theme-secondary text-theme-muted cursor-not-allowed' 
                      : 'bg-theme-primary text-white hover:bg-theme-primary-dark shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}
                  title="الصفحة الأخيرة"
                >
                  <span className="text-sm">⏭️</span>
                </Button>
              </div>

              {/* الانتقال السريع للصفحة */}
              <div className="hidden md:flex items-center space-x-2 space-x-reverse">
                <span className="gulf-text-sm text-theme-muted">الانتقال لـ:</span>
                <Input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value)
                    if (page >= 1 && page <= totalPages) {
                      setCurrentPage(page)
                    }
                  }}
                  className="w-16 h-10 text-center gulf-text-sm border-2 rounded-lg focus:border-theme-primary"
                />
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
