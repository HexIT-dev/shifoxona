import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Search, DollarSign, User, Receipt, X, CheckCircle, Clock, AlertCircle, Download } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const CashierPaymentPage = () => {
  const [billingList, setBillingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    amount: '50000',
    method: 'Cash'
  });

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/cashier/billing-list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBillingList(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleDownloadReceipt = (appointment: any) => {
    const content = `
HOSPITAL MANAGEMENT SYSTEM - RECEIPT
-----------------------------------
Receipt ID: RCP-${appointment.payments[0]?.id || 'N/A'}
Date: ${new Date().toLocaleString()}
Patsient: ${appointment.patsient.user.name}
Doctor: Dr. ${appointment.doctor.user.name}
Amount: ${appointment.payments[0]?.amount.toLocaleString()} UZS
Payment Method: ${appointment.payments[0]?.method}
Status: PAID
-----------------------------------
Thank you for choosing our clinic!
    `;
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `receipt-${appointment.id}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    try {
      await axios.post('http://localhost:5000/api/cashier/payments', {
        patsientId: selectedAppointment.patsientId,
        appointmentId: selectedAppointment.id,
        amount: parseFloat(formData.amount),
        method: formData.method
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsPayModalOpen(false);
      setSelectedAppointment(null);
      setFormData({ amount: '50000', method: 'Cash' });
      fetchBillingData();
      alert('Payment processed successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed to process payment');
    }
  };

  const filteredList = billingList.filter(item => 
    item.patsient.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toString().includes(searchTerm)
  );

  const stats = {
    total: billingList.reduce((acc, curr) => acc + (curr.payments?.[0]?.amount || 0), 0),
    unpaidCount: billingList.filter(item => item.payments.length === 0).length,
    paidCount: billingList.filter(item => item.payments.length > 0).length
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Billing & Payments</h1>
          <p className="text-slate-500">Manage patient bills and transaction history</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="glass-panel p-6 shadow-xl border border-slate-100 bg-gradient-to-br from-green-600 to-emerald-700 text-white">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Receipt size={20} /> Total Revenue
            </h3>
            <div className="text-3xl font-black mb-1">
              {stats.total.toLocaleString()} UZS
            </div>
            <p className="text-green-100 text-sm">Collected from {stats.paidCount} patients</p>
          </div>
          
          <div className="glass-panel p-6 shadow-lg border border-slate-100 bg-white">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Pending Bills</h3>
            <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                <AlertCircle size={24} />
              </div>
              <div>
                <div className="text-2xl font-black text-orange-700">{stats.unpaidCount}</div>
                <div className="text-xs font-bold text-orange-400 uppercase tracking-wider">Unpaid Appointments</div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="glass-panel overflow-hidden border border-slate-200/60 shadow-xl bg-white h-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Patient Billing List</h3>
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" placeholder="Search by name or ID..." 
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                />
              </div>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr className="text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                    <th className="px-6 py-4">Patient</th>
                    <th className="px-6 py-4">Doctor</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Loading...</td></tr>
                  ) : filteredList.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">No appointments to bill</td></tr>
                  ) : (
                    filteredList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{item.patsient.user.name}</div>
                          <div className="text-[10px] text-slate-400">#PT-{item.patsientId} • {new Date(item.updatedAt).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">Dr. {item.doctor.user.name}</td>
                        <td className="px-6 py-4">
                          {item.payments.length > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
                              <CheckCircle size={10} /> PAID
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold">
                              <Clock size={10} /> UNPAID
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {item.payments.length > 0 ? (
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => { setSelectedAppointment(item); setIsDetailsModalOpen(true); }}
                                className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                              >
                                View
                              </button>
                              <button 
                                onClick={() => handleDownloadReceipt(item)}
                                className="text-xs font-bold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg hover:bg-slate-200 transition-all flex items-center gap-1"
                              >
                                <Download size={14} />
                                TXT
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => { 
                                setSelectedAppointment(item); 
                                setFormData({ ...formData, amount: item.amount });
                                setIsPayModalOpen(true); 
                              }}
                              className="bg-orange-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-700 transition-all shadow-md shadow-orange-600/20"
                            >
                              Process Pay
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Process Payment Modal */}
      {isPayModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-orange-600 text-white">
              <h2 className="text-xl font-bold">New Payment</h2>
              <button onClick={() => setIsPayModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleProcessPayment} className="p-8 space-y-6">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <User size={24} />
                </div>
                <div>
                  <div className="font-black text-slate-900">{selectedAppointment.patsient.user.name}</div>
                  <div className="text-xs text-slate-500">Service: Dr. {selectedAppointment.doctor.user.name}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Amount (UZS)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="number" required value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 outline-none font-bold" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Method</label>
                  <select 
                    value={formData.method}
                    onChange={(e) => setFormData({...formData, method: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 outline-none"
                  >
                    <option value="Cash">Cash (Naqd)</option>
                    <option value="Card">Card (Karta)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" onClick={() => setIsPayModalOpen(false)}
                  className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-600/30 transition-all"
                >
                  Pay Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedAppointment && selectedAppointment.payments[0] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-green-600 text-white">
              <h2 className="text-xl font-bold">Payment Receipt</h2>
              <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Payment Successful</h3>
                <p className="text-slate-500 text-sm">Transaction #PAY-{selectedAppointment.payments[0].id}</p>
              </div>

              <div className="space-y-4 border-y border-slate-100 py-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Patsient Name</span>
                  <span className="font-bold text-slate-900">{selectedAppointment.patsient.user.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Doctor</span>
                  <span className="font-bold text-slate-900">Dr. {selectedAppointment.doctor.user.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Date</span>
                  <span className="font-bold text-slate-900">{new Date(selectedAppointment.payments[0].createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Method</span>
                  <span className="font-bold text-slate-900">{selectedAppointment.payments[0].method}</span>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-dashed">
                  <span className="font-bold text-slate-900">Amount Paid</span>
                  <span className="font-black text-green-600">{selectedAppointment.payments[0].amount.toLocaleString()} UZS</span>
                </div>
              </div>

              <button 
                onClick={() => setIsDetailsModalOpen(false)}
                className="w-full px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierPaymentPage;
