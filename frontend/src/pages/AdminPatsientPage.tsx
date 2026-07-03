import React, { useState, useEffect } from 'react';
import { Search, User, Mail, Phone, MapPin, Briefcase, Filter } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminPatsientPage = () => {
  const [patsients, setPatsients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { token } = useAuth();

  const fetchPatsients = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/admin/patsients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatsients(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatsients();
  }, []);

  const filteredPatsients = patsients.filter(p => 
    p.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Patsient Directory</h1>
        <p className="text-slate-500">View and manage all registered patsients in the system</p>
      </div>

      <div className="glass-panel overflow-hidden border border-slate-200/60 shadow-xl bg-white/50">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, email or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-slate-600 font-bold text-sm">
            <span>{filteredPatsients.length} Patsients</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                <th className="px-6 py-4">Patsient Details</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Registered By</th>
                <th className="px-6 py-4">Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/40">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Loading directory...</td></tr>
              ) : filteredPatsients.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">No patsients found</td></tr>
              ) : (
                filteredPatsients.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
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
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg w-fit">
                        <Briefcase size={12} />
                        {p.user.createdBy?.name || 'Self/Admin'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">Role: {p.user.createdBy?.role || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500 flex items-center gap-1.5">
                        <MapPin size={14} className="text-slate-400" /> {p.user.address || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPatsientPage;
