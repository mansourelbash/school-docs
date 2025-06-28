import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import prisma from "@/lib/prisma"
import { uploadToCloudinary } from "@/lib/cloudinary"
import path from "path"

// Get all documents with filtering and search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const mainCategoryId = searchParams.get('mainCategoryId')
    const subCategoryId = searchParams.get('subCategoryId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {}

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
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: "فشل في جلب الملفات" },
      { status: 500 }
    )
  }
}

// Upload new document
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "غير مصرح بالدخول" },
        { status: 401 }
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

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)" },
        { status: 400 }
      )
    }

    // Check file type
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

    // Generate unique filename
    const fileExtension = path.extname(file.name)
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`

    // Upload file to Cloudinary
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const cloudinaryResult = await uploadToCloudinary(
      buffer,
      fileName,
      'school-docs'
    )

    // Save document to database with Cloudinary info
    const document = await prisma.document.create({
      data: {
        title,
        titleAr,
        description: description || '',
        descriptionAr: descriptionAr || '',
        fileName,
        originalName: file.name,
        filePath: cloudinaryResult.url, // Store Cloudinary URL as main path
        cloudinaryUrl: cloudinaryResult.url,
        cloudinaryId: cloudinaryResult.publicId,
        fileSize: file.size,
        mimeType: file.type,
        fileExtension,
        mainCategoryId,
        subCategoryId: subCategoryId || null
      },
      include: {
        mainCategory: true,
        subCategory: true
      }
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { error: "فشل في رفع الملف" },
      { status: 500 }
    )
  }
}
