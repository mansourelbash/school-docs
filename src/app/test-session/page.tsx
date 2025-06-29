"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useEffect, useState } from "react"

export default function SessionTest() {
  const { data: session, status } = useSession()
  const [permissionsData, setPermissionsData] = useState<any>(null)
  const [permissionsError, setPermissionsError] = useState<string>("")

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const response = await fetch('/api/auth/check-permissions')
        if (response.ok) {
          const data = await response.json()
          setPermissionsData(data)
          setPermissionsError("")
        } else {
          setPermissionsError(`خطأ ${response.status}: ${response.statusText}`)
        }
      } catch (error) {
        console.error('Error checking permissions:', error)
        setPermissionsError('خطأ في الاتصال')
      }
    }

    if (session) {
      checkPermissions()
    }
  }, [session])

  const handleLogin = async () => {
    await signIn('credentials', {
      email: 'test@test.com',
      password: '123456',
      callbackUrl: '/test-session'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 اختبار الجلسة والصلاحيات</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* معلومات الجلسة */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">🔐 معلومات الجلسة</h2>
            <div className="space-y-2">
              <p><strong>الحالة:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  status === 'authenticated' ? 'bg-green-100 text-green-800' :
                  status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {status}
                </span>
              </p>
              <p><strong>الجلسة موجودة:</strong> {session ? '✅ نعم' : '❌ لا'}</p>
              {session && (
                <>
                  <p><strong>البريد الإلكتروني:</strong> {session.user?.email}</p>
                  <p><strong>الاسم:</strong> {session.user?.name}</p>
                  <p><strong>المعرف:</strong> {(session.user as any)?.id}</p>
                  <p><strong>الدور:</strong> 
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {(session.user as any)?.role || 'غير محدد'}
                    </span>
                  </p>
                </>
              )}
              {!session && (
                <div className="mt-4">
                  <button 
                    onClick={handleLogin}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    تسجيل دخول تلقائي (test@test.com)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* معلومات الصلاحيات */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">⚡ معلومات الصلاحيات</h2>
            {session ? (
              permissionsData ? (
                <div className="space-y-2">
                  <p><strong>الدور:</strong> 
                    <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                      {permissionsData.role}
                    </span>
                  </p>
                  <p><strong>إدارة المستخدمين:</strong> {permissionsData.canManageUsers ? '✅' : '❌'}</p>
                  <p><strong>عرض التقارير:</strong> {permissionsData.canViewReports ? '✅' : '❌'}</p>
                  <p><strong>إدارة الوثائق:</strong> {permissionsData.canManageDocuments ? '✅' : '❌'}</p>
                  <p><strong>رفع الملفات:</strong> {permissionsData.canUploadDocuments ? '✅' : '❌'}</p>
                  <p><strong>عرض جميع الملفات:</strong> {permissionsData.canViewAllDocuments ? '✅' : '❌'}</p>
                </div>
              ) : permissionsError ? (
                <p className="text-red-600">❌ خطأ: {permissionsError}</p>
              ) : (
                <p className="text-gray-500">⏳ جاري تحميل الصلاحيات...</p>
              )
            ) : (
              <p className="text-gray-500">يجب تسجيل الدخول أولاً</p>
            )}
          </div>
        </div>

        {/* أزرار الاختبار */}
        <div className="mt-8 flex flex-wrap gap-4">
          {!session ? (
            <button 
              onClick={handleLogin}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              🔑 تسجيل الدخول
            </button>
          ) : (
            <button 
              onClick={() => signOut()}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              🚪 تسجيل الخروج
            </button>
          )}
          
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            🏠 الذهاب للداشبورد
          </button>
          
          <button 
            onClick={() => window.location.href = '/admin/reports'}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            📊 الذهاب للتقارير
          </button>
          
          <button 
            onClick={() => window.location.reload()}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            🔄 إعادة تحميل
          </button>
        </div>

        {/* نتائج الاختبار */}
        {session && permissionsData && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">🧪 نتائج الاختبار</h3>
            <div className="space-y-2">
              <p>
                <strong>هل يمكن الوصول للتقارير؟</strong>
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  (permissionsData.role === 'ADMIN' || permissionsData.role === 'admin' || 
                   permissionsData.canViewReports || permissionsData.canManageUsers) 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {(permissionsData.role === 'ADMIN' || permissionsData.role === 'admin' || 
                    permissionsData.canViewReports || permissionsData.canManageUsers) 
                     ? '✅ نعم' : '❌ لا'}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                الشروط: role=ADMIN/admin أو canViewReports=true أو canManageUsers=true
              </p>
            </div>
          </div>
        )}

        {/* JSON البيانات الخام */}
        <div className="mt-8">
          <details className="bg-gray-100 p-4 rounded-lg">
            <summary className="cursor-pointer font-semibold mb-2">🔍 البيانات الخام (للتصحيح)</summary>
            <pre className="text-sm overflow-auto">
              {JSON.stringify({
                status,
                session,
                permissionsData,
                permissionsError
              }, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  )
}
