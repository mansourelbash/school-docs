import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import authOptions from '../../auth/authOptions'
import prisma from "@/lib/prisma"
import { deleteFromCloudinary } from "@/lib/cloudinary"

// Get single document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        mainCategory: true,
        subCategory: true
      }
    })

    if (!document) {
      return NextResponse.json(
        { error: "الملف غير موجود" },
        { status: 404 }
      )
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json(
      { error: "فشل في جلب الملف" },
      { status: 500 }
    )
  }
}

// Update document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "غير مصرح بالدخول" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { title, titleAr, description, descriptionAr, mainCategoryId, subCategoryId } = body

    if (!title || !titleAr || !mainCategoryId) {
      return NextResponse.json(
        { error: "العنوان والتصنيف الرئيسي مطلوبان" },
        { status: 400 }
      )
    }

    const document = await prisma.document.update({
      where: { id },
      data: {
        title,
        titleAr,
        description: description || '',
        descriptionAr: descriptionAr || '',
        mainCategoryId,
        subCategoryId: subCategoryId || null,
        updatedAt: new Date()
      },
      include: {
        mainCategory: true,
        subCategory: true
      }
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error updating document:', error)
    return NextResponse.json(
      { error: "فشل في تحديث الملف" },
      { status: 500 }
    )
  }
}

// Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "غير مصرح بالدخول" },
        { status: 401 }
      )
    }

    const { id } = await params

    // Get document info first
    const document = await prisma.document.findUnique({
      where: { id }
    })

    if (!document) {
      return NextResponse.json(
        { error: "الملف غير موجود" },
        { status: 404 }
      )
    }

    // Delete file from Cloudinary
    try {
      if (document.cloudinaryId) {
        console.log(`🗑️ حذف الملف من Cloudinary: ${document.cloudinaryId}`)
        await deleteFromCloudinary(document.cloudinaryId)
        console.log(`✅ تم حذف الملف من Cloudinary بنجاح: ${document.originalName}`)
      }
    } catch (fileError) {
      console.warn('Could not delete file from Cloudinary:', fileError)
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.document.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: "فشل في حذف الملف" },
      { status: 500 }
    )
  }
}
