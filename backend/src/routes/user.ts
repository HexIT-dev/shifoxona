import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../mockDb';

const router = Router();

// Get current user profile
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

// Edit user profile
router.put('/profile', async (req: Request | any, res: Response): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { name, phone, address, img, email } = req.body;

    const user = db.users.find(u => u.id === userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (email && email !== user.email && db.users.some(u => u.email === email)) {
      res.status(400).json({ message: 'Email already exists' });
      return;
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (img !== undefined) user.img = img;
    if (email !== undefined) user.email = email;

    const { password, ...safeUser } = user;
    res.json({ message: 'Profile updated', user: safeUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Change password
router.put('/password', async (req: Request | any, res: Response): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { oldPassword, newPassword } = req.body;

    const user = db.users.find(u => u.id === userId);
    if (!user || !user.password) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      res.status(401).json({ message: 'Old password is incorrect' });
      return;
    }

    user.password = await bcrypt.hash(newPassword, 10);
    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all doctors (shared access for booking)
router.get('/doctors', (req: Request, res: Response): void => {
  const doctors = db.users.filter(u => u.role === 'DOCTOR').map(d => {
    const { password, ...safe } = d;
    return {
      id: d.id,
      specialty: d.address, // mapping address to specialty for this mockup
      user: safe
    };
  });
  res.json(doctors);
});

// Alias for /doctors
router.get('/doctors/list', (req: Request, res: Response): void => {
  const doctors = db.users.filter(u => u.role === 'DOCTOR').map(d => {
    const { password, ...safe } = d;
    return {
      id: d.id,
      specialty: d.address,
      user: safe
    };
  });
  res.json(doctors);
});

// Get all patsients (shared: admin, cashier, doctor can access)
router.get('/patsients', (req: Request, res: Response): void => {
  const patsients = db.users.filter(u => u.role === 'PATSIENT').map(p => {
    const { password, ...safe } = p;
    return {
      id: p.id,
      user: safe,
      patsientProfile: p.patsientProfile
    };
  });
  res.json(patsients);
});

// Alias for /patsients
router.get('/patsients/list', (req: Request, res: Response): void => {
  const patsients = db.users.filter(u => u.role === 'PATSIENT').map(p => {
    const { password, ...safe } = p;
    return {
      id: p.id,
      user: safe,
      patsientProfile: p.patsientProfile
    };
  });
  res.json(patsients);
});

export default router;
