import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import authOptions from '../../auth/authOptions'
import prisma from "@/lib/prisma"
import { deleteFromCloudinary, deleteCloudinaryFolder } from "@/lib/cloudinary"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const category = await prisma.mainCategory.findUnique({
      where: { id },
      include: {
        subCategories: true,
        _count: {
          select: {
            documents: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: "التصنيف غير موجود" },
        { status: 404 }
      )
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { error: "فشل في جلب التصنيف" },
      { status: 500 }
    )
  }
}

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
    const { name, nameAr, description } = body

    const category = await prisma.mainCategory.update({
      where: { id },
      data: {
        name,
        nameAr,
        description
      }
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: "فشل في تحديث التصنيف" },
      { status: 500 }
    )
  }
}

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

    // Get category with all related data for Cloudinary cleanup
    const category = await prisma.mainCategory.findUnique({
      where: { id },
      include: {
        documents: true,
        subCategories: {
          include: {
            documents: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: "التصنيف غير موجود" },
        { status: 404 }
      )
    }

    // Delete all files from Cloudinary first
    // Delete main category documents
    for (const document of category.documents) {
      if (document.cloudinaryId) {
        try {
          await deleteFromCloudinary(document.cloudinaryId)
        } catch (error) {
          console.error('Error deleting file from Cloudinary:', error)
        }
      }
    }

    // Delete subcategory documents
    for (const subCategory of category.subCategories) {
      for (const document of subCategory.documents) {
        if (document.cloudinaryId) {
          try {
            await deleteFromCloudinary(document.cloudinaryId)
          } catch (error) {
            console.error('Error deleting file from Cloudinary:', error)
          }
        }
      }
    }

    // Try to delete the entire category folder from Cloudinary
    try {
      const folderPath = `school-docs/${category.nameAr.replace(/\s+/g, '_')}`
      await deleteCloudinaryFolder(folderPath)
    } catch (error) {
      console.error('Error deleting Cloudinary folder:', error)
      // Continue with database deletion even if Cloudinary fails
    }

    // Delete from database (cascade will handle subcategories and documents)
    await prisma.mainCategory.delete({
      where: { id }
    })

    return NextResponse.json({ message: "تم حذف التصنيف بنجاح" })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: "فشل في حذف التصنيف" },
      { status: 500 }
    )
  }
}
