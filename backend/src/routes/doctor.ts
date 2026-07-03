import { Router, Request, Response } from 'express';
import { db, Receipt, Prescription } from '../mockDb';
import { isTimeValid, isSlotAvailable } from '../utils/appointmentUtils';

const router = Router();

// Get their appointments (patients scheduled for this doctor)
router.get('/appointments', (req: Request | any, res: Response) => {
  const doctorId = req.user.userId;
  const appointments = db.appointments
    .filter(a => a.doctorId === doctorId)
    .map(a => {
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

// Alias for prescriptions
router.get('/prescriptions', (req: Request | any, res: Response) => {
  const doctorId = req.user.userId;
  const prescriptions = db.prescriptions
    .filter(r => r.doctorId === doctorId)
    .map(r => {
      const patsient = db.users.find(u => u.id === r.patsientId);
      return {
        ...r,
        createdAt: r.date,
        patsient: { id: patsient?.id, user: patsient }
      };
    });
  res.json(prescriptions);
});

router.get('/:id/prescriptions', (req: Request | any, res: Response) => {
  const doctorId = parseInt(req.params.id);
  const prescriptions = db.prescriptions
    .filter(r => r.doctorId === doctorId)
    .map(r => {
      const patsient = db.users.find(u => u.id === r.patsientId);
      return {
        ...r,
        createdAt: r.date,
        patsient: { id: patsient?.id, user: patsient }
      };
    });
  res.json(prescriptions);
});

// Cancel appointment
router.delete('/appointments/:id', (req: Request | any, res: Response): void => {
  const doctorId = req.user.userId;
  const apptId = parseInt(req.params.id);
  const apptIndex = db.appointments.findIndex(a => a.id === apptId && a.doctorId === doctorId);
  
  if (apptIndex === -1) {
    res.status(404).json({ message: 'Appointment not found or not yours' });
    return;
  }
  
  db.appointments[apptIndex].status = 'CANCELLED';
  res.json({ message: 'Appointment cancelled', appointment: db.appointments[apptIndex] });
});

// Edit appointment
router.put('/appointments/:id', (req: Request | any, res: Response): void => {
  const doctorId = req.user.userId;
  const apptId = parseInt(req.params.id);
  const { dateTime, date: dateFromReq, description, status } = req.body;
  const targetDateStr = dateTime || dateFromReq;

  const appt = db.appointments.find(a => a.id === apptId && a.doctorId === doctorId);
  if (!appt) {
    res.status(404).json({ message: 'Appointment not found or not yours' });
    return;
  }

  if (targetDateStr) {
    const date = new Date(targetDateStr);
    const timeValidation = isTimeValid(date);
    if (!timeValidation.valid) {
      res.status(400).json({ message: timeValidation.message });
      return;
    }

    const slotValidation = isSlotAvailable(doctorId, appt.patsientId, date, apptId);
    if (!slotValidation.available) {
      res.status(400).json({ message: slotValidation.message });
      return;
    }
    appt.dateTime = date;
  }

  if (description !== undefined) appt.description = description;
  if (status !== undefined) appt.status = status;

  res.json({ message: 'Appointment updated', appointment: appt });
});

// Update patient examination status
router.put('/patsients/:patsientId/status', (req: Request | any, res: Response): void => {
  const patsientId = parseInt(req.params.patsientId);
  const { passed_examination_or_not } = req.body;

  const patsient = db.users.find(u => u.id === patsientId && u.role === 'PATSIENT');
  if (!patsient) {
    res.status(404).json({ message: 'Patient not found' });
    return;
  }

  if (!patsient.patsientProfile) patsient.patsientProfile = {};
  patsient.patsientProfile.passed_examination_or_not = passed_examination_or_not;

  res.json({ message: 'Patient status updated', patsientProfile: patsient.patsientProfile });
});

// View patient info
router.get('/patsients/:patsientId', (req: Request | any, res: Response): void => {
  const patsientId = parseInt(req.params.patsientId);
  const patsient = db.users.find(u => u.id === patsientId && u.role === 'PATSIENT');
  
  if (!patsient) {
    res.status(404).json({ message: 'Patient not found' });
    return;
  }

  // exclude password
  const { password, ...safePatsient } = patsient;
  res.json({
    id: patsient.id,
    user: safePatsient,
    patsientProfile: patsient.patsientProfile
  });
});

// Get history of all patients treated by this doctor
router.get('/patsients/history', (req: Request | any, res: Response): void => {
  const doctorId = req.user.userId;
  
  // Find all patients who have appointments or prescriptions with this doctor
  const patientIds = new Set([
    ...db.appointments.filter(a => a.doctorId === doctorId).map(a => a.patsientId),
    ...db.receipts.filter(r => r.doctorId === doctorId).map(r => r.patsientId)
  ]);

  const history = Array.from(patientIds).map(pid => {
    const user = db.users.find(u => u.id === pid);
    const payments = db.receipts.filter(r => r.patsientId === pid); // simplified
    const prescriptions = db.prescriptions.filter(p => p.patsientId === pid && p.doctorId === doctorId);
    
    return {
      id: pid,
      user,
      payments: payments.map(p => ({ ...p, createdAt: p.date, amount: parseFloat(p.amount) })),
      prescriptions: prescriptions.map(r => ({ ...r, createdAt: r.date }))
    };
  });

  res.json(history);
});

// Get detailed profile of a specific patient
router.get('/patsients/:id/profile', (req: Request | any, res: Response): void => {
  const patsientId = parseInt(req.params.id);
  const patsient = db.users.find(u => u.id === patsientId && u.role === 'PATSIENT');
  
  if (!patsient) {
    res.status(404).json({ message: 'Patient not found' });
    return;
  }

  const appointments = db.appointments.filter(a => a.patsientId === patsientId);
  const prescriptions = db.prescriptions.filter(p => p.patsientId === patsientId);
  
  res.json({
    id: patsient.id,
    user: patsient,
    appointments: appointments.map(a => {
      const doctor = db.users.find(u => u.id === a.doctorId);
      return { ...a, doctor: { id: doctor?.id, user: doctor } };
    }),
    prescriptions: prescriptions.map(p => {
      const doctor = db.users.find(u => u.id === p.doctorId);
      return { ...p, doctor: { id: doctor?.id, user: doctor }, createdAt: p.date };
    })
  });
});

// Write prescription
router.post('/prescriptions', (req: Request | any, res: Response): void => {
  const doctorId = req.user.userId;
  const { patsientId, appointmentId, medicine, dosage, timing, notes, amount } = req.body;

  const patsient = db.users.find(u => u.id === parseInt(patsientId) && u.role === 'PATSIENT');
  if (!patsient) {
    res.status(404).json({ message: 'Patient not found' });
    return;
  }

  const prescription: Prescription = {
    id: db.getNextPrescriptionId(),
    appointmentId: parseInt(appointmentId),
    doctorId,
    patsientId: parseInt(patsientId),
    medicine: medicine || 'Prescription',
    dosage: dosage || '',
    timing: timing || '',
    notes: notes || '',
    date: new Date()
  };

  db.prescriptions.push(prescription);

  // Also create an unpaid receipt if amount is provided
  if (amount) {
    const receipt: Receipt = {
      id: db.getNextReceiptId(),
      doctorId,
      patsientId: parseInt(patsientId),
      name: 'Consultation Fee',
      amount: amount.toString(),
      days: '1',
      description: `Pending payment for appointment #${appointmentId}`,
      date: new Date(),
      paid: false
    };
    db.receipts.push(receipt);
  }

  res.status(201).json({ message: 'Prescription created', prescription });
});

// Write receipt for a patient
router.post('/receipts', (req: Request | any, res: Response): void => {
  const doctorId = req.user.userId;
  const { patsientId, name, amount, days, description } = req.body;

  const patsient = db.users.find(u => u.id === parseInt(patsientId) && u.role === 'PATSIENT');
  if (!patsient) {
    res.status(404).json({ message: 'Patient not found' });
    return;
  }

  const receipt: Receipt = {
    id: db.getNextReceiptId(),
    doctorId,
    patsientId: parseInt(patsientId),
    name,
    amount,
    days,
    description,
    date: new Date()
  };

  db.receipts.push(receipt);
  res.status(201).json({ message: 'Receipt created', receipt });
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

// Get appointments for a specific doctor ID (used by frontend)
router.get('/:id/appointments', (req: Request | any, res: Response): void => {
  const doctorId = parseInt(req.params.id);
  const appointments = db.appointments
    .filter(a => a.doctorId === doctorId)
    .map(a => {
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

export default router;
