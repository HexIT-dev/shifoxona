import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, CreditCard, 
  Stethoscope, FileText, UserCircle, Activity, 
  LogOut, Shield, DollarSign, Moon, Sun 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

const Sidebar = ({ darkMode, setDarkMode }: SidebarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sections = [
    {
      title: 'Admin',
      roles: ['ADMIN'],
      links: [
        { path: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/admin/doctors', icon: <Stethoscope size={20} />, label: 'Manage Doctors' },
        { path: '/admin/patsients', icon: <Users size={20} />, label: 'Manage Patsients' },
        { path: '/admin/appointments', icon: <Calendar size={20} />, label: 'All Appointments' },
        { path: '/admin/payments', icon: <DollarSign size={20} />, label: 'Financial Analytics' },
        { path: '/admin/profile', icon: <UserCircle size={20} />, label: 'My Profile' },
      ]
    },
    {
      title: 'Doctor',
      roles: ['DOCTOR'],
      links: [
        { path: '/doctor/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/doctor/appointments', icon: <Activity size={20} />, label: 'My Appointments' },
        { path: '/doctor/prescriptions', icon: <FileText size={20} />, label: 'Prescriptions' },
        { path: '/doctor/profile', icon: <UserCircle size={20} />, label: 'My Profile' },
      ]
    },
    {
      title: 'Cashier',
      roles: ['CASHIER'],
      links: [
        { path: '/cashier/patsients', icon: <Users size={20} />, label: 'Register Patsients' },
        { path: '/cashier/payments', icon: <CreditCard size={20} />, label: 'Payments' },
        { path: '/cashier/profile', icon: <UserCircle size={20} />, label: 'My Profile' },
      ]
    },
    {
      title: 'Patsient',
      roles: ['PATSIENT'],
      links: [
        { path: '/patsient/profile', icon: <UserCircle size={20} />, label: 'My Profile' },
        { path: '/patsient/appointments', icon: <Calendar size={20} />, label: 'My Appointments' },
        { path: '/patsient/prescriptions', icon: <FileText size={20} />, label: 'My Prescriptions' },
        { path: '/patsient/payments', icon: <CreditCard size={20} />, label: 'Payment History' },
      ]
    }
  ];

  const visibleSections = sections.filter(section => user && section.roles.includes(user.role));

  return (
    <aside className={`w-72 h-full flex flex-col border-r transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
      {/* Brand */}
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Shield className="text-white" size={24} />
          </div>
          <span className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>HMS Pro</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar">
        {visibleSections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className={`px-4 text-[10px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.links.map((link, lIdx) => (
                <NavLink
                  key={lIdx}
                  to={link.path}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 group
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : darkMode 
                        ? 'text-slate-400 hover:bg-slate-800 hover:text-white' 
                        : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'}
                  `}
                >
                  <span className="transition-transform group-hover:scale-110 duration-200">
                    {link.icon}
                  </span>
                  <span className="text-sm">{link.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className={`p-4 mt-auto border-t space-y-2 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${darkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          <span className="text-sm">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <button 
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 transition-all ${darkMode ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}
        >
          <LogOut size={20} />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
