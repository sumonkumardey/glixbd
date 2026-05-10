import React from 'react';
import { Bell, Check, Trash2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotifications } from '@/src/hooks/useNotifications';
import { cn } from '@/src/lib/utils';
import { useNavigate } from 'react-router-dom';

export default function NotificationsScreen() {
  const navigate = useNavigate();
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors lg:hidden"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-text-main">নোটিফিকেশন</h1>
            <p className="text-sm font-bold text-text-muted mt-1">আপনার সকল আপডেট এখানে দেখুন</p>
          </div>
        </div>
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={markAllAsRead}
            className="text-sm font-black text-primary hover:underline"
          >
            সব পঠিত করুন
          </button>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 animate-pulse flex gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/4" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white p-12 rounded-[40px] border border-gray-100 text-center shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-200">
              <Bell size={40} />
            </div>
            <h3 className="text-xl font-black text-text-main">কোনো আপডেট নেই</h3>
            <p className="text-sm font-bold text-text-muted mt-2 max-w-[280px] mx-auto leading-relaxed">
              আপনার জন্য আপাতত কোনো নোটিফিকেশন নেই। নতুন কিছু এলে আমরা আপনাকে জানাবো।
            </p>
          </div>
        ) : (
          notifications.map((n, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={n.id}
              onClick={() => !n.isRead && markAsRead(n.id)}
              className={cn(
                "bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex gap-5 transition-all group cursor-pointer hover:border-primary/20",
                !n.isRead ? "border-l-4 border-l-primary" : ""
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                n.type === 'order' ? "bg-blue-50 text-blue-500" :
                n.type === 'wallet' ? "bg-green-50 text-green-500" :
                "bg-orange-50 text-orange-500"
              )}>
                <Bell size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={cn("font-black text-lg", !n.isRead ? "text-primary" : "text-text-main")}>
                    {n.title}
                  </h4>
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest whitespace-nowrap opacity-60">
                    {new Date(n.createdAt?.toDate?.() || n.createdAt).toLocaleDateString('bn-BD')}
                  </span>
                </div>
                <p className="text-sm font-bold text-text-muted leading-relaxed">
                  {n.message}
                </p>
                {!n.isRead && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">নতুন আপডেট</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
