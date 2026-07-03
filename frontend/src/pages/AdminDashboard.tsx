import React, { useState, useEffect } from 'react';
import { Users, Calendar, Stethoscope, DollarSign, TrendingUp, Activity, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [payRes, docRes, patRes, appRes] = await Promise.all([
          axios.get('http://localhost:5000/api/admin/payments/stats', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/api/admin/doctors', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/api/admin/patsients', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/api/admin/appointments', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setStats({
          revenue: Object.values(payRes.data.byMethod).reduce((a: any, b: any) => a + b, 0),
          doctors: docRes.data.length,
          patients: patRes.data.length,
          appointments: appRes.data.length,
          recentApps: appRes.data.slice(0, 5)
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-400">Loading dashboard...</div>;

  const statCards = [
    { label: 'Total Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: <DollarSign />, color: 'bg-green-500', link: '/admin/payments' },
    { label: 'Total Patsients', value: stats.patients, icon: <Users />, color: 'bg-blue-500', link: '/admin/patsients' },
    { label: 'Active Doctors', value: stats.doctors, icon: <Stethoscope />, color: 'bg-purple-500', link: '/admin/doctors' },
    { label: 'Appointments', value: stats.appointments, icon: <Calendar />, color: 'bg-orange-500', link: '/admin/appointments' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <Link key={i} to={card.link} className="glass-panel p-6 bg-white hover:shadow-2xl transition-all group">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl text-white ${card.color} shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform [&>svg]:w-6 [&>svg]:h-6`}>
                {card.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
                <p className="text-2xl font-black text-slate-900">{card.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel bg-white overflow-hidden shadow-xl border border-slate-100">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Activity size={20} className="text-blue-500" /> Recent Appointments
            </h3>
            <Link to="/admin/appointments" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-3">Patient</th>
                  <th className="px-6 py-3">Doctor</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.recentApps.map((app: any) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 text-sm">{app.patsient.user.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">Dr. {app.doctor.user.name}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{new Date(app.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        app.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <TrendingUp size={20} /> Revenue Overview
            </h3>
            <div className="text-4xl font-black mb-2">${stats.revenue.toLocaleString()}</div>
            <p className="text-blue-100 text-sm mb-6">Total earnings from all departments</p>
            <Link to="/admin/payments" className="block w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl text-center font-bold transition-all backdrop-blur-md">
              Detailed Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
