import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import prisma from "@/lib/prisma"
import { deleteFromCloudinary, deleteCloudinaryFolder } from "@/lib/cloudinary"

// Update subcategory
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
    const { name, nameAr, description } = await request.json()

    if (!name || !nameAr) {
      return NextResponse.json(
        { error: "الاسم مطلوب" },
        { status: 400 }
      )
    }

    const subcategory = await prisma.subCategory.update({
      where: { id },
      data: {
        name,
        nameAr,
        description
      },
      include: {
        mainCategory: true,
        _count: {
          select: {
            documents: true
          }
        }
      }
    })

    return NextResponse.json(subcategory)
  } catch (error) {
    console.error('Error updating subcategory:', error)
    return NextResponse.json(
      { error: "فشل في تحديث التصنيف الفرعي" },
      { status: 500 }
    )
  }
}

// Delete subcategory
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

    // Get subcategory with main category info for Cloudinary folder path
    const subcategory = await prisma.subCategory.findUnique({
      where: { id },
      include: {
        mainCategory: true,
        documents: true
      }
    })

    if (!subcategory) {
      return NextResponse.json(
        { error: "التصنيف الفرعي غير موجود" },
        { status: 404 }
      )
    }

    // Delete all documents from Cloudinary first
    for (const document of subcategory.documents) {
      if (document.cloudinaryId) {
        try {
          await deleteFromCloudinary(document.cloudinaryId)
        } catch (error) {
          console.error('Error deleting file from Cloudinary:', error)
        }
      }
    }

    // Try to delete the Cloudinary folder
    try {
      const folderPath = `school-docs/${subcategory.mainCategory.nameAr.replace(/\s+/g, '_')}/${subcategory.nameAr.replace(/\s+/g, '_')}`
      await deleteCloudinaryFolder(folderPath)
    } catch (error) {
      console.error('Error deleting Cloudinary folder:', error)
      // Continue with database deletion even if Cloudinary fails
    }

    // Delete subcategory (this will cascade delete documents due to foreign key)
    await prisma.subCategory.delete({
      where: { id }
    })

    return NextResponse.json({ message: "تم حذف التصنيف الفرعي بنجاح" })
  } catch (error) {
    console.error('Error deleting subcategory:', error)
    return NextResponse.json(
      { error: "فشل في حذف التصنيف الفرعي" },
      { status: 500 }
    )
  }
}
