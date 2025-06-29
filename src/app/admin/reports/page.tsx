'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  UsersIcon, 
  FolderIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface Stats {
  totalDocuments: number
  totalUsers: number
  totalDownloads: number
  totalViews: number
  recentActivity: {
    documentsThisMonth: number
    usersThisMonth: number
    downloadsThisMonth: number
  }
  topDocuments: Array<{
    title: string
    downloads: number
    views: number
  }>
  userActivity: Array<{
    name: string
    email: string
    lastLogin: string
    documentsUploaded: number
  }>
}

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      console.log('لا توجد جلسة، إعادة توجيه لتسجيل الدخول')
      setError('يجب تسجيل الدخول أولاً')
      setLoading(false)
      // router.push('/auth/signin')
      return
    }

    // التحقق من الصلاحيات
    checkPermissions()
  }, [session, status, router])

  const checkPermissions = async () => {
    try {
      const response = await fetch('/api/auth/check-permissions')
      const data = await response.json()
      
      console.log('بيانات الصلاحيات المُستلمة:', data) // للتصحيح
      
      // التحقق من الصلاحيات مباشرة من البيانات المُستلمة
      const hasPermission = data.role === 'admin' || 
                          data.role === 'ADMIN' || 
                          data.canManageUsers ||
                          data.canViewReports ||
                          data.canViewAllDocuments
      
      if (!hasPermission) {
        console.log('لا توجد صلاحية للوصول للتقارير', data)
        alert('ليس لديك صلاحية لعرض التقارير')
        router.push('/dashboard')
        return
      }

      console.log('تم التحقق من الصلاحيات بنجاح، جاري جلب الإحصائيات...')
      // جلب الإحصائيات
      await fetchStats()
    } catch (error) {
      console.error('Error checking permissions:', error)
      console.log('خطأ في التحقق من الصلاحيات، إعادة توجيه للداشبورد')
      setError('خطأ في التحقق من الصلاحيات')
      setLoading(false)
      // عدم إعادة التوجيه فوراً، بل عرض الخطأ
      // router.push('/dashboard')
    }
  }

  const fetchStats = async () => {
    try {
      setLoading(true)
      console.log('بدء جلب الإحصائيات...')
      const response = await fetch('/api/admin/stats')
      
      console.log('استجابة API الإحصائيات:', response.status)
      
      if (!response.ok) {
        const errorData = await response.text()
        console.error('خطأ في استجابة API:', errorData)
        throw new Error(`فشل في جلب الإحصائيات: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('بيانات الإحصائيات المُستلمة:', data)
      
      if (data.success) {
        setStats(data.stats)
        console.log('تم تحميل الإحصائيات بنجاح')
      } else {
        throw new Error(data.error || 'خطأ في جلب الإحصائيات')
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      setError('حدث خطأ في جلب الإحصائيات')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <h2 className="text-xl font-bold text-red-600 mb-4">خطأ في صفحة التقارير</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="text-sm text-gray-500 mb-4">
            <p>معلومات إضافية:</p>
            <p>الجلسة: {session ? '✅ موجود' : '❌ غير موجود'}</p>
            <p>المستخدم: {session?.user?.email || 'غير محدد'}</p>
          </div>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ml-2"
          >
            العودة للداشبورد
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">لا توجد بيانات</h2>
          <p className="text-gray-600">لم يتم العثور على إحصائيات</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">التقارير والإحصائيات</h1>
              <p className="mt-2 text-gray-600">تقرير شامل عن نشاط النظام</p>
            </div>
            <button 
              onClick={() => router.push('/dashboard')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              العودة للداشبورد
            </button>
          </div>
        </div>

        {/* إحصائيات عامة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الوثائق</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-green-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي المستخدمين</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي التحميلات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDownloads.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <EyeIcon className="h-8 w-8 text-orange-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي المشاهدات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* النشاط الشهري */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CalendarIcon className="h-5 w-5 text-blue-600 ml-2" />
              النشاط هذا الشهر
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.recentActivity.documentsThisMonth}</p>
                <p className="text-sm text-gray-600">وثيقة جديدة</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <UsersIcon className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.recentActivity.usersThisMonth}</p>
                <p className="text-sm text-gray-600">مستخدم جديد</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.recentActivity.downloadsThisMonth}</p>
                <p className="text-sm text-gray-600">تحميل جديد</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* أكثر الوثائق تحميلاً */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <ChartBarIcon className="h-5 w-5 text-blue-600 ml-2" />
                أكثر الوثائق تحميلاً
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.topDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{doc.title}</p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span>{doc.views} مشاهدة</span>
                        <span>{doc.downloads} تحميل</span>
                      </div>
                    </div>
                    <div className="flex items-center text-sm font-medium text-blue-600">
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* نشاط المستخدمين */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <ClockIcon className="h-5 w-5 text-green-600 ml-2" />
                نشاط المستخدمين الأخير
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.userActivity.map((user, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{user.documentsUploaded} وثيقة</p>
                      <p className="text-xs text-gray-500">آخر دخول: {user.lastLogin}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ملاحظة حول البيانات */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="mr-3">
              <h3 className="text-sm font-medium text-blue-800">
                معلومات الإحصائيات
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  تعتمد الإحصائيات على بيانات حقيقية من قاعدة البيانات (عدد المستخدمين، النشاط الشهري). 
                  بعض الإحصائيات (الوثائق والتحميلات) ستصبح حقيقية عند إضافة نظام إدارة الملفات.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
