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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../prisma");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
// User Login (handles regular users by Role and specific admin123 login)
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, password, role } = req.body;
        // Hardcoded Admin check
        if (name === 'admin123' && password === 'admin123') {
            const token = jsonwebtoken_1.default.sign({ userId: 0, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1d' });
            res.json({ token, user: { id: 0, name: 'Admin', role: 'ADMIN' } });
            return;
        }
        // Normal User Check
        const user = yield prisma_1.prisma.user.findFirst({
            where: {
                name,
                role: role,
            }
        });
        if (!user) {
            res.status(404).json({ message: 'User not found or role mismatch' });
            return;
        }
        const isValid = yield bcryptjs_1.default.compare(password, user.password);
        if (!isValid) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
// Register new user (For self-registration, default to PATIENT or USER)
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, phone, address, role } = req.body;
        // Hash password
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const userRole = role || 'USER';
        const user = yield prisma_1.prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone,
                address,
                role: userRole,
                patsientProfile: userRole === 'PATSIENT' ? { create: {} } : undefined,
            }
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Forgot password
router.post('/forgot-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    try {
        const user = yield prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        // Generate a simple token (in a real app, use a crypto token and save it in DB with expiry)
        const token = Buffer.from(email + Date.now()).toString('base64');
        // Log the reset link to console (mocking email)
        console.log('\n--- MOCK EMAIL SENT ---');
        console.log(`To: ${email}`);
        console.log(`Subject: Password Reset Request`);
        console.log(`Link: http://localhost:5173/reset-password?token=${token}&email=${email}`);
        console.log('------------------------\n');
        res.json({ message: 'Password reset link sent to your email.' });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Reset password
router.post('/reset-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, token, newPassword } = req.body;
    try {
        // In a real app, verify the token from database
        const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
        yield prisma_1.prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });
        res.json({ message: 'Password reset successfully.' });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
exports.default = router;
