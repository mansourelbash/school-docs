import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { v2 as cloudinary } from 'cloudinary'

// تكوين Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'غير مسموح - يجب تسجيل الدخول' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'لم يتم اختيار ملف' },
        { status: 400 }
      )
    }

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'يجب أن يكون الملف صورة' },
        { status: 400 }
      )
    }

    // التحقق من حجم الملف (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت' },
        { status: 400 }
      )
    }

    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    try {
      // جلب الصورة القديمة لحذفها من Cloudinary
      const userResult = await client.query(
        'SELECT image FROM users WHERE email = $1',
        [session.user.email]
      )

      const oldImageUrl = userResult.rows[0]?.image

      // تحويل الملف إلى buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // رفع الصورة إلى Cloudinary
      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'avatars',
            transformation: [
              { width: 300, height: 300, crop: 'fill', gravity: 'face' },
              { quality: 'auto', fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        ).end(buffer)
      })

      // تحديث URL الصورة في قاعدة البيانات
      await client.query(
        'UPDATE users SET image = $1 WHERE email = $2',
        [uploadResult.secure_url, session.user.email]
      )

      // حذف الصورة القديمة من Cloudinary
      if (oldImageUrl && oldImageUrl.includes('cloudinary.com')) {
        try {
          const publicId = oldImageUrl.split('/').pop()?.split('.')[0]
          if (publicId) {
            await cloudinary.uploader.destroy(`avatars/${publicId}`)
          }
        } catch (deleteError) {
          console.warn('خطأ في حذف الصورة القديمة:', deleteError)
        }
      }

      return NextResponse.json({
        success: true,
        imageUrl: uploadResult.secure_url,
        message: 'تم تحديث الصورة الشخصية بنجاح'
      })

    } finally {
      await client.end()
    }

  } catch (error) {
    console.error('خطأ في رفع الصورة الشخصية:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}
