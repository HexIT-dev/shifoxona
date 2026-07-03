"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const admin_1 = __importDefault(require("./routes/admin"));
const doctor_1 = __importDefault(require("./routes/doctor"));
const cashier_1 = __importDefault(require("./routes/cashier"));
const patsient_1 = __importDefault(require("./routes/patsient"));
const user_1 = __importDefault(require("./routes/user"));
const auth_1 = __importDefault(require("./routes/auth"));
const authMiddleware_1 = require("./middleware/authMiddleware");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/auth', auth_1.default);
// Protected Routes
app.use('/api/admin', authMiddleware_1.verifyToken, (0, authMiddleware_1.checkRole)(['ADMIN']), admin_1.default);
app.use('/api/doctor', authMiddleware_1.verifyToken, (0, authMiddleware_1.checkRole)(['DOCTOR']), doctor_1.default);
app.use('/api/cashier', authMiddleware_1.verifyToken, (0, authMiddleware_1.checkRole)(['CASHIER']), cashier_1.default);
app.use('/api/patsient', authMiddleware_1.verifyToken, (0, authMiddleware_1.checkRole)(['PATSIENT']), patsient_1.default);
app.use('/api/user', authMiddleware_1.verifyToken, (0, authMiddleware_1.checkRole)(['USER', 'PATSIENT', 'DOCTOR', 'CASHIER', 'ADMIN']), user_1.default);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
