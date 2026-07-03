import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, Appointment, Prescription } from '../mockDb';
import { isTimeValid, isSlotAvailable } from '../utils/appointmentUtils';

const router = Router();

// View available doctors
router.get('/doctors', (req: Request, res: Response): void => {
  const doctors = db.users.filter(u => u.role === 'DOCTOR').map(d => ({
    id: d.id,
    name: d.name,
    email: d.email,
    phone: d.phone,
    address: d.address,
    img: d.img
  }));
  res.json(doctors);
});

// Book appointment
router.post('/appointments', (req: Request | any, res: Response): void => {
  const patsientId = req.user.userId;
  const { doctorId, dateTime, date: dateFromReq, description } = req.body;
  const targetDateStr = dateTime || dateFromReq;

  const patsient = db.users.find(u => u.id === patsientId);
  if (patsient?.patsientProfile?.isBlocked) {
    res.status(403).json({ 
      message: 'Siz 5 marta bekor qilganingiz sababli bloklangansiz. Iltimos shifoxonaga boring.' 
    });
    return;
  }

  if (!db.users.some(u => u.id === parseInt(doctorId) && u.role === 'DOCTOR')) {
    res.status(404).json({ message: 'Doctor not found' });
    return;
  }

  const date = new Date(targetDateStr);
  const timeValidation = isTimeValid(date);
  if (!timeValidation.valid) {
    res.status(400).json({ message: timeValidation.message });
    return;
  }

  const slotValidation = isSlotAvailable(parseInt(doctorId), patsientId, date);
  if (!slotValidation.available) {
    res.status(400).json({ message: slotValidation.message });
    return;
  }

  const appointment: Appointment = {
    id: db.getNextApptId(),
    patsientId,
    doctorId: parseInt(doctorId),
    dateTime: date,
    status: 'PENDING',
    description
  };

  db.appointments.push(appointment);
  res.status(201).json({ message: 'Appointment booked', appointment });
});

// Cancel appointment
router.delete('/appointments/:id', (req: Request | any, res: Response): void => {
  const patsientId = req.user.userId;
  const apptId = parseInt(req.params.id);
  const apptIndex = db.appointments.findIndex(a => a.id === apptId && a.patsientId === patsientId);
  
  if (apptIndex === -1) {
    res.status(404).json({ message: 'Appointment not found or not yours' });
    return;
  }

  if (db.appointments[apptIndex].status === 'CANCELLED') {
    res.status(400).json({ message: 'Appointment is already cancelled' });
    return;
  }
  
  db.appointments[apptIndex].status = 'CANCELLED';

  // Increment cancellation count
  const patsient = db.users.find(u => u.id === patsientId);
  if (patsient) {
    if (!patsient.patsientProfile) patsient.patsientProfile = {};
    patsient.patsientProfile.cancellationCount = (patsient.patsientProfile.cancellationCount || 0) + 1;

    if (patsient.patsientProfile.cancellationCount >= 5) {
      patsient.patsientProfile.isBlocked = true;
      // Cancel all other pending appointments
      db.appointments.forEach(a => {
        if (a.patsientId === patsientId && a.status === 'PENDING') {
          a.status = 'CANCELLED';
        }
      });
      res.json({ 
        message: 'Appointment cancelled and you are now blocked due to 5 cancellations. All your pending appointments have been cancelled.', 
        appointment: db.appointments[apptIndex] 
      });
      return;
    }
  }

  res.json({ message: 'Appointment cancelled', appointment: db.appointments[apptIndex] });
});

