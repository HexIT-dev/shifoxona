import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';

// Global Alert Component
const GlobalAlert = () => {
  const [alertState, setAlertState] = useState<{message: string, visible: boolean}>({message: '', visible: false});

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message: string) => {
      setAlertState({ message, visible: true });
    };
    return () => {
      window.alert = originalAlert;
    };
  }, []);

  if (!alertState.visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white">
          <h2 className="text-xl font-bold">Xabarnoma</h2>
        </div>
        <div className="p-8">
          <p className="text-slate-700 font-medium text-center">{alertState.message}</p>
        </div>
        <div className="p-4 bg-slate-50 flex justify-center">
          <button 
            onClick={() => setAlertState({ message: '', visible: false })}
            className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-95"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';

// Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminDoctorPage from './pages/AdminDoctorPage';
import AdminPatsientPage from './pages/AdminPatsientPage';
import AdminAppointmentPage from './pages/AdminAppointmentPage';
import AdminPaymentsPage from './pages/AdminPaymentsPage';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorAppointmentsPage from './pages/DoctorAppointmentsPage';
import DoctorPrescriptionPage from './pages/DoctorPrescriptionPage';
import CashierPatsientPage from './pages/CashierPatsientPage';
import CashierPaymentPage from './pages/CashierPaymentPage';
import ProfilePage from './pages/ProfilePage';
import PatsientAppointmentsPage from './pages/PatsientAppointmentsPage';
import PatsientPrescriptionsPage from './pages/PatsientPrescriptionsPage';
import PatsientPaymentPage from './pages/PatsientPaymentPage';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    // Redirect to their specific dashboard if they try to access something else
    switch(user.role) {
      case 'ADMIN': return <Navigate to="/admin/dashboard" replace />;
      case 'DOCTOR': return <Navigate to="/doctor/dashboard" replace />;
      case 'CASHIER': return <Navigate to="/cashier/patsients" replace />;
      case 'PATSIENT': return <Navigate to="/patsient/profile" replace />;
      default: return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${darkMode ? 'dark bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className={`absolute top-0 -left-4 w-72 h-72 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob ${darkMode ? 'bg-blue-900' : 'bg-blue-400'}`}></div>
        <div className={`absolute top-0 -right-4 w-72 h-72 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 ${darkMode ? 'bg-purple-900' : 'bg-purple-400'}`}></div>
        <div className={`absolute -bottom-8 left-20 w-72 h-72 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 ${darkMode ? 'bg-pink-900' : 'bg-pink-400'}`}></div>
        <div className="relative z-10 max-w-7xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <GlobalAlert />
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />

          {/* Protected Routes */}
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DashboardLayout>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="doctors" element={<AdminDoctorPage />} />
                  <Route path="patsients" element={<AdminPatsientPage />} />
                  <Route path="appointments" element={<AdminAppointmentPage />} />
                  <Route path="payments" element={<AdminPaymentsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/doctor/*" element={
            <ProtectedRoute allowedRoles={['DOCTOR']}>
              <DashboardLayout>
                <Routes>
                  <Route path="dashboard" element={<DoctorDashboard />} />
                  <Route path="appointments" element={<DoctorAppointmentsPage />} />
                  <Route path="prescriptions" element={<DoctorPrescriptionPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/cashier/*" element={
            <ProtectedRoute allowedRoles={['CASHIER']}>
              <DashboardLayout>
                <Routes>
                  <Route path="patsients" element={<CashierPatsientPage />} />
                  <Route path="payments" element={<CashierPaymentPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="*" element={<Navigate to="patsients" replace />} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/patsient/*" element={
            <ProtectedRoute allowedRoles={['PATSIENT']}>
              <DashboardLayout>
                <Routes>
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="appointments" element={<PatsientAppointmentsPage />} />
                  <Route path="prescriptions" element={<PatsientPrescriptionsPage />} />
                  <Route path="payments" element={<PatsientPaymentPage />} />
                  <Route path="*" element={<Navigate to="profile" replace />} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Root redirect to login if not authenticated */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
