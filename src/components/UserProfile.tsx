"use client"

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { 
  User, 
  Settings, 
  LogOut, 
  Edit, 
  Camera,
  Save,
  X,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function UserProfile() {
  const { data: session, update } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    image: session?.user?.image || ''
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [profileUpdateKey, setProfileUpdateKey] = useState(0) // لفرض إعادة التحديث

  // تحديث بيانات الملف الشخصي عند تحديث الجلسة
  useEffect(() => {
    if (session?.user) {
      setProfileData(prevData => ({
        name: session.user.name || prevData.name,
        email: session.user.email || prevData.email,
        image: session.user.image || prevData.image
      }))
    }
  }, [session])

  // استخدام profileData.image أولاً، ثم session.user.image كbacking
  const currentUserImage = profileData.image || session?.user?.image
  const currentUserName = profileData.name || session?.user?.name
  
  // إضافة logs للتتبع (يمكن إزالتها لاحقاً)
  useEffect(() => {
    console.log('🔍 Current user image sources:', {
      profileDataImage: profileData.image,
      sessionUserImage: session?.user?.image,
      finalImage: currentUserImage,
      updateKey: profileUpdateKey
    })
  }, [profileData.image, session?.user?.image, currentUserImage, profileUpdateKey])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!session?.user?.id) return
    
    setIsLoading(true)
    setError('')
    
    try {
      const formData = new FormData()
      formData.append('name', profileData.name)
      
      if (imageFile) {
        formData.append('image', imageFile)
      }

      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'فشل في تحديث الملف الشخصي')
      }

      const updatedAdmin = await response.json()
      
      console.log('✅ API Response - Updated admin data:', updatedAdmin) // للتأكد من البيانات المُحدثة
      console.log('🖼️ New image URL:', updatedAdmin.image) // للتأكد من URL الصورة الجديدة
      
      // تحديث البيانات المحلية فوراً قبل تحديث الجلسة
      setProfileData({
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        image: updatedAdmin.image
      })
      
      // تحديث بيانات الجلسة بالبيانات الجديدة
      const sessionUpdateResult = await update({
        name: updatedAdmin.name,
        image: updatedAdmin.image
      })
      
      console.log('🔄 Session update result:', sessionUpdateResult) // للتأكد من تحديث الجلسة
      
      console.log('💾 Local state updated with:', {
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        image: updatedAdmin.image
      }) // للتأكد من تحديث الحالة المحلية

      // إعادة تعيين الحالة
      setIsEditing(false)
      setImageFile(null)
      setImagePreview('')
      setProfileUpdateKey(prev => prev + 1) // فرض إعادة التحديث
      
      console.log('✅ Profile updated successfully!') // تأكيد نجاح التحديث
      
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setError(error.message || 'حدث خطأ في تحديث الملف الشخصي')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  if (!session) return null

  return (
    <div className="relative" key={profileUpdateKey}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 space-x-reverse p-2 rounded-xl hover:bg-theme-secondary transition-colors"
      >
        <div className="w-10 h-10 rounded-full overflow-hidden bg-theme-primary flex items-center justify-center">
          {currentUserImage ? (
            <img 
              key={`profile-btn-${profileUpdateKey}-${currentUserImage}`}
              src={currentUserImage} 
              alt={currentUserName || 'مدير النظام'} 
              className="w-full h-full object-cover"
              onLoad={() => console.log('🖼️ Profile button image loaded:', currentUserImage)}
              onError={(e) => {
                console.error('❌ Profile button image failed to load:', currentUserImage)
                // يمكن إضافة fallback هنا إذا لزم الأمر
              }}
            />
          ) : (
            <User className="h-5 w-5 text-white" />
          )}
        </div>
        <div className="hidden md:block text-right">
          <div className="gulf-text-sm font-semibold theme-text">
            {currentUserName || 'المستخدم'}
          </div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute left-0 top-full mt-2 w-80 theme-card rounded-2xl shadow-2xl border-theme z-50">
            {!isEditing ? (
              // View Mode
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-theme-primary flex items-center justify-center mb-4">
                    {currentUserImage ? (
                      <img 
                        key={`profile-view-${profileUpdateKey}-${currentUserImage}`}
                        src={currentUserImage} 
                        alt={currentUserName || 'User'} 
                        className="w-full h-full object-cover"
                        onLoad={() => console.log('🖼️ Profile view image loaded:', currentUserImage)}
                        onError={(e) => console.error('❌ Profile view image failed to load:', currentUserImage)}
                      />
                    ) : (
                      <User className="h-8 w-8 text-white" />
                    )}
                  </div>
                  <h3 className="gulf-text-lg font-bold theme-text mb-1">
                    {currentUserName || 'المستخدم'}
                  </h3>
                  <p className="gulf-text-sm text-theme-muted">
                    {profileData.email}
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full flex items-center space-x-3 space-x-reverse p-3 rounded-xl hover:theme-secondary transition-colors text-right"
                  >
                    <Edit className="h-5 w-5 text-theme-secondary" />
                    <span className="gulf-text-sm font-medium theme-text">
                      تعديل الملف الشخصي
                    </span>
                  </button>

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-3 space-x-reverse p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-right"
                  >
                    <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <span className="gulf-text-sm font-medium text-red-700 dark:text-red-400">
                      تسجيل الخروج
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              // Edit Mode
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="gulf-text-lg font-bold theme-text">
                    تعديل الملف الشخصي
                  </h3>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setImagePreview('')
                      setImageFile(null)
                      setError('')
                    }}
                    className="p-2 hover:theme-secondary rounded-lg"
                  >
                    <X className="h-4 w-4 text-theme-secondary" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="gulf-text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Profile Image */}
                  <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-4">
                      <div className="w-full h-full rounded-full overflow-hidden bg-theme-primary flex items-center justify-center">
                        {(imagePreview || currentUserImage) ? (
                          <img 
                            key={`profile-edit-${profileUpdateKey}-${imagePreview || currentUserImage}`}
                            src={imagePreview || currentUserImage || ''} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                            onLoad={() => console.log('🖼️ Profile edit image loaded:', imagePreview || currentUserImage)}
                            onError={(e) => console.error('❌ Profile edit image failed to load:', imagePreview || currentUserImage)}
                          />
                        ) : (
                          <User className="h-8 w-8 text-white" />
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 p-1 bg-theme-primary rounded-full cursor-pointer hover:bg-theme-primary-dark transition-colors">
                        <Camera className="h-3 w-3 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block gulf-text-sm font-medium text-theme-secondary mb-2">
                      الاسم
                    </label>
                    <Input
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="gulf-text-base"
                    />
                  </div>

                  {/* Email (readonly) */}
                  <div>
                    <label className="block gulf-text-sm font-medium text-theme-secondary mb-2">
                      البريد الإلكتروني
                    </label>
                    <Input
                      value={profileData.email}
                      readOnly
                      className="gulf-text-base theme-secondary"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex space-x-3 space-x-reverse pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="flex-1 btn-primary"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 ml-2" />
                          حفظ
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditing(false)
                        setImagePreview('')
                        setImageFile(null)
                        setError('')
                      }}
                      disabled={isLoading}
                      className="flex-1 btn-secondary"
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
