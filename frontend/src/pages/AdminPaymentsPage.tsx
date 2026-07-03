import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CreditCard, Wallet, Calendar } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminPaymentsPage = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/admin/payments/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-400">Loading analytics...</div>;

  const maxDaily = Math.max(...(stats?.byDate.map((d: any) => d.total) || [1]));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Analytics</h1>
        <p className="text-slate-500">Overview of hospital revenue and payment methods</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 bg-white border border-slate-100 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-2xl">
              <DollarSign size={24} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</div>
              <div className="text-2xl font-black text-slate-900">
                ${(Object.values(stats?.byMethod || {}) as number[]).reduce((a, b) => a + b, 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 bg-white border border-slate-100 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
              <CreditCard size={24} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Card Payments</div>
              <div className="text-2xl font-black text-slate-900">${(stats?.byMethod['Card'] || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 bg-white border border-slate-100 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
              <Wallet size={24} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cash Payments</div>
              <div className="text-2xl font-black text-slate-900">${(stats?.byMethod['Cash'] || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 bg-white border border-slate-100 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Avg</div>
              <div className="text-2xl font-black text-slate-900">
                ${((Object.values(stats?.byMethod || {}) as number[]).reduce((a, b) => a + b, 0) / 7).toFixed(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Revenue Chart (CSS Bars) */}
        <div className="glass-panel p-8 bg-white border border-slate-100 shadow-xl">
          <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" /> Revenue Trend (Last 7 Days)
          </h3>
          <div className="flex items-end justify-between h-64 gap-2">
            {stats?.byDate.map((d: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="relative w-full flex flex-col justify-end h-full">
                  <div 
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                  >
                    ${d.total.toLocaleString()}
                  </div>
                  <div 
                    style={{ height: `${(d.total / maxDaily) * 100}%` }}
                    className="w-full bg-blue-500 rounded-t-lg transition-all duration-1000 group-hover:bg-blue-600 min-h-[4px]"
                  ></div>
                </div>
                <div className="text-[10px] font-bold text-slate-400 rotate-45 mt-4">{d.date.split('-').slice(1).join('/')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Method Distribution */}
        <div className="glass-panel p-8 bg-white border border-slate-100 shadow-xl">
          <h3 className="text-lg font-bold text-slate-800 mb-8">Payment Methods</h3>
          <div className="space-y-6">
            {Object.entries(stats?.byMethod || {}).map(([method, amount]: any) => {
              const total = Object.values(stats?.byMethod || {}).reduce((a: any, b: any) => a + b, 0) as number;
              const percentage = ((amount / total) * 100).toFixed(1);
              return (
                <div key={method} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-600">{method}</span>
                    <span className="text-slate-900">${amount.toLocaleString()} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${percentage}%` }}
                      className={`h-full transition-all duration-1000 ${
                        method === 'Card' ? 'bg-blue-500' : 
                        method === 'Cash' ? 'bg-green-500' : 'bg-purple-500'
                      }`}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentsPage;
