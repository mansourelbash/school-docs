import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import prisma from "@/lib/prisma"

// Get all main categories
export async function GET() {
  try {
    const categories = await prisma.mainCategory.findMany({
      include: {
        subCategories: {
          include: {
            _count: {
              select: {
                documents: true
              }
            }
          }
        },
        _count: {
          select: {
            documents: true,
            subCategories: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    // إرجاع مصفوفة فارغة بدلاً من object خطأ لتجنب مشاكل في .map()
    return NextResponse.json([], { status: 500 })
  }
}

// Create new main category
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
    const { name, nameAr, description } = body

    if (!name || !nameAr) {
      return NextResponse.json(
        { error: "الاسم بالإنجليزية والعربية مطلوبان" },
        { status: 400 }
      )
    }

    const category = await prisma.mainCategory.create({
      data: {
        name,
        nameAr,
        description
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: "فشل في إنشاء التصنيف" },
      { status: 500 }
    )
  }
}
