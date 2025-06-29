import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import authOptions from '../../auth/authOptions'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'غير مصرح لك بالوصول' 
      }, { status: 401 })
    }

    // استخدام pg مباشرة
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    })

    await client.connect()

    // التحقق من الصلاحيات
    const userResult = await client.query(
      'SELECT id, role, permissions FROM users WHERE email = $1',
      [session.user.email]
    )

    if (userResult.rows.length === 0) {
      await client.end()
      return NextResponse.json({ 
        success: false, 
        error: 'المستخدم غير موجود' 
      }, { status: 404 })
    }

    const user = userResult.rows[0]
    const permissions = typeof user.permissions === 'string' 
      ? JSON.parse(user.permissions) 
      : user.permissions

    // التحقق من صلاحية الوصول للتقارير
    const hasPermission = user.role === 'admin' || 
                         user.role === 'ADMIN' || 
                         permissions?.canViewReports ||
                         permissions?.canManageUsers

    if (!hasPermission) {
      await client.end()
      return NextResponse.json({ 
        success: false, 
        error: 'ليس لديك صلاحية لعرض التقارير' 
      }, { status: 403 })
    }

    // جلب الإحصائيات
    // إجمالي المستخدمين
    const totalUsersResult = await client.query('SELECT COUNT(*) as count FROM users')
    const totalUsers = parseInt(totalUsersResult.rows[0].count)
    
    // المستخدمين الجدد هذا الشهر
    const currentMonth = new Date()
    currentMonth.setDate(1) // بداية الشهر
    
    const usersThisMonthResult = await client.query(
      `SELECT COUNT(*) as count FROM users WHERE "createdAt" >= $1`,
      [currentMonth]
    )
    const usersThisMonth = parseInt(usersThisMonthResult.rows[0].count)

    // آخر المستخدمين المسجلين
    const recentUsersResult = await client.query(`
      SELECT name, email, "created_at", "lastLogin" 
      FROM users 
      ORDER BY "created_at" DESC 
      LIMIT 5
    `)

    await client.end()

    const stats = {
      totalDocuments: 125, // بيانات تجريبية
      totalUsers: totalUsers,
      totalDownloads: 543, // بيانات تجريبية
      totalViews: 1289, // بيانات تجريبية
      recentActivity: {
        documentsThisMonth: 45, // بيانات تجريبية
        usersThisMonth: usersThisMonth,
        downloadsThisMonth: 340 // بيانات تجريبية
      },
      topDocuments: [
        { title: 'كتاب الرياضيات - الصف الثالث', downloads: 234, views: 567 },
        { title: 'دليل المعلم - العلوم', downloads: 189, views: 423 },
        { title: 'امتحانات سابقة - اللغة العربية', downloads: 156, views: 398 },
        { title: 'خطة الدروس الأسبوعية', downloads: 134, views: 321 },
        { title: 'نماذج تقييم الطلاب', downloads: 112, views: 287 }
      ],
      userActivity: recentUsersResult.rows.map((user: any) => ({
        name: user.name || 'مستخدم',
        email: user.email,
        lastLogin: user.lastLogin ? user.lastLogin.toISOString().split('T')[0] : user.createdAt.toISOString().split('T')[0],
        documentsUploaded: Math.floor(Math.random() * 25) + 1, // بيانات تجريبية
        role: user.role || 'user'
      }))
    }

    return NextResponse.json({ success: true, stats })

  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'حدث خطأ في جلب الإحصائيات' 
    }, { status: 500 })
  }
}
