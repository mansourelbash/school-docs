"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Users,
  FileText,
  FolderOpen,
  Settings,
  BarChart3,
  Upload,
  Home,
  LogOut
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import UserMenu from "@/components/ui/UserMenu"

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userPermissions, setUserPermissions] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // دالة لتحويل الأدوار إلى نصوص عربية
  const getUserRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
      case 'admin':
        return 'مدير النظام'
      case 'moderator':
        return 'مشرف'
      case 'TEACHER':
      case 'teacher':
        return 'معلم'
      case 'editor':
        return 'محرر'
      case 'STUDENT':
      case 'student':
        return 'طالب'
      case 'USER':
      case 'user':
        return 'مستخدم'
      default:
        return 'مستخدم عادي'
    }
  }

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/')
      return
    }

    const checkPermissions = async () => {
      try {
        const response = await fetch('/api/auth/check-permissions')
        if (response.ok) {
          const permissions = await response.json()
          setUserPermissions(permissions)
        }
      } catch (error) {
        console.error('Error checking permissions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkPermissions()
  }, [session, status, router])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-gradient-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-theme-primary-light border-t-theme-primary mx-auto"></div>
          <p className="mt-6 gulf-text-lg theme-text font-medium">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen theme-gradient-bg">
      {/* Header */}
      <header className="header-theme border-b border-theme">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4 space-x-reverse gap-2">
              <div className={`p-3 rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300 ${
                userPermissions?.role === 'ADMIN' || userPermissions?.role === 'admin' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                userPermissions?.role === 'MODERATOR' || userPermissions?.role === 'moderator' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                userPermissions?.role === 'TEACHER' || userPermissions?.role === 'teacher' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                userPermissions?.role === 'EDITOR' || userPermissions?.role === 'editor' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                'gulf-gradient'
              }`}>
                <Settings className="h-8 w-8 text-white" />
              </div>
              <div>
                {/* <h1 className="gulf-text-xl sm:gulf-text-2xl text-theme-primary font-bold">
                  لوحة التحكم
                </h1> */}
                <div className="flex items-center mt-1">
                  <UserMenu 
                    user={session.user}
                    userRole={userPermissions?.role}
                    className="text-right"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 space-x-reverse gap-2">
              <Link href="/">
                <Button variant="outline" size="sm" className="admin-btn-login">
                  <Home className="h-4 w-4 ml-2" />
                  الصفحة الرئيسية
                </Button>
              </Link>
              <Button 
                onClick={handleSignOut}
                variant="outline" 
                size="sm" 
                className="admin-btn-users"
              >
                <LogOut className="h-4 w-4 ml-2" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* بطاقات الإدارة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* العودة للمكتبة - متاحة لجميع المستخدمين */}
          <Link href="/">
            <div className="modern-card p-8 hover:scale-105 transition-all duration-300 cursor-pointer border-l-4 border-blue-500">
              <div className="flex items-center space-x-4 space-x-reverse gap-2">
                <div className="p-4 bg-blue-100 rounded-2xl">
                  <Home className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="gulf-text-lg font-bold text-theme-primary">مكتبة الملفات</h3>
                  <p className="gulf-text-sm text-theme-muted">العودة لتصفح الملفات</p>
                  <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    متاح للجميع
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* إدارة المستخدمين - admin فقط أو canManageUsers */}
          {(userPermissions?.role === 'ADMIN' || userPermissions?.role === 'admin' || userPermissions?.canManageUsers) && (
            <Link href="/admin/users">
              <div className="modern-card p-8 hover:scale-105 transition-all duration-300 cursor-pointer border-l-4 border-purple-500">
                <div className="flex items-center space-x-4 space-x-reverse gap-2">
                  <div className="p-4 bg-purple-100 rounded-2xl">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="gulf-text-lg font-bold text-theme-primary">إدارة المستخدمين</h3>
                    <p className="gulf-text-sm text-theme-muted">إدارة الصلاحيات والأدوار</p>
                    <span className="inline-block mt-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      {(userPermissions?.role === 'ADMIN' || userPermissions?.role === 'admin') ? 'مدير النظام' : 'صلاحية خاصة'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* رفع الملفات - admin أو canUploadDocuments */}
          {(userPermissions?.role === 'admin' || userPermissions?.canUploadDocuments) && (
            <Link href="/admin/upload">
              <div className="modern-card p-8 hover:scale-105 transition-all duration-300 cursor-pointer border-l-4 border-green-500">
                <div className="flex items-center space-x-4 space-x-reverse gap-2">
                  <div className="p-4 bg-green-100 rounded-2xl">
                    <Upload className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="gulf-text-lg font-bold text-theme-primary">رفع الملفات</h3>
                    <p className="gulf-text-sm text-theme-muted">إضافة ملفات جديدة</p>
                    <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      {userPermissions?.role === 'admin' ? '★★★ مدير النظام' : '★ مُرفق ملفات'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* إدارة التصنيفات - admin أو canManageCategories */}
          {(userPermissions?.role === 'admin' || userPermissions?.canManageCategories) && (
            <Link href="/admin/categories">
              <div className="modern-card p-8 hover:scale-105 transition-all duration-300 cursor-pointer border-l-4 border-yellow-500">
                <div className="flex items-center space-x-4 space-x-reverse gap-2">
                  <div className="p-4 bg-yellow-100 rounded-2xl">
                    <FolderOpen className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="gulf-text-lg font-bold text-theme-primary">إدارة التصنيفات</h3>
                    <p className="gulf-text-sm text-theme-muted">تنظيم الملفات والمجلدات</p>
                    <span className="inline-block mt-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                      {userPermissions?.role === 'admin' ? '★★★ مدير النظام' : '★ مُنظم محتوى'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* إدارة الوثائق - admin أو canManageDocuments */}
          {(userPermissions?.role === 'admin' || userPermissions?.canManageDocuments) && (
            <Link href="/admin/documents">
              <div className="modern-card p-8 hover:scale-105 transition-all duration-300 cursor-pointer border-l-4 border-orange-500">
                <div className="flex items-center space-x-4 space-x-reverse gap-2">
                  <div className="p-4 bg-orange-100 rounded-2xl">
                    <FileText className="h-8 w-8 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="gulf-text-lg font-bold text-theme-primary">إدارة الوثائق</h3>
                    <p className="gulf-text-sm text-theme-muted">تعديل وحذف الملفات</p>
                    <span className="inline-block mt-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                      {userPermissions?.role === 'admin' ? '★★★ مدير النظام' : '★ مُحرر محتوى'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* إعدادات الحساب - متاحة لجميع المستخدمين */}
          <Link href="/account/settings">
            <div className="modern-card p-8 hover:scale-105 transition-all duration-300 cursor-pointer border-l-4 border-gray-500">
              <div className="flex items-center space-x-4 space-x-reverse gap-2">
                <div className="p-4 bg-gray-100 rounded-2xl">
                  <Settings className="h-8 w-8 text-gray-600" />
                </div>
                <div>
                  <h3 className="gulf-text-lg font-bold text-theme-primary">إعدادات الحساب</h3>
                  <p className="gulf-text-sm text-theme-muted">تحديث المعلومات الشخصية</p>
                  <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    متاح للجميع
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* معلومات المستخدم والصلاحيات */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* معلومات الحساب */}
          <div className="modern-card p-8">
            <h2 className="gulf-text-xl font-bold text-theme-primary mb-6 flex items-center">
              <Settings className="h-6 w-6 ml-2" />
              معلومات الحساب
            </h2>
            <div className="space-y-4">
              <div>
                <label className="gulf-text-sm font-medium text-theme-secondary">الاسم</label>
                <p className="gulf-text-base text-theme-primary mt-1 p-3 bg-theme-secondary rounded-lg">
                  {session.user.name || 'غير محدد'}
                </p>
              </div>
              <div>
                <label className="gulf-text-sm font-medium text-theme-secondary">البريد الإلكتروني</label>
                <p className="gulf-text-base text-theme-primary mt-1 p-3 bg-theme-secondary rounded-lg">
                  {session.user.email}
                </p>
              </div>
              <div>
                <label className="gulf-text-sm font-medium text-theme-secondary">الدور</label>
                <div className="mt-1 p-3 bg-theme-secondary rounded-lg">
                  <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                    userPermissions?.role === 'admin' 
                      ? 'bg-red-100 text-red-700 border border-red-200' 
                      : userPermissions?.role === 'moderator'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : userPermissions?.role === 'teacher'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : userPermissions?.role === 'editor'
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : userPermissions?.role === 'student'
                      ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}>
                    {getUserRoleLabel(userPermissions?.role || 'user')}
                  </span>
                  {userPermissions?.role === 'admin' && (
                    <span className="mr-2 text-xs text-red-600 font-medium">• جميع الصلاحيات</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* الصلاحيات التفصيلية */}
          <div className="modern-card p-8">
            <h2 className="gulf-text-xl font-bold text-theme-primary mb-6 flex items-center">
              <Users className="h-6 w-6 ml-2" />
              الصلاحيات المتاحة
            </h2>
            <div className="space-y-3">
              {userPermissions && Object.entries({
                canManageUsers: 'إدارة المستخدمين',
                canUploadDocuments: 'رفع الملفات',
                canManageDocuments: 'إدارة الوثائق',
                canManageCategories: 'إدارة التصنيفات',
                canViewAllDocuments: 'عرض جميع الملفات',
                canDeleteDocuments: 'حذف الملفات'
              }).map(([permission, label]) => (
                <div key={permission} className="flex items-center justify-between p-3 bg-theme-secondary rounded-lg">
                  <span className="gulf-text-sm font-medium text-theme-primary">{label}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    userPermissions[permission] || userPermissions?.role === 'admin'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {userPermissions[permission] || userPermissions?.role === 'admin' ? 'مُفعّل' : 'مُعطّل'}
                  </span>
                </div>
              ))}
            </div>
            
            {/* ملخص الصلاحيات */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border-r-4 border-blue-400">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-blue-600 ml-2" />
                  <span className="gulf-text-sm font-medium text-blue-800">
                    مستوى الصلاحيات: {getUserRoleLabel(userPermissions?.role || 'user')}
                  </span>
                </div>
                <div className="text-left">
                  {userPermissions?.role === 'admin' && (
                    <span className="text-red-600 font-bold text-lg">★★★</span>
                  )}
                  {userPermissions?.role === 'moderator' && (
                    <span className="text-blue-600 font-bold text-lg">★★</span>
                  )}
                  {(userPermissions?.role === 'teacher' || userPermissions?.role === 'editor') && (
                    <span className="text-green-600 font-bold text-lg">★</span>
                  )}
                  {(!userPermissions?.role || userPermissions?.role === 'user') && (
                    <span className="text-gray-500 font-bold text-lg">○</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                {userPermissions?.role === 'admin' ? 'جميع الصلاحيات متاحة' :
                 `${Object.values(userPermissions || {}).filter(Boolean).length} صلاحية نشطة من أصل 6`}
              </p>
            </div>
          </div>
        </div>

        {/* رسالة للمستخدمين العاديين */}
        {userPermissions && !userPermissions.role && 
         !Object.values(userPermissions).some(Boolean) && (
          <div className="modern-card p-8 mt-8 border-l-4 border-yellow-400">
            <div className="flex items-center space-x-4 space-x-reverse gap-2">
              <div className="p-4 bg-yellow-100 rounded-2xl">
                <Settings className="h-8 w-8 text-yellow-600" />
              </div>
              <div>
                <h3 className="gulf-text-lg font-bold text-yellow-800">مستخدم عادي</h3>
                <p className="gulf-text-sm text-yellow-700 mt-2">
                  حسابك مُفعّل كمستخدم عادي. يمكنك تصفح وتحميل الملفات المتاحة من المكتبة.
                  للحصول على صلاحيات إضافية، يرجى التواصل مع مدير النظام.
                </p>
                <Link href="/" className="inline-block mt-4">
                  <Button className="admin-btn-login">
                    <Home className="h-4 w-4 ml-2" />
                    تصفح المكتبة الآن
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
