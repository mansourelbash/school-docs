"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
// import ThemeChanger from "@/components/ThemeChanger"
import UserProfile from "@/components/UserProfile"
import { 
  FolderOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronDown,
  ChevronRight,
  Download,
  FolderPlus,
  Archive,
  Settings
} from "lucide-react"

interface Category {
  id: string
  name: string
  nameAr: string
  description?: string
  _count: {
    documents: number
    subCategories: number
  }
  subCategories: SubCategory[]
}

interface SubCategory {
  id: string
  name: string
  nameAr: string
  description?: string
  mainCategoryId: string
  _count: {
    documents: number
  }
}

export default function CategoriesManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  
  // Modals state
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showEditCategory, setShowEditCategory] = useState(false)
  const [showAddSubCategory, setShowAddSubCategory] = useState(false)
  const [showEditSubCategory, setShowEditSubCategory] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
    mainCategoryId: ''
  })
  const [editingItem, setEditingItem] = useState<any>(null)
  const [deleteItem, setDeleteItem] = useState<any>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login")
    } else if (status === "authenticated") {
      fetchCategories()
    }
  }, [status, router])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleAddCategory = async () => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          nameAr: formData.nameAr,
          description: formData.description
        })
      })

      if (response.ok) {
        fetchCategories()
        setShowAddCategory(false)
        setFormData({ name: '', nameAr: '', description: '', mainCategoryId: '' })
      }
    } catch (error) {
      console.error('Error adding category:', error)
    }
  }

  const handleEditCategory = async () => {
    try {
      const response = await fetch(`/api/categories/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          nameAr: formData.nameAr,
          description: formData.description
        })
      })

      if (response.ok) {
        fetchCategories()
        setShowEditCategory(false)
        setEditingItem(null)
        setFormData({ name: '', nameAr: '', description: '', mainCategoryId: '' })
      }
    } catch (error) {
      console.error('Error editing category:', error)
    }
  }

  const handleAddSubCategory = async () => {
    try {
      const response = await fetch('/api/subcategories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          nameAr: formData.nameAr,
          description: formData.description,
          mainCategoryId: formData.mainCategoryId
        })
      })

      if (response.ok) {
        fetchCategories()
        setShowAddSubCategory(false)
        setFormData({ name: '', nameAr: '', description: '', mainCategoryId: '' })
      }
    } catch (error) {
      console.error('Error adding subcategory:', error)
    }
  }

  const handleEditSubCategory = async () => {
    try {
      const response = await fetch(`/api/subcategories/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          nameAr: formData.nameAr,
          description: formData.description
        })
      })

      if (response.ok) {
        fetchCategories()
        setShowEditSubCategory(false)
        setEditingItem(null)
        setFormData({ name: '', nameAr: '', description: '', mainCategoryId: '' })
      }
    } catch (error) {
      console.error('Error editing subcategory:', error)
    }
  }

  const handleDelete = async () => {
    try {
      const endpoint = deleteItem.type === 'category' 
        ? `/api/categories/${deleteItem.id}`
        : `/api/subcategories/${deleteItem.id}`
      
      const response = await fetch(endpoint, { method: 'DELETE' })

      if (response.ok) {
        fetchCategories()
        setShowDeleteConfirm(false)
        setDeleteItem(null)
      }
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const handleDownloadCategory = async (categoryId: string, categoryName: string) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `${categoryName}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error downloading category:', error)
    }
  }

  const openEditCategory = (category: Category) => {
    setEditingItem(category)
    setFormData({
      name: category.name,
      nameAr: category.nameAr,
      description: category.description || '',
      mainCategoryId: ''
    })
    setShowEditCategory(true)
  }

  const openEditSubCategory = (subCategory: SubCategory) => {
    setEditingItem(subCategory)
    setFormData({
      name: subCategory.name,
      nameAr: subCategory.nameAr,
      description: subCategory.description || '',
      mainCategoryId: subCategory.mainCategoryId
    })
    setShowEditSubCategory(true)
  }

  const openAddSubCategory = (categoryId: string) => {
    setFormData({
      name: '',
      nameAr: '',
      description: '',
      mainCategoryId: categoryId
    })
    setShowAddSubCategory(true)
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-gradient-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto"></div>
          <p className="mt-4 gulf-text-base text-theme-muted">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen theme-gradient-bg">
      {/* Header */}
      <header className="header-theme">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="admin-header-content flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4">
            <div className="admin-header-info flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full">
              <div className="p-3 gulf-gradient rounded-2xl shadow-lg mb-2 sm:mb-0">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="gulf-text-xl sm:gulf-text-2xl text-theme-primary font-bold">
                  إدارة التصنيفات
                </h1>
                <p className="gulf-text-sm text-theme-muted">
                  إدارة المجلدات والتصنيفات وتنظيم الملفات
                </p>
              </div>
            </div>
            <div className="admin-header-actions flex flex-wrap gap-2 w-full sm:w-auto justify-end">
              <UserProfile />
              <Button
                onClick={() => setShowAddCategory(true)}
                className="gulf-button btn-primary w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                <span className="hidden xs:inline">تصنيف جديد</span>
              </Button>
              <Button
                onClick={() => router.push('/admin/dashboard')}
                className="gulf-button btn-secondary w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              >
                العودة للوحة التحكم
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Categories Tree */}
        <div className="modern-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2 sm:gap-0">
            <h2 className="gulf-text-lg sm:gulf-text-xl font-bold theme-text">
              هيكل التصنيفات والمجلدات
            </h2>
            <div className="gulf-text-sm text-theme-muted mt-2 sm:mt-0">
              {categories.length} تصنيف رئيسي
            </div>
          </div>

          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="card-theme border-theme rounded-xl overflow-hidden">
                {/* Main Category */}
                <div className="theme-secondary p-4 flex flex-col gap-2">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 space-x-reverse">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="p-1 hover-theme-primary rounded-lg transition-colors"
                        >
                          {expandedCategories.has(category.id) ? (
                            <ChevronDown className="h-4 w-4 text-theme-muted" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-theme-muted" />
                          )}
                        </button>
                        <FolderOpen className="h-6 w-6 text-theme-primary" />
                      </div>
                      <div>
                        <h3 className="gulf-text-base sm:gulf-text-lg font-semibold theme-text">
                          {category.nameAr}
                        </h3>
                        <p className="gulf-text-xs sm:gulf-text-sm text-theme-muted">
                          {category.name}
                        </p>
                      </div>
                    </div>
                    <div className="action-buttons flex flex-wrap gap-2 justify-end mt-2 md:mt-0">
                      <div className="gulf-text-xs sm:gulf-text-sm text-theme-muted theme-card px-2 sm:px-3 py-1 rounded-lg">
                        {category._count?.documents || 0} ملف
                      </div>
                      <div className="gulf-text-xs sm:gulf-text-sm text-theme-muted theme-card px-2 sm:px-3 py-1 rounded-lg">
                        {category._count.subCategories} فرعي
                      </div>
                      <Button
                        onClick={() => handleDownloadCategory(category.id, category.nameAr)}
                        className="p-2 bg-theme-success hover:bg-theme-success text-white rounded-lg"
                        title="تحميل المجلد كاملاً"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => openAddSubCategory(category.id)}
                        className="p-2 btn-primary rounded-lg"
                        title="إضافة تصنيف فرعي"
                      >
                        <FolderPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => openEditCategory(category)}
                        className="p-2 bg-theme-warning hover:bg-theme-warning text-white rounded-lg"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => {
                          setDeleteItem({ ...category, type: 'category' })
                          setShowDeleteConfirm(true)
                        }}
                        className="p-2 bg-theme-error hover:bg-theme-error text-white rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {category.description && (
                    <p className="gulf-text-xs sm:gulf-text-sm text-theme-muted mt-2 mr-0 sm:mr-8">
                      {category.description}
                    </p>
                  )}
                </div>

                {/* Subcategories */}
                {expandedCategories.has(category.id) && category.subCategories.length > 0 && (
                  <div className="theme-bg border-theme">
                    {category.subCategories.map((subCategory) => (
                      <div key={subCategory.id} className="p-4 border-theme last:border-b-0">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mr-0 md:mr-8">
                          <div className="flex items-center gap-2 sm:gap-3 space-x-reverse">
                            <div className="w-6"></div>
                            <FolderOpen className="h-5 w-5 text-theme-success" />
                            <div>
                              <h4 className="gulf-text-sm sm:gulf-text-base font-medium theme-text">
                                {subCategory.nameAr}
                              </h4>
                              <p className="gulf-text-xs sm:gulf-text-sm text-theme-muted">
                                {subCategory.name}
                              </p>
                            </div>
                          </div>
                          <div className="action-buttons flex flex-wrap gap-2 justify-end mt-2 md:mt-0">
                            <div className="gulf-text-xs sm:gulf-text-sm text-theme-muted theme-secondary px-2 py-1 rounded">
                              {subCategory._count?.documents || 0} ملف
                            </div>
                            <Button
                              onClick={() => handleDownloadCategory(subCategory.id, subCategory.nameAr)}
                              className="p-1 bg-theme-success hover:bg-theme-success text-white rounded"
                              title="تحميل المجلد الفرعي"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => openEditSubCategory(subCategory)}
                              className="p-1 bg-theme-warning hover:bg-theme-warning text-white rounded"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => {
                                setDeleteItem({ ...subCategory, type: 'subcategory' })
                                setShowDeleteConfirm(true)
                              }}
                              className="p-1 bg-theme-error hover:bg-theme-error text-white rounded"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {subCategory.description && (
                          <p className="gulf-text-xs sm:gulf-text-sm text-gray-600 mt-2 mr-0 md:mr-14">
                            {subCategory.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {expandedCategories.has(category.id) && category.subCategories.length === 0 && (
                  <div className="bg-white border-t border-gray-200 p-4 text-center">
                    <p className="gulf-text-sm text-gray-500">لا توجد تصنيفات فرعية</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="text-center py-12">
              <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="gulf-text-lg font-medium text-gray-900 mb-2">لا توجد تصنيفات</h3>
              <p className="gulf-text-base text-gray-500 mb-6">ابدأ بإنشاء تصنيف رئيسي لتنظيم الملفات</p>
              <Button
                onClick={() => setShowAddCategory(true)}
                className="gulf-button bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
              >
                <Plus className="h-5 w-5 ml-2" />
                إنشاء تصنيف جديد
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="gulf-text-xl font-bold text-gray-900">إضافة تصنيف جديد</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block gulf-text-sm font-medium text-theme-secondary mb-2">
                  الاسم بالعربية
                </label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  className="gulf-text-base input-theme"
                />
              </div>
              <div>
                <label className="block gulf-text-sm font-medium text-theme-secondary mb-2">
                  الاسم بالإنجليزية
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="gulf-text-base input-theme"
                />
              </div>
              <div>
                <label className="block gulf-text-sm font-medium text-theme-secondary mb-2">
                  الوصف (اختياري)
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="gulf-text-base input-theme"
                />
              </div>
            </div>
            <div className="p-6 border-theme action-buttons">
              <Button
                onClick={handleAddCategory}
                className="flex-1 gulf-button btn-primary"
              >
                إضافة
              </Button>
              <Button
                onClick={() => {
                  setShowAddCategory(false)
                  setFormData({ name: '', nameAr: '', description: '', mainCategoryId: '' })
                }}
                className="flex-1 gulf-button btn-secondary"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Similar modals for edit, add subcategory, etc... */}
      
      {/* Edit Category Modal */}
      {showEditCategory && (
<div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center px-4 sm:px-6">
  <div className="bg-white w-full max-w-lg sm:max-w-xl rounded-xl shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="p-6 border-b border-gray-200">
              <h3 className="gulf-text-lg font-semibold text-gray-800">
                تعديل التصنيف الرئيسي
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block gulf-text-sm font-medium text-gray-700 mb-2">
                  الاسم بالعربية
                </label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  className="gulf-text-base"
                />
              </div>
              <div>
                <label className="block gulf-text-sm font-medium text-gray-700 mb-2">
                  الاسم بالإنجليزية
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="gulf-text-base"
                />
              </div>
              <div>
                <label className="block gulf-text-sm font-medium text-gray-700 mb-2">
                  الوصف (اختياري)
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="gulf-text-base"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex space-x-3 space-x-reverse">
              <Button
                onClick={handleEditCategory}
                className="flex-1 gulf-button bg-blue-600 hover:bg-blue-700 text-white"
              >
                حفظ التغييرات
              </Button>
              <Button
                onClick={() => {
                  setShowEditCategory(false)
                  setEditingItem(null)
                  setFormData({ name: '', nameAr: '', description: '', mainCategoryId: '' })
                }}
                className="flex-1 gulf-button bg-gray-300 hover:bg-gray-400 text-gray-700"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add SubCategory Modal */}
      {showAddSubCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="gulf-text-lg font-semibold text-gray-800">
                إضافة تصنيف فرعي
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block gulf-text-sm font-medium text-gray-700 mb-2">
                  الاسم بالعربية
                </label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  className="gulf-text-base"
                />
              </div>
              <div>
                <label className="block gulf-text-sm font-medium text-gray-700 mb-2">
                  الاسم بالإنجليزية
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="gulf-text-base"
                />
              </div>
              <div>
                <label className="block gulf-text-sm font-medium text-gray-700 mb-2">
                  الوصف (اختياري)
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="gulf-text-base"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex space-x-3 space-x-reverse">
              <Button
                onClick={handleAddSubCategory}
                className="flex-1 gulf-button bg-green-600 hover:bg-green-700 text-white"
              >
                إضافة
              </Button>
              <Button
                onClick={() => {
                  setShowAddSubCategory(false)
                  setFormData({ name: '', nameAr: '', description: '', mainCategoryId: '' })
                }}
                className="flex-1 gulf-button bg-gray-300 hover:bg-gray-400 text-gray-700"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit SubCategory Modal */}
      {showEditSubCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="gulf-text-lg font-semibold text-gray-800">
                تعديل التصنيف الفرعي
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block gulf-text-sm font-medium text-gray-700 mb-2">
                  الاسم بالعربية
                </label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  className="gulf-text-base"
                />
              </div>
              <div>
                <label className="block gulf-text-sm font-medium text-gray-700 mb-2">
                  الاسم بالإنجليزية
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="gulf-text-base"
                />
              </div>
              <div>
                <label className="block gulf-text-sm font-medium text-gray-700 mb-2">
                  الوصف (اختياري)
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="gulf-text-base"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex space-x-3 space-x-reverse">
              <Button
                onClick={handleEditSubCategory}
                className="flex-1 gulf-button bg-blue-600 hover:bg-blue-700 text-white"
              >
                حفظ التغييرات
              </Button>
              <Button
                onClick={() => {
                  setShowEditSubCategory(false)
                  setEditingItem(null)
                  setFormData({ name: '', nameAr: '', description: '', mainCategoryId: '' })
                }}
                className="flex-1 gulf-button bg-gray-300 hover:bg-gray-400 text-gray-700"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deleteItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="gulf-text-lg font-semibold text-red-600">
                تأكيد الحذف
              </h3>
            </div>
            <div className="p-6">
              <p className="gulf-text-base text-gray-700">
                هل أنت متأكد من حذف {deleteItem.type === 'category' ? 'التصنيف الرئيسي' : 'التصنيف الفرعي'} 
                "<span className="font-semibold">{deleteItem.nameAr}</span>"؟
              </p>
              {deleteItem.type === 'category' && deleteItem._count && (
                <div className="mt-4 p-3 bg-red-50 rounded-md">
                  <p className="gulf-text-sm text-red-700">
                    سيتم حذف {deleteItem._count?.subCategories || 0} تصنيف فرعي و {deleteItem._count?.documents || 0} ملف مرتبط بهذا التصنيف.
                  </p>
                </div>
              )}
              {deleteItem.type === 'subcategory' && deleteItem._count && (
                <div className="mt-4 p-3 bg-red-50 rounded-md">
                  <p className="gulf-text-sm text-red-700">
                    سيتم حذف {deleteItem._count?.documents || 0} ملف مرتبط بهذا التصنيف الفرعي.
                  </p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex space-x-3 space-x-reverse">
              <Button
                onClick={handleDelete}
                className="flex-1 gulf-button bg-red-600 hover:bg-red-700 text-white"
              >
                حذف
              </Button>
              <Button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteItem(null)
                }}
                className="flex-1 gulf-button bg-gray-300 hover:bg-gray-400 text-gray-700"
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
