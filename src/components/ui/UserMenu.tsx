"use client"

import { useState, useRef, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import Avatar from './Avatar'

interface UserMenuProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  userRole?: string
  className?: string
}

export default function UserMenu({ user, userRole, className = '' }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // إغلاق القائمة عند الضغط خارجها
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    setIsOpen(false)
    await signOut({ callbackUrl: '/' })
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN':
      case 'admin':
        return 'مدير النظام'
      case 'TEACHER':
      case 'teacher':
        return 'معلم'
      case 'STUDENT':
      case 'student':
        return 'طالب'
      default:
        return 'مستخدم'
    }
  }

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      {/* الزر الرئيسي */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 space-x-reverse bg-theme-secondary rounded-xl px-3 py-2 hover:bg-theme-secondary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2"
      >
        <Avatar 
          src={user.image} 
          name={user.name || user.email || undefined} 
          size="sm"
        />
        <div className="hidden lg:block text-right">
          <div className="gulf-text-sm font-medium text-theme-primary">
            {user.name || user.email?.split('@')[0]}
          </div>
          {userRole && (
            <div className="gulf-text-xs text-theme-muted">
              {getRoleLabel(userRole)}
            </div>
          )}
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-theme-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* القائمة المنسدلة */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-gray-400 rounded-xl shadow-xl border border-theme-border z-50 overflow-hidden">
          {/* معلومات المستخدم */}
          <div className="px-4 py-3 border-b border-theme-border bg-theme-secondary/30">
            <div className="flex items-center space-x-3 space-x-reverse">
              <Avatar 
                src={user.image} 
                name={user.name || user.email || undefined} 
                size="md"
              />
              <div className="flex-1 text-right">
                <div className="gulf-text-sm font-medium text-theme-primary">
                  {user.name || 'مستخدم'}
                </div>
                <div className="gulf-text-xs text-theme-muted">
                  {user.email}
                </div>
                {userRole && (
                  <div className="gulf-text-xs mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      userRole === 'ADMIN' || userRole === 'admin' 
                        ? 'bg-red-100 text-red-700 border border-red-200' 
                        : userRole === 'TEACHER' || userRole === 'teacher'
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : userRole === 'STUDENT' || userRole === 'student'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                      {getRoleLabel(userRole)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* خيارات القائمة */}
          <div className="py-2">
            {/* إعدادات الحساب */}
            <Link 
              href="/account/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 space-x-reverse px-4 py-3 text-theme-primary hover:bg-theme-secondary/50 transition-colors"
            >
              <Settings className="h-5 w-5 text-theme-muted" />
              <span className="gulf-text-sm font-medium">إعدادات الحساب</span>
            </Link>

            {/* لوحة التحكم */}
            <Link 
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 space-x-reverse px-4 py-3 text-theme-primary hover:bg-theme-secondary/50 transition-colors"
            >
              <User className="h-5 w-5 text-theme-muted" />
              <span className="gulf-text-sm font-medium">لوحة التحكم</span>
            </Link>

            {/* فاصل */}
            <div className="my-2 border-t border-theme-border"></div>

            {/* تسجيل الخروج */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 space-x-reverse px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="gulf-text-sm font-medium">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
