/**
 * Migration script to upload existing local files to Cloudinary
 * This script is optional and can be used to migrate existing files
 * Run with: node scripts/migrate-to-cloudinary.js
 */

const { PrismaClient } = require('@prisma/client')
const { v2: cloudinary } = require('cloudinary')
const fs = require('fs').promises
const path = require('path')

// Load environment variables
require('dotenv').config()

const prisma = new PrismaClient()

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

async function uploadToCloudinary(filePath, fileName) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, {
      resource_type: 'auto',
      folder: 'school-docs',
      public_id: fileName.split('.')[0],
      use_filename: true,
      unique_filename: true,
    }, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        })
      }
    })
  })
}

async function migrateFilesToCloudinary() {
  try {
    console.log('🚀 بدء ترحيل الملفات إلى Cloudinary...')

    // Get all documents that don't have cloudinary URLs
    const documents = await prisma.document.findMany({
      where: {
        cloudinaryUrl: null
      }
    })

    console.log(`📁 تم العثور على ${documents.length} ملف للترحيل`)

    if (documents.length === 0) {
      console.log('✅ لا توجد ملفات للترحيل')
      return
    }

    let successCount = 0
    let errorCount = 0

    for (const doc of documents) {
      try {
        console.log(`📤 ترحيل الملف: ${doc.originalName}`)

        // Check if local file exists
        const localPath = path.join(process.cwd(), 'public', 'uploads', doc.fileName)
        
        try {
          await fs.access(localPath)
        } catch {
          console.log(`⚠️  الملف المحلي غير موجود: ${doc.fileName}`)
          errorCount++
          continue
        }

        // Upload to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(localPath, doc.fileName)

        // Update database
        await prisma.document.update({
          where: { id: doc.id },
          data: {
            filePath: cloudinaryResult.url, // Update main path to Cloudinary
            cloudinaryUrl: cloudinaryResult.url,
            cloudinaryId: cloudinaryResult.publicId,
          }
        })

        console.log(`✅ تم ترحيل: ${doc.originalName}`)
        successCount++

        // Optional: Delete local file after successful upload
        // await fs.unlink(localPath)
        // console.log(`🗑️  تم حذف الملف المحلي: ${doc.fileName}`)

      } catch (error) {
        console.error(`❌ فشل في ترحيل ${doc.originalName}:`, error.message)
        errorCount++
      }
    }

    console.log(`\n📊 نتائج الترحيل:`)
    console.log(`✅ نجح: ${successCount} ملف`)
    console.log(`❌ فشل: ${errorCount} ملف`)
    console.log(`📦 المجموع: ${documents.length} ملف`)

  } catch (error) {
    console.error('❌ خطأ في عملية الترحيل:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Check if Cloudinary is configured
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ خطأ: متغيرات Cloudinary غير مكونة في ملف .env')
  console.log('يرجى إضافة المتغيرات التالية إلى ملف .env:')
  console.log('CLOUDINARY_CLOUD_NAME="your-cloud-name"')
  console.log('CLOUDINARY_API_KEY="your-api-key"')
  console.log('CLOUDINARY_API_SECRET="your-api-secret"')
  process.exit(1)
}

// Run migration
migrateFilesToCloudinary()
  .then(() => {
    console.log('🎉 انتهت عملية الترحيل')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 فشلت عملية الترحيل:', error)
    process.exit(1)
  })
