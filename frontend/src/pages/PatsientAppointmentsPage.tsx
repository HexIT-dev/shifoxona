import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Clock, User, Plus, X, 
  ChevronLeft, ChevronRight, CheckCircle, Info, Stethoscope
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const PatsientAppointmentsPage = () => {
  const { user: authUser, token } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Calendar state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());

  // Booking state
  const [bookingData, setBookingData] = useState({
    doctorId: '',
    reason: '',
    time: '10:00'
  });

  const fetchData = async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      // Get current patient profile using the token
      const patientResponse = await axios.get(`http://localhost:5000/api/patsient/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const patientId = patientResponse.data.id;

      const [appRes, docRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/patsient/${patientId}/appointments`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/api/user/doctors/list`, { // Shared endpoint
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setAppointments(appRes.data);
      setDoctors(docRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Get current patient profile using the token
      const patientResponse = await axios.get(`http://localhost:5000/api/patsient/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const appointmentDate = new Date(selectedDate);
      const [hours, minutes] = bookingData.time.split(':');
      appointmentDate.setHours(parseInt(hours), parseInt(minutes));

      await axios.post(`http://localhost:5000/api/patsient/appointments`, {
        patsientId: patientResponse.data.id,
        doctorId: parseInt(bookingData.doctorId),
        date: appointmentDate.toISOString(),
        reason: bookingData.reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsModalOpen(false);
      fetchData();
      alert('Appointment booked successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed to book appointment');
    }
  };

  // Simple calendar helpers
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const prevMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Appointments</h1>
          <p className="text-slate-500">View and manage your scheduled hospital visits</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all active:scale-95"
        >
          <Plus size={20} />
          <span>Book New Appointment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          {/* Doctors Info Section */}
          <div className="glass-panel p-8 shadow-xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Stethoscope className="text-blue-600" size={22} />
              Meet Our Specialists
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctors.map(doc => (
                <div key={doc.id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
                    <img src={doc.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.user.name}`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-bold text-slate-900">Dr. {doc.user.name}</h4>
                    <p className="text-xs text-blue-600 font-bold mb-1">{doc.specialty}</p>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{doc.user.email}</p>
                  </div>
                  <button 
                    onClick={() => { setBookingData({...bookingData, doctorId: doc.id.toString()}); setIsModalOpen(true); }}
                    className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 shadow-xl border border-slate-200/60">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <CalendarIcon className="text-blue-600" size={22} />
              Appointment Calendar
            </h3>
            
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold text-lg text-slate-800">
                {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h4>
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
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-xs font-bold text-slate-400 uppercase py-2">{d}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {prevMonthDays.map(d => <div key={`empty-${d}`} className="h-24 bg-slate-50/50 rounded-lg"></div>)}
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
                    className={`h-24 p-2 rounded-xl border transition-all cursor-pointer relative group
                      ${isSelected ? 'border-blue-500 bg-blue-50/50 shadow-inner' : 'border-slate-100 hover:border-blue-200 hover:bg-blue-50/20'}
                    `}
                  >
                    <span className={`text-sm font-bold ${isSelected ? 'text-blue-600' : 'text-slate-600'}`}>{d}</span>
                    {hasApp && (
                      <div className="mt-1">
                        <div className="w-full h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                        <div className="text-[10px] text-blue-600 font-bold mt-1 truncate">Visit Booked</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="xl:col-span-1 space-y-6">
          <div className="glass-panel p-6 shadow-xl border border-slate-200/60 bg-white/80">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Upcoming Visits</h3>
            <div className="space-y-4">
              {loading ? (
                <p className="text-center text-slate-400 py-8">Loading visits...</p>
              ) : appointments.length === 0 ? (
                <div className="text-center py-8 px-4 border-2 border-dashed border-slate-100 rounded-2xl">
                  <Info className="mx-auto text-slate-300 mb-2" size={32} />
                  <p className="text-slate-400 text-sm font-medium">No upcoming appointments scheduled</p>
                </div>
              ) : (
                appointments.map((app) => (
                  <div key={app.id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                        {app.status}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(app.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                        {app.doctor.user.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Dr. {app.doctor.user.name}</h4>
                        <p className="text-xs text-slate-500">{app.doctor.specialty}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs font-medium text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-slate-400" />
                        {new Date(app.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <button 
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to cancel this appointment? Note: You can only cancel 5 appointments per month.')) {
                            try {
                              await axios.put(`http://localhost:5000/api/patsient/appointments/${app.id}`, { 
                                status: 'CANCELLED',
                                patsientId: app.patsientId 
                              }, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              fetchData();
                            } catch (err: any) {
                              alert(err.response?.data?.error || 'Failed to cancel appointment');
                            }
                          }
                        }}
                        className="text-red-600 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white">
              <h2 className="text-xl font-bold">Book Appointment</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleBooking} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Select Doctor</label>
                <select 
                  required 
                  value={bookingData.doctorId}
                  onChange={(e) => setBookingData({...bookingData, doctorId: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                >
                  <option value="">Choose a specialist...</option>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.user.name} ({doc.specialty})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Date</label>
                  <input 
                    type="date" 
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Time</label>
                  <select 
                    value={bookingData.time}
                    onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                  >
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Reason for Visit</label>
                <textarea 
                  value={bookingData.reason}
                  onChange={(e) => setBookingData({...bookingData, reason: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none h-24 resize-none"
                  placeholder="Tell us about your symptoms..."
                ></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!bookingData.doctorId}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatsientAppointmentsPage;
