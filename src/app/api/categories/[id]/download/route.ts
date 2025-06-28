import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import archiver from 'archiver'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`📁 طلب تحميل المجلد للـ ID: ${id}`)

    // First, try to find if it's a main category
    let category = await prisma.mainCategory.findUnique({
      where: { id },
      include: {
        documents: {
          select: {
            id: true,
            title: true,
            titleAr: true,
            fileName: true,
            originalName: true,
            fileExtension: true,
            cloudinaryUrl: true,
            cloudinaryId: true,
            fileSize: true,
            mimeType: true
          }
        },
        subCategories: {
          include: {
            documents: {
              select: {
                id: true,
                title: true,
                titleAr: true,
                fileName: true,
                originalName: true,
                fileExtension: true,
                cloudinaryUrl: true,
                cloudinaryId: true,
                fileSize: true,
                mimeType: true
              }
            }
          }
        }
      }
    })

    let categoryName = ''
    let documents: any[] = []

    if (!category) {
      console.log(`🔍 لم يتم العثور كتصنيف رئيسي، البحث كتصنيف فرعي...`)
      
      // If not found, try to find as subcategory
      const subCategory = await prisma.subCategory.findUnique({
        where: { id },
        include: {
          documents: {
            select: {
              id: true,
              title: true,
              titleAr: true,
              fileName: true,
              originalName: true,
              fileExtension: true,
              cloudinaryUrl: true,
              cloudinaryId: true,
              fileSize: true,
              mimeType: true
            }
          },
          mainCategory: true
        }
      })

      if (!subCategory) {
        console.log(`❌ لم يتم العثور على التصنيف بالـ ID: ${id}`)
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }

      console.log(`✅ تم العثور على تصنيف فرعي: ${subCategory.nameAr}`)
      categoryName = subCategory.nameAr
      documents = subCategory.documents
    } else {
      console.log(`✅ تم العثور على تصنيف رئيسي: ${category.nameAr}`)
      categoryName = category.nameAr
      // Collect all documents from main category and subcategories
      documents = [
        ...category.documents,
        ...category.subCategories.flatMap(sub => sub.documents)
      ]
    }

    console.log(`📊 إجمالي الملفات الموجودة: ${documents.length}`)
    
    // Log details about each document
    documents.forEach((doc, index) => {
      console.log(`📄 ملف ${index + 1}: ${doc.titleAr || doc.title}`)
      console.log(`   - cloudinaryUrl: ${doc.cloudinaryUrl ? 'موجود' : 'غير موجود'}`)
      console.log(`   - fileExtension: ${doc.fileExtension}`)
      console.log(`   - fileSize: ${doc.fileSize}`)
    })

    if (documents.length === 0) {
      console.log(`⚠️ لا توجد ملفات في التصنيف: ${categoryName}`)
      return NextResponse.json(
        { error: 'No documents found in this category' },
        { status: 404 }
      )
    }

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 }
    })

    const chunks: Buffer[] = []

    // Set up data collection
    archive.on('data', (chunk) => {
      chunks.push(chunk)
    })

    // Handle errors
    archive.on('error', (err) => {
      console.error('❌ خطأ في Archiver:', err)
      throw err
    })

    // Handle warnings
    archive.on('warning', (err) => {
      console.warn('⚠️ تحذير من Archiver:', err)
    })

    // Handle archive finalization
    const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
      archive.on('end', () => {
        const buffer = Buffer.concat(chunks)
        console.log(`📦 تم إنشاء الأرشيف بحجم: ${buffer.length} bytes`)
        resolve(buffer)
      })

      archive.on('error', (err) => {
        console.error('❌ خطأ في إنهاء الأرشيف:', err)
        reject(err)
      })

      // Add files to archive
      const addFilesToArchive = async () => {
        console.log(`📦 إنشاء أرشيف لـ ${categoryName} مع ${documents.length} ملف`)
        
        let addedFiles = 0
        
        for (const document of documents) {
          try {
            console.log(`🔄 معالجة الملف: ${document.title}`)
            
            if (document.cloudinaryUrl) {
              console.log(`📥 تحميل من Cloudinary: ${document.cloudinaryUrl}`)
              
              // Add timeout for fetch
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 seconds timeout
              
              try {
                const response = await fetch(document.cloudinaryUrl, {
                  signal: controller.signal,
                  headers: {
                    'User-Agent': 'school-docs-downloader/1.0'
                  }
                })
                
                clearTimeout(timeoutId)
              
                if (response.ok) {
                  const fileBuffer = await response.arrayBuffer()
                  
                  // استخدام fileExtension بدلاً من fileType
                  const fileExtension = document.fileExtension || 'bin'
                  const fileName = `${document.titleAr || document.title}.${fileExtension}`
                  
                  console.log(`✅ إضافة الملف للأرشيف: ${fileName} (${fileBuffer.byteLength} bytes)`)
                  
                  archive.append(Buffer.from(fileBuffer), { name: fileName })
                  addedFiles++
                } else {
                  console.error(`❌ فشل تحميل الملف ${document.title}: HTTP ${response.status} - ${response.statusText}`)
                }
              } catch (fetchError: any) {
                clearTimeout(timeoutId)
                if (fetchError.name === 'AbortError') {
                  console.error(`⏰ انتهت مهلة تحميل الملف: ${document.title}`)
                } else {
                  console.error(`❌ خطأ في تحميل الملف ${document.title}:`, fetchError.message)
                }
              }
            } else if (document.filePath) {
              // محاولة استخدام filePath كـ fallback
              console.log(`⚠️ لا يوجد cloudinaryUrl، محاولة استخدام filePath: ${document.filePath}`)
            } else {
              console.error(`❌ لا يوجد cloudinaryUrl أو filePath للملف: ${document.title}`)
            }
          } catch (error) {
            console.error(`❌ خطأ في معالجة الملف ${document.title}:`, error)
          }
        }
        
        console.log(`📊 تم إضافة ${addedFiles} من أصل ${documents.length} ملف للأرشيف`)
        
        if (addedFiles === 0) {
          console.error('⚠️ لم يتم إضافة أي ملف للأرشيف!')
          // إضافة ملف نصي يوضح المشكلة
          const errorMessage = `لم يتم العثور على ملفات صالحة للتحميل في هذا التصنيف.\n\nالملفات الموجودة:\n${documents.map(doc => `- ${doc.titleAr || doc.title} (cloudinaryUrl: ${doc.cloudinaryUrl ? 'موجود' : 'غير موجود'})`).join('\n')}`
          archive.append(Buffer.from(errorMessage, 'utf8'), { name: 'README.txt' })
        }
        
        archive.finalize()
      }

      addFilesToArchive()
    })

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(categoryName)}.zip"`,
        'Content-Length': zipBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Error creating archive:', error)
    return NextResponse.json(
      { error: 'Failed to create archive' },
      { status: 500 }
    )
  }
}
