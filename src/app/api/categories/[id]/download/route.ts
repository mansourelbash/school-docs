import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import archiver from 'archiver'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }

      categoryName = subCategory.nameAr
      documents = subCategory.documents
    } else {
      categoryName = category.nameAr
      // Collect all documents from main category and subcategories
      documents = [
        ...category.documents,
        ...category.subCategories.flatMap(sub => sub.documents)
      ]
    }

    if (documents.length === 0) {
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
      throw err
    })

    // Handle warnings
    archive.on('warning', (err) => {
      if (err.code !== 'ENOENT') {
        throw err
      }
    })

    // Handle archive finalization
    const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
      archive.on('end', () => {
        const buffer = Buffer.concat(chunks)
        resolve(buffer)
      })

      archive.on('error', (err) => {
        reject(err)
      })

      // Add files to archive
      const addFilesToArchive = async () => {
        let addedFiles = 0
        
        for (const document of documents) {
          try {
            if (document.cloudinaryUrl) {
              
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
                  
                  archive.append(Buffer.from(fileBuffer), { name: fileName })
                  addedFiles++
                } else {
                  // Failed to download file
                }
              } catch (fetchError: any) {
                clearTimeout(timeoutId)
                // Handle timeout or other errors
              }
            } else if (document.filePath) {
              // Try to use filePath as fallback
            } else {
              // No URL or path available for file
            }
          } catch (error) {
            // Error processing file
          }
        }
        
        
        if (addedFiles === 0) {
          // Add a text file explaining the issue
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
    return NextResponse.json(
      { error: 'Failed to create archive' },
      { status: 500 }
    )
  }
}
