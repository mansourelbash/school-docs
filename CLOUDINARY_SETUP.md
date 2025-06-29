# نظام إدارة الملفات المدرسية - مع دعم Cloudinary

نظام شامل لإدارة الملفات المدرسية مع رفع الملفات إلى السحابة باستخدام Cloudinary.

## ميزات النظام

### 📁 إدارة الملفات
- رفع الملفات مباشرة إلى Cloudinary (تخزين سحابي مجاني)
- معاينة الصور والملفات مباشرة من السحابة
- تحميل الملفات من Cloudinary
- حذف الملفات من السحابة تلقائياً
- دعم أنواع ملفات متعددة (PDF, Word, Excel, صور)

### 🏷️ نظام التصنيفات
- تصنيفات رئيسية وفرعية
- فلترة الملفات حسب التصنيف
- إدارة كاملة للتصنيفات

### 🔍 البحث والفلترة
- بحث شامل في العناوين والأوصاف
- فلترة حسب التصنيفات
- عرض النتائج بأشكال متعددة

### 👤 نظام المشرف
- تسجيل دخول آمن للمشرف
- لوحة تحكم شاملة
- إدارة الملفات والتصنيفات

### 🌐 واجهة عامة
- عرض الملفات للزوار
- تحميل مباشر للملفات
- تصميم متجاوب وحديث

## إعداد Cloudinary

### 1. إنشاء حساب Cloudinary
1. اذهب إلى [cloudinary.com](https://cloudinary.com)
2. أنشئ حساباً مجانياً
3. احصل على بيانات الاعتماد من Dashboard

### 2. إعداد متغيرات البيئة
انسخ ملف `.env.example` إلى `.env` وأضف بيانات Cloudinary:

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"  
CLOUDINARY_API_SECRET="your-api-secret"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
```

### 3. ميزات Cloudinary
- **مساحة مجانية**: 25 جيجابايت تخزين و 25 جيجابايت نقل شهرياً
- **أداء عالي**: CDN عالمي لتحميل سريع
- **تحسين تلقائي**: ضغط وتحسين الصور تلقائياً
- **أمان**: حماية الملفات وروابط آمنة

## التثبيت والتشغيل

### 1. تثبيت التبعيات
```bash
npm install
```

### 2. إعداد قاعدة البيانات
```bash
npm run db:migrate
npm run setup-db
```

### 3. تشغيل المشروع
```bash
npm run dev
```

## ترحيل الملفات الموجودة (اختياري)

إذا كان لديك ملفات محلية تريد ترحيلها إلى Cloudinary:

```bash
node scripts/migrate-to-cloudinary.js
```

هذا السكريبت سوف:
- يرفع جميع الملفات المحلية إلى Cloudinary
- يحدث قاعدة البيانات بروابط Cloudinary
- يحافظ على الملفات المحلية (يمكن حذفها يدوياً لاحقاً)

## البيانات الافتراضية

بيانات تسجيل دخول المشرف الافتراضية:
- البريد الإلكتروني: admin@schooldocs.com
- كلمة المرور: admin123

**⚠️ تأكد من تغيير كلمة المرور قبل النشر في بيئة الإنتاج**

## هيكل المشروع

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # صفحات المشرف
│   ├── api/               # API endpoints
│   └── page.tsx           # الواجهة العامة
├── components/            # مكونات React
│   ├── ui/               # مكونات الواجهة
│   └── FilePreview.tsx   # معاينة الملفات من Cloudinary
├── lib/                   # مكتبات مساعدة
│   ├── prisma.ts         # إعداد Prisma
│   └── cloudinary.ts     # إعداد Cloudinary
prisma/
├── schema.prisma         # نموذج قاعدة البيانات
└── migrations/           # ملفات الترحيل
scripts/
├── setup-db.js          # إعداد البيانات الافتراضية
└── migrate-to-cloudinary.js  # ترحيل الملفات للسحابة
```

## API Endpoints

### الملفات
- `GET /api/documents` - جلب جميع الملفات
- `POST /api/documents` - رفع ملف جديد إلى Cloudinary
- `GET /api/documents/[id]` - جلب ملف محدد
- `PUT /api/documents/[id]` - تعديل ملف
- `DELETE /api/documents/[id]` - حذف ملف (من Cloudinary وقاعدة البيانات)
- `GET /api/documents/[id]/download` - تحميل ملف من Cloudinary

### التصنيفات
- `GET /api/categories` - جلب التصنيفات
- `POST /api/categories` - إضافة تصنيف
- `PUT /api/categories/[id]` - تعديل تصنيف
- `DELETE /api/categories/[id]` - حذف تصنيف

## الأمان

- جميع الملفات الحساسة محمية في `.gitignore`
- بيانات Cloudinary مشفرة ومحمية
- تشفير كلمات المرور باستخدام bcrypt
- جلسات آمنة مع NextAuth

## المتطلبات

- Node.js 18+
- PostgreSQL
- حساب Cloudinary مجاني

## الدعم الفني

للحصول على المساعدة:
1. راجع الوثائق
2. تحقق من ملفات السجل
3. تأكد من صحة إعدادات Cloudinary
