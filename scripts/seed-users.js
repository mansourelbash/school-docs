const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedUsers() {
  const users = [
    { name: "مدير النظام", email: "admin@school.com", password: "admin123", role: "ADMIN", department: null },
    { name: "مشرف عام", email: "moderator@school.com", password: "mod123", role: "MODERATOR", department: null },
    { name: "أستاذ رياضيات", email: "math_teacher@school.com", password: "teach123", role: "TEACHER", department: "الرياضيات" },
    { name: "أستاذ علوم", email: "science_teacher@school.com", password: "teach123", role: "TEACHER", department: "العلوم" },
    { name: "محرر محتوى", email: "editor@school.com", password: "edit123", role: "EDITOR", department: null },
    { name: "طالب 1", email: "student1@school.com", password: "student123", role: "USER", department: "الطلاب" },
    { name: "طالب 2", email: "student2@school.com", password: "student123", role: "USER", department: "الطلاب" },
    { name: "مستخدم عادي 1", email: "user1@school.com", password: "user123", role: "USER", department: null },
    { name: "مستخدم عادي 2", email: "user2@school.com", password: "user123", role: "USER", department: null },
    { name: "مستخدم عادي 3", email: "user3@school.com", password: "user123", role: "USER", department: null }
  ];

  function getDefaultPermissions(role) {
    switch(role) {
      case "ADMIN":
        return {
          canUploadDocuments: true,
          canEditOwnDocuments: true,
          canDeleteOwnDocuments: true,
          canViewAllDocuments: true,
          canManageCategories: true,
          canManageUsers: true
        };
      case "MODERATOR":
        return {
          canUploadDocuments: true,
          canEditOwnDocuments: true,
          canDeleteOwnDocuments: true,
          canViewAllDocuments: true,
          canManageCategories: true,
          canManageUsers: false
        };
      case "TEACHER":
        return {
          canUploadDocuments: true,
          canEditOwnDocuments: true,
          canDeleteOwnDocuments: false,
          canViewAllDocuments: true,
          canManageCategories: false,
          canManageUsers: false
        };
      case "EDITOR":
        return {
          canUploadDocuments: true,
          canEditOwnDocuments: true,
          canDeleteOwnDocuments: false,
          canViewAllDocuments: false,
          canManageCategories: true,
          canManageUsers: false
        };
      case "USER":
        return {
          canUploadDocuments: false,
          canEditOwnDocuments: false,
          canDeleteOwnDocuments: false,
          canViewAllDocuments: false,
          canManageCategories: false,
          canManageUsers: false
        };
      default:
        return {};
    }
  }

  try {
    for (const user of users) {
      const existing = await prisma.user.findUnique({ where: { email: user.email } });
      if (existing) {
        console.log(`⚠️ المستخدم موجود مسبقاً: ${user.email}, سيتم تخطي الإنشاء`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(user.password, 10);

      await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          password: hashedPassword,
          role: user.role,
          department: user.department,
          permissions: getDefaultPermissions(user.role)
        }
      });

      console.log(`✅ تم إنشاء المستخدم: ${user.name} (${user.email})`);
    }
  } catch (error) {
    console.error("❌ خطأ أثناء إضافة المستخدمين:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();
