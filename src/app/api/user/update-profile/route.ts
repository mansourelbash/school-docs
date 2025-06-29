import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'غير مسموح - يجب تسجيل الدخول' },
        { status: 401 }
      )
    }

    const { name, email } = await request.json()

    // التحقق من صحة البيانات
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    // التحقق من تنسيق البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'تنسيق البريد الإلكتروني غير صحيح' },
        { status: 400 }
      )
    }

    // استخدام pg مباشرة
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    try {
      // التحقق من عدم وجود بريد إلكتروني مكرر (إذا كان مختلف عن الحالي)
      if (email !== session.user.email) {
        const existingUser = await client.query(
          'SELECT id FROM users WHERE email = $1 AND email != $2',
          [email, session.user.email]
        )
        
        if (existingUser.rows.length > 0) {
          return NextResponse.json(
            { success: false, error: 'البريد الإلكتروني مستخدم من قبل مستخدم آخر' },
            { status: 400 }
          )
        }
      }

      // تحديث البيانات
      await client.query(
        'UPDATE users SET name = $1, email = $2 WHERE email = $3',
        [name, email, session.user.email]
      )

      return NextResponse.json({
        success: true,
        message: 'تم تحديث الملف الشخصي بنجاح'
      })

    } finally {
      await client.end()
    }

  } catch (error) {
    console.error('خطأ في تحديث الملف الشخصي:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}
