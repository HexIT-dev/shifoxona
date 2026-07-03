import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, Role, User, Prescription } from '../mockDb';

const router = Router();

// Helper to add staff
const addStaff = async (req: Request, res: Response, role: Role) => {
  try {
    const { name, email, password, number, phone, img, address, specialty } = req.body;
    const finalPhone = phone || number;
    const finalAddress = specialty || address;
    
    if (db.users.some(u => u.email === email)) {
      res.status(400).json({ message: 'Email already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser: User = {
      id: db.getNextUserId(),
      name,
      email,
      password: hashedPassword,
      phone: finalPhone,
      img,
      address: finalAddress,
      role
    };

    db.users.push(newUser);
    res.status(201).json({ message: `${role} added successfully`, user: { id: newUser.id, name, email, role } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Add Doctor
router.post('/doctors', (req, res) => addStaff(req, res, 'DOCTOR'));

// Add Cashier
router.post('/cashiers', (req, res) => addStaff(req, res, 'CASHIER'));

// View Doctors
router.get('/doctors', (req: Request | any, res: Response) => {
  const doctors = db.users.filter(u => u.role === 'DOCTOR').map(d => ({
    id: d.id,
    specialty: d.address, // In this mockup, we use address or a separate field
    user: d
  }));
  res.json(doctors);
});

// View Cashiers
router.get('/cashiers', (req: Request | any, res: Response) => {
  const cashiers = db.users.filter(u => u.role === 'CASHIER').map(c => ({
    id: c.id,
    user: c
  }));
  res.json(cashiers);
});

// View Patients
router.get('/patsients', (req: Request | any, res: Response) => {
  const patsients = db.users.filter(u => u.role === 'PATSIENT').map(p => ({
    id: p.id,
    user: p,
    patsientProfile: p.patsientProfile
  }));
  res.json(patsients);
});

// View Receipts
router.get('/receipts', (req: Request, res: Response) => {
  res.json(db.receipts);
});

// View Appointments (for dashboard and management)
router.get('/appointments', (req: Request | any, res: Response) => {
  const appointments = db.appointments.map(a => {
    const patsient = db.users.find(u => u.id === a.patsientId);
    const doctor = db.users.find(u => u.id === a.doctorId);
    return {
      ...a,
      date: a.dateTime,
      patsient: { id: patsient?.id, user: patsient },
      doctor: { id: doctor?.id, user: doctor, specialty: doctor?.address }
    };
  });
  res.json(appointments);
});

// Update appointment status (Admin)
router.put('/appointments/:id', (req: Request | any, res: Response): void => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const appointment = db.appointments.find(a => a.id === id);
  
  if (!appointment) {
    res.status(404).json({ message: 'Appointment not found' });
    return;
  }

  if (status) appointment.status = status;
  res.json({ message: 'Appointment updated', appointment });
});

// Dashboard Stats
router.get('/payments/stats', (req: Request | any, res: Response) => {
  const receipts = db.receipts.filter(r => r.paid);
  
  const byMethod: { [key: string]: number } = {
    "Cash": 0,
    "Card": 0
  };

  receipts.forEach(r => {
    const method = r.method || "Cash";
    if (!byMethod[method]) byMethod[method] = 0;
    byMethod[method] += parseFloat(r.amount);
  });

  // Last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    const dayTotal = receipts
      .filter(r => new Date(r.date).toISOString().split('T')[0] === dateStr)
      .reduce((acc, r) => acc + parseFloat(r.amount), 0);

    return {
      date: dateStr,
      total: dayTotal
    };
  }).reverse();

  res.json({ byMethod, byDate: last7Days });
});

// General User Deletion
router.delete('/users/:id', (req: Request | any, res: Response): void => {
  const id = parseInt(req.params.id);
  const index = db.users.findIndex(u => u.id === id);
  if (index === -1) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  // Remove user
  db.users.splice(index, 1);
  // Also remove their appointments
  db.appointments = db.appointments.filter(a => a.patsientId !== id && a.doctorId !== id);
  res.json({ message: 'User deleted successfully' });
});

// View all prescriptions
router.get('/prescriptions', (req: Request, res: Response): void => {
  const list = db.prescriptions.map(p => {
    const patsient = db.users.find(u => u.id === p.patsientId);
    const doctor = db.users.find(u => u.id === p.doctorId);
    return {
      ...p,
      createdAt: p.date,
      patsient: { id: patsient?.id, user: patsient },
      doctor: { id: doctor?.id, user: doctor }
    };
  });
  res.json(list);
});

export default router;
