import React, { useState } from 'react';
import { Search, ShieldAlert, ShieldCheck, ShieldX, User, ShoppingBag, XCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { checkCustomerFraud, FraudStats } from '@/src/services/fraudService';
import { cn } from '@/src/lib/utils';
import { useAdmin } from '@/src/hooks/useAdmin';

export default function AdminFraudChecker() {
  const { isAdmin } = useAdmin();
  const [phone, setPhone] = useState('');
  const [stats, setStats] = useState<FraudStats | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    const res = await checkCustomerFraud(phone.trim());
    setStats(res);
    setLoading(false);
  };

  if (!isAdmin) return null;

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-text-main">ফ্রড কাস্টমার ট্রাকিং</h1>
        <p className="text-text-muted">কাস্টমারের ফোন নাম্বার দিয়ে তাদের অর্ডার হিস্টোরি ও রিস্ক লেভেল চেক করুন</p>
      </div>

      <div className="relative group max-w-xl mx-auto">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="ফোন নাম্বার দিয়ে খুঁজুন (e.g. 017XXXXXXXX)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="w-full bg-white border border-gray-100 px-14 py-4 rounded-3xl font-black shadow-lg shadow-gray-100 focus:border-primary outline-none transition-all"
        />
        <button 
          onClick={handleSearch}
          disabled={loading}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-white font-black px-6 py-2 rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'চার্জিং...' : 'চেক করুন'}
        </button>
      </div>

      {stats && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* Risk Card */}
          <div className={cn(
            "p-8 rounded-[40px] border-2 flex flex-col items-center text-center space-y-4 shadow-xl",
            stats.riskLevel === 'high' ? "bg-red-50 border-red-100 text-red-600" :
            stats.riskLevel === 'medium' ? "bg-amber-50 border-amber-100 text-amber-600" :
            "bg-green-50 border-green-100 text-green-600"
          )}>
            <div className={cn(
              "w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg mb-2",
              stats.riskLevel === 'high' ? "bg-red-500 text-white" :
              stats.riskLevel === 'medium' ? "bg-amber-500 text-white" :
              "bg-green-500 text-white"
            )}>
              {stats.riskLevel === 'high' ? <ShieldX size={40} /> :
               stats.riskLevel === 'medium' ? <ShieldAlert size={40} /> :
               <ShieldCheck size={40} />}
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-wider">
                {stats.riskLevel === 'high' ? "High Risk" :
                 stats.riskLevel === 'medium' ? "Moderate Risk" :
                 "Safe Customer"}
              </h3>
              <p className="font-bold opacity-80 mt-1">
                {stats.riskLevel === 'high' ? "এই কাস্টমারকে অর্ডার কনফার্ম করার আগে সাবধান থাকুন।" :
                 stats.riskLevel === 'medium' ? "অর্ডারটি পুনরায় চেক করে কনফার্ম করুন।" :
                 "এই কাস্টমারের রেকর্ড ভালো।"}
              </p>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl space-y-6">
            <h4 className="font-black text-text-main flex items-center gap-2">
              <ShoppingBag className="text-primary" size={20} />
              অর্ডার পরিসংখ্যান
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <StatItem label="মোট অর্ডার" value={stats.totalOrders} icon={<ShoppingBag size={14} />} />
              <StatItem label="সফল ডেলিভারি" value={stats.deliveredCount} icon={<CheckCircle size={14} className="text-green-500" />} />
              <StatItem label="বাতিল অর্ডার" value={stats.cancelledCount} icon={<XCircle size={14} className="text-red-500" />} />
              <StatItem label="সাফল্যের হার" value={`${Math.round(stats.successRate)}%`} icon={<div className="w-1.5 h-1.5 bg-primary rounded-full" />} />
            </div>

            <div className="pt-4 border-t border-gray-50">
              <div className="bg-gray-50 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <User size={16} className="text-text-muted" />
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">কাস্টমার ফোন</p>
                </div>
                <p className="text-lg font-black text-text-main">{phone}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {!stats && !loading && (
        <div className="py-20 text-center space-y-4 opacity-30">
          <ShieldAlert size={64} className="mx-auto" />
          <p className="font-bold">সঠিক ফোন নাম্বার দিয়ে চেক শুরু করুন</p>
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-gray-50 p-4 rounded-3xl space-y-1">
      <div className="flex items-center gap-1.5 text-[9px] font-black text-text-muted uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <p className="text-xl font-black text-text-main">{value}</p>
    </div>
  );
}
