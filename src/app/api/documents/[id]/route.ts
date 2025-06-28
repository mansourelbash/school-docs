import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import prisma from "@/lib/prisma"
import { unlink } from "fs/promises"
import path from "path"

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

    // Delete file from filesystem
    try {
      const filePath = path.join(process.cwd(), 'public', 'uploads', document.fileName)
      await unlink(filePath)
    } catch (fileError) {
      console.warn('Could not delete file from filesystem:', fileError)
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
