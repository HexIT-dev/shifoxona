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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const router = (0, express_1.Router)();
// Get current patsient profile
router.get('/me', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const patsient = yield prisma_1.prisma.patsient.findUnique({
            where: { userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId },
            include: { user: true }
        });
        if (!patsient) {
            return res.status(404).json({ message: 'Patsient profile not found' });
        }
        res.json(patsient);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// View profile
router.get('/:patsientId/profile', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const patsientId = Number(req.params.patsientId);
    const patsient = yield prisma_1.prisma.patsient.findUnique({
        where: { id: patsientId },
        include: { user: true }
    });
    res.json(patsient);
}));
// Edit profile
router.put('/:patsientId/profile', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const patsientId = Number(req.params.patsientId);
    const { name, phone, address } = req.body;
    try {
        const patsient = yield prisma_1.prisma.patsient.findUnique({ where: { id: patsientId } });
        if (!patsient)
            throw new Error('Patsient not found');
        const user = yield prisma_1.prisma.user.update({
            where: { id: patsient.userId },
            data: { name, phone, address }
        });
        res.json(user);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// View appointments
router.get('/:patsientId/appointments', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const patsientId = Number(req.params.patsientId);
    const appointments = yield prisma_1.prisma.appointment.findMany({
        where: { patsientId },
        include: { doctor: { include: { user: true } } }
    });
    res.json(appointments);
}));
// View prescriptions
router.get('/:patsientId/prescriptions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const patsientId = Number(req.params.patsientId);
    const prescriptions = yield prisma_1.prisma.prescription.findMany({
        where: { patsientId },
        include: { doctor: { include: { user: true } } }
    });
    res.json(prescriptions);
}));
// View payment history
router.get('/:patsientId/payments', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const patsientId = Number(req.params.patsientId);
    const payments = yield prisma_1.prisma.payment.findMany({
        where: { patsientId }
    });
    res.json(payments);
}));
// Cancel appointment with limit check
router.put('/appointments/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(req.params.id);
    const { status, patsientId } = req.body;
    try {
        if (status === 'CANCELLED' && patsientId) {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const cancelCount = yield prisma_1.prisma.appointment.count({
                where: {
                    patsientId: Number(patsientId),
                    status: 'CANCELLED',
                    updatedAt: { gte: startOfMonth }
                }
            });
            if (cancelCount >= 5) {
                return res.status(403).json({
                    error: 'You have reached the monthly limit of 5 cancellations. Please contact the hospital for further assistance.'
                });
            }
        }
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
exports.default = router;
