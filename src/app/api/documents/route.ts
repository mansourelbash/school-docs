import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import authOptions from '../auth/authOptions'
import prisma from "@/lib/prisma"
import { uploadToCloudinary } from "@/lib/cloudinary"
import path from "path"

// Get all documents with filtering and search
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "غير مصرح بالدخول" },
        { status: 401 }
      )
    }

    // Get user with schoolId
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { schoolId: true }
    })

    if (!user?.schoolId) {
      return NextResponse.json(
        { error: "لا يوجد مدرسة مرتبطة بالمستخدم" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const mainCategoryId = searchParams.get('mainCategoryId')
    const subCategoryId = searchParams.get('subCategoryId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {
      schoolId: user.schoolId  // ✅ فقط المستندات الخاصة بمدرسة المستخدم الحالي
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { titleAr: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { descriptionAr: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (mainCategoryId) {
      where.mainCategoryId = mainCategoryId
    }

    if (subCategoryId) {
      where.subCategoryId = subCategoryId
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          mainCategory: true,
          subCategory: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.document.count({ where })
    ])

    return NextResponse.json({
      documents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Fetch Error:', error)
    return NextResponse.json({
      documents: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0
      }
    }, { status: 500 })
  }
}


// Upload new document
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "غير مصرح بالدخول" },
        { status: 401 }
      )
    }

    // جلب المستخدم مع معلومات المدرسة
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { schoolId: true }
    })

    if (!user?.schoolId) {
      return NextResponse.json(
        { error: "لم يتم العثور على المدرسة المرتبطة بالمستخدم" },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const titleAr = formData.get('titleAr') as string
    const description = formData.get('description') as string
    const descriptionAr = formData.get('descriptionAr') as string
    const mainCategoryId = formData.get('mainCategoryId') as string
    const subCategoryId = formData.get('subCategoryId') as string

    if (!file || !title || !titleAr || !mainCategoryId) {
      return NextResponse.json(
        { error: "الملف والعنوان والتصنيف الرئيسي مطلوبة" },
        { status: 400 }
      )
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)" },
        { status: 400 }
      )
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "نوع الملف غير مدعوم" },
        { status: 400 }
      )
    }

    const mainCategory = await prisma.mainCategory.findUnique({
      where: { id: mainCategoryId }
    })

    if (!mainCategory) {
      return NextResponse.json(
        { error: "التصنيف الرئيسي غير موجود" },
        { status: 404 }
      )
    }

    let subCategory = null
    if (subCategoryId) {
      subCategory = await prisma.subCategory.findUnique({
        where: { id: subCategoryId }
      })

      if (!subCategory) {
        return NextResponse.json(
          { error: "التصنيف الفرعي غير موجود" },
          { status: 404 }
        )
      }
    }

    const fileExtension = path.extname(file.name)
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const cloudinaryResult = await uploadToCloudinary(
      buffer,
      fileName,
      mainCategory.nameAr,
      subCategory?.nameAr
    )

    const document = await prisma.document.create({
      data: {
        title,
        titleAr,
        description: description || '',
        descriptionAr: descriptionAr || '',
        fileName,
        originalName: file.name,
        filePath: cloudinaryResult.url,
        cloudinaryUrl: cloudinaryResult.url,
        cloudinaryId: cloudinaryResult.publicId,
        fileSize: file.size,
        mimeType: file.type,
        fileExtension,
        mainCategoryId,
        subCategoryId: subCategoryId || null,
        schoolId: user.schoolId // ✅ مضاف هنا
      },
      include: {
        mainCategory: true,
        subCategory: true
      }
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error: any) {
    console.error('Upload Error:', error)
    return NextResponse.json(
      { error: "فشل في رفع الملف", details: error.message || error.toString() },
      { status: 500 }
    )
  }
}
