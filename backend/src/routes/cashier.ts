import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, User, Appointment, Prescription, Receipt } from '../mockDb';
import { isTimeValid, isSlotAvailable } from '../utils/appointmentUtils';

const router = Router();

// Cashier adds patient
router.post('/patsients', async (req: Request | any, res: Response): Promise<void> => {
  try {
    const { name, email, password, number, img } = req.body;
    
    if (db.users.some(u => u.email === email || u.name?.toLowerCase() === name?.toLowerCase())) {
      res.status(400).json({ message: 'Email or Name already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser: User = {
      id: db.getNextUserId(),
      name,
      email,
      password: hashedPassword,
      phone: number,
      img,
      role: 'PATSIENT',
      patsientProfile: { passed_examination_or_not: false }
    };

    db.users.push(newUser);
    res.status(201).json({ message: 'Patient added successfully', user: { id: newUser.id, name, email, role: 'PATSIENT' } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cashier updates patient
router.put('/patsients/:id', async (req: Request | any, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { name, email, phone, number, address } = req.body;
    const user = db.users.find(u => u.id === id && u.role === 'PATSIENT');
    if (!user) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone || number) user.phone = phone || number;
    if (address) user.address = address;
    res.json({ message: 'Patient updated', user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Register and book in one go
router.post('/register-and-book', async (req: Request | any, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, number, address, doctorId, date, dateTime, reason } = req.body;
    
    // 1. Register
    if (db.users.some(u => u.email === email)) {
      res.status(400).json({ message: 'Email already exists' });
      return;
    }
    const hashedPassword = await bcrypt.hash(password || 'Pass@123', 10);
    const newUser: User = {
      id: db.getNextUserId(),
      name,
      email,
      password: hashedPassword,
      phone: phone || number,
      address,
      role: 'PATSIENT',
      patsientProfile: { passed_examination_or_not: false }
    };
    db.users.push(newUser);

    // 2. Book
    const targetDateStr = date || dateTime;
    if (!targetDateStr || !doctorId) {
      res.status(201).json({ message: 'Patient registered but appointment data missing', user: newUser });
      return;
    }

    const apptDate = new Date(targetDateStr);
    const appointment: Appointment = {
      id: db.getNextApptId(),
      patsientId: newUser.id,
      doctorId: parseInt(doctorId),
      cashierId: req.user.userId,
      dateTime: apptDate,
      status: 'PENDING',
      description: reason
    };
    db.appointments.push(appointment);
    res.status(201).json({ message: 'Registered and booked successfully', user: newUser, appointment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cashier books appointment for patient
router.post('/appointments', (req: Request | any, res: Response): void => {
  const cashierId = req.user.userId;
  const { patsientId, doctorId, dateTime, date, description, reason } = req.body;
  const targetDateStr = dateTime || date;
  const targetReason = description || reason;

  const patsient = db.users.find(u => u.id === parseInt(patsientId) && u.role === 'PATSIENT');
  if (!patsient) {
    res.status(404).json({ message: 'Patient not found' });
    return;
  }

  if (patsient.patsientProfile?.isBlocked) {
    res.status(403).json({ 
      message: 'Ushbu bemor 5 marta bekor qilganligi sababli bloklangan. U shaxsan murojaat qilishi kerak.' 
    });
    return;
  }

  if (!db.users.some(u => u.id === parseInt(doctorId) && u.role === 'DOCTOR')) {
    res.status(404).json({ message: 'Doctor not found' });
    return;
  }
  
  const targetDate = new Date(targetDateStr);
  const timeValidation = isTimeValid(targetDate);
  if (!timeValidation.valid) {
    res.status(400).json({ message: timeValidation.message });
    return;
  }

  const slotValidation = isSlotAvailable(parseInt(doctorId), parseInt(patsientId), targetDate);
  if (!slotValidation.available) {
    res.status(400).json({ message: slotValidation.message });
    return;
  }

  const appointment: Appointment = {
    id: db.getNextApptId(),
    patsientId: parseInt(patsientId),
    doctorId: parseInt(doctorId),
    cashierId,
    dateTime: targetDate,
    status: 'PENDING',
    description: targetReason
  };

  db.appointments.push(appointment);
  res.status(201).json({ message: 'Appointment created', appointment });
});

// Edit appointment
router.put('/appointments/:id', (req: Request | any, res: Response): void => {
  const apptId = parseInt(req.params.id);
  const { dateTime, description, doctorId } = req.body;

  const appt = db.appointments.find(a => a.id === apptId);
  if (!appt) {
    res.status(404).json({ message: 'Appointment not found' });
    return;
  }

  const targetDoctorId = doctorId ? parseInt(doctorId) : appt.doctorId;
  const targetDate = dateTime ? new Date(dateTime) : new Date(appt.dateTime);

  if (dateTime) {
    const timeValidation = isTimeValid(targetDate);
    if (!timeValidation.valid) {
      res.status(400).json({ message: timeValidation.message });
      return;
    }
  }

  if (dateTime || doctorId) {
    const slotValidation = isSlotAvailable(targetDoctorId, appt.patsientId, targetDate, apptId);
    if (!slotValidation.available) {
      res.status(400).json({ message: slotValidation.message });
      return;
    }
  }

  if (dateTime) appt.dateTime = targetDate;
  if (description !== undefined) appt.description = description;
  if (doctorId) appt.doctorId = targetDoctorId;

  res.json({ message: 'Appointment updated', appointment: appt });
});

// Cancel appointment
router.delete('/appointments/:id', (req: Request | any, res: Response): void => {
  const apptId = parseInt(req.params.id);
  const apptIndex = db.appointments.findIndex(a => a.id === apptId);
  
  if (apptIndex === -1) {
    res.status(404).json({ message: 'Appointment not found' });
    return;
  }
  
  db.appointments[apptIndex].status = 'CANCELLED';
  res.json({ message: 'Appointment cancelled', appointment: db.appointments[apptIndex] });
});

// Get all patients for cashier
router.get('/patsients', (req: Request, res: Response): void => {
  const patsients = db.users.filter(u => u.role === 'PATSIENT').map(p => ({
    id: p.id,
    user: p,
    patsientProfile: p.patsientProfile
  }));
  res.json(patsients);
});

// Get all appointments for cashier (with date normalization)
router.get('/appointments', (req: Request, res: Response): void => {
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

// Get billing list (completed/pending appointments for payment)
router.get('/billing-list', (req: Request, res: Response): void => {
  const list = db.appointments
    .filter(a => a.status === 'COMPLETED')
    .map(a => {
      const patsient = db.users.find(u => u.id === a.patsientId);
      const doctor = db.users.find(u => u.id === a.doctorId);
      
      // Check if a receipt already exists for this appointment
      // We look for a receipt created around the same time or specifically for this doctor/patient
      const receipt = db.receipts.find(r => 
        r.patsientId === a.patsientId && 
        r.doctorId === a.doctorId &&
        !r.paid // Only find the unpaid one
      ) || db.receipts.find(r => 
        r.patsientId === a.patsientId && 
        r.doctorId === a.doctorId &&
        new Date(r.date).toDateString() === new Date(a.dateTime).toDateString()
      );

      // Find prescription for this appointment
      const prescription = db.prescriptions.find(p => p.appointmentId === a.id);

      return {
        id: a.id,
        patsientId: a.patsientId,
        patsient: { id: patsient?.id, user: patsient },
        doctor: { id: doctor?.id, user: doctor },
        dateTime: a.dateTime,
        updatedAt: a.dateTime, // Added for frontend compatibility
        status: receipt?.paid ? 'PAID' : 'UNPAID',
        amount: receipt?.amount || '0',
        method: receipt?.method || 'N/A',
        medicine: prescription?.medicine || 'N/A',
        prescription: prescription ? { ...prescription, createdAt: prescription.date } : null,
        payments: receipt?.paid ? [{ id: receipt.id, amount: parseFloat(receipt.amount), method: receipt.method, createdAt: receipt.date }] : []
      };
    });
    
  res.json(list);
});

// Process payment
router.post('/payments', (req: Request | any, res: Response): void => {
  const { patsientId, appointmentId, amount, method } = req.body;
  const app = db.appointments.find(a => a.id === parseInt(appointmentId));
  if (!app) {
    res.status(404).json({ message: 'Appointment not found' });
    return;
  }

  // Check if there is an existing unpaid receipt
  let receipt = db.receipts.find(r => 
    r.patsientId === parseInt(patsientId) && 
    r.doctorId === app.doctorId && 
    !r.paid
  );

  if (receipt) {
    receipt.paid = true;
    receipt.method = method;
    receipt.amount = amount.toString();
    receipt.date = new Date();
    receipt.description = `Payment for appointment #${appointmentId} via ${method}`;
  } else {
    receipt = {
      id: db.getNextReceiptId(),
      patsientId: parseInt(patsientId),
      doctorId: app.doctorId,
      name: 'Consultation Fee',
      amount: amount.toString(),
      days: '1',
      description: `Payment for appointment #${appointmentId} via ${method}`,
      date: new Date(),
      method: method,
      paid: true
    };
    db.receipts.push(receipt);
  }

  res.status(201).json({ message: 'Payment processed', receipt });
});

// Get all prescriptions (shared oversight)
router.get('/prescriptions/list', (req: Request, res: Response): void => {
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
