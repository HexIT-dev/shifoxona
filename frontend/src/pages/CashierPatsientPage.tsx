import React, { useState, useEffect } from 'react';
import { UserPlus, Search, User, Mail, Phone, MapPin, Plus, X, Calendar, Clock } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const CashierPatsientPage = () => {
  const [activeTab, setActiveTab] = useState<'patsients' | 'appointments'>('patsients');
  const [patsients, setPatsients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [doctors, setDoctors] = useState<any[]>([]);
  const { token } = useAuth();

  type ModalMode = 'REGISTER' | 'EDIT' | 'BOOK' | 'REGISTER_AND_BOOK';
  const [modalMode, setModalMode] = useState<ModalMode>('REGISTER');
  const [selectedPatsientId, setSelectedPatsientId] = useState<number | null>(null);
  const [editingPatsient, setEditingPatsient] = useState<any>(null);

  const formatDateTimeLocal = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    doctorId: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    reason: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'patsients') {
        const response = await axios.get('http://localhost:5000/api/cashier/patsients', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPatsients(response.data);
      } else {
        const response = await axios.get('http://localhost:5000/api/cashier/appointments', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAppointments(response.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/user/doctors/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchData();
    if (doctors.length === 0) fetchDoctors();
  }, [activeTab]);

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', phone: '', address: '', doctorId: '', date: new Date().toISOString().split('T')[0], time: '09:00', reason: '' });
    setSelectedPatsientId(null);
    setEditingPatsient(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === 'EDIT') {
        await axios.put(`http://localhost:5000/api/cashier/patsients/${editingPatsient.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Patsient updated successfully!');
      } else if (modalMode === 'BOOK') {
        const combinedDateTime = new Date(`${formData.date}T${formData.time}:00`);
        await axios.post(`http://localhost:5000/api/cashier/appointments`, {
          ...formData,
          dateTime: combinedDateTime.toISOString(),
          patsientId: selectedPatsientId
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Appointment booked successfully!');
      } else {
        const endpoint = modalMode === 'REGISTER_AND_BOOK' ? 'register-and-book' : 'patsients';
        const combinedDateTime = new Date(`${formData.date}T${formData.time}:00`);
        await axios.post(`http://localhost:5000/api/cashier/${endpoint}`, {
          ...formData,
          dateTime: combinedDateTime.toISOString()
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert(modalMode === 'REGISTER_AND_BOOK' ? 'Patsient registered and appointment booked!' : 'Patsient registered successfully!');
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed to process request');
    }
  };

  const openEditModal = (patsient: any) => {
    setEditingPatsient(patsient);
    setModalMode('EDIT');
    setFormData({
      ...formData,
      name: patsient.user.name,
      email: patsient.user.email,
      phone: patsient.user.phone || '',
      address: patsient.user.address || '',
    });
    setIsModalOpen(true);
  };

  const openBookModal = (patsient: any) => {
    setSelectedPatsientId(patsient.id);
    setModalMode('BOOK');
    setIsModalOpen(true);
  };

  const filteredPatsients = patsients.filter(p => 
    p.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toString().includes(searchTerm) ||
    (p.user.phone && p.user.phone.includes(searchTerm))
  );

  const filteredAppointments = appointments.filter(a => 
    a.patsient.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.doctor.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Registration & Booking</h1>
          <p className="text-slate-500">Register patients and manage appointments</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { resetForm(); setModalMode('REGISTER'); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-5 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all active:scale-95"
          >
            <UserPlus size={20} />
            <span>Register Patsient</span>
          </button>
          <button 
            onClick={() => { resetForm(); setModalMode('REGISTER_AND_BOOK'); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-green-600/20 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>Register & Book</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-slate-200/50 w-fit rounded-xl">
        <button 
          onClick={() => setActiveTab('patsients')}
          className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'patsients' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Registered Patsients
        </button>
        <button 
          onClick={() => setActiveTab('appointments')}
          className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'appointments' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Appointments List
        </button>
      </div>

      <div className="glass-panel overflow-hidden border border-slate-200/60 shadow-xl bg-white/50">
        <div className="p-6 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'patsients' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                  <th className="px-6 py-4">Patsient Details</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Address</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/40">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">Loading patsients...</td></tr>
                ) : patsients.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">No patsients registered</td></tr>
                ) : (
                  filteredPatsients.map((p) => (
                    <tr key={p.id} className="hover:bg-green-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                            {p.user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{p.user.name}</div>
                            <div className="text-[10px] font-bold text-slate-400">#PT-{p.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Mail size={12} className="text-slate-400" /> {p.user.email}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                            <Phone size={12} className="text-slate-400" /> {p.user.phone || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500 flex items-center gap-1.5">
                          <MapPin size={14} /> {p.user.address || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openBookModal(p)}
                            className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 hover:text-white transition-all"
                          >
                            Book Appt
                          </button>
                          <button 
                            onClick={() => openEditModal(p)}
                            className="text-slate-400 hover:text-slate-900 transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                  <th className="px-6 py-4">Patsient</th>
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/40">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">Loading appointments...</td></tr>
                ) : appointments.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">No appointments found</td></tr>
                ) : (
                  filteredAppointments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{a.patsient.user.name}</div>
                        <div className="text-xs text-slate-500">#{a.id} • {a.reason || 'Checkup'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-700">Dr. {a.doctor.user.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-sm text-slate-600">
                          <span className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-400" /> {new Date(a.date).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1.5 font-bold"><Clock size={14} className="text-slate-400" /> {new Date(a.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                          a.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                          a.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Unified Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-green-600 text-white">
              <h2 className="text-xl font-bold">
                {modalMode === 'EDIT' ? 'Edit Patsient' : 
                 modalMode === 'BOOK' ? 'Book Appointment' : 
                 modalMode === 'REGISTER_AND_BOOK' ? 'Register & Book' : 'Register New Patsient'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-4 max-h-[80vh] overflow-y-auto">
              {(modalMode !== 'BOOK') && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-slate-700">Full Name</label>
                      <input 
                        type="text" required value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-slate-700">Email Address</label>
                      <input 
                        type="email" required value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 outline-none" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-slate-700">Phone</label>
                      <input 
                        type="text" required value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 outline-none" 
                      />
                    </div>
                    {modalMode === 'REGISTER' || modalMode === 'REGISTER_AND_BOOK' ? (
                      <div className="space-y-1">
                        <label className="text-sm font-bold text-slate-700">Set Password</label>
                        <input 
                          type="text" required value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          placeholder="e.g. Pass@123"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 outline-none font-mono" 
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="text-sm font-bold text-slate-700">Address</label>
                        <input 
                          type="text" value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 outline-none" 
                        />
                      </div>
                    )}
                  </div>
                  {modalMode !== 'EDIT' && (
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-slate-700">Address</label>
                      <input 
                        type="text" value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 outline-none" 
                      />
                    </div>
                  )}
                </>
              )}

              {(modalMode === 'BOOK' || modalMode === 'REGISTER_AND_BOOK') && (
                <div className="pt-4 mt-4 border-t border-slate-100 space-y-4">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Appointment Details</h3>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Select Doctor</label>
                    <select 
                      required value={formData.doctorId}
                      onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 outline-none"
                    >
                      <option value="">Choose a doctor...</option>
                      {doctors.map(doc => (
                        <option key={doc.id} value={doc.id}>Dr. {doc.user.name} ({doc.specialty})</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-slate-700">Date</label>
                      <input 
                        type="date" required value={formData.date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-slate-700">Time Slot</label>
                      <select 
                        required value={formData.time}
                        onChange={(e) => setFormData({...formData, time: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 outline-none"
                      >
                        {['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Reason</label>
                    <input 
                      type="text" required value={formData.reason}
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 outline-none" 
                      placeholder="e.g. Checkup"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-600/30 transition-all"
                >
                  {modalMode === 'EDIT' ? 'Update Details' : 
                   modalMode === 'BOOK' ? 'Confirm Booking' : 
                   'Register Patsient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierPatsientPage;
