import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 })
    }

    // استخدام pg مباشرة
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    })

    await client.connect()

    const result = await client.query(
      'SELECT id, name, email, password, role FROM users WHERE email = $1',
      [email]
    )

    await client.end()

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    const user = result.rows[0]

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    // إرجاع بيانات المستخدم (بدون كلمة المرور)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
