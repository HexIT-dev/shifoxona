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
const prisma_1 = require("../prisma");
const emailService_1 = require("../utils/emailService");
const router = (0, express_1.Router)();
// Register Patsient
router.post('/patsients', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { name, email, password, phone, address, image } = req.body;
    try {
        const hashedPassword = yield bcryptjs_1.default.hash(password || 'password123', 10);
        const user = yield prisma_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                phone,
                address,
                image,
                role: 'PATSIENT',
                createdById: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId,
                patsientProfile: {
                    create: {}
                }
            },
            include: { patsientProfile: true }
        });
        // Send Welcome Email
        yield (0, emailService_1.sendEmail)(email, 'Welcome to Our Hospital', `Hello ${name}, your account has been created. Your temporary password is: ${password || 'password123'}. Please change it after login.`);
        res.json(user);
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'This email is already registered.' });
        }
        res.status(400).json({ error: error.message });
    }
}));
// Register and Book Appointment in one go
router.post('/register-and-book', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, phone, address, doctorId, date, reason } = req.body;
    try {
        const hashedPassword = yield bcryptjs_1.default.hash('password123', 10);
        const result = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const user = yield tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    phone,
                    address,
                    role: 'PATSIENT',
                    createdById: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId,
                    patsientProfile: { create: {} }
                },
                include: { patsientProfile: true }
            });
            const appointment = yield tx.appointment.create({
                data: {
                    doctorId: parseInt(doctorId),
                    patsientId: user.patsientProfile.id,
                    date: new Date(date),
                    reason
                }
            });
            return { user, appointment };
        }));
        // Send Welcome Email
        yield (0, emailService_1.sendEmail)(email, 'Welcome to Our Hospital', `Hello ${name}, your account has been created. Your temporary password is: password123. Please change it after login.`);
        res.json(result);
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'This email is already registered.' });
        }
        res.status(400).json({ error: error.message });
    }
}));
// Create appointment
router.post('/appointments', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { doctorId, patsientId, date, reason } = req.body;
    try {
        const appointment = yield prisma_1.prisma.appointment.create({
            data: {
                doctorId: Number(doctorId),
                patsientId: Number(patsientId),
                date: new Date(date),
                reason
            }
        });
        res.json(appointment);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Process payment
router.post('/payments', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { patsientId, amount, method, appointmentId } = req.body;
    try {
        const payment = yield prisma_1.prisma.payment.create({
            data: {
                patsientId: Number(patsientId),
                amount: Number(amount),
                method,
                status: 'COMPLETED',
                appointmentId: appointmentId ? Number(appointmentId) : null
            }
        });
        res.json(payment);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Get billing list (completed appointments)
router.get('/billing-list', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const appointments = yield prisma_1.prisma.appointment.findMany({
            where: { status: 'COMPLETED' },
            include: {
                patsient: { include: { user: true } },
                doctor: { include: { user: true } },
                payments: true
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(appointments);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Get registered patsients
router.get('/patsients', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const patsients = yield prisma_1.prisma.patsient.findMany({ include: { user: true } });
    res.json(patsients);
}));
// Update Patsient
router.put('/patsients/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const patsientId = Number(req.params.id);
    const { name, email, phone, address } = req.body;
    try {
        const patsient = yield prisma_1.prisma.patsient.findUnique({ where: { id: patsientId } });
        if (!patsient)
            return res.status(404).json({ error: 'Patsient not found' });
        const user = yield prisma_1.prisma.user.update({
            where: { id: patsient.userId },
            data: { name, email, phone, address }
        });
        res.json(user);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
exports.default = router;
