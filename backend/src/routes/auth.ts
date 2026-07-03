import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, Role } from '../mockDb';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// User Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, password, role } = req.body;

    // Support case-insensitive search for better UX
    const user = db.users.find(u => 
      u.name?.toLowerCase().trim() === name?.toLowerCase().trim() && 
      (!role || u.role === role)
    );

    if (!user) {
      res.status(404).json({ message: 'User not found or role mismatch' });
      return;
    }

    if (!user.password) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Register new user (For self-registration, default to PATSIENT)
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, number, img } = req.body;
    
    // Only PATSIENT can register themselves according to requirements
    const role: Role = 'PATSIENT';

    const existingUser = db.users.find(u => u.email === email || u.name?.toLowerCase() === name?.toLowerCase());
    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'name';
      res.status(400).json({ message: `This ${field} is already registered.` });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: db.getNextUserId(),
      name,
      email,
      password: hashedPassword,
      phone: number,
      img,
      role,
      patsientProfile: { passed_examination_or_not: false }
    };

    db.users.push(newUser);

    const token = jwt.sign({ userId: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
