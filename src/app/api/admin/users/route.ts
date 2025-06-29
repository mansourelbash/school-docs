import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import authOptions from '@/app/api/auth/authOptions'
import bcrypt from "bcryptjs"
import { Client } from "pg"

// دالة مساعدة للتحقق من أن المستخدم مدير نظام
async function isUserAdmin(userEmail: string): Promise<boolean> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })

  try {
    await client.connect()
    const result = await client.query(
      'SELECT role FROM users WHERE email = $1',
      [userEmail]
    )
    
    if (result.rows.length > 0) {
      const user = result.rows[0]
      return user.role === 'ADMIN'
    }
    
    return false
  } catch (error) {
    console.error('❌ خطأ في التحقق من صلاحيات المستخدم:', error)
    return false
  } finally {
    await client.end()
  }
}

// GET - جلب جميع المستخدمين
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 })
    }

    // التحقق من أن المستخدم مدير نظام
    const isAdmin = await isUserAdmin(session.user.email!)
    
    if (!isAdmin) {
      console.log('❌ المستخدم ليس مدير نظام - مرفوض')
      return NextResponse.json({ 
        error: 'غير مصرح - إدارة المستخدمين محصورة بمديري النظام فقط' 
      }, { status: 403 })
    }

    // استخدام pg مباشرة
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })

    await client.connect()
    
    const result = await client.query(`
      SELECT id, name, email, role, department, permissions, image, "created_at", "updated_at"
      FROM users 
      ORDER BY "created_at" DESC
    `)

    await client.end()

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST - إنشاء مستخدم جديد
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 بدء إنشاء مستخدم جديد...')
    
    const session = await getServerSession(authOptions)
    console.log('🔐 Session:', session ? 'موجود' : 'غير موجود')
    
    if (!session?.user) {
      console.log('❌ غير مصرح: لا يوجد session')
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 })
    }

    // التحقق من أن المستخدم مدير نظام
    const isAdmin = await isUserAdmin(session.user.email!)
    
    if (!isAdmin) {
      console.log('❌ المستخدم ليس مدير نظام - مرفوض')
      return NextResponse.json({ 
        error: 'غير مصرح - إدارة المستخدمين محصورة بمديري النظام فقط' 
      }, { status: 403 })
    }

    const requestData = await request.json()
    console.log('📝 البيانات المستلمة:', requestData)
    
    const { name, email, password, role, department, permissions } = requestData

    // التحقق من البيانات المطلوبة
    if (!name || !email || !password) {
      console.log('❌ بيانات مفقودة:', { name: !!name, email: !!email, password: !!password })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // استخدام pg مباشرة
    console.log('🗄️ محاولة الاتصال بقاعدة البيانات...')
    const { Client } = require('pg')
    
    if (!process.env.DATABASE_URL) {
      console.log('❌ DATABASE_URL غير موجود في متغيرات البيئة')
      return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 })
    }
    
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    })

    try {
      await client.connect()
      console.log('✅ تم الاتصال بقاعدة البيانات بنجاح')

      // التحقق من عدم وجود المستخدم مسبقاً
      console.log('🔍 التحقق من وجود المستخدم:', email)
      const existingUserResult = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      )

      if (existingUserResult.rows.length > 0) {
        console.log('❌ المستخدم موجود مسبقاً')
        await client.end()
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
      }

      // تشفير كلمة المرور
      console.log('🔒 تشفير كلمة المرور...')
      const hashedPassword = await bcrypt.hash(password, 10)

      // إعداد الصلاحيات الافتراضية
      const defaultPermissions = permissions || {
        canUpload: false,
        canEdit: false,
        canDelete: false
      }
      console.log('🔐 الصلاحيات:', defaultPermissions)

      // إنشاء ID جديد
      const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2)}`
      console.log('🆔 ID المستخدم الجديد:', userId)

      // إنشاء المستخدم الجديد
      console.log('💾 إدراج المستخدم في قاعدة البيانات...')
      const result = await client.query(`
        INSERT INTO users (id, name, email, password, role, department, permissions, "created_at", "updated_at")
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id, name, email, role, department, permissions, "created_at" as "createdAt"
      `, [
        userId,
        name,
        email,
        hashedPassword,
        role || 'USER',
        department || null,
        JSON.stringify(defaultPermissions)
      ])

      console.log('✅ تم إنشاء المستخدم بنجاح:', result.rows[0]?.id)

      const newUser = result.rows[0]
      
      // تحويل permissions من string إلى object
      if (newUser.permissions && typeof newUser.permissions === 'string') {
        newUser.permissions = JSON.parse(newUser.permissions)
      }

      return NextResponse.json(newUser, { status: 201 })
      
    } catch (dbError) {
      console.error('❌ خطأ في قاعدة البيانات:', dbError)
      throw dbError
    } finally {
      await client.end()
      console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات')
    }
  } catch (error: any) {
    console.error('❌ خطأ عام في إنشاء المستخدم:', error)
    console.error('تفاصيل الخطأ:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    })
    
    const errorMessage = error?.message || error?.toString() || 'خطأ غير معروف'
    return NextResponse.json(
      { error: `حدث خطأ في إنشاء المستخدم: ${errorMessage}` },
      { status: 500 }
    )
  }
}
