import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    try {
      const userResult = await client.query(
        'SELECT id, name, email, image, role, department, permissions, "createdAt", "updatedAt" FROM users WHERE email = $1',
        [session.user.email]
      )

      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
      }

      const user = userResult.rows[0]
      const permissions = typeof user.permissions === 'string' 
        ? JSON.parse(user.permissions) 
        : user.permissions

      return NextResponse.json({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        department: user.department,
        permissions: permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })

    } finally {
      await client.end()
    }

  } catch (error) {
    console.error('خطأ في جلب بيانات المستخدم:', error)
    return NextResponse.json({ error: 'خطأ في الخادم الداخلي' }, { status: 500 })
  }
}
