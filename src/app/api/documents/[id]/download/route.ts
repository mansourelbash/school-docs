import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const document = await prisma.document.findUnique({
      where: { id }
    })

    if (!document) {
      return NextResponse.json(
        { error: "الملف غير موجود" },
        { status: 404 }
      )
    }

    // If document has Cloudinary URL, download and serve with proper filename
    if (document.cloudinaryUrl) {
      try {
        // Fetch file from Cloudinary
        const response = await fetch(document.cloudinaryUrl)
        
        if (response.ok) {
          const fileBuffer = await response.arrayBuffer()
          
          // معالجة أفضل لامتداد الملف
          let fileExtension = document.fileExtension
          
          // إذا لم يكن هناك امتداد، حاول استخراجه من originalName
          if (!fileExtension && document.originalName) {
            const parts = document.originalName.split('.')
            if (parts.length > 1) {
              fileExtension = parts[parts.length - 1]
            }
          }
          
          // إذا لم يزل لا يوجد امتداد، حاول تحديده من mimeType
          if (!fileExtension && document.mimeType) {
            if (document.mimeType.includes('pdf')) fileExtension = 'pdf'
            else if (document.mimeType.includes('word') || document.mimeType.includes('document')) {
              fileExtension = document.mimeType.includes('openxml') ? 'docx' : 'doc'
            }
            else if (document.mimeType.includes('excel') || document.mimeType.includes('spreadsheet')) {
              fileExtension = document.mimeType.includes('openxml') ? 'xlsx' : 'xls'
            }
            else if (document.mimeType.includes('powerpoint') || document.mimeType.includes('presentation')) {
              fileExtension = document.mimeType.includes('openxml') ? 'pptx' : 'ppt'
            }
            else if (document.mimeType.startsWith('image/')) {
              fileExtension = document.mimeType.split('/')[1]
            }
            else fileExtension = 'bin'
          }
          
          // احتياطي أخير
          if (!fileExtension) fileExtension = 'bin'
          
          const fileName = `${document.titleAr || document.title}.${fileExtension}`
          
          return new NextResponse(fileBuffer, {
            headers: {
              'Content-Type': document.mimeType || 'application/octet-stream',
              'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
              'Content-Length': fileBuffer.byteLength.toString()
            }
          })
        } else {
          return NextResponse.json(
            { error: "فشل في تحميل الملف من الخادم" },
            { status: 500 }
          )
        }
      } catch (fetchError) {
        console.error('Error fetching from Cloudinary:', fetchError)
        return NextResponse.json(
          { error: "فشل في تحميل الملف" },
          { status: 500 }
        )
      }
    }
    
    // If no Cloudinary URL, create a demo response (for testing purposes)
    if (!document.cloudinaryUrl) {
      // معالجة امتداد الملف للملفات التجريبية
      let fileExtension = document.fileExtension
      
      if (!fileExtension && document.originalName) {
        const parts = document.originalName.split('.')
        if (parts.length > 1) {
          fileExtension = parts[parts.length - 1]
        }
      }
      
      if (!fileExtension && document.mimeType) {
        if (document.mimeType.includes('pdf')) fileExtension = 'pdf'
        else if (document.mimeType.includes('word') || document.mimeType.includes('document')) {
          fileExtension = document.mimeType.includes('openxml') ? 'docx' : 'doc'
        }
        else if (document.mimeType.includes('excel') || document.mimeType.includes('spreadsheet')) {
          fileExtension = document.mimeType.includes('openxml') ? 'xlsx' : 'xls'
        }
        else if (document.mimeType.includes('powerpoint') || document.mimeType.includes('presentation')) {
          fileExtension = document.mimeType.includes('openxml') ? 'pptx' : 'ppt'
        }
        else if (document.mimeType.startsWith('image/')) {
          fileExtension = document.mimeType.split('/')[1]
        }
        else fileExtension = 'bin'
      }
      
      if (!fileExtension) fileExtension = 'bin'
      
      const fileName = `${document.titleAr || document.title}.${fileExtension}`
      
      // Create demo content
      const demoContent = `هذا ملف تجريبي: ${document.titleAr || document.title}\n\nمعلومات الملف:\n- النوع: ${document.mimeType}\n- الحجم: ${document.fileSize} بايت\n- تاريخ الرفع: ${document.uploadDate}\n\nهذا المحتوى للاختبار فقط.`
      
      return new NextResponse(demoContent, {
        headers: {
          'Content-Type': document.mimeType || 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
          'Content-Length': Buffer.byteLength(demoContent, 'utf8').toString()
        }
      })
    }
    
    // Fallback to local file (for backward compatibility)
    if (document.filePath.startsWith('/uploads/')) {
      const fileUrl = `${request.nextUrl.origin}${document.filePath}`
      return NextResponse.redirect(fileUrl)
    }
    
    return NextResponse.json(
      { error: "الملف غير متوفر" },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error downloading document:', error)
    return NextResponse.json(
      { error: "فشل في تنزيل الملف" },
      { status: 500 }
    )
  }
}
