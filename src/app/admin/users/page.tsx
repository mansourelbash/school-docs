"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  Users,
  Shield,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  Settings,
  Eye,
  Upload,
  FileText,
  Database,
  BarChart3
} from "lucide-react"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import Avatar from "@/components/ui/Avatar"

interface User {
  id: string
  name: string
  email: string
  role: 'TEACHER' | 'STUDENT' | 'USER' | 'VIEWER'
  department?: string
  permissions: {
    canUploadDocuments: boolean
    canEditOwnDocuments: boolean
    canDeleteOwnDocuments: boolean
    canViewAllDocuments: boolean
    canManageCategories: boolean
    canManageUsers: boolean
  }
  createdAt: string
  image?: string
}

interface PermissionSet {
  name: string
  nameAr: string
  permissions: {
    canUploadDocuments: boolean
    canEditOwnDocuments: boolean
    canDeleteOwnDocuments: boolean
    canViewAllDocuments: boolean
    canManageCategories: boolean
    canManageUsers: boolean
  }
}

const predefinedPermissions: PermissionSet[] = [
  {
    name: 'TEACHER',
    nameAr: 'معلم',
    permissions: {
      canUploadDocuments: true,
      canEditOwnDocuments: true,
      canDeleteOwnDocuments: true,
      canViewAllDocuments: true,
      canManageCategories: false,
      canManageUsers: false
    }
  },
  {
    name: 'STUDENT',
    nameAr: 'طالب',
    permissions: {
      canUploadDocuments: false,
      canEditOwnDocuments: false,
      canDeleteOwnDocuments: false,
      canViewAllDocuments: true,
      canManageCategories: false,
      canManageUsers: false
    }
  },
  {
    name: 'USER',
    nameAr: 'مستخدم',
    permissions: {
      canUploadDocuments: false,
      canEditOwnDocuments: false,
      canDeleteOwnDocuments: false,
      canViewAllDocuments: true,
      canManageCategories: false,
      canManageUsers: false
    }
  },
  {
    name: 'VIEWER',
    nameAr: 'مشاهد',
    permissions: {
      canUploadDocuments: false,
      canEditOwnDocuments: false,
      canDeleteOwnDocuments: false,
      canViewAllDocuments: true,
      canManageCategories: false,
      canManageUsers: false
    }
  },
  {
    name: 'ADMIN',
    nameAr: 'مدير المحتوى',
    permissions: {
      canUploadDocuments: true,
      canEditOwnDocuments: true,
      canDeleteOwnDocuments: true,
      canViewAllDocuments: true,
      canManageCategories: true,
      canManageUsers: true
    }
  }
  // إذا أضفت أدوارًا جديدة في enum UserType أضفها هنا بنفس الاسم بالضبط
]

const MainHeader = dynamic(() => import("@/components/MainHeader"), { ssr: false });

