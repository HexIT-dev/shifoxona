import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const doctors = await prisma.doctor.findMany({
    include: {
      user: true
    }
  });
  console.log('Doctors count:', doctors.length);
  console.log('Doctors:', JSON.stringify(doctors, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
