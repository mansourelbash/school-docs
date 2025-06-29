import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import authOptions from '../../auth/authOptions'
import prisma from '@/lib/prisma'
import { uploadProfileImageToCloudinary, deleteFromCloudinary, extractPublicIdFromUrl } from '@/lib/cloudinary'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!admin) {
      return NextResponse.json({ error: 'المشرف غير موجود' }, { status: 404 })
    }

    return NextResponse.json(admin)
  } catch (error) {
    return NextResponse.json({ error: 'خطأ في الخادم الداخلي' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const formData = await request.formData()
    const name = formData.get('name') as string
    const imageFile = formData.get('image') as File | null

    if (!name) {
      return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 })
    }

    // البحث عن المشرف الحالي
    const currentAdmin = await prisma.admin.findUnique({
      where: { id: session.user.id }
    })

    if (!currentAdmin) {
      return NextResponse.json({ error: 'المشرف غير موجود' }, { status: 404 })
    }

    let imageUrl = currentAdmin.image

    // رفع صورة جديدة إذا تم إرسالها
    if (imageFile && imageFile.size > 0) {
      // حذف الصورة القديمة إذا كانت موجودة ومن Cloudinary
      if (currentAdmin.image) {
        try {
          const publicId = extractPublicIdFromUrl(currentAdmin.image)
          if (publicId) {
            await deleteFromCloudinary(publicId)
          }
        } catch (error) {
          // Ignore error and continue with new image upload
        }
      }

      // رفع الصورة الجديدة
      try {
        const buffer = Buffer.from(await imageFile.arrayBuffer())
        const uploadResult = await uploadProfileImageToCloudinary(
          buffer,
          `admins/${session.user.id}/profile`,
          'image'
        )
        imageUrl = uploadResult.url
      } catch (error) {
        return NextResponse.json({ error: 'فشل في رفع الصورة' }, { status: 500 })
      }
    }

    // تحديث بيانات المشرف
    const updatedAdmin = await prisma.admin.update({
      where: { id: session.user.id },
      data: {
        name,
        image: imageUrl
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        updatedAt: true
      }
    })
    return NextResponse.json(updatedAdmin)
  } catch (error) {
    return NextResponse.json({ error: 'خطأ في الخادم الداخلي' }, { status: 500 })
  }
}
