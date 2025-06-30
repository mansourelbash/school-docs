import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const mainCategory = await prisma.mainCategory.create({
    data: {
      name: 'General Documents',
      nameAr: 'وثائق عامة',
      description: 'Shared general documents',
    },
  });

  const subCategory = await prisma.subCategory.create({
    data: {
      name: 'Regulations',
      nameAr: 'لوائح',
      description: 'School regulations',
      mainCategoryId: mainCategory.id,
    },
  });

  for (let i = 1; i <= 5; i++) {
    const school = await prisma.school.create({
      data: {
        name: `School ${i}`,
        address: `Address for School ${i}`,
      },
    });

    // مدير النظام
    const admin = await prisma.user.create({
      data: {
        email: `admin${i}@school.com`,
        password: `hashed_admin_password_${i}`,
        name: `Admin ${i}`,
        role: 'ADMIN',
        schoolId: school.id,
        permissions: {
          viewDocuments: true,
          uploadDocuments: true,
          deleteDocuments: true,
          manageUsers: true,
        },
      },
    });

    await prisma.userRole.create({
      data: {
        user_id: admin.id,
        role: 'ADMIN',
        permissions: {
          view: true,
          edit: true,
          delete: true,
          manage: true,
        },
        assigned_by: null,
      },
    });

    // معلم
    const teacher = await prisma.user.create({
      data: {
        email: `teacher${i}@school.com`,
        password: `hashed_teacher_password_${i}`,
        name: `Teacher ${i}`,
        role: 'TEACHER',
        schoolId: school.id,
        permissions: {
          viewDocuments: true,
          uploadDocuments: true,
          deleteDocuments: false,
        },
      },
    });

    await prisma.userRole.create({
      data: {
        user_id: teacher.id,
        role: 'TEACHER',
        permissions: {
          view: true,
          edit: true,
          delete: false,
        },
        assigned_by: admin.id,
      },
    });

    // طالب
    const student = await prisma.user.create({
      data: {
        email: `student${i}@school.com`,
        password: `hashed_student_password_${i}`,
        name: `Student ${i}`,
        role: 'STUDENT',
        schoolId: school.id,
        permissions: {
          viewDocuments: true,
          uploadDocuments: false,
          deleteDocuments: false,
        },
      },
    });

    await prisma.userRole.create({
      data: {
        user_id: student.id,
        role: 'STUDENT',
        permissions: {
          view: true,
          edit: false,
          delete: false,
        },
        assigned_by: admin.id,
      },
    });

    // مستندات لكل مدرسة
    for (let d = 1; d <= 2; d++) {
      await prisma.document.create({
        data: {
          title: `Document ${d} - School ${i}`,
          titleAr: `مستند ${d} - مدرسة ${i}`,
          description: `Document ${d} for School ${i}`,
          descriptionAr: `تفاصيل المستند ${d} للمدرسة ${i}`,
          fileName: `file_${i}_${d}.pdf`,
          originalName: `original_file_${i}_${d}.pdf`,
          filePath: `/uploads/school_${i}/file_${d}.pdf`,
          fileSize: 1024 * d,
          mimeType: 'application/pdf',
          fileExtension: '.pdf',
          mainCategoryId: mainCategory.id,
          subCategoryId: subCategory.id,
          schoolId: school.id,
          isPublic: false,
        },
      });
    }
  }
}

main()
  .then(() => {
    console.log('✅ Seed data inserted for 5 schools with roles and permissions.');
  })
  .catch((e) => {
    console.error('❌ Error while seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
