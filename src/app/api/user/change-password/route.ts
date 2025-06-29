import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import authOptions from '../../auth/authOptions'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'غير مسموح - يجب تسجيل الدخول' },
        { status: 401 }
      )
    }

    const { currentPassword, newPassword } = await request.json()

    // التحقق من صحة البيانات
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' },
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
      // جلب كلمة المرور الحالية
      const userResult = await client.query(
        'SELECT password FROM users WHERE email = $1',
        [session.user.email]
      )

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'المستخدم غير موجود' },
          { status: 404 }
        )
      }

      const user = userResult.rows[0]
      
      // التحقق من كلمة المرور الحالية
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
      
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { success: false, error: 'كلمة المرور الحالية غير صحيحة' },
          { status: 400 }
        )
      }

      // تشفير كلمة المرور الجديدة
      const hashedNewPassword = await bcrypt.hash(newPassword, 12)

      // تحديث كلمة المرور
      await client.query(
        'UPDATE users SET password = $1 WHERE email = $2',
        [hashedNewPassword, session.user.email]
      )

      return NextResponse.json({
        success: true,
        message: 'تم تغيير كلمة المرور بنجاح'
      })

    } finally {
      await client.end()
    }

  } catch (error) {
    console.error('خطأ في تغيير كلمة المرور:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}
