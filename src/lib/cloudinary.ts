import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Helper function to upload file to Cloudinary
export async function uploadToCloudinary(
  file: Buffer,
  fileName: string,
  folder: string = 'school-docs'
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: folder,
        public_id: fileName.split('.')[0], // Remove extension
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
