import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, orderBy, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { useAdmin } from '@/src/hooks/useAdmin';
import { UserProfile } from '@/src/types';
import { Search, UserX, UserCheck, MessageSquare, Wallet, Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/src/lib/utils';
import { createNotification } from '@/src/services/notificationService';
import { toast } from 'react-hot-toast';

export default function AdminUsers() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [adminIds, setAdminIds] = useState<string[]>([]);
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [notifText, setNotifText] = useState('');
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [newBalance, setNewBalance] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchUsers = async () => {
    if (!isAdmin) return;
    try {
      const q = query(collection(db, 'users'), orderBy('name', 'asc'));
      const snap = await getDocs(q);
      const fetchedUsers = snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
      
      const adminSnap = await getDocs(collection(db, 'admins'));
      const fetchedAdminIds = adminSnap.docs.map(d => d.id);

      const emailSnap = await getDocs(collection(db, 'admin_emails'));
      const fetchedAdminEmails = emailSnap.docs.map(d => d.id);
      
      setUsers(fetchedUsers);
      setAdminIds(fetchedAdminIds);
      setAdminEmails(fetchedAdminEmails);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'users_admin_data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isAdmin]);

  if (adminLoading || (isAdmin && loading)) return <div className="p-8 text-center font-bold">লোড হচ্ছে...</div>;
  if (!isAdmin) return null;

  const toggleBlock = async (user: UserProfile) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { isBlocked: !user.isBlocked });
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।');
    }
  };

  const toggleAdmin = async (user: UserProfile) => {
    const isAdmin = adminIds.includes(user.uid);
    const hardcodedEmails = ['oksumondey153@gmail.com', 'sumonkumardey23@gmail.com'];
    
    if (hardcodedEmails.includes(user.email)) {
      toast.error('হার্ডকোডেড অ্যাডমিন রিমুভ করা সম্ভব নয়।');
      return;
    }

    const confirm = window.confirm(isAdmin ? `আপনি কি ${user.name}-এর অ্যাডমিন পারমিশন বাতিল করতে চান?` : `আপনি কি ${user.name}-কে অ্যাডমিন পারমিশন দিতে চান?`);
    if (!confirm) return;

    try {
      if (isAdmin) {
        await deleteDoc(doc(db, 'admins', user.uid));
        toast.success(`${user.name} এখন আর অ্যাডমিন নন।`);
      } else {
        await setDoc(doc(db, 'admins', user.uid), {
          email: user.email,
          name: user.name,
          promotedAt: serverTimestamp()
        });
        toast.success(`${user.name} এখন একজন অ্যাডমিন।`);
      }
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error('অ্যাডমিন পারমিশন আপডেট করতে সমস্যা হয়েছে।');
    }
  };

  const addAdminEmail = async () => {
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) {
      toast.error('সঠিক ইমেইল দিন');
      return;
    }
    setUpdating(true);
    try {
      const emailLower = newAdminEmail.toLowerCase().trim();
      await setDoc(doc(db, 'admin_emails', emailLower), {
        addedAt: serverTimestamp(),
      });
      toast.success(`${emailLower} এখন অ্যাডমিন লিস্টে যুক্ত।`);
      setNewAdminEmail('');
      setShowAddAdmin(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error('অ্যাডমিন ইমেইল যুক্ত করতে সমস্যা হয়েছে।');
    } finally {
      setUpdating(false);
    }
  };

  const removeAdminEmail = async (email: string) => {
    const hardcodedEmails = ['oksumondey153@gmail.com', 'sumonkumardey23@gmail.com'];
    if (hardcodedEmails.includes(email.toLowerCase())) {
      toast.error('হার্ডকোডেড অ্যাডমিন রিমুভ করা সম্ভব নয়।');
      return;
    }

    if (!window.confirm(`${email}-কে অ্যাডমিন লিস্ট থেকে বাদ দিতে চান?`)) return;

    try {
      await deleteDoc(doc(db, 'admin_emails', email.toLowerCase()));
      toast.success(`${email} রিমুভ করা হয়েছে।`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error('রিমুভ করতে সমস্যা হয়েছে।');
    }
  };

  const sendDirectNotif = async () => {
    if (!selectedUser || !notifText.trim()) return;
    try {
      await createNotification(selectedUser.uid, {
        title: 'অ্যাডমিন মেসেজ',
        message: notifText,
        type: 'system',
        isRead: false
      });
      setNotifText('');
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.phone.includes(search)
  );

  const updateBalance = async () => {
    if (!selectedUser || isNaN(Number(newBalance))) return;
    setUpdating(true);
    try {
      const userRef = doc(db, 'users', selectedUser.uid);
      await updateDoc(userRef, { 
        walletBalance: Number(newBalance),
        updatedAt: serverTimestamp()
      });
      
      await createNotification(selectedUser.uid, {
        title: 'ওয়ালেট আপডেট',
        message: `অ্যাডমিন আপনার ওয়ালেট ব্যালেন্স আপডেট করেছেন। নতুন ব্যালেন্স: ৳${newBalance}`,
        type: 'system',
        isRead: false
      });
      
      toast.success('ব্যালেন্স আপডেট হয়েছে');
      setShowBalanceModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error('আপডেট করতে সমস্যা হয়েছে');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-8 text-center font-bold">লোড হচ্ছে...</div>;

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-main">ইউজার ম্যানেজমেন্ট</h1>
          <p className="text-sm text-text-muted">নিবন্ধিত গ্রাহকদের তথ্য ও নিয়ন্ত্রণ</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAddAdmin(!showAddAdmin)}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl font-black shadow-lg shadow-purple-200 hover:scale-105 active:scale-95 transition-all text-sm"
          >
            <Shield size={20} />
            ইমেল দিয়ে অ্যাডমিন এড
          </button>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="নাম বা ফোন দিয়ে খুঁজুন..."
              className="pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-2xl w-full lg:w-80 outline-none focus:border-primary transition-all font-bold"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddAdmin && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-purple-50 p-6 rounded-[32px] border border-purple-100 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                <div className="flex-1 space-y-1.5">
                  <label className="text-sm font-bold text-purple-900 ml-1">নতুন অ্যাডমিন ইমেইল</label>
                  <input 
                    type="email" 
                    placeholder="example@gmail.com"
                    className="w-full bg-white border border-purple-200 p-4 rounded-xl font-bold outline-none focus:border-purple-500 transition-all"
                    value={newAdminEmail}
                    onChange={e => setNewAdminEmail(e.target.value)}
                  />
                </div>
                <button 
                  onClick={addAdminEmail}
                  disabled={updating}
                  className="px-8 py-4 bg-purple-600 text-white rounded-xl font-black shadow-lg shadow-purple-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {updating ? 'যোগ হচ্ছে...' : 'অ্যাডমিন লিস্টে যোগ করুন'}
                </button>
              </div>

              {adminEmails.length > 0 && (
                <div className="pt-4 border-t border-purple-100 italic font-medium">
                  <p className="text-xs text-purple-700 mb-2">ইমেইল লিস্ট (এই ইউজাররা লগইন করলেই অ্যাডমিন হয়ে যাবেন):</p>
                  <div className="flex flex-wrap gap-2">
                    {adminEmails.map(email => (
                      <div key={email} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-purple-100 text-xs font-bold text-purple-800">
                        {email}
                        <button onClick={() => removeAdminEmail(email)} className="p-1 hover:bg-red-50 text-red-400 rounded-full">
                          <ShieldX size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50 text-[10px] uppercase tracking-widest font-black text-text-muted">
                <th className="px-6 py-4">গ্রাহক</th>
                <th className="px-6 py-4">ফোন</th>
                <th className="px-6 py-4">ব্যালেন্স</th>
                <th className="px-6 py-4">স্ট্যাটাস</th>
                <th className="px-6 py-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map(user => (
                <tr key={user.uid} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl overflow-hidden flex items-center justify-center font-black">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          user.name?.[0] || 'U'
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{user.name}</p>
                        <p className="text-[10px] text-text-muted">{user.email || 'ইমেইল নেই'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-sm">{user.phone}</td>
                  <td className="px-6 py-4 font-bold text-sm text-primary">৳{user.walletBalance || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${user.isBlocked ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                      {user.isBlocked ? 'ব্লকড' : 'অ্যাক্টিভ'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => toggleAdmin(user)}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          adminIds.includes(user.uid) 
                            ? "bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white"
                            : "bg-gray-50 text-gray-400 hover:bg-primary hover:text-white"
                        )}
                        title={adminIds.includes(user.uid) ? "অ্যাডমিন রিমুভ করুন" : "অ্যাডমিন করুন"}
                      >
                        {adminIds.includes(user.uid) ? <ShieldAlert size={18} /> : <Shield size={18} />}
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedUser(user);
                          setNewBalance(String(user.walletBalance || 0));
                          setShowBalanceModal(true);
                        }}
                        className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-600 hover:text-white transition-all"
                        title="ব্যালেন্স আপডেট"
                      >
                        <Wallet size={18} />
                      </button>
                      <button 
                        onClick={() => setSelectedUser(user)}
                        className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all"
                        title="মেসেজ পাঠান"
                      >
                        <MessageSquare size={18} />
                      </button>
                      <button 
                        onClick={() => toggleBlock(user)}
                        className={`p-2 rounded-lg transition-all ${
                          user.isBlocked 
                            ? 'bg-green-50 text-green-500 hover:bg-green-500 hover:text-white' 
                            : 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white'
                        }`}
                        title={user.isBlocked ? 'আনব্লক করুন' : 'ব্লক করুন'}
                      >
                        {user.isBlocked ? <UserCheck size={18} /> : <UserX size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Modal */}
      {selectedUser && !showBalanceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[40px] p-8 w-full max-w-md space-y-6 shadow-2xl overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
            
            <div className="space-y-2">
              <h3 className="text-xl font-black">{selectedUser.name}-কে মেসেজ পাঠান</h3>
              <p className="text-sm text-text-muted">গ্রাহকের নোটিফিকেশন সেন্টারে এই মেসেজটি যাবে।</p>
            </div>

            <textarea 
              className="w-full h-32 bg-gray-50 border-2 border-transparent focus:border-primary p-4 rounded-2xl font-bold outline-none transition-all resize-none"
              placeholder="আপনার মেসেজ লিখুন..."
              value={notifText}
              onChange={e => setNotifText(e.target.value)}
            />

            <div className="flex gap-3">
              <button 
                onClick={() => setSelectedUser(null)}
                className="flex-1 py-4 bg-gray-100 rounded-2xl font-black hover:bg-gray-200 transition-colors"
              >
                বাতিল
              </button>
              <button 
                onClick={sendDirectNotif}
                disabled={!notifText.trim()}
                className="flex-1 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                পাঠান
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Balance Modal */}
      {selectedUser && showBalanceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[40px] p-8 w-full max-w-md space-y-6 shadow-2xl overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16" />
            
            <div className="space-y-2">
              <h3 className="text-xl font-black">{selectedUser.name}-এর ব্যালেন্স আপডেট</h3>
              <p className="text-sm text-text-muted">ওয়ালেট ব্যালেন্স ম্যানুয়ালি পরিবর্তন করুন।</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-text-main ml-1">নতুন ব্যালেন্স (৳)</label>
              <input 
                type="number"
                className="w-full bg-gray-50 border-2 border-transparent focus:border-amber-500 p-4 rounded-2xl font-black outline-none transition-all"
                placeholder="0.00"
                value={newBalance}
                onChange={e => setNewBalance(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setSelectedUser(null);
                  setShowBalanceModal(false);
                }}
                className="flex-1 py-4 bg-gray-100 rounded-2xl font-black hover:bg-gray-200 transition-colors"
                disabled={updating}
              >
                বাতিল
              </button>
              <button 
                onClick={updateBalance}
                disabled={updating || isNaN(Number(newBalance))}
                className="flex-1 py-4 bg-amber-500 text-white rounded-2xl font-black shadow-lg shadow-amber-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {updating ? 'আপডেট হচ্ছে...' : 'আপডেট করুন'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
