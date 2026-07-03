import { db } from '../mockDb';

/**
 * Checks if the given date and time is within working hours (8 AM - 8 PM)
 * and not during lunch break (1 PM - 2 PM).
 */
export const isTimeValid = (date: Date): { valid: boolean; message?: string } => {
  if (isNaN(date.getTime())) {
    return { valid: false, message: 'Invalid date provided.' };
  }
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Working hours: 8:00 to 20:00 (8 PM)
  if (hours < 8 || hours >= 20) {
    return { valid: false, message: 'Appointments must be between 08:00 and 20:00.' };
  }

  // Lunch break: 13:00 to 14:00 (1 PM to 2 PM)
  if (hours === 13) {
    return { valid: false, message: 'Appointments cannot be booked during lunch break (13:00 - 14:00).' };
  }

  // Check if minutes are 0 (assuming exactly 1 hour slots starting at top of the hour)
  // Actually the requirement says "har bir bemorga qarash vaqti 1 soat"
  // If they can book at 8:30, then 9:30 is the next slot.
  // To keep it simple, let's assume they can book at any time, but it takes 1 hour.
  // But usually it's better to enforce slots or just check for overlaps.
  
  return { valid: true };
};

/**
 * Checks if a 1-hour slot is available for both doctor and patient.
 */
export const isSlotAvailable = (
  doctorId: number,
  patsientId: number,
  dateTime: Date,
  excludeApptId?: number
): { available: boolean; message?: string } => {
  const appointmentStart = new Date(dateTime);
  const appointmentEnd = new Date(dateTime);
  appointmentEnd.setHours(appointmentEnd.getHours() + 1);

  // Check doctor's schedule
  const doctorOverlap = db.appointments.find(a => {
    if (a.id === excludeApptId || a.status === 'CANCELLED') return false;
    if (a.doctorId !== doctorId) return false;

    const existingStart = new Date(a.dateTime);
    const existingEnd = new Date(a.dateTime);
    existingEnd.setHours(existingEnd.getHours() + 1);

    // Overlap condition: (StartA < EndB) and (EndA > StartB)
    return appointmentStart < existingEnd && appointmentEnd > existingStart;
  });

  if (doctorOverlap) {
    return { available: false, message: 'Doctor is already booked at this time.' };
  }

  // Check patient's schedule
  const patsientOverlap = db.appointments.find(a => {
    if (a.id === excludeApptId || a.status === 'CANCELLED') return false;
    if (a.patsientId !== patsientId) return false;

    const existingStart = new Date(a.dateTime);
    const existingEnd = new Date(a.dateTime);
    existingEnd.setHours(existingEnd.getHours() + 1);

    return appointmentStart < existingEnd && appointmentEnd > existingStart;
  });

  if (patsientOverlap) {
    return { available: false, message: 'Patient already has another appointment at this time.' };
  }

  return { available: true };
};
