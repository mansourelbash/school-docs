import Link from "next/link";
import { School, TrendingUp, FolderOpen, User, Settings, LogIn } from "lucide-react";
import ThemeChanger from "@/components/ThemeChanger";
import { useSession } from "next-auth/react";
import UserMenu from "@/components/ui/UserMenu";

export default function MainHeader({ documentsCount = 0, categoriesCount = 0, canManageUsers = false }) {
  const { data: session } = useSession();
  return (
    <header className="header-theme border-b border-theme">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* الشعار والعنوان */}
          <div className="flex items-center space-x-4 space-x-reverse pl-2">
            <div className="p-3 gulf-gradient rounded-2xl shadow-lg">
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
          {/* مجموعة الأزرار */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 space-x-2 sm:space-x-4 space-x-reverse">
            {session && (
              <UserMenu user={session.user} userRole={canManageUsers ? 'ADMIN' : undefined} />
            )}
            <div className="hidden xl:flex items-center space-x-6 space-x-reverse bg-theme-secondary rounded-xl px-4 py-2">
              <div className="text-center group">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="p-1.5 bg-theme-primary/10 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-theme-primary" />
                  </div>
                  <div className="gulf-text-sm font-bold text-theme-primary">{documentsCount}</div>
                </div>
                <div className="gulf-text-xs text-theme-muted">ملف</div>
              </div>
              <div className="w-px h-8 bg-theme-border"></div>
              <div className="text-center group">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="p-1.5 bg-theme-success/10 rounded-lg">
                    <FolderOpen className="h-4 w-4 text-theme-success" />
                  </div>
                  <div className="gulf-text-sm font-bold text-theme-success">{categoriesCount}</div>
                </div>
                <div className="gulf-text-xs text-theme-muted">تصنيف</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              {!session && (
                <Link href="/admin/login">
                  <span className="admin-btn-login group flex items-center space-x-2 space-x-reverse text-theme-primary hover:text-theme-primary-dark font-semibold cursor-pointer">
                    <LogIn className="h-4 w-4" />
                    <span className="hidden lg:inline gulf-text-sm font-medium">تسجيل الدخول</span>
                  </span>
                </Link>
              )}
              {session && canManageUsers && (
                <Link href="/admin/users">
                  <span className="admin-btn-users group flex items-center space-x-2 space-x-reverse text-theme-primary hover:text-theme-primary-dark font-semibold cursor-pointer">
                    <User className="h-4 w-4" />
                    <span className="hidden xl:inline gulf-text-sm font-medium">إدارة المستخدمين</span>
                  </span>
                </Link>
              )}
              {session && (
                <Link href="/dashboard">
                  <span className="admin-btn-dashboard group flex items-center space-x-2 space-x-reverse text-theme-primary hover:text-theme-primary-dark font-semibold cursor-pointer">
                    <Settings className="h-4 w-4" />
                    <span className="hidden lg:inline gulf-text-sm font-medium">لوحة التحكم</span>
                  </span>
                </Link>
              )}
            </div>
            <div className="w-px h-8 bg-theme-border hidden sm:block"></div>
            <div className="flex items-center">
              <ThemeChanger />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