// Update appointment status (Patsient - mainly for cancellation)
router.put('/appointments/:id', (req: Request | any, res: Response): void => {
  const patsientId = req.user.userId;
  const apptId = parseInt(req.params.id);
  const { status } = req.body;

  const appt = db.appointments.find(a => a.id === apptId && a.patsientId === patsientId);
  if (!appt) {
    res.status(404).json({ message: 'Appointment not found' });
    return;
  }

  if (status === 'CANCELLED' && appt.status !== 'CANCELLED') {
    appt.status = 'CANCELLED';
    // Increment cancellation count
    const patsient = db.users.find(u => u.id === patsientId);
    if (patsient) {
      if (!patsient.patsientProfile) patsient.patsientProfile = {};
      patsient.patsientProfile.cancellationCount = (patsient.patsientProfile.cancellationCount || 0) + 1;
      if (patsient.patsientProfile.cancellationCount >= 5) {
        patsient.patsientProfile.isBlocked = true;
        db.appointments.forEach(a => { if (a.patsientId === patsientId && a.status === 'PENDING') a.status = 'CANCELLED'; });
      }
    }
  } else if (status) {
    appt.status = status;
  }

  res.json({ message: 'Appointment updated', appointment: appt });
});

// View own receipts
router.get('/receipts', (req: Request | any, res: Response): void => {
  const patsientId = req.user.userId;
  const myReceipts = db.receipts.filter(r => r.patsientId === patsientId).map(r => ({
    ...r,
    createdAt: r.date,
    amount: parseFloat(r.amount),
    status: r.paid ? 'COMPLETED' : 'PENDING'
  }));
  res.json(myReceipts);
});

// Alias for payments
router.get('/payments', (req: Request | any, res: Response): void => {
  const patsientId = req.user.userId;
  const myPayments = db.receipts.filter(r => r.patsientId === patsientId).map(r => ({
    ...r,
    createdAt: r.date,
    amount: parseFloat(r.amount),
    status: r.paid ? 'COMPLETED' : 'PENDING'
  }));
  res.json(myPayments);
});

router.get('/:id/payments', (req: Request | any, res: Response): void => {
  const patsientId = parseInt(req.params.id);
  const myPayments = db.receipts.filter(r => r.patsientId === patsientId).map(r => ({
    ...r,
    createdAt: r.date,
    amount: parseFloat(r.amount),
    status: r.paid ? 'COMPLETED' : 'PENDING'
  }));
  res.json(myPayments);
});

// View own prescriptions (medical records)
router.get('/prescriptions', (req: Request | any, res: Response): void => {
  const patsientId = req.user.userId;
  const myPrescriptions = db.prescriptions
    .filter(r => r.patsientId === patsientId)
    .map(r => {
      const doctor = db.users.find(u => u.id === r.doctorId);
      return {
        ...r,
        createdAt: r.date,
        doctor: { id: doctor?.id, user: doctor, specialty: doctor?.address }
      };
    });
  res.json(myPrescriptions);
});

router.get('/:id/prescriptions', (req: Request | any, res: Response): void => {
  const patsientId = parseInt(req.params.id);
  const myPrescriptions = db.prescriptions
    .filter(r => r.patsientId === patsientId)
    .map(r => {
      const doctor = db.users.find(u => u.id === r.doctorId);
      return {
        ...r,
        createdAt: r.date,
        doctor: { id: doctor?.id, user: doctor, specialty: doctor?.address }
      };
    });
  res.json(myPrescriptions);
});

// Update own profile
router.put('/profile', async (req: Request | any, res: Response): Promise<void> => {
  try {
    const patsientId = req.user.userId;
    const { name, email, password, phone, img } = req.body;

    const user = db.users.find(u => u.id === patsientId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (email && email !== user.email && db.users.some(u => u.email === email)) {
      res.status(400).json({ message: 'Email already exists' });
      return;
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (img) user.img = img;
    
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    res.json({ message: 'Profile updated', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get own profile
router.get('/me', (req: Request | any, res: Response): void => {
  const userId = req.user.userId;
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  const { password, ...safeUser } = user;
  res.json(safeUser);
});

// Get own appointments
router.get('/:id/appointments', (req: Request | any, res: Response): void => {
  const patsientId = parseInt(req.params.id);
  const appointments = db.appointments
    .filter(a => a.patsientId === patsientId)
    .map(a => {
      const doctor = db.users.find(u => u.id === a.doctorId);
      return {
        ...a,
        date: a.dateTime,
        doctor: { id: doctor?.id, user: doctor, specialty: doctor?.address }
      };
    });
  res.json(appointments);
});

export default router;
