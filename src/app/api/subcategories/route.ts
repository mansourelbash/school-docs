import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import authOptions from '../auth/authOptions'
import prisma from "@/lib/prisma"

// Get sub categories by main category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mainCategoryId = searchParams.get('mainCategoryId')

    if (!mainCategoryId) {
      return NextResponse.json(
        { error: "معرف التصنيف الرئيسي مطلوب" },
        { status: 400 }
      )
    }

    const subCategories = await prisma.subCategory.findMany({
      where: { mainCategoryId },
      include: {
        _count: {
          select: {
            documents: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(subCategories)
  } catch (error) {
    console.error('Error fetching sub categories:', error)
    return NextResponse.json(
      { error: "فشل في جلب التصنيفات الفرعية" },
      { status: 500 }
    )
  }
}

// Create new sub category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "غير مصرح بالدخول" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, nameAr, description, mainCategoryId } = body

    if (!name || !nameAr || !mainCategoryId) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      )
    }

    const subCategory = await prisma.subCategory.create({
      data: {
        name,
        nameAr,
        description,
        mainCategoryId
      }
    })

    return NextResponse.json(subCategory, { status: 201 })
  } catch (error) {
    console.error('Error creating sub category:', error)
    return NextResponse.json(
      { error: "فشل في إنشاء التصنيف الفرعي" },
      { status: 500 }
    )
  }
}
