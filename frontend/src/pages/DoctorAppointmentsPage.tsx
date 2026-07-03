import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, MoreVertical, Search, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const DoctorAppointmentsPage = () => {
  const { user, token } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Calendar state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());

  const fetchAppointments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const docRes = await axios.get('http://localhost:5000/api/doctor/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const doctor = docRes.data;
      
      if (doctor) {
        const response = await axios.get(`http://localhost:5000/api/doctor/${doctor.id}/appointments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAppointments(response.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [prescriptionData, setPrescriptionData] = useState({
    medicine: '',
    dosage: '',
    timing: '',
    notes: '',
    amount: '50000'
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedPatientProfile, setSelectedPatientProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const handleComplete = async (id: number) => {
    setSelectedAppId(id);
    setShowPrescriptionModal(true);
  };

  const submitPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) return;

    const app = appointments.find(a => a.id === selectedAppId);
    if (!app) return;

    try {
      // 1. Create prescription
      await axios.post('http://localhost:5000/api/doctor/prescriptions', {
        ...prescriptionData,
        appointmentId: selectedAppId,
        doctorId: app.doctorId,
        patsientId: app.patsientId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 2. Mark appointment as completed
      await axios.put(`http://localhost:5000/api/doctor/appointments/${selectedAppId}`, { status: 'COMPLETED' }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowPrescriptionModal(false);
      setPrescriptionData({ medicine: '', dosage: '', timing: '', notes: '', amount: '50000' });
      fetchAppointments();
      alert('Prescription saved and appointment completed!');
    } catch (error: any) {
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed to complete appointment');
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await axios.put(`http://localhost:5000/api/doctor/appointments/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAppointments();
    } catch (error: any) {
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleReschedule = async (id: number) => {
    const newDateStr = prompt("Enter new date and time (YYYY-MM-DD HH:MM):", new Date().toISOString().slice(0, 16).replace('T', ' '));
    if (!newDateStr) return;
    const newDate = new Date(newDateStr);
    if (isNaN(newDate.getTime())) {
      alert("Invalid date format");
      return;
    }

    try {
      await axios.put(`http://localhost:5000/api/doctor/appointments/${id}`, { date: newDate.toISOString() }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAppointments();
      alert('Appointment rescheduled');
    } catch (error: any) {
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed to reschedule');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/doctor/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAppointments();
      alert('Appointment deleted');
    } catch (error: any) {
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed to delete');
    }
  };

  const handleViewProfile = async (patsientId: number) => {
    setLoadingProfile(true);
    setShowProfileModal(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/doctor/patsients/${patsientId}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedPatientProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Calendar helpers
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const prevMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const filteredAppointments = appointments.filter(app => {
    const appDate = new Date(app.date);
    return appDate.getDate() === selectedDate.getDate() &&
           appDate.getMonth() === selectedDate.getMonth() &&
           appDate.getFullYear() === selectedDate.getFullYear();
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Schedule</h1>
          <p className="text-slate-500">Manage your patient appointments and consultations</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
          <Calendar className="text-blue-600" size={20} />
          <span className="font-bold text-blue-700">{selectedDate.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Calendar Section */}
        <div className="xl:col-span-1 space-y-6">
          <div className="glass-panel p-6 shadow-xl border border-slate-200/60 bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-800">
                {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                <div key={d} className="text-[10px] font-black text-slate-400 uppercase py-2">{d}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {prevMonthDays.map(d => <div key={`empty-${d}`} className="aspect-square bg-slate-50/50 rounded-lg"></div>)}
              {days.map(d => {
                const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === viewDate.getMonth() && selectedDate.getFullYear() === viewDate.getFullYear();
                const hasApp = appointments.some(a => {
                  const ad = new Date(a.date);
                  return ad.getDate() === d && ad.getMonth() === viewDate.getMonth() && ad.getFullYear() === viewDate.getFullYear();
                });

                return (
                  <div 
                    key={d} 
                    onClick={() => setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), d))}
                    className={`aspect-square flex items-center justify-center rounded-xl border transition-all cursor-pointer relative
                      ${isSelected ? 'border-blue-500 bg-blue-600 text-white shadow-lg' : 'border-transparent hover:bg-blue-50 text-slate-600'}
                    `}
                  >
                    <span className="text-xs font-bold">{d}</span>
                    {hasApp && !isSelected && (
                      <div className="absolute bottom-1.5 w-1 h-1 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="p-6 border border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-600/30 rounded-2xl">
            <h4 className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1 text-white">Today's Summary</h4>
            <div className="text-3xl font-black text-white">{appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).length}</div>
            <p className="text-xs opacity-80 text-white">Total appointments scheduled for today</p>
          </div>
        </div>

        {/* Appointments List Section */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">
              {selectedDate.toDateString() === new Date().toDateString() ? "Today's Appointments" : `Appointments for ${selectedDate.toLocaleDateString()}`}
            </h3>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
              {filteredAppointments.length} Total
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <p className="col-span-full text-center py-12 text-slate-400">Loading appointments...</p>
            ) : filteredAppointments.length === 0 ? (
              <div className="col-span-full py-20 text-center glass-panel border-dashed border-2 border-slate-200 bg-white/50">
                <Clock className="mx-auto text-slate-200 mb-4" size={48} />
                <p className="text-slate-500 font-bold text-lg">No appointments scheduled</p>
                <p className="text-slate-400 text-sm">Select another date to view your schedule.</p>
              </div>
            ) : (
              filteredAppointments.map((app) => (
                <div key={app.id} className="glass-panel p-6 shadow-lg hover:shadow-xl transition-all border border-slate-100 flex flex-col group bg-white">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center text-slate-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      {app.patsient.user.image ? (
                        <img src={app.patsient.user.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        app.patsient.user.name.charAt(0)
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        app.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                        app.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {app.status}
                      </span>
                      {app.status === 'PENDING' && (
                        <button 
                          onClick={() => handleUpdateStatus(app.id, 'CANCELLED')}
                          className="text-[10px] text-red-600 hover:underline font-bold"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-1">{app.patsient.user.name}</h3>
                  <div className="flex flex-col gap-1 mb-4">
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <Clock size={14} className="text-slate-400" />
                      {new Date(app.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">Patient ID: #PT-{app.patsient.id}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl mb-6 flex-grow">
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-1 tracking-widest">Reason for Visit</p>
                    <p className="text-sm text-slate-700 line-clamp-2 italic font-medium">"{app.reason || 'General checkup'}"</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      {app.status === 'PENDING' && (
                        <button 
                          onClick={() => handleComplete(app.id)}
                          className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-green-700 transition-all active:scale-95 shadow-md shadow-green-600/20"
                        >
                          Complete
                        </button>
                      )}
                      <button 
                        onClick={() => handleReschedule(app.id)}
                        className="flex-1 bg-blue-50 text-blue-600 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                      >
                        Reschedule
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleViewProfile(app.patsientId)}
                        className="flex-1 bg-white border border-slate-200 text-slate-600 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all active:scale-95"
                      >
                        View Profile
                      </button>
                      <button 
                        onClick={() => handleDelete(app.id)}
                        className="flex-1 bg-white border border-red-100 text-red-600 py-2.5 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all active:scale-95"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {/* Prescription Modal */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white">
              <h2 className="text-xl font-bold">Write Prescription</h2>
              <button onClick={() => setShowPrescriptionModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={submitPrescription} className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Medicine Name</label>
                <input 
                  type="text" required value={prescriptionData.medicine}
                  onChange={(e) => setPrescriptionData({...prescriptionData, medicine: e.target.value})}
                  placeholder="e.g. Paracetamol"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Dosage</label>
                  <input 
                    type="text" required value={prescriptionData.dosage}
                    onChange={(e) => setPrescriptionData({...prescriptionData, dosage: e.target.value})}
                    placeholder="e.g. 500mg"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Timing/Frequency</label>
                  <input 
                    type="text" required value={prescriptionData.timing}
                    onChange={(e) => setPrescriptionData({...prescriptionData, timing: e.target.value})}
                    placeholder="e.g. 3 times a day"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Description/Notes</label>
                <textarea 
                  value={prescriptionData.notes}
                  onChange={(e) => setPrescriptionData({...prescriptionData, notes: e.target.value})}
                  placeholder="Additional instructions..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none h-24" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Konsultatsiya narxi (UZS)</label>
                <input 
                  type="number" required value={prescriptionData.amount}
                  onChange={(e) => setPrescriptionData({...prescriptionData, amount: e.target.value})}
                  placeholder="e.g. 50000"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-blue-600" 
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" onClick={() => setShowPrescriptionModal(false)}
                  className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all"
                >
                  Save & Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <h2 className="text-xl font-bold">Patient Profile</h2>
              <button onClick={() => setShowProfileModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              {loadingProfile ? (
                <p className="text-center py-12 text-slate-400">Loading profile data...</p>
              ) : selectedPatientProfile ? (
                <>
                  <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                    <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold">
                      {selectedPatientProfile.user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{selectedPatientProfile.user.name}</h3>
                      <p className="text-slate-500">{selectedPatientProfile.user.email}</p>
                      <p className="text-sm font-bold text-blue-600">ID: #PT-{selectedPatientProfile.id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Phone</p>
                      <p className="text-sm font-bold text-slate-700">{selectedPatientProfile.user.phone || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Address</p>
                      <p className="text-sm font-bold text-slate-700">{selectedPatientProfile.user.address || 'N/A'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Medical History (Prescriptions)</h4>
                    <div className="space-y-3">
                      {selectedPatientProfile.prescriptions.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">No previous prescriptions</p>
                      ) : (
                        selectedPatientProfile.prescriptions.map((p: any) => (
                          <div key={p.id} className="p-4 border border-slate-100 rounded-xl">
                            <div className="flex justify-between mb-1">
                              <span className="font-bold text-slate-900">{p.medicine}</span>
                              <span className="text-[10px] text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-slate-600">{p.dosage} • {p.timing}</p>
                            <p className="text-xs text-slate-400 mt-2 italic">"{p.notes}"</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-center text-red-500">Failed to load profile</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointmentsPage;
