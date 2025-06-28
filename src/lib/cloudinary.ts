import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// التحقق من أن متغيرات البيئة مضبوطة
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('⚠️ متغيرات البيئة Cloudinary غير مضبوطة بشكل صحيح')
}

export default cloudinary;

// Helper function to upload file to Cloudinary with category-based folder structure
export async function uploadToCloudinary(
  file: Buffer,
  fileName: string,
  mainCategoryNameAr: string,
  subCategoryNameAr?: string
): Promise<{ url: string; publicId: string }> {
  // Create folder path: school-docs/MainCategory/SubCategory (if exists)
  let folderPath = `school-docs/${sanitizeFolderName(mainCategoryNameAr)}`;
  
  if (subCategoryNameAr) {
    folderPath += `/${sanitizeFolderName(subCategoryNameAr)}`;
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: folderPath,
        public_id: sanitizeFileName(fileName.split('.')[0]), // Remove extension and sanitize
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        } else {
          reject(new Error('فشل في رفع الملف'));
        }
      }
    ).end(file);
  });
}

// Helper function to upload profile images to Cloudinary
export async function uploadProfileImageToCloudinary(
  file: Buffer,
  folderPath: string,
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'image'
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    // التحقق من متغيرات البيئة
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      reject(new Error('متغيرات البيئة Cloudinary غير مضبوطة'))
      return
    }

    console.log('🔄 بدء رفع الصورة إلى Cloudinary...')
    
    cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: folderPath,
        use_filename: false,
        unique_filename: true,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('❌ خطأ في رفع الصورة إلى Cloudinary:', error)
          reject(error);
        } else if (result) {
          console.log('✅ تم رفع الصورة بنجاح إلى Cloudinary:', result.secure_url)
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        } else {
          console.error('❌ لم يتم إرجاع نتيجة من Cloudinary')
          reject(new Error('فشل في رفع الصورة'));
        }
      }
    ).end(file);
  });
}

// Helper function to delete file from Cloudinary
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      console.log(`✅ تم حذف الملف من Cloudinary بنجاح: ${publicId}`);
    } else if (result.result === 'not found') {
      console.warn(`⚠️ الملف غير موجود في Cloudinary: ${publicId}`);
    } else {
      console.warn(`⚠️ نتيجة غير متوقعة من Cloudinary: ${result.result}`);
    }
  } catch (error) {
    console.error('❌ خطأ في حذف الملف من Cloudinary:', error);
    throw error;
  }
}

// Helper function to sanitize folder names for Cloudinary
function sanitizeFolderName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s-_]/g, '') // Keep Arabic, English, numbers, spaces, hyphens, underscores
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .trim()
    .substring(0, 50); // Limit length
}

// Helper function to sanitize file names for Cloudinary
function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s-_.]/g, '') // Keep Arabic, English, numbers, spaces, hyphens, underscores, dots
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .trim()
    .substring(0, 100); // Limit length
}

// Helper function to get all files in a Cloudinary folder
export async function getCloudinaryFolderFiles(folderPath: string): Promise<any[]> {
  try {
    const result = await cloudinary.search
      .expression(`folder:${folderPath}/*`)
      .max_results(500)
      .execute();
    
    return result.resources || [];
  } catch (error) {
    console.error('Error getting Cloudinary folder files:', error);
    return [];
  }
}

// Helper function to delete entire folder from Cloudinary
export async function deleteCloudinaryFolder(folderPath: string): Promise<void> {
  try {
    // First get all files in the folder
    const files = await getCloudinaryFolderFiles(folderPath);
    
    // Delete all files
    for (const file of files) {
      await deleteFromCloudinary(file.public_id);
    }
    
    // Delete the folder itself
    await cloudinary.api.delete_folder(folderPath);
    console.log(`✅ تم حذف المجلد من Cloudinary بنجاح: ${folderPath}`);
  } catch (error) {
    console.error('❌ خطأ في حذف المجلد من Cloudinary:', error);
    throw error;
  }
}

// Helper function to extract publicId from Cloudinary URL
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    // التحقق من أن الـ URL من Cloudinary
    if (!url.includes('cloudinary.com')) {
      return null
    }
    
    // استخراج الجزء بعد /upload/
    const urlParts = url.split('/upload/')
    if (urlParts.length < 2) return null
    
    // الحصول على الجزء الثاني وإزالة التحويلات
    let pathPart = urlParts[1]
    
    // إزالة معاملات التحويل (مثل v1234/)
    const versionRegex = /^v\d+\//
    if (versionRegex.test(pathPart)) {
      pathPart = pathPart.replace(versionRegex, '')
    }
    
    // إزالة امتداد الملف
    const publicId = pathPart.replace(/\.[^/.]+$/, '')
    
    return publicId
  } catch (error) {
    console.error('خطأ في استخراج publicId:', error)
    return null
  }
}
