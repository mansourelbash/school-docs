"use client"

import { useState } from 'react'
import { User, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AvatarProps {
  src?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showUpload?: boolean
  onUpload?: (newImageUrl: string) => void
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-base',
  xl: 'h-24 w-24 text-lg'
}

export default function Avatar({ 
  src, 
  name, 
  size = 'md', 
  showUpload = false, 
  onUpload,
  className = '' 
}: AvatarProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [imageError, setImageError] = useState(false)

  const getInitials = (name?: string) => {
    if (!name) return '👤'
    const names = name.trim().split(' ')
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase()
    }
    return name[0].toUpperCase() || '👤'
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/user/upload-avatar', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setImageError(false)
        onUpload?.(result.imageUrl)
      } else {
        alert(result.error || 'فشل في رفع الصورة')
      }
    } catch (error) {
      alert('حدث خطأ في رفع الصورة')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg`}>
        {src && !imageError ? (
          <img
            src={src}
            alt={name || 'صورة شخصية'}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="select-none">
            {getInitials(name)}
          </span>
        )}
      </div>
      
      {showUpload && (
        <div className="absolute -bottom-1 -right-1">
          <label 
            htmlFor="avatar-upload" 
            className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-primary rounded-full"
            title={isUploading ? "جارٍ رفع الصورة..." : "رفع صورة جديدة"}
          >
            <div className="bg-theme-primary text-white rounded-full p-1 shadow-lg hover:bg-theme-primary-dark transition-colors">
              {isUploading ? (
                <div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full"></div>
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </div>
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
            aria-busy={isUploading}
            aria-disabled={isUploading}
          />
        </div>
      )}
    </div>
  )
}
