import React, { useState } from 'react';
import { Bell, Send, AlertTriangle, Info, Tag, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { broadcastNotification, createNotification } from '@/src/services/notificationService';
import { cn } from '@/src/lib/utils';
import { auth, db } from '@/src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAdmin } from '@/src/hooks/useAdmin';

const NOTIF_TYPES = [
  { id: 'promotion', label: 'promotion', icon: <Tag size={18} />, color: 'bg-orange-50 text-orange-500' },
  { id: 'system', label: 'system', icon: <Info size={18} />, color: 'bg-blue-50 text-blue-500' },
  { id: 'order', label: 'order', icon: <Bell size={18} />, color: 'bg-indigo-50 text-indigo-500' },
  { id: 'wallet', label: 'wallet', icon: <Wallet size={18} />, color: 'bg-green-50 text-green-500' },
] as const;

export default function AdminNotifications() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<typeof NOTIF_TYPES[number]['id']>('promotion');
  const [loading, setLoading] = useState(false);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  React.useEffect(() => {
    const fetchCount = async () => {
      if (!isAdmin) return;
      try {
        const snap = await getDocs(collection(db, 'users'));
        setUserCount(snap.size);
      } catch (e) {
        console.error("Failed to fetch user count:", e);
      }
    };
    fetchCount();
  }, [isAdmin]);

  if (adminLoading) return <div className="p-8 text-center font-bold">লোড হচ্ছে...</div>;
  if (!isAdmin) return null;

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || loading) return;

    setLoading(true);
    setStatus(null);
    try {
      await broadcastNotification({
        title,
        message,
        type,
        isRead: false
      });
      setStatus({ type: 'success', msg: 'সকল গ্রাহককে নোটিফিকেশন পাঠানো হয়েছে!' });
      setTitle('');
      setMessage('');
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'নোটিফিকেশন পাঠাতে সমস্যা হয়েছে।';
      
      // Attempt to extract meaningful error from handleFirestoreError's JSON throw
      try {
        const errorContent = err.message.substring(err.message.indexOf('{'));
        const parsed = JSON.parse(errorContent);
        if (parsed.error && (parsed.error.includes('permissions') || parsed.error.includes('permission'))) {
          errorMsg = 'আপনার নোটিফিকেশন পাঠানোর অনুমতি নেই। আপনি কি আপনার এডমিন অ্যাকসেস নিশ্চিত করেছেন?';
        } else if (parsed.error) {
          errorMsg = `ভুল: ${parsed.error}`;
        }
      } catch (e) {
        if (err.message.includes('permission')) {
          errorMsg = 'অনুমতি নেই (Permission Denied)।';
        }
      }
      
      setStatus({ type: 'error', msg: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-text-main">ব্রডকাস্ট নোটিফিকেশন</h1>
        <p className="text-sm text-text-muted">
          {userCount !== null ? `মোট ${userCount} জন গ্রাহকের কাছে একযোগে নোটিফিকেশন পাঠান` : "একসাথে সকল গ্রাহকের কাছে নোটিফিকেশন পাঠান"}
        </p>
      </div>

      {status && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-6 rounded-3xl border flex items-center gap-4 font-bold text-sm",
            status.type === 'success' ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
          )}
        >
          {status.type === 'success' ? <Info size={20} /> : <AlertTriangle size={20} />}
          {status.msg}
        </motion.div>
      )}

      <form onSubmit={handleBroadcast} className="bg-white rounded-[40px] p-8 lg:p-10 border border-gray-100 shadow-sm space-y-8">
        <div className="space-y-4">
          <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-2">নোটিফিকেশন টাইপ</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {NOTIF_TYPES.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={cn(
                  "flex items-center gap-2 p-4 rounded-2xl border-2 transition-all font-bold text-sm",
                  type === t.id 
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-transparent bg-gray-50 text-text-muted hover:bg-gray-100"
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-2">শিরোনাম (Title)</label>
          <input 
            type="text" 
            placeholder="নোটিফিকেশনের শিরোনাম লিখুন..."
            className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-6 py-4 rounded-2xl font-bold outline-none transition-all"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-4">
          <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-2">বিস্তারিত বার্তা (Message)</label>
          <textarea 
            placeholder="নোটিফিকেশনের বিস্তারিত লিখুন..."
            className="w-full h-40 bg-gray-50 border-2 border-transparent focus:border-primary p-6 rounded-[32px] font-bold outline-none transition-all resize-none"
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
          />
        </div>

        <div className="p-6 bg-red-50 rounded-3xl border border-red-100 flex gap-4 items-start">
          <AlertTriangle className="text-red-500 shrink-0" size={24} />
          <div className="space-y-1">
            <p className="font-bold text-red-900 text-sm underline">সতর্কতা: এটি সকল গ্রাহকের কাছে যাবে।</p>
            <p className="text-xs text-red-700 leading-relaxed font-medium">
              এটি একটি গ্লোবাল অ্যাকশন। বাটন প্রেস করার পর এটি রিব্যাক করার সুযোগ থাকবে না। 
              দয়া করে তথ্যগুলো পুনরায় চেক করে নিন।
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            type="button"
            onClick={async () => {
              if (!title.trim() || !message.trim()) return;
              setLoading(true);
              setStatus(null);
              try {
                if (auth.currentUser) {
                  await createNotification(auth.currentUser.uid, { title, message, type, isRead: false });
                  setStatus({ type: 'success', msg: 'টেস্ট নোটিফিকেশন সফলভাবে আপনার কাছে পাঠানো হয়েছে!' });
                }
              } catch (err: any) {
                setStatus({ type: 'error', msg: 'টেস্ট নোটিফিকেশন পাঠাতে সমস্যা হয়েছে।' });
              } finally {
                setLoading(false);
              }
            }}
            className="flex-1 py-4 bg-gray-100 text-text-main rounded-2xl font-black hover:bg-gray-200 transition-all"
          >
            টেস্ট (শুধুমাত্র আমাকে)
          </button>
          
          <button 
            type="submit"
            disabled={loading || !title.trim() || !message.trim()}
            className="flex-[2] py-5 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={22} />}
            নোটিফিকেশন ব্রডকাস্ট করুন
          </button>
        </div>
      </form>
    </div>
  );
}
