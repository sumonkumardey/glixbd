import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { motion } from 'framer-motion';
import { MapPin, TrendingUp, ShoppingBag, ChevronRight, Award } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAdmin } from '@/src/hooks/useAdmin';

interface DistrictStats {
  district: string;
  count: number;
  totalAmount: number;
}

export default function AdminDistrictReport() {
  const { isAdmin } = useAdmin();
  const [stats, setStats] = useState<DistrictStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        
        const districtMap: Record<string, { count: number; totalAmount: number }> = {};
        
        snap.docs.forEach(doc => {
          const data = doc.data();
          const district = data.shippingAddress?.district || 'Unknown';
          const amount = data.total || 0;
          
          if (!districtMap[district]) {
            districtMap[district] = { count: 0, totalAmount: 0 };
          }
          districtMap[district].count += 1;
          districtMap[district].totalAmount += amount;
        });

        const sortedStats = Object.entries(districtMap)
          .map(([district, data]) => ({
            district,
            ...data
          }))
          .sort((a, b) => b.count - a.count);

        setStats(sortedStats);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch district stats:', err);
        setLoading(false);
      }
    };

    if (isAdmin) fetchStats();
  }, [isAdmin]);

  if (!isAdmin) return null;

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-5xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-text-main flex items-center gap-3">
            <MapPin className="text-primary" size={32} />
            জেলা ভিত্তিক অর্ডার রিপোর্ট
          </h1>
          <p className="text-text-muted font-bold">কোন জেলা থেকে কাস্টমাররা বেশি অর্ডার করছে তা দেখুন</p>
        </div>
        <div className="bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20">
          <span className="text-primary font-black text-sm">মোট জেলা কভারড: {stats.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-32 bg-gray-100 rounded-[32px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((item, idx) => (
            <motion.div
              key={item.district}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-100/50 relative overflow-hidden group hover:border-primary/30 transition-all"
            >
              {idx === 0 && (
                <div className="absolute top-0 right-0 bg-primary text-white p-3 rounded-bl-3xl shadow-lg">
                  <Award size={20} />
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner",
                    idx === 0 ? "bg-primary text-white" : "bg-gray-100 text-text-muted"
                  )}>
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-text-main tracking-tight">{item.district}</h3>
                    <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">District Name</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-gray-50 p-3 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-text-muted uppercase mb-1">
                      <ShoppingBag size={10} />
                      অর্ডার সংখ্যা
                    </div>
                    <p className="font-black text-text-main text-lg">{item.count}</p>
                  </div>
                  <div className="bg-primary/5 p-3 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-primary uppercase mb-1">
                      <TrendingUp size={10} />
                      মোট বিক্রয়
                    </div>
                    <p className="font-black text-primary text-lg">{item.totalAmount} ৳</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && stats.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
          <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="font-bold text-text-muted">এখনো কোনো জেলা থেকে অর্ডার আসেনি।</p>
        </div>
      )}
    </div>
  );
}
