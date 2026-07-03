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
// Get current doctor profile
router.get('/me', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const doctor = yield prisma_1.prisma.doctor.findUnique({
            where: { userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId },
            include: { user: true }
        });
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }
        res.json(doctor);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Get doctor's appointments
router.get('/:doctorId/appointments', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const doctorId = Number(req.params.doctorId);
    const appointments = yield prisma_1.prisma.appointment.findMany({
        where: { doctorId },
        include: { patsient: { include: { user: true } } }
    });
    res.json(appointments);
}));
// Create prescription (simplified)
router.post('/prescriptions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { patsientId, medicine, dosage, notes, doctorId } = req.body;
    try {
        // Use doctorId from body if provided, else find it from user token
        let finalDoctorId = doctorId;
        if (!finalDoctorId) {
            const doctor = yield prisma_1.prisma.doctor.findUnique({ where: { userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId } });
            if (!doctor)
                return res.status(404).json({ error: 'Doctor profile not found' });
            finalDoctorId = doctor.id;
        }
        const prescription = yield prisma_1.prisma.prescription.create({
            data: {
                doctorId: parseInt(finalDoctorId),
                patsientId: parseInt(patsientId),
                medicine,
                dosage,
                notes
            }
        });
        res.json(prescription);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Create appointment (Doctor scheduling it)
router.post('/:doctorId/appointments', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const doctorId = Number(req.params.doctorId);
    const { patsientId, date, reason } = req.body;
    try {
        const appointment = yield prisma_1.prisma.appointment.create({
            data: {
                doctorId,
                patsientId,
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
// Update appointment (Doctor rescheduling it)
router.put('/appointments/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(req.params.id);
    const { date, reason, status } = req.body;
    try {
        const appointment = yield prisma_1.prisma.appointment.update({
            where: { id },
            data: {
                date: date ? new Date(date) : undefined,
                reason,
                status
            }
        });
        res.json(appointment);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Delete appointment (Doctor cancelling/removing it)
router.delete('/appointments/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(req.params.id);
    try {
        yield prisma_1.prisma.appointment.delete({ where: { id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Create Prescription
router.post('/prescriptions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { medicine, dosage, timing, notes, doctorId, patsientId } = req.body;
    try {
        const prescription = yield prisma_1.prisma.prescription.create({
            data: {
                medicine,
                dosage,
                timing,
                notes,
                doctorId: Number(doctorId),
                patsientId: Number(patsientId)
            }
        });
        res.json(prescription);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Get all patsients with their history (for the selection/list)
router.get('/patsients/history', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const patsients = yield prisma_1.prisma.patsient.findMany({
            include: {
                user: true,
                prescriptions: {
                    orderBy: { createdAt: 'desc' }
                },
                payments: true
            }
        });
        res.json(patsients);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
exports.default = router;
