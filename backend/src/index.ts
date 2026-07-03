import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import adminRoutes from './routes/admin';
import doctorRoutes from './routes/doctor';
import cashierRoutes from './routes/cashier';
import patsientRoutes from './routes/patsient';
import userRoutes from './routes/user';
import authRoutes from './routes/auth';
import { verifyToken, checkRole } from './middleware/authMiddleware';

const app = express();

app.use(cors());
app.use(express.json());

// Public Auth Routes
app.use('/api/auth', authRoutes);

// Protected Routes (role-based)
app.use('/api/admin', verifyToken, checkRole(['ADMIN']), adminRoutes);
app.use('/api/doctor', verifyToken, checkRole(['DOCTOR']), doctorRoutes);
app.use('/api/cashier', verifyToken, checkRole(['CASHIER']), cashierRoutes);
app.use('/api/patsient', verifyToken, checkRole(['PATSIENT']), patsientRoutes);

// Shared routes: all authenticated roles
app.use(
  '/api/user',
  verifyToken,
  checkRole(['PATSIENT', 'DOCTOR', 'CASHIER', 'ADMIN']),
  userRoutes
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`   Admin login -> email: admin@hospital.com | password: admin123`);
});
