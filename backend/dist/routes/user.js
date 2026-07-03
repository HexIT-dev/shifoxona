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
// Edit User profile
router.put('/:userId/profile', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = Number(req.params.userId);
    const { name, phone, address } = req.body;
    try {
        const user = yield prisma_1.prisma.user.update({
            where: { id: userId },
            data: { name, phone, address }
        });
        res.json(user);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Change password
router.put('/:userId/password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = Number(req.params.userId);
    const { password } = req.body;
    // in a real app, verify old password and hash new one
    try {
        yield prisma_1.prisma.user.update({
            where: { id: userId },
            data: { password }
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Get notifications
router.get('/:userId/notifications', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = Number(req.params.userId);
    const notifications = yield prisma_1.prisma.notification.findMany({
        where: { userId }
    });
    res.json(notifications);
}));
// Get all doctors (Shared access)
router.get('/doctors/list', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const doctors = yield prisma_1.prisma.doctor.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        image: true,
                        role: true
                    }
                }
            }
        });
        res.json(doctors);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
exports.default = router;
