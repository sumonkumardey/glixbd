import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '@/src/lib/firebase';
import { motion } from 'framer-motion';
import { ShoppingBag, Users, Package, TrendingUp, ChevronRight, Clock, ShieldCheck, Settings as SettingsIcon, Wallet } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { formatPrice } from '@/src/lib/utils';

import { useAdmin } from '@/src/hooks/useAdmin';

export default function AdminDashboard() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalAdmins: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchData = async () => {
      try {
        const results = await Promise.allSettled([
          getDocs(collection(db, 'orders')),
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'admin_emails'))
        ]);

        const ordersSnap = results[0].status === 'fulfilled' ? (results[0] as PromiseFulfilledResult<any>).value : null;
        const productsSnap = results[1].status === 'fulfilled' ? (results[1] as PromiseFulfilledResult<any>).value : null;
        const usersSnap = results[2].status === 'fulfilled' ? (results[2] as PromiseFulfilledResult<any>).value : null;
        const adminSnap = results[3].status === 'fulfilled' ? (results[3] as PromiseFulfilledResult<any>).value : null;

        // Log errors if any
        results.forEach((res, idx) => {
          if (res.status === 'rejected') {
            const paths = ['orders', 'products', 'users', 'admin_emails'];
            console.warn(`Dashboard fetch failed for ${paths[idx]}:`, res.reason);
          }
        });

        const orders = ordersSnap ? ordersSnap.docs.map((d: any) => d.data()) : [];
        const totalSales = orders.reduce((acc: number, curr: any) => acc + (curr.total || 0), 0);

        setStats({
          totalSales,
          totalOrders: ordersSnap?.size || 0,
          totalProducts: productsSnap?.size || 0,
          totalUsers: usersSnap?.size || 0,
          totalAdmins: (adminSnap?.size || 0) + 2 // +2 for hardcoded admins
        });

        // Recent orders
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5));
        const recentSnap = await getDocs(q);
        setRecentOrders(recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (err: any) {
        handleFirestoreError(err, OperationType.GET, 'dashboard_stats');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  if (adminLoading || (isAdmin && loading)) return <div className="p-8 text-center font-bold">লোড হচ্ছে...</div>;

  if (!isAdmin) return null;

  return (
    <div className="space-y-8 p-4 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-text-main">অ্যাডমিন ড্যাশবোর্ড</h1>
          <p className="text-sm text-text-muted">আপনার ব্যবসার বর্তমান অবস্থা একনজরে</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-2xl border border-green-100">
          <ShieldCheck size={18} />
          <span className="text-xs font-black uppercase tracking-widest">অ্যাডমিন সেশন সক্রিয়</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatItem 
          label="মোট বিক্রয়" 
          value={formatPrice(stats.totalSales)} 
          icon={<TrendingUp className="text-green-500" />} 
          color="bg-green-50"
        />
        <StatItem 
          label="মোট অর্ডার" 
          value={stats.totalOrders} 
          icon={<ShoppingBag className="text-blue-500" />} 
          color="bg-blue-50"
        />
        <StatItem 
          label="মোট প্রোডাক্ট" 
          value={stats.totalProducts} 
          icon={<Package className="text-purple-500" />} 
          color="bg-purple-50"
        />
        <StatItem 
          label="মোট ইউজার" 
          value={stats.totalUsers} 
          icon={<Users className="text-orange-500" />} 
          color="bg-orange-50"
        />
        <StatItem 
          label="মোট অ্যাডমিন" 
          value={stats.totalAdmins} 
          icon={<ShieldCheck className="text-pink-500" />} 
          color="bg-pink-50"
        />
      </div>

      {/* Management Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Links */}
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-lg font-black flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            দ্রুত নেভিগেশন
          </h2>
          <div className="grid grid-cols-1 gap-3">
            <NavLink to="/admin/products" className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group hover:bg-primary/5 transition-colors">
              <span className="font-bold">প্রোডাক্ট ম্যানেজমেন্ট</span>
              <ChevronRight size={18} className="text-gray-400 group-hover:text-primary" />
            </NavLink>
            <NavLink to="/admin/orders" className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group hover:bg-primary/5 transition-colors">
              <span className="font-bold">অর্ডার ম্যানেজমেন্ট</span>
              <ChevronRight size={18} className="text-gray-400 group-hover:text-primary" />
            </NavLink>
            <NavLink to="/admin/withdrawals" className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl group hover:bg-orange-100 transition-colors">
              <div className="flex items-center gap-3">
                <Wallet size={18} className="text-orange-500" />
                <span className="font-bold text-orange-600">উইথড্র রিকোয়েস্ট</span>
              </div>
              <ChevronRight size={18} className="text-orange-400 group-hover:text-orange-600" />
            </NavLink>
            <NavLink to="/admin/users" className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group hover:bg-primary/5 transition-colors">
              <span className="font-bold">ইউজার ম্যানেজমেন্ট</span>
              <ChevronRight size={18} className="text-gray-400 group-hover:text-primary" />
            </NavLink>
            <NavLink to="/admin/notifications" className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group hover:bg-primary/5 transition-colors">
              <span className="font-bold">ব্রডকাস্ট নোটিফিকেশন</span>
              <ChevronRight size={18} className="text-gray-400 group-hover:text-primary" />
            </NavLink>
            <NavLink to="/admin/coupons" className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group hover:bg-primary/5 transition-colors">
              <span className="font-bold">ডিসকাউন্ট ও কুপন</span>
              <ChevronRight size={18} className="text-gray-400 group-hover:text-primary" />
            </NavLink>
            <NavLink to="/admin/banners" className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group hover:bg-primary/5 transition-colors">
              <span className="font-bold">ব্যানার ম্যানেজমেন্ট</span>
              <ChevronRight size={18} className="text-gray-400 group-hover:text-primary" />
            </NavLink>
            <NavLink to="/admin/categories" className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group hover:bg-primary/5 transition-colors">
              <span className="font-bold">ক্যাটাগরি ম্যানেজমেন্ট</span>
              <ChevronRight size={18} className="text-gray-400 group-hover:text-primary" />
            </NavLink>
            <NavLink to="/admin/settings" className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl group hover:bg-primary/10 transition-colors">
              <div className="flex items-center gap-3">
                <SettingsIcon size={18} className="text-primary" />
                <span className="font-bold text-primary">পেমেন্ট সেটিংস</span>
              </div>
              <ChevronRight size={18} className="text-primary" />
            </NavLink>
          </div>
        </div>

        {/* Recent Orders List */}
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">সাম্প্রতিক অর্ডার</h2>
            <NavLink to="/admin/orders" className="text-primary text-xs font-bold hover:underline">সব দেখুন</NavLink>
          </div>
          <div className="space-y-4">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                <div className="space-y-1">
                  <p className="font-bold text-sm">#{order.orderNumber}</p>
                  <p className="text-[10px] text-text-muted">{order.shippingAddress?.fullName}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-black text-xs text-primary">{formatPrice(order.total)}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold bg-orange-50 text-orange-500`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, icon, color }: { label: string, value: string | number, icon: React.ReactNode, color: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4"
    >
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center`}>
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-black text-text-main">{value}</p>
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</p>
      </div>
    </motion.div>
  );
}