export default function UserManagementPage() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [hasManageUsersPermission, setHasManageUsersPermission] = useState(false)

  // Form state for creating/editing users
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'USER' as 'TEACHER' | 'STUDENT' | 'USER' | 'VIEWER',
    department: '',
    password: '',
    permissions: {
      canUploadDocuments: false,
      canEditOwnDocuments: false,
      canDeleteOwnDocuments: false,
      canViewAllDocuments: true,
      canManageCategories: false,
      canManageUsers: false
    }
  })

  // التحقق من الصلاحيات وتحميل البيانات
  useEffect(() => {
    const checkPermissions = async () => {
      if (!session?.user) return

      try {
        // التحقق من الدور أولاً
        const userRole = (session.user as any).role
        if (userRole === 'ADMIN') {
          setHasManageUsersPermission(true)
          return
        }

        // التحقق من صلاحية إدارة المستخدمين من قاعدة البيانات
        const response = await fetch('/api/auth/check-permissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: session.user.email })
        })

        if (response.ok) {
          const result = await response.json()
          setHasManageUsersPermission(result.canManageUsers || false)
        }
      } catch (error) {
        console.error('خطأ في فحص الصلاحيات:', error)
      }
    }

    const loadUsers = async () => {
      try {
        const response = await fetch('/api/admin/users')
        if (response.ok) {
          const data = await response.json()
          setUsers(data)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }

    if (status === 'authenticated') {
      checkPermissions()
      loadUsers() // استدعاء loadUsers بدلاً من fetchUsers
    }
  }, [session, status])

  // إذا لم يكن لديه صلاحية، عرض رسالة
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">غير مصرح</h2>
          <p className="text-gray-600">يجب تسجيل الدخول للوصول لهذه الصفحة</p>
        </div>
      </div>
    )
  }

  if (!hasManageUsersPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">غير مصرح</h2>
          <p className="text-gray-600">لا تملك صلاحية إدارة المستخدمين</p>
        </div>
      </div>
    )
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchUsers()
        setIsCreateMode(false)
        resetForm()
        alert('تم إنشاء المستخدم بنجاح')
      } else {
        const error = await response.json()
        alert(`خطأ: ${error.message}`)
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('حدث خطأ في إنشاء المستخدم')
    }
  }

 const handleUpdateUser = async () => {
  if (!selectedUser) return

  // ✅ تحقق: لا يمكن إزالة صلاحية canManageUsers من نفسك
  if (selectedUser?.id === (session?.user as any)?.id) {
    const hadManageUsers = selectedUser.permissions.canManageUsers
    const tryingToRemoveManageUsers = hadManageUsers && !formData.permissions.canManageUsers
    if (tryingToRemoveManageUsers) {
      alert("لا يمكنك إزالة صلاحية إدارة المستخدمين عن نفسك.")
      return
    }
  }

  try {
    const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })

    if (response.ok) {
      await fetchUsers()
      setIsEditMode(false)
      setSelectedUser(null)
      resetForm()
      alert('تم تحديث المستخدم بنجاح')
    } else {
      const error = await response.json()
      alert(`خطأ: ${error.message}`)
    }
  } catch (error) {
    console.error('Error updating user:', error)
    alert('حدث خطأ في تحديث المستخدم')
  }
}

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchUsers()
        alert('تم حذف المستخدم بنجاح')
      } else {
        const error = await response.json()
        alert(`خطأ: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('حدث خطأ في حذف المستخدم')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'USER',
      department: '',
      password: '',
      permissions: {
        canUploadDocuments: false,
        canEditOwnDocuments: false,
        canDeleteOwnDocuments: false,
        canViewAllDocuments: true,
        canManageCategories: false,
        canManageUsers: false
      }
    })
  }

  const applyPermissionSet = (permissionSet: PermissionSet) => {
    setFormData(prev => ({
      ...prev,
      role: permissionSet.name.toUpperCase() as any,
      permissions: permissionSet.permissions
    }))
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = !roleFilter || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'TEACHER': return '👨‍🏫'
      case 'STUDENT': return '👨‍🎓'
      case 'USER': return '👤'
      case 'VIEWER': return '👁️'
      default: return '👤'
    }
  }

  const getRoleNameAr = (role: string) => {
    switch (role) {
      case 'TEACHER': return 'معلم'
      case 'STUDENT': return 'طالب'
      case 'USER': return 'مستخدم'
      case 'VIEWER': return 'مشاهد'
      default: return 'مستخدم'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 gulf-text-lg text-gray-700">جاري تحميل المستخدمين...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <MainHeader documentsCount={0} categoriesCount={0} canManageUsers={true} />
      <div className="max-w-7xl mx-auto">
        <div className="modern-card p-6 mb-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="gulf-text-2xl font-bold text-gray-900">إدارة المستخدمين والصلاحيات</h1>
              <p className="gulf-text-sm text-gray-600 mt-1">
                إدارة حسابات المستخدمين وتحديد صلاحياتهم
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="modern-card p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="البحث في المستخدمين..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="gulf-text-base h-12"
              />
            </div>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="gulf-text-base min-w-[200px] h-12"
            >
              <option value="">جميع الأدوار</option>
              <option value="TEACHER">معلم</option>
              <option value="STUDENT">طالب</option>
              <option value="USER">مستخدم</option>
              <option value="VIEWER">مشاهد</option>
            </Select>
          </div>
        </div>

        {/* Users List */}
        <div className="modern-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-right gulf-text-sm font-bold text-gray-700">المستخدم</th>
                  <th className="px-6 py-4 text-right gulf-text-sm font-bold text-gray-700">الدور</th>
                  <th className="px-6 py-4 text-right gulf-text-sm font-bold text-gray-700">القسم</th>
                  <th className="px-6 py-4 text-right gulf-text-sm font-bold text-gray-700">الصلاحيات</th>
                  <th className="px-6 py-4 text-right gulf-text-sm font-bold text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <Avatar 
                          src={user.image} 
                          name={user.name} 
                          size="md"
                        />
                        <div>
                          <div className="gulf-text-base font-semibold text-gray-900">{user.name}</div>
                          <div className="gulf-text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full gulf-text-sm font-medium bg-blue-100 text-blue-800">
                        {getRoleNameAr(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 gulf-text-sm text-gray-500">
                      {user.department || 'غير محدد'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {user.permissions.canUploadDocuments && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300 shadow-sm"
                            title="رفع الملفات"
                          >
                            <Upload className="h-3 w-3 ml-1 text-green-600" /> رفع
                          </span>
                        )}
                        {user.permissions.canEditOwnDocuments && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300 shadow-sm"
                            title="تعديل الملفات"
                          >
                            <Edit className="h-3 w-3 ml-1 text-yellow-600" /> تعديل
                          </span>
                        )}
                        {user.permissions.canDeleteOwnDocuments && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300 shadow-sm"
                            title="حذف الملفات"
                          >
                            <Trash2 className="h-3 w-3 ml-1 text-red-600" /> حذف
                          </span>
                        )}
                        {user.permissions.canViewAllDocuments && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300 shadow-sm"
                            title="مشاهدة جميع الملفات"
                          >
                            <Eye className="h-3 w-3 ml-1 text-blue-600" /> مشاهدة
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2 space-x-reverse">
                        <Button
                          onClick={() => {
                            setSelectedUser(user)
                            setFormData({
                              name: user.name,
                              email: user.email,
                              role: user.role,
                              department: user.department || '',
                              password: '',
                              permissions: {
                                ...user.permissions,
                                canManageCategories: user.permissions.canManageCategories || false,
                                canManageUsers: user.permissions.canManageUsers || false
                              }
                            })
                            setIsEditMode(true)
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg gulf-text-sm"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg gulf-text-sm"
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
        </div>

        {/* Create/Edit User Modal */}
        {(isCreateMode || isEditMode) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="gulf-text-xl font-bold text-gray-900">
                  {isCreateMode ? 'إنشاء مستخدم جديد' : 'تعديل المستخدم'}
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block gulf-text-sm font-medium text-gray-700 mb-2">الاسم</label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="gulf-text-base"
                    />
                  </div>
                  <div>
                    <label className="block gulf-text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="gulf-text-base"
                    />
                  </div>
                  <div>
                    <label className="block gulf-text-sm font-medium text-gray-700 mb-2">الدور</label>
                    <Select
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                      className="gulf-text-base"
                    >
                      <option value="TEACHER">معلم</option>
                      <option value="STUDENT">طالب</option>
                      <option value="USER">مستخدم</option>
                      <option value="VIEWER">مشاهد</option>
                      <option value="ADMIN">مدير المحتوى</option>
                      {/* إذا أضفت أدوارًا جديدة في enum UserType أضفها هنا */}
                    </Select>
                  </div>
                  <div>
                    <label className="block gulf-text-sm font-medium text-gray-700 mb-2">القسم</label>
                    <Input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      className="gulf-text-base"
                      placeholder="مثال: الرياضيات"
                    />
                  </div>
                  {isCreateMode && (
                    <div className="md:col-span-2">
                      <label className="block gulf-text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="gulf-text-base"
                      />
                    </div>
                  )}
                </div>

                {/* Permission Sets */}
                <div>
                  <label className="block gulf-text-sm font-medium text-gray-700 mb-3">قوالب الصلاحيات</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {predefinedPermissions.map((permSet) => (
                      <Button
                        key={permSet.name}
                        onClick={() => applyPermissionSet(permSet)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 gulf-text-sm py-2"
                      >
                        {permSet.nameAr}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Permissions */}
                <div>
                  <label className="block gulf-text-sm font-medium text-gray-700 mb-3">الصلاحيات المخصصة</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Checkbox
                        checked={formData.permissions.canUploadDocuments}
                        onChange={(checked: boolean) => setFormData(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, canUploadDocuments: checked }
                        }))}
                      />
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Upload className="h-4 w-4 text-green-600" />
                        <span className="gulf-text-sm">رفع الملفات</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Checkbox
                        checked={formData.permissions.canEditOwnDocuments}
                        onChange={(checked: boolean) => setFormData(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, canEditOwnDocuments: checked }
                        }))}
                      />
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Edit className="h-4 w-4 text-yellow-600" />
                        <span className="gulf-text-sm">تعديل الملفات الخاصة</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Checkbox
                        checked={formData.permissions.canDeleteOwnDocuments}
                        onChange={(checked: boolean) => setFormData(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, canDeleteOwnDocuments: checked }
                        }))}
                      />
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Trash2 className="h-4 w-4 text-red-600" />
                        <span className="gulf-text-sm">حذف الملفات الخاصة</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Checkbox
                        checked={formData.permissions.canViewAllDocuments}
                        onChange={(checked: boolean) => setFormData(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, canViewAllDocuments: checked }
                        }))}
                      />
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Eye className="h-4 w-4 text-blue-600" />
                        <span className="gulf-text-sm">مشاهدة جميع الملفات</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Checkbox
                        checked={formData.permissions.canManageCategories}
                        onChange={(checked: boolean) => setFormData(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, canManageCategories: checked }
                        }))}
                      />
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Database className="h-4 w-4 text-purple-600" />
                        <span className="gulf-text-sm">إدارة التصنيفات</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Checkbox
                        checked={formData.permissions.canManageUsers}
                        onChange={(checked: boolean) => setFormData(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, canManageUsers: checked }
                        }))}
                      />
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Users className="h-4 w-4 text-indigo-600" />
                        <span className="gulf-text-sm">إدارة المستخدمين</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 space-x-reverse">
                <Button
                  onClick={() => {
                    setIsCreateMode(false)
                    setIsEditMode(false)
                    setSelectedUser(null)
                    resetForm()
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg gulf-text-base"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={isCreateMode ? handleCreateUser : handleUpdateUser}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg gulf-text-base"
                >
                  {isCreateMode ? 'إنشاء' : 'تحديث'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
