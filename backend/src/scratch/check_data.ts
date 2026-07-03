import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const doctors = await prisma.doctor.findMany({
    include: {
      user: true,
      appointments: {
        include: {
          patsient: {
            include: { user: true }
          }
        }
      }
    }
  });
  
  console.log('--- Doctors and Appointments ---');
  doctors.forEach(doc => {
    console.log(`Doctor: ID ${doc.id}, Name: ${doc.user.name}, UserId: ${doc.userId}`);
    console.log(`Appointments count: ${doc.appointments.length}`);
    doc.appointments.forEach(app => {
        console.log(`  - AppID: ${app.id}, Patient: ${app.patsient.user.name}, Date: ${app.date}, Status: ${app.status}`);
    });
  });

  const allApps = await prisma.appointment.findMany();
  console.log('\n--- All Appointments in DB ---');
  console.log('Total count:', allApps.length);
  allApps.forEach(a => {
      console.log(`ID: ${a.id}, DrId: ${a.doctorId}, PtId: ${a.patsientId}, Date: ${a.date}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
