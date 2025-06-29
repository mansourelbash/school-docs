"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  FileText,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  User,
  FolderOpen,
  ArrowLeft,
  AlertTriangle,
  CheckCircle
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
  originalName: string
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
  uploader?: {
    id: string
    name: string
    email: string
  }
}

interface Category {
  id: string
  name: string
  nameAr: string
  subCategories: any[]
}

export default function DocumentsManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [userPermissions, setUserPermissions] = useState<any>(null)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/admin/login')
      return
    }

    checkPermissionsAndLoadData()
  }, [session, status, router])

  const checkPermissionsAndLoadData = async () => {
    try {
      // التحقق من الصلاحيات
      const permResponse = await fetch('/api/auth/check-permissions')
      if (permResponse.ok) {
        const permissions = await permResponse.json()
        setUserPermissions(permissions)
        
        if (!permissions.canManageDocuments && permissions.role !== 'ADMIN' && permissions.role !== 'admin') {
          router.push('/dashboard')
          return
        }
      }

      // تحميل الوثائق
      const docsResponse = await fetch('/api/documents?limit=1000')
      if (docsResponse.ok) {
        const docsData = await docsResponse.json()
        setDocuments(docsData.documents || [])
      }

      // تحميل التصنيفات
      const catsResponse = await fetch('/api/categories')
      if (catsResponse.ok) {
        const catsData = await catsResponse.json()
        setCategories(Array.isArray(catsData) ? catsData : [])
      }

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDocuments(documents.filter(doc => doc.id !== documentId))
        setShowDeleteModal(false)
        setSelectedDocument(null)
        alert('تم حذف الوثيقة بنجاح')
      } else {
        alert('فشل في حذف الوثيقة')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('حدث خطأ أثناء حذف الوثيقة')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === "" || 
      doc.titleAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.originalName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === "" || doc.mainCategory.id === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-gradient-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-theme-primary-light border-t-theme-primary mx-auto"></div>
          <p className="mt-6 gulf-text-lg theme-text font-medium">جاري تحميل الوثائق...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen theme-gradient-bg">
      {/* Header */}
      <header className="header-theme border-b border-theme">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="gulf-text-xl sm:gulf-text-2xl text-theme-primary font-bold">
                  إدارة الوثائق
                </h1>
                <p className="gulf-text-xs sm:gulf-text-sm text-theme-muted mt-1">
                  تحرير وحذف الملفات والوثائق
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 space-x-reverse">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="admin-btn-login">
                  <ArrowLeft className="h-4 w-4 ml-2" />
                  العودة للداشبورد
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="modern-card p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h3 className="gulf-text-lg font-bold text-theme-primary">{documents.length}</h3>
            <p className="gulf-text-sm text-theme-muted">إجمالي الوثائق</p>
          </div>
          
          <div className="modern-card p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <FolderOpen className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h3 className="gulf-text-lg font-bold text-theme-primary">{categories.length}</h3>
            <p className="gulf-text-sm text-theme-muted">التصنيفات</p>
          </div>

          <div className="modern-card p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <h3 className="gulf-text-lg font-bold text-theme-primary">
              {documents.filter(doc => {
                const today = new Date()
                const uploadDate = new Date(doc.uploadDate)
                const diffTime = Math.abs(today.getTime() - uploadDate.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                return diffDays <= 7
              }).length}
            </h3>
            <p className="gulf-text-sm text-theme-muted">ملفات هذا الأسبوع</p>
          </div>

          <div className="modern-card p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <User className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <h3 className="gulf-text-lg font-bold text-theme-primary">
              {new Set(documents.map(doc => doc.uploader?.id).filter(Boolean)).size}
            </h3>
            <p className="gulf-text-sm text-theme-muted">المساهمون</p>
          </div>
        </div>

        {/* البحث والفلاتر */}
        <div className="modern-card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-theme-muted h-5 w-5" />
              <Input
                type="text"
                placeholder="البحث في الوثائق..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 h-12 input-theme rounded-lg"
              />
            </div>

            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-12 select-theme rounded-lg"
            >
              <option value="">جميع التصنيفات</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nameAr}
                </option>
              ))}
            </Select>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Button
                onClick={() => {
                  setSearchTerm("")
                  setSelectedCategory("")
                }}
                className="h-12 px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
              >
                مسح الفلاتر
              </Button>
            </div>
          </div>
        </div>

        {/* جدول الوثائق */}
        <div className="modern-card overflow-hidden">
          <div className="px-6 py-4 border-b border-theme">
            <h2 className="gulf-text-lg font-bold text-theme-primary">
              قائمة الوثائق ({filteredDocuments.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y border-theme">
              <thead className="theme-secondary">
                <tr>
                  <th className="px-6 py-3 text-right gulf-text-sm font-bold text-theme-secondary uppercase">
                    الوثيقة
                  </th>
                  <th className="px-6 py-3 text-right gulf-text-sm font-bold text-theme-secondary uppercase">
                    التصنيف
                  </th>
                  <th className="px-6 py-3 text-right gulf-text-sm font-bold text-theme-secondary uppercase">
                    الحجم
                  </th>
                  <th className="px-6 py-3 text-right gulf-text-sm font-bold text-theme-secondary uppercase">
                    تاريخ الرفع
                  </th>
                  <th className="px-6 py-3 text-right gulf-text-sm font-bold text-theme-secondary uppercase">
                    المرفق بواسطة
                  </th>
                  <th className="px-6 py-3 text-right gulf-text-sm font-bold text-theme-secondary uppercase">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="theme-bg divide-y border-theme">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-theme-secondary transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-orange-600" />
                          </div>
                        </div>
                        <div>
                          <div className="gulf-text-sm font-medium theme-text">
                            {doc.titleAr}
                          </div>
                          <div className="gulf-text-xs text-theme-muted">
                            {doc.originalName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full gulf-text-xs font-medium bg-blue-100 text-blue-800">
                        {doc.mainCategory.nameAr}
                      </span>
                      {doc.subCategory && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full gulf-text-xs font-medium bg-green-100 text-green-800 mr-1">
                          {doc.subCategory.nameAr}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 gulf-text-sm text-theme-muted">
                      {formatFileSize(doc.fileSize)}
                    </td>
                    <td className="px-6 py-4 gulf-text-sm text-theme-muted">
                      {new Date(doc.uploadDate).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 gulf-text-sm text-theme-muted">
                      {doc.uploader?.name || 'غير محدد'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Button
                          onClick={() => window.open(`/api/documents/${doc.id}/download`, '_blank')}
                          className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                          title="تحميل"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          onClick={() => {
                            setSelectedDocument(doc)
                            setShowDeleteModal(true)
                          }}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-theme-muted mx-auto mb-4" />
              <h3 className="gulf-text-lg font-medium text-theme-muted">لا توجد وثائق</h3>
              <p className="gulf-text-sm text-theme-muted mt-2">
                لم يتم العثور على وثائق تطابق معايير البحث
              </p>
            </div>
          )}
        </div>
      </main>

      {/* مودال تأكيد الحذف */}
      {showDeleteModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-red-100 rounded-full ml-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="gulf-text-lg font-bold text-gray-900">
                تأكيد حذف الوثيقة
              </h3>
            </div>
            
            <p className="gulf-text-sm text-gray-600 mb-6">
              هل أنت متأكد من حذف الوثيقة "{selectedDocument.titleAr}"؟ 
              هذا الإجراء لا يمكن التراجع عنه.
            </p>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              <Button
                onClick={() => handleDeleteDocument(selectedDocument.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                حذف نهائي
              </Button>
              <Button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedDocument(null)
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
