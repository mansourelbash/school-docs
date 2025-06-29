"use client"

import { signOut } from "next-auth/react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ClearSession() {
  const router = useRouter()

  useEffect(() => {
    const clearAndRedirect = async () => {
      try {
        // تسجيل خروج من NextAuth
        await signOut({ redirect: false })
        
        // مسح جميع البيانات المحفوظة
        localStorage.clear()
        sessionStorage.clear()
        
        // مسح cookies
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });

        console.log('✅ تم مسح جميع البيانات')
        
        // إعادة توجيه لصفحة تسجيل الدخول
        setTimeout(() => {
          router.push('/admin/login')
        }, 1000)
        
      } catch (error) {
        console.error('خطأ في مسح البيانات:', error)
        router.push('/admin/login')
      }
    }

    clearAndRedirect()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <h2 className="text-xl font-semibold mt-4 text-gray-800">جاري مسح البيانات القديمة...</h2>
        <p className="text-gray-600 mt-2">سيتم إعادة توجيهك لصفحة تسجيل الدخول</p>
      </div>
    </div>
  )
}
