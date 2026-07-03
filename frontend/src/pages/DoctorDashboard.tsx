import React, { useState, useEffect } from 'react';
import { Activity, Calendar, Clock, User, ArrowRight, CheckCircle, Search } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [stats, setStats] = useState({ today: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/doctor/appointments', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const all = res.data;
        const todayStr = new Date().toDateString();
        const todayApps = all.filter((a: any) => new Date(a.date).toDateString() === todayStr);
        
        setAppointments(todayApps);
        setStats({
          today: todayApps.length,
          pending: todayApps.filter((a: any) => a.status === 'PENDING').length,
          completed: todayApps.filter((a: any) => a.status === 'COMPLETED').length
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-400">Loading dashboard...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Doctor Dashboard</h1>
          <p className="text-slate-500">You have {stats.pending} patients waiting for you today.</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 bg-white border-l-4 border-blue-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Calendar size={24}/></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Today's Total</p>
              <p className="text-2xl font-black text-slate-900">{stats.today}</p>
            </div>
          </div>
        </div>
        <div className="glass-panel p-6 bg-white border-l-4 border-orange-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><Clock size={24}/></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Pending</p>
              <p className="text-2xl font-black text-slate-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="glass-panel p-6 bg-white border-l-4 border-green-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-xl"><CheckCircle size={24}/></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Completed</p>
              <p className="text-2xl font-black text-slate-900">{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel bg-white overflow-hidden shadow-xl border border-slate-100">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Activity size={20} className="text-blue-500" /> Today's Schedule
          </h3>
          <Link to="/doctor/appointments" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
            Manage All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="divide-y divide-slate-50">
          {appointments.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No appointments scheduled for today.</div>
          ) : (
            appointments.map((app) => (
              <div key={app.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                    {app.patsient.user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{app.patsient.user.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={12} /> {new Date(app.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {app.reason}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                    app.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {app.status}
                  </span>
                  <Link 
                    to="/doctor/appointments" 
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
