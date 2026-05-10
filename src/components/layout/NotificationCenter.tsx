import React, { useState } from 'react';
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/src/hooks/useNotifications';
import { cn } from '@/src/lib/utils';
import { Link } from 'react-router-dom';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-text-muted hover:text-primary transition-colors relative"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-lg shadow-red-500/20 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-[320px] md:w-[380px] bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
            >
              <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-lg">নোটিফিকেশন</h3>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">আপনার সকল আপডেট</p>
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-black text-primary hover:underline"
                  >
                    সব পঠিত হিসেবে চিহ্নিত করুন
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto scrollbar-hide py-2">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                      <Bell size={32} />
                    </div>
                    <p className="text-sm font-bold text-text-muted">কোনো নোটিফিকেশন নেই</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => !n.isRead && markAsRead(n.id)}
                      className={cn(
                        "p-4 flex gap-4 transition-colors cursor-pointer group hover:bg-gray-50",
                        !n.isRead ? "bg-primary/5" : "bg-white"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                        n.type === 'order' ? "bg-blue-50 text-blue-500" :
                        n.type === 'wallet' ? "bg-green-50 text-green-500" :
                        "bg-orange-50 text-orange-500"
                      )}>
                        <Bell size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={cn("text-xs font-bold truncate", !n.isRead ? "text-primary" : "text-text-main")}>
                            {n.title}
                          </h4>
                          {!n.isRead && <div className="w-2 h-2 bg-primary rounded-full mt-1 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-text-muted mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[9px] text-text-muted/60 mt-2 font-medium">
                          {new Date(n.createdAt?.toDate?.() || n.createdAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
                <Link 
                  to="/notifications" 
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-black text-text-muted hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  সব নোটিফিকেশন দেখুন
                  <ExternalLink size={14} />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
