import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, MoreVertical, Clock, User, CheckCircle, XCircle, Briefcase } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminAppointmentPage = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [doctorFilter, setDoctorFilter] = useState('ALL');
  const [cashierFilter, setCashierFilter] = useState('ALL');
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [cashiersList, setCashiersList] = useState<any[]>([]);
  const { token } = useAuth();

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/admin/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(response.data);
      
      // Extract unique doctors and cashiers for filtering
      const uniqueDocs = Array.from(new Set(response.data.map((a: any) => a.doctor.user.name)));
      setDoctorsList(uniqueDocs);
      
      const uniqueCashiers = Array.from(new Set(response.data.map((a: any) => a.patsient.user.createdBy?.name).filter(Boolean)));
      setCashiersList(uniqueCashiers);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const filteredAppointments = appointments.filter(app => {
    const matchesSearch = 
      app.patsient.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.doctor.user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    const matchesDoctor = doctorFilter === 'ALL' || app.doctor.user.name === doctorFilter;
    const matchesCashier = cashierFilter === 'ALL' || app.patsient.user.createdBy?.name === cashierFilter;
    return matchesSearch && matchesStatus && matchesDoctor && matchesCashier;
  });

  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientHistory, setPatientHistory] = useState<any>(null);

  const fetchPatientDetails = async (patientId: number) => {
    try {
      const [appRes, payRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/patsient/${patientId}/appointments`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/api/patsient/${patientId}/payments`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setPatientHistory({ appointments: appRes.data, payments: payRes.data });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientDetails(selectedPatient.id);
    } else {
      setPatientHistory(null);
    }
  }, [selectedPatient]);

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/appointments/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAppointments();
    } catch (error: any) {
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Appointments Management</h1>
        <p className="text-slate-500">Overview of all hospital appointments and schedules</p>
      </div>

      <div className="glass-panel p-6 shadow-xl border border-slate-200/60">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by patient or doctor name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none font-medium"
              >
                <option value="ALL">All Status</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none font-medium"
              >
                <option value="ALL">All Doctors</option>
                {doctorsList.map((doc, idx) => (
                  <option key={idx} value={doc}>{doc}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                value={cashierFilter}
                onChange={(e) => setCashierFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none font-medium"
              >
                <option value="ALL">All Cashiers</option>
                {cashiersList.map((c, idx) => (
                  <option key={idx} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                <th className="px-6 py-4">Patient & Registered By</th>
                <th className="px-6 py-4">Doctor</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Fetching appointments...</td></tr>
              ) : filteredAppointments.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">No appointments found matches your filters</td></tr>
              ) : (
                filteredAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-blue-50/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div 
                        className="font-bold text-slate-900 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => setSelectedPatient(app.patsient)}
                      >
                        {app.patsient.user.name}
                      </div>
                      <div className="text-[10px] text-slate-400">ID: #PT-{app.patsient.id}</div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-blue-600">
                        <Briefcase size={10} />
                        Reg by: {app.patsient.user.createdBy?.name || 'Admin'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">Dr. {app.doctor.user.name}</div>
                      <div className="text-xs text-blue-600 font-medium">{app.doctor.specialty}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-sm">{new Date(app.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 mt-1">
                        <Clock size={14} />
                        <span className="text-xs">{new Date(app.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        app.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        app.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white">
              <div>
                <h2 className="text-xl font-bold">{selectedPatient.user.name}</h2>
                <p className="text-xs opacity-80">Patient History & Medical Records</p>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-8">
              {!patientHistory ? (
                <div className="text-center py-12 text-slate-400">Loading history...</div>
              ) : (
                <>
                  <div>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Visit History</h3>
                    <div className="space-y-3">
                      {patientHistory.appointments.map((app: any) => (
                        <div key={app.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-900">Dr. {app.doctor.user.name}</p>
                            <p className="text-xs text-slate-500">{new Date(app.date).toLocaleDateString()} - {app.reason}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                            app.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                            app.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Financial Summary</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-4 rounded-2xl bg-green-50 border border-green-100">
                        <p className="text-xs text-green-600 font-bold">Total Spent</p>
                        <p className="text-2xl font-black text-green-700">
                          ${patientHistory.payments.reduce((sum: number, p: any) => sum + p.amount, 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                        <p className="text-xs text-blue-600 font-bold">Total Visits</p>
                        <p className="text-2xl font-black text-blue-700">{patientHistory.appointments.length}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {patientHistory.payments.map((p: any) => (
                        <div key={p.id} className="text-xs flex justify-between text-slate-500 py-1 border-b border-slate-50">
                          <span>{new Date(p.createdAt).toLocaleDateString()} - {p.method}</span>
                          <span className="font-bold text-slate-700">${p.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAppointmentPage;
