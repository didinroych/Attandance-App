import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Seed School Levels
  const schoolLevels = [
    { id: 1, name: 'SD', description: 'Sekolah Dasar (Elementary School) - Grade 1-6' },
    { id: 2, name: 'SMP', description: 'Sekolah Menengah Pertama (Junior High School) - Grade 7-9' },
    { id: 3, name: 'SMA', description: 'Sekolah Menengah Atas (Senior High School) - Grade 10-12' },
  ];

  for (const level of schoolLevels) {
    const existingLevel = await prisma.schoolLevel.findUnique({
      where: { id: level.id },
    });

    if (!existingLevel) {
      await prisma.schoolLevel.create({
        data: level,
      });
      console.log(`Created school level: ${level.name}`);
    } else {
      console.log(`School level ${level.name} already exists`);
    }
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
