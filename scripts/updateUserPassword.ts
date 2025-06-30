import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin2@school.com';  // البريد الذي تريد تغيير كلمة مروره
  const newPassword = '123123123';  // كلمة المرور الجديدة

  // تشفير كلمة المرور
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // تحديث المستخدم
  const updatedUser = await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  });

  console.log(`Password updated successfully for ${email}`);
}

main()
  .catch((e) => {
    console.error('Error updating password:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
