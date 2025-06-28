import { useState } from 'react'
import { FileText, Image, FileSpreadsheet, FileVideo, Music, Archive, File } from 'lucide-react'

interface FilePreviewProps {
  fileName: string
  mimeType: string
  cloudinaryUrl?: string
  fileSize: number
  className?: string
}

export default function FilePreview({ 
  fileName, 
  mimeType, 
  cloudinaryUrl, 
  fileSize,
  className = "" 
}: FilePreviewProps) {
  const [imageError, setImageError] = useState(false)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = () => {
    if (mimeType.startsWith('image/')) return <Image className="h-12 w-12 text-blue-500" />
    if (mimeType.includes('pdf')) return <FileText className="h-12 w-12 text-red-500" />
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) 
      return <FileSpreadsheet className="h-12 w-12 text-green-500" />
    if (mimeType.includes('word') || mimeType.includes('document'))
      return <FileText className="h-12 w-12 text-blue-600" />
    if (mimeType.startsWith('video/')) return <FileVideo className="h-12 w-12 text-purple-500" />
    if (mimeType.startsWith('audio/')) return <Music className="h-12 w-12 text-orange-500" />
    if (mimeType.includes('zip') || mimeType.includes('rar')) 
      return <Archive className="h-12 w-12 text-gray-500" />
    return <File className="h-12 w-12 text-gray-600" />
  }

  const getFileTypeLabel = () => {
    if (mimeType.includes('pdf')) return 'PDF'
    if (mimeType.includes('word')) return 'Word'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Excel'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'PowerPoint'
    if (mimeType.startsWith('image/')) return 'صورة'
    if (mimeType.startsWith('video/')) return 'فيديو'
    if (mimeType.startsWith('audio/')) return 'صوت'
    return 'ملف'
  }

  // Generate Cloudinary thumbnail URL for images
  const getThumbnailUrl = () => {
    if (!cloudinaryUrl || !mimeType.startsWith('image/') || imageError) {
      return null
    }
    
    // Convert Cloudinary URL to thumbnail
    const urlParts = cloudinaryUrl.split('/upload/')
    if (urlParts.length === 2) {
      return `${urlParts[0]}/upload/w_400,h_300,c_fill,f_auto,q_auto,dpr_2.0/${urlParts[1]}`
    }
    
    return cloudinaryUrl
  }

  const thumbnailUrl = getThumbnailUrl()

  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 ${className}`}>
      {thumbnailUrl && !imageError ? (
        <div className="aspect-[4/3] w-full">
          <img
            src={thumbnailUrl}
            alt={fileName}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
          />
          {/* Overlay gradient for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      ) : (
        <div className="aspect-[4/3] w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-dashed border-blue-200">
          <div className="text-center">
            {getFileIcon()}
            <div className="mt-3 gulf-text-sm font-medium text-gray-700">
              {getFileTypeLabel()}
            </div>
          </div>
        </div>
      )}
      
      {/* File info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="text-white">
          <div className="gulf-text-sm font-semibold truncate mb-1" title={fileName}>
            {fileName}
          </div>
          <div className="flex items-center justify-between">
            <div className="gulf-text-xs opacity-90">
              {formatFileSize(fileSize)}
            </div>
            <div className="gulf-text-xs opacity-90 bg-white/20 px-2 py-1 rounded-full">
              {getFileTypeLabel()}
            </div>
          </div>
        </div>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  )
}
