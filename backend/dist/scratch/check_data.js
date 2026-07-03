"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const doctors = yield prisma.doctor.findMany({
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
        const allApps = yield prisma.appointment.findMany();
        console.log('\n--- All Appointments in DB ---');
        console.log('Total count:', allApps.length);
        allApps.forEach(a => {
            console.log(`ID: ${a.id}, DrId: ${a.doctorId}, PtId: ${a.patsientId}, Date: ${a.date}`);
        });
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
