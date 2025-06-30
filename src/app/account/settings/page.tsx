"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  User,
  Mail,
  Lock,
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  LogOut,
  Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Avatar from "@/components/ui/Avatar"

export default function AccountSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', content: '' })
  const [userPermissions, setUserPermissions] = useState<any>(null)
  const [currentImage, setCurrentImage] = useState<string | null>(null)

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
      router.push('/admin/login')
      return
    }

    // تحميل بيانات المستخدم
    setUserInfo({
      name: session.user.name || '',
      email: session.user.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })

    // تعيين الصورة الحالية
    setCurrentImage(session.user.image || null)

    // جلب الصورة الشخصية المحدثة من قاعدة البيانات
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const userData = await response.json()
          setCurrentImage(userData.image || null)
          // تحديث صلاحيات المستخدم من بيانات الملف الشخصي
          setUserPermissions({
            role: userData.role,
            permissions: userData.permissions
          })
        }
      } catch (error) {
        console.error('خطأ في جلب الملف الشخصي:', error)
      }
    }

    fetchUserProfile()

    // جلب الصلاحيات
    const fetchPermissions = async () => {
      try {
        const response = await fetch('/api/auth/check-permissions')
        if (response.ok) {
          const permissions = await response.json()
          // دمج البيانات مع ما تم جلبه من الملف الشخصي
          setUserPermissions((prev: any) => ({
            ...prev,
            ...permissions
          }))
        }
      } catch (error) {
        console.error('Error fetching permissions:', error)
      }
    }

    fetchPermissions()
  }, [session, status, router])

  const handleInputChange = (field: string, value: string) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveProfile = async () => {
    setIsLoading(true)
    setMessage({ type: '', content: '' })

    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userInfo.name,
          email: userInfo.email
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', content: 'تم تحديث الملف الشخصي بنجاح' })
        // تحديث الجلسة
        window.location.reload()
      } else {
        setMessage({ type: 'error', content: data.error || 'حدث خطأ في التحديث' })
      }
    } catch (error) {
      setMessage({ type: 'error', content: 'حدث خطأ في الاتصال' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (userInfo.newPassword !== userInfo.confirmPassword) {
      setMessage({ type: 'error', content: 'كلمات المرور الجديدة غير متطابقة' })
      return
    }

    if (userInfo.newPassword.length < 6) {
      setMessage({ type: 'error', content: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
      return
    }

    setIsLoading(true)
    setMessage({ type: '', content: '' })

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: userInfo.currentPassword,
          newPassword: userInfo.newPassword
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', content: 'تم تغيير كلمة المرور بنجاح' })
        setUserInfo(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }))
      } else {
        setMessage({ type: 'error', content: data.error || 'حدث خطأ في تغيير كلمة المرور' })
      }
    } catch (error) {
      setMessage({ type: 'error', content: 'حدث خطأ في الاتصال' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = async (newImageUrl: string) => {
    setCurrentImage(newImageUrl)
    setMessage({ type: 'success', content: 'تم تحديث الصورة الشخصية بنجاح' })
    
    // إعادة تحميل الصفحة لتحديث الجلسة
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center theme-gradient-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-theme-primary-light border-t-theme-primary mx-auto"></div>
          <p className="mt-6 gulf-text-lg theme-text font-medium">جاري تحميل إعدادات الحساب...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen theme-gradient-bg" dir="rtl">
      {/* Header */}
      <header className="header-theme border-b border-theme">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 h-auto sm:h-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div className="p-3 rounded-2xl shadow-lg bg-gradient-to-r from-gray-500 to-gray-600 transform hover:scale-105 transition-transform duration-300 mb-2 sm:mb-0">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="gulf-text-lg sm:gulf-text-xl md:gulf-text-2xl text-theme-primary font-bold">
                  إعدادات الحساب
                </h1>
                <p className="gulf-text-xs sm:gulf-text-sm text-theme-muted">
                  إدارة المعلومات الشخصية والأمان
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="admin-btn-login w-full sm:w-auto">
                  <ArrowLeft className="h-4 w-4 ml-2" />
                  العودة للداشبورد
                </Button>
              </Link>
              <Button 
                onClick={handleSignOut}
                variant="outline" 
                size="sm" 
                className="admin-btn-users w-full sm:w-auto"
              >
                <LogOut className="h-4 w-4 ml-2" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-2 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* رسائل التنبيه */}
        {message.content && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.content}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* معلومات الملف الشخصي */}
          <div className="modern-card p-4 sm:p-8">
            <h2 className="gulf-text-xl font-bold text-theme-primary mb-6 flex items-center">
              <User className="h-6 w-6 ml-2" />
              الملف الشخصي
            </h2>
            
            <div className="space-y-6">
              {/* الصورة الشخصية */}
              <div className="text-center">
                <label className="gulf-text-sm font-medium text-theme-secondary mb-4 block">
                  الصورة الشخصية
                </label>
                <div className="flex justify-center">
                  <Avatar 
                    src={currentImage} 
                    name={session?.user?.name || session?.user?.email} 
                    size="xl"
                    showUpload={true}
                    onUpload={handleAvatarUpload}
                  />
                </div>
                <p className="gulf-text-xs text-theme-muted mt-2">
                  انقر على أيقونة الكاميرا لتغيير الصورة
                </p>
              </div>

              <div>
                <label className="gulf-text-sm font-medium text-theme-secondary mb-2 block">
                  الاسم الكامل
                </label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={userInfo.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل اسمك الكامل"
                  />
                </div>
              </div>

              <div>
                <label className="gulf-text-sm font-medium text-theme-secondary mb-2 block">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل بريدك الإلكتروني"
                  />
                </div>
              </div>

              <div>
                <label className="gulf-text-sm font-medium text-theme-secondary mb-2 block">
                  الدور في النظام
                </label>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                    userPermissions?.role === 'ADMIN' || userPermissions?.role === 'admin'
                      ? 'bg-red-100 text-red-700 border border-red-200' 
                      : userPermissions?.role === 'moderator'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : userPermissions?.role === 'teacher'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : userPermissions?.role === 'editor'
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}>
                    {getUserRoleLabel(userPermissions?.role || 'user')}
                  </span>
                  {(userPermissions?.role === 'ADMIN' || userPermissions?.role === 'admin') && (
                    <span className="mr-2 text-xs text-red-600 font-medium">• جميع الصلاحيات</span>
                  )}
                </div>
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="w-full admin-btn-login mt-4"
              >
                <Save className="h-4 w-4 ml-2" />
                {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </div>
          </div>

          {/* تغيير كلمة المرور */}
          <div className="modern-card p-4 sm:p-8">
            <h2 className="gulf-text-xl font-bold text-theme-primary mb-6 flex items-center">
              <Lock className="h-6 w-6 ml-2" />
              تغيير كلمة المرور
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="gulf-text-sm font-medium text-theme-secondary mb-2 block">
                  كلمة المرور الحالية
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={userInfo.currentPassword}
                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    className="w-full pr-12 pl-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل كلمة المرور الحالية"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="gulf-text-sm font-medium text-theme-secondary mb-2 block">
                  كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={userInfo.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    className="w-full pr-12 pl-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل كلمة المرور الجديدة"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="gulf-text-sm font-medium text-theme-secondary mb-2 block">
                  تأكيد كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={userInfo.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full pr-12 pl-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أعد إدخال كلمة المرور الجديدة"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={isLoading || !userInfo.currentPassword || !userInfo.newPassword || !userInfo.confirmPassword}
                className="w-full admin-btn-users mt-4"
              >
                <Lock className="h-4 w-4 ml-2" />
                {isLoading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
              </Button>
            </div>
          </div>
        </div>

        {/* معلومات إضافية */}
        <div className="modern-card p-4 sm:p-8 mt-8">
          <h2 className="gulf-text-lg sm:gulf-text-xl font-bold text-theme-primary mb-6">معلومات إضافية</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <User className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="gulf-text-sm font-medium text-blue-800">آخر تسجيل دخول</p>
              <p className="gulf-text-xs text-blue-600">اليوم</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Settings className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="gulf-text-sm font-medium text-green-800">حالة الحساب</p>
              <p className="gulf-text-xs text-green-600">نشط</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Lock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="gulf-text-sm font-medium text-purple-800">مستوى الأمان</p>
              <p className="gulf-text-xs text-purple-600">جيد</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
