import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, Search, Calendar, User, Pill, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const PatsientPrescriptionsPage = () => {
  const { user: authUser, token } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPrescriptions = async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const patientResponse = await axios.get(`http://localhost:5000/api/patsient/${authUser.id}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const response = await axios.get(`http://localhost:5000/api/patsient/${patientResponse.data.id}/prescriptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrescriptions(response.data);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const handleDownload = (prescription: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Prescription - ${prescription.id}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 40px; }
            .hospital { font-size: 24px; font-bold: bold; color: #2563eb; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
            .label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: bold; }
            .value { font-size: 16px; font-weight: bold; margin-top: 4px; }
            .rx-section { background: #f8fafc; padding: 30px; border-radius: 12px; }
            .rx-icon { font-size: 32px; color: #2563eb; margin-bottom: 10px; }
            .medicine { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
            .dosage { font-size: 16px; color: #334155; margin-bottom: 20px; }
            .notes { border-top: 1px solid #e2e8f0; padding-top: 20px; font-style: italic; color: #475569; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="hospital">ANTIGRAVITY MEDICAL CENTER</div>
            <p>123 Healthcare Way, Tashkent, Uzbekistan</p>
          </div>
          <div class="details">
            <div>
              <div class="label">Patient</div>
              <div class="value">${authUser?.name}</div>
            </div>
            <div>
              <div class="label">Doctor</div>
              <div class="value">Dr. ${prescription.doctor.user.name}</div>
            </div>
            <div>
              <div class="label">Date</div>
              <div class="value">${new Date(prescription.createdAt).toLocaleDateString()}</div>
            </div>
            <div>
              <div class="label">Prescription ID</div>
              <div class="value">#RX-${prescription.id}</div>
            </div>
          </div>
          <div class="rx-section">
            <div class="rx-icon">Rx</div>
            <div class="medicine">${prescription.medicine}</div>
            <div class="dosage"><strong>Dosage:</strong> ${prescription.dosage}</div>
            <div class="notes"><strong>Notes:</strong> ${prescription.notes || 'No additional notes provided.'}</div>
          </div>
          <div class="footer">
            This is a computer-generated document. Digital signature verified.
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filtered = prescriptions.filter(p => 
    p.medicine.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.doctor.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Prescriptions</h1>
        <p className="text-slate-500">View and download your medical prescriptions</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by medicine or doctor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 font-medium">Fetching your medical records...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center glass-panel border-dashed border-2 border-slate-200">
            <FileText className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 font-bold text-lg">No prescriptions found</p>
            <p className="text-slate-400 text-sm">Your medical records will appear here once issued by a doctor.</p>
          </div>
        ) : (
          filtered.map((rx) => (
            <div key={rx.id} className="glass-panel p-6 shadow-xl hover:shadow-2xl transition-all border border-slate-100 group flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                  <Pill size={24} />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Issued Date</span>
                  <span className="text-sm font-bold text-slate-700">{new Date(rx.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-1">{rx.medicine}</h3>
              <p className="text-sm text-blue-600 font-bold mb-4">{rx.dosage}</p>

              <div className="space-y-3 mb-6 flex-grow">
                <div className="flex items-center gap-2 text-slate-600">
                  <User size={14} className="text-slate-400" />
                  <span className="text-xs font-medium">Dr. {rx.doctor.user.name}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 italic leading-relaxed">
                  "{rx.notes || 'Follow general healthcare guidelines.'}"
                </div>
              </div>

              <div className="flex gap-2 mt-auto">
                <button 
                  onClick={() => handleDownload(rx)}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95"
                >
                  <Download size={16} /> Download PDF
                </button>
                <button 
                  onClick={() => handleDownload(rx)} // Same as print for now
                  className="p-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <Printer size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PatsientPrescriptionsPage;
