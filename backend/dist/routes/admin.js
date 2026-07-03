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
const router = (0, express_1.Router)();
// Get all doctors
router.get('/doctors', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const doctors = yield prisma_1.prisma.doctor.findMany({ include: { user: true } });
    res.json(doctors);
}));
// Create doctor
router.post('/doctors', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { name, email, password, specialty, phone, image } = req.body;
    try {
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = yield prisma_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                phone,
                image,
                role: 'DOCTOR',
                createdById: ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) && req.user.userId !== 0 ? req.user.userId : null,
                doctorProfile: {
                    create: { specialty }
                }
            },
            include: { doctorProfile: true }
        });
        res.json(user);
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'This email is already registered.' });
        }
        res.status(400).json({ error: error.message });
    }
}));
// Get all cashiers
router.get('/cashiers', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const cashiers = yield prisma_1.prisma.user.findMany({ where: { role: 'CASHIER' } });
    res.json(cashiers);
}));
// Create cashier
router.post('/cashiers', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { name, email, password, phone, address, image } = req.body;
    try {
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = yield prisma_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                phone,
                address,
                image,
                role: 'CASHIER',
                createdById: ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) && req.user.userId !== 0 ? req.user.userId : null
            }
        });
        res.json(user);
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'This email is already registered.' });
        }
        res.status(400).json({ error: error.message });
    }
}));
// Delete user (doctor, cashier, etc)
router.delete('/users/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(req.params.id);
    try {
        yield prisma_1.prisma.user.delete({ where: { id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// View all appointments
router.get('/appointments', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const appointments = yield prisma_1.prisma.appointment.findMany({
        include: { doctor: { include: { user: true } }, patsient: { include: { user: true } } }
    });
    res.json(appointments);
}));
// Update appointment status (Complete/Cancel)
router.put('/appointments/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(req.params.id);
    const { status } = req.body;
    try {
        const appointment = yield prisma_1.prisma.appointment.update({
            where: { id },
            data: { status }
        });
        res.json(appointment);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Get all patsients
router.get('/patsients', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const patsients = yield prisma_1.prisma.patsient.findMany({
            include: {
                user: {
                    include: { createdBy: true }
                }
            }
        });
        res.json(patsients);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Get payment stats
router.get('/payments/stats', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payments = yield prisma_1.prisma.payment.findMany({
            select: {
                amount: true,
                method: true,
                createdAt: true
            }
        });
        // Group by method
        const byMethod = payments.reduce((acc, p) => {
            acc[p.method] = (acc[p.method] || 0) + p.amount;
            return acc;
        }, {});
        // Group by date (last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();
        const byDate = last7Days.map(date => {
            const total = payments
                .filter(p => p.createdAt.toISOString().split('T')[0] === date)
                .reduce((sum, p) => sum + p.amount, 0);
            return { date, total };
        });
        res.json({ byMethod, byDate });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
exports.default = router;
