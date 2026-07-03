import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, User, Pill, Send, X, Clock } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const DoctorPrescriptionPage = () => {
  const { user, token } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedPatsient, setSelectedPatsient] = useState<any>(null);
  const [patsientSearch, setPatsientSearch] = useState('');
  const [patsientHistory, setPatsientHistory] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    patsientId: '',
    medicine: '',
    dosage: '',
    timing: '',
    notes: ''
  });

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const docRes = await axios.get('http://localhost:5000/api/doctor/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const doctor = docRes.data;
      
      if (doctor) {
        const [preRes, histRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/doctor/${doctor.id}/prescriptions`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://localhost:5000/api/doctor/patsients/history`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setPrescriptions(preRes.data);
        setPatsientHistory(histRes.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPrescriptions = prescriptions.filter(rx => 
    rx.patsient.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rx.medicine.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPatsients = patsientHistory.filter(p => 
    p.user.name.toLowerCase().includes(patsientSearch.toLowerCase()) ||
    p.id.toString().includes(patsientSearch)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:5000/api/doctor/prescriptions`, {
        ...formData,
        patsientId: parseInt(formData.patsientId)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsModalOpen(false);
      setFormData({ patsientId: '', medicine: '', dosage: '', timing: '', notes: '' });
      fetchData();
      alert('Prescription issued successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed to issue prescription');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Prescriptions</h1>
          <p className="text-slate-500">Manage medical records and issue new prescriptions</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all active:scale-95"
        >
          <Plus size={20} />
          <span>New Prescription</span>
        </button>
      </div>

      {/* Main Stats/Search Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel overflow-hidden border border-slate-200/60 shadow-xl bg-white">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Recent Prescriptions</h3>
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" placeholder="Search RX..." 
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr className="text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                    <th className="px-6 py-3">Patient</th>
                    <th className="px-6 py-3">Medicine</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
                  ) : filteredPrescriptions.map((rx) => (
                    <tr key={rx.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 text-sm">{rx.patsient.user.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-700">{rx.medicine}</div>
                        <div className="text-[10px] text-blue-500 font-bold">{rx.dosage} - {rx.timing}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">{new Date(rx.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Patient Directory Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel overflow-hidden border border-slate-200/60 shadow-xl bg-white h-full flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">My Patients</h3>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" placeholder="Search patsients..." 
                  value={patsientSearch} onChange={(e) => setPatsientSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[400px] p-2 space-y-1">
              {filteredPatsients.map(p => (
                <button 
                  key={p.id}
                  onClick={() => setSelectedPatsient(p)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                    {p.user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{p.user.name}</div>
                    <div className="text-[10px] text-slate-400">#PT-{p.id}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Patient History Modal */}
      {selectedPatsient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h2 className="text-xl font-bold">{selectedPatsient.user.name}</h2>
                <p className="text-slate-400 text-xs">Patsient Medical Records & History</p>
              </div>
              <button onClick={() => setSelectedPatsient(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Total Payments</div>
                  <div className="text-2xl font-black text-slate-900">
                    ${selectedPatsient.payments.reduce((sum: number, p: any) => sum + p.amount, 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Prescriptions</div>
                  <div className="text-2xl font-black text-slate-900">{selectedPatsient.prescriptions.length}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 border-b pb-2">Prescription History</h3>
                {selectedPatsient.prescriptions.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-4">No prescriptions issued yet.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedPatsient.prescriptions.map((rx: any) => (
                      <div key={rx.id} className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex justify-between items-start">
                        <div>
                          <div className="font-bold text-slate-900">{rx.medicine}</div>
                          <div className="text-xs text-blue-600 font-bold">{rx.dosage} • {rx.timing}</div>
                          {rx.notes && <p className="mt-1 text-xs text-slate-500 italic">"{rx.notes}"</p>}
                        </div>
                        <div className="text-[10px] text-slate-400">{new Date(rx.createdAt).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 border-b pb-2">Payment History</h3>
                <div className="space-y-2">
                  {selectedPatsient.payments.map((pay: any) => (
                    <div key={pay.id} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${pay.method === 'CARD' ? 'bg-purple-500' : 'bg-green-500'}`}></span>
                        <span className="font-medium text-slate-700">{pay.method}</span>
                      </div>
                      <div className="font-bold text-slate-900">${pay.amount}</div>
                      <div className="text-[10px] text-slate-400">{new Date(pay.createdAt).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => {
                  setFormData({...formData, patsientId: selectedPatsient.id.toString()});
                  setSelectedPatsient(null);
                  setIsModalOpen(true);
                }}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all"
              >
                Write New RX
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Prescription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white">
              <h2 className="text-xl font-bold">Issue New Prescription</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Select Patient</label>
                <select 
                  required value={formData.patsientId}
                  onChange={(e) => setFormData({...formData, patsientId: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                >
                  <option value="">Choose a patient...</option>
                  {patsientHistory.map(p => (
                    <option key={p.id} value={p.id}>{p.user.name} (#PT-{p.id})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Medicine Name</label>
                <input 
                  type="text" required value={formData.medicine}
                  onChange={(e) => setFormData({...formData, medicine: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                  placeholder="e.g. Amoxicillin"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Dosage</label>
                  <input 
                    type="text" required value={formData.dosage}
                    onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="e.g. 500mg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Timing</label>
                  <input 
                    type="text" required value={formData.timing}
                    onChange={(e) => setFormData({...formData, timing: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="e.g. After breakfast"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Additional Notes</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none h-24 resize-none"
                  placeholder="Instructions for the patient..."
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
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  Issue RX
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPrescriptionPage;
