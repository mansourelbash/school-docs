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

    // If document has Cloudinary URL, redirect to it
    if (document.cloudinaryUrl) {
      return NextResponse.redirect(document.cloudinaryUrl)
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
