import React, { useState, useEffect } from 'react';
import { CreditCard, Download, Receipt, Search, Filter, ArrowUpRight, CheckCircle, Clock, X, Printer } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const PatsientPaymentPage = () => {
  const { user: authUser, token } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const fetchPayments = async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const patientResponse = await axios.get(`http://localhost:5000/api/patsient/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const response = await axios.get(`http://localhost:5000/api/patsient/${patientResponse.data.id}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handlePrintReceipt = (p: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${p.id}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; max-width: 600px; margin: auto; }
            .receipt-box { border: 2px solid #e2e8f0; border-radius: 20px; padding: 40px; }
            .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 20px; margin-bottom: 30px; }
            .hospital { font-size: 20px; font-weight: bold; color: #2563eb; }
            .amount { font-size: 48px; font-weight: 800; text-align: center; margin: 30px 0; color: #0f172a; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 14px; }
            .label { color: #64748b; }
            .value { font-weight: bold; }
            .status { text-align: center; margin-top: 30px; padding: 10px; background: #f0fdf4; color: #166534; font-weight: bold; border-radius: 10px; text-transform: uppercase; }
            .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <div class="hospital">ANTIGRAVITY MEDICAL CENTER</div>
              <p>PAYMENT RECEIPT</p>
            </div>
            <div class="amount">${p.amount.toLocaleString()} UZS</div>
            <div class="info-row">
              <span class="label">Receipt No</span>
              <span class="value">#INV-${p.id}${new Date(p.createdAt).getTime()}</span>
            </div>
            <div class="info-row">
              <span class="label">Date</span>
              <span class="value">${new Date(p.createdAt).toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="label">Payment Method</span>
              <span class="value">${p.method}</span>
            </div>
            <div class="info-row">
              <span class="label">Patient Name</span>
              <span class="value">${authUser?.name}</span>
            </div>
            <div class="status">${p.status}</div>
            <div class="footer">Thank you for your trust. For inquiries call +998 90 123 45 67</div>
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Payment History</h1>
          <p className="text-slate-500">Manage your bills, receipts and transaction history</p>
        </div>
        <div className="flex gap-3">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Total Spent</p>
              <p className="text-xl font-black text-slate-900">
                {payments.reduce((acc, p) => acc + p.amount, 0).toLocaleString()} <span className="text-sm font-medium">UZS</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden shadow-xl border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading transactions...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No payment history found</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm font-bold text-slate-700">#INV-{p.id}{new Date(p.createdAt).getTime().toString().slice(-4)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 font-medium">{new Date(p.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">{new Date(p.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-black text-slate-900">{p.amount.toLocaleString()} UZS</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                        <CreditCard size={14} className="text-slate-300" />
                        {p.method}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 text-xs font-bold ${
                        p.status === 'COMPLETED' ? 'text-green-600' : 'text-orange-500'
                      }`}>
                        {p.status === 'COMPLETED' ? <CheckCircle size={14} /> : <Clock size={14} />}
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedPayment(p)}
                        className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all inline-flex items-center gap-2 font-bold text-xs"
                      >
                        <Receipt size={16} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Payment Receipt</h2>
              <button onClick={() => setSelectedPayment(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-1">Payment Successful</p>
                <h3 className="text-4xl font-black text-slate-900">{selectedPayment.amount.toLocaleString()} <span className="text-lg font-medium">UZS</span></h3>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Date</span>
                  <span className="font-bold text-slate-900">{new Date(selectedPayment.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Method</span>
                  <span className="font-bold text-slate-900">{selectedPayment.method}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Transaction ID</span>
                  <span className="font-mono text-xs font-bold text-slate-900">#INV-{selectedPayment.id}</span>
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button 
                  onClick={() => handlePrintReceipt(selectedPayment)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all active:scale-95"
                >
                  <Printer size={18} /> Print Receipt
                </button>
                <button 
                  onClick={() => handlePrintReceipt(selectedPayment)}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  <Download size={18} /> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatsientPaymentPage;
