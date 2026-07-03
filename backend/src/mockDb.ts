import bcrypt from 'bcryptjs';

export type Role = 'ADMIN' | 'DOCTOR' | 'CASHIER' | 'PATSIENT' | 'USER';

export interface User {
  id: number;
  name?: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
  role: Role;
  img?: string;
  patsientProfile?: {
    passed_examination_or_not?: boolean;
    cancellationCount?: number;
    isBlocked?: boolean;
  };
}

export interface Appointment {
  id: number;
  patsientId: number;
  doctorId: number;
  cashierId?: number;
  dateTime: Date;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  description?: string;
}

export interface Receipt {
  id: number;
  patsientId: number;
  doctorId: number;
  name: string;
  amount: string;
  days: string;
  description: string;
  date: Date;
  method?: string;
  paid?: boolean;
}

export interface Prescription {
  id: number;
  appointmentId: number;
  patsientId: number;
  doctorId: number;
  medicine: string;
  dosage: string;
  timing: string;
  notes: string;
  date: Date;
}

// Global auto-increment IDs
let nextUserId = 2;
let nextApptId = 1;
let nextReceiptId = 1;
let nextPrescriptionId = 1;

export const db = {
  users: [] as User[],
  appointments: [] as Appointment[],
  receipts: [] as Receipt[],
  prescriptions: [] as Prescription[],

  getNextUserId: () => nextUserId++,
  getNextApptId: () => nextApptId++,
  getNextReceiptId: () => nextReceiptId++,
  getNextPrescriptionId: () => nextPrescriptionId++,
};

// Initialize default admin
const initDb = async () => {
  const adminPassword = await bcrypt.hash('admin123', 10);
  db.users.push({
    id: 1,
    name: 'admin',
    email: 'admin@hospital.com',
    password: adminPassword,
    role: 'ADMIN',
  });

  const doctorPassword = await bcrypt.hash('doctor123', 10);
  db.users.push({
    id: db.getNextUserId(),
    name: 'doctor',
    email: 'doctor@hospital.com',
    password: doctorPassword,
    role: 'DOCTOR',
    phone: '111222333',
    address: 'Cardiology Dept'
  });

  const cashierPassword = await bcrypt.hash('cashier123', 10);
  db.users.push({
    id: db.getNextUserId(),
    name: 'cashier',
    email: 'cashier@hospital.com',
    password: cashierPassword,
    role: 'CASHIER',
    phone: '444555666'
  });

  const patientPassword = await bcrypt.hash('user123', 10);
  db.users.push({
    id: db.getNextUserId(),
    name: 'user',
    email: 'user@hospital.com',
    password: patientPassword,
    role: 'PATSIENT',
    phone: '777888999',
    address: 'Tashkent',
    patsientProfile: {
      passed_examination_or_not: false,
      cancellationCount: 0,
      isBlocked: false
    }
  });
};

initDb();
