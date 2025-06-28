const bcrypt = require('bcryptjs')
const { PrismaClient } = require('../src/generated/prisma')

const prismaClient = new PrismaClient()

async function setupDatabase() {
  console.log('🔄 Setting up database...')

  try {
    // Create default admin user
    const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@school.com'
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123'

    // Check if admin already exists
    const existingAdmin = await prismaClient.admin.findUnique({
      where: { email: defaultEmail }
    })

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(defaultPassword, 12)
      
      await prismaClient.admin.create({
        data: {
          email: defaultEmail,
          password: hashedPassword,
          name: 'مدير النظام'
        }
      })

      console.log('✅ Default admin user created:')
      console.log(`   Email: ${defaultEmail}`)
      console.log(`   Password: ${defaultPassword}`)
    } else {
      console.log('ℹ️ Default admin user already exists')
    }

    // Create default categories
    const defaultCategories = [
      {
        name: 'Academic',
        nameAr: 'أكاديمي',
        description: 'Academic documents and materials',
        subCategories: [
          { name: 'Grade 9 Results', nameAr: 'نتائج الصف التاسع' },
          { name: 'Grade 12 Results', nameAr: 'نتائج الصف الثاني عشر' },
          { name: 'Curriculum', nameAr: 'المناهج الدراسية' },
          { name: 'Exams', nameAr: 'الامتحانات' }
        ]
      },
      {
        name: 'Administrative',
        nameAr: 'إداري',
        description: 'Administrative documents and forms',
        subCategories: [
          { name: 'Student Registration', nameAr: 'تسجيل الطلاب' },
          { name: 'Staff Documents', nameAr: 'وثائق الموظفين' },
          { name: 'Reports', nameAr: 'التقارير' },
          { name: 'Policies', nameAr: 'السياسات' }
        ]
      },
      {
        name: 'Events',
        nameAr: 'فعاليات',
        description: 'School events and activities',
        subCategories: [
          { name: 'Sports Day', nameAr: 'اليوم الرياضي' },
          { name: 'Science Fair', nameAr: 'معرض العلوم' },
          { name: 'Graduation', nameAr: 'التخرج' },
          { name: 'Meetings', nameAr: 'الاجتماعات' }
        ]
      }
    ]

    for (const categoryData of defaultCategories) {
      const existingCategory = await prismaClient.mainCategory.findUnique({
        where: { nameAr: categoryData.nameAr }
      })

      if (!existingCategory) {
        const category = await prismaClient.mainCategory.create({
          data: {
            name: categoryData.name,
            nameAr: categoryData.nameAr,
            description: categoryData.description
          }
        })

        // Create subcategories
        for (const subCatData of categoryData.subCategories) {
          await prismaClient.subCategory.create({
            data: {
              name: subCatData.name,
              nameAr: subCatData.nameAr,
              mainCategoryId: category.id
            }
          })
        }

        console.log(`✅ Created category: ${categoryData.nameAr}`)
      } else {
        console.log(`ℹ️ Category already exists: ${categoryData.nameAr}`)
      }
    }

    console.log('✅ Database setup completed successfully!')
  } catch (error) {
    console.error('❌ Error setting up database:', error)
    throw error
  } finally {
    await prismaClient.$disconnect()
  }
}

setupDatabase()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
