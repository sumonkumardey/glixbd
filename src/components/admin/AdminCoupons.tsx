import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAdmin } from '@/src/hooks/useAdmin';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Plus, Search, Edit2, Trash2, X, Save, Key, Calendar, Percent, Banknote, HelpCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatPrice } from '@/src/lib/utils';

export default function AdminCoupons() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '' as string | number,
    minAmount: '' as string | number,
    expiry: '',
    isActive: true,
    usageLimit: '' as string | number,
  });

  useEffect(() => {
    if (isAdmin) {
      fetchCoupons();
    }
  }, [isAdmin]);

  const fetchCoupons = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setCoupons(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
      toast.error('কুপন লিস্ট লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const couponData = {
        code: formData.code.toUpperCase().trim(),
        type: formData.type,
        value: Number(formData.value),
        minAmount: formData.minAmount ? Number(formData.minAmount) : 0,
        expiry: formData.expiry ? new Date(formData.expiry) : null,
        isActive: formData.isActive,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        usageCount: editingCoupon ? (editingCoupon.usageCount || 0) : 0,
      };

      if (editingCoupon) {
        await updateDoc(doc(db, 'coupons', editingCoupon.id), {
          ...couponData,
          updatedAt: serverTimestamp()
        });
        toast.success('কুপন আপডেট হয়েছে');
      } else {
        // Check if code already exists
        if (coupons.some(c => c.code === couponData.code)) {
          toast.error('এই কোডটি ইতিমধ্যে ব্যবহার করা হয়েছে');
          setSaving(false);
          return;
        }

        await addDoc(collection(db, 'coupons'), {
          ...couponData,
          createdAt: serverTimestamp()
        });
        toast.success('নতুন কুপন তৈরি হয়েছে');
      }

      setShowForm(false);
      setEditingCoupon(null);
      resetForm();
      fetchCoupons();
    } catch (err) {
      console.error(err);
      toast.error('কুপন সেভ করতে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে আপনি এই কুপনটি ডিলিট করতে চান?')) {
      try {
        await deleteDoc(doc(db, 'coupons', id));
        toast.success('কুপন ডিলিট হয়েছে');
        fetchCoupons();
      } catch (err) {
        console.error(err);
        toast.error('ভুল হয়েছে');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percentage',
      value: '',
      minAmount: '',
      expiry: '',
      isActive: true,
      usageLimit: '',
    });
  };

  if (adminLoading || (isAdmin && loading)) return <div className="p-12 text-center font-bold">লোড হচ্ছে...</div>;
  if (!isAdmin) return null;

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-text-main">ডিসকাউন্ট ও কুপন</h1>
          <p className="text-sm text-text-muted">আপনার শপের অফার ও প্রোমো কোড ম্যানেজ করুন</p>
        </div>
        <button 
          onClick={() => { resetForm(); setEditingCoupon(null); setShowForm(true); }}
          className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          <Plus size={20} />
          নতুন কুপন
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="কোড দিয়ে সার্চ করুন..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-gray-100 px-14 py-4 rounded-2xl font-bold shadow-sm focus:border-primary outline-none"
        />
      </div>

      {/* Coupons List */}
      {loading ? (
        <div className="p-12 text-center font-bold">লোড হচ্ছে...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoupons.map(coupon => {
            const isExpired = coupon.expiry && coupon.expiry.toDate() < new Date();
            return (
              <motion.div 
                layout
                key={coupon.id}
                className={`bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col gap-5 relative overflow-hidden group ${!coupon.isActive || isExpired ? 'opacity-60' : ''}`}
              >
                {/* Visual Accent */}
                <div className={`absolute top-0 left-0 w-2 h-full ${coupon.isActive && !isExpired ? 'bg-primary' : 'bg-gray-300'}`} />
                
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${coupon.isActive && !isExpired ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                      <Ticket size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-lg tracking-wider">{coupon.code}</h3>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        {coupon.type === 'percentage' ? `${coupon.value}% ছাড়` : `${coupon.value} টাকা ছাড়`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { 
                        setEditingCoupon(coupon); 
                        setFormData({
                          code: coupon.code,
                          type: coupon.type,
                          value: coupon.value,
                          minAmount: coupon.minAmount || '',
                          expiry: coupon.expiry ? new Date(coupon.expiry.toDate().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
                          isActive: coupon.isActive,
                          usageLimit: coupon.usageLimit || '',
                        }); 
                        setShowForm(true); 
                      }}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(coupon.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 bg-gray-50 p-4 rounded-2xl">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-text-muted">মিনিমাম অর্ডার:</span>
                    <span>{coupon.minAmount > 0 ? formatPrice(coupon.minAmount) : 'যেকোনো'}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-text-muted">ব্যবহার হয়েছে:</span>
                    <span>{coupon.usageCount || 0} বার {coupon.usageLimit ? `/ ${coupon.usageLimit}` : ''}</span>
                  </div>
                  {coupon.expiry && (
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-text-muted">মেয়াদ:</span>
                      <span className={isExpired ? 'text-red-500' : ''}>{coupon.expiry.toDate().toLocaleDateString('bn-BD')}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  {isExpired ? (
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full">মেয়াদ উত্তীর্ণ</span>
                  ) : coupon.isActive ? (
                    <span className="text-[10px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full">সক্রিয়</span>
                  ) : (
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">নিষ্ক্রিয়</span>
                  )}
                  
                  {isExpired && (
                    <div className="flex items-center gap-1 text-[10px] text-red-400 font-bold">
                      <Calendar size={12} />
                      <span>EXPIRED</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Coupon Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl p-8 lg:p-10 max-h-[90vh] overflow-y-auto overflow-x-hidden scrollbar-hide"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                    <Ticket />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">{editingCoupon ? 'কুপন এডিট' : 'নতুন কুপন'}</h2>
                    <p className="text-xs text-text-muted font-bold">আপনার ডিসকাউন্ট অফার সেট করুন</p>
                  </div>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-2">কুপন কোড (যেমন: SAVE20)</label>
                  <div className="relative">
                    <Key size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" required
                      placeholder="GLIX2024"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-primary pl-14 pr-6 py-4 rounded-2xl font-black outline-none transition-all uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-2">ডিসকাউন্ট টাইপ</label>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, type: 'percentage'})}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-bold ${formData.type === 'percentage' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-50 bg-gray-50 text-gray-400'}`}
                      >
                        <Percent size={18} />
                        শতাংশ
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, type: 'fixed'})}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-bold ${formData.type === 'fixed' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-50 bg-gray-50 text-gray-400'}`}
                      >
                        <Banknote size={18} />
                        ফিক্সড
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-2">ছাড়ের পরিমাণ</label>
                    <input 
                      type="number" required
                      placeholder={formData.type === 'percentage' ? '২০' : '১০০'}
                      value={formData.value}
                      onChange={(e) => setFormData({...formData, value: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-6 py-4 rounded-2xl font-black outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-2">মিনিমাম অর্ডার (ঐচ্ছিক)</label>
                    <input 
                      type="number"
                      placeholder="৫০০"
                      value={formData.minAmount}
                      onChange={(e) => setFormData({...formData, minAmount: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-6 py-4 rounded-2xl font-black outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-2">ব্যবহারের সীমা (ঐচ্ছিক)</label>
                    <input 
                      type="number"
                      placeholder="১০০"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-6 py-4 rounded-2xl font-black outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-2">মেয়াদ শেষ হওয়ার তারিখ (ঐচ্ছিক)</label>
                  <input 
                    type="datetime-local"
                    value={formData.expiry}
                    onChange={(e) => setFormData({...formData, expiry: e.target.value})}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-6 py-4 rounded-2xl font-bold outline-none transition-all"
                  />
                </div>

                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                  <label className="flex items-center gap-3 cursor-pointer group flex-1">
                    <input 
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      className="w-6 h-6 rounded-lg accent-primary"
                    />
                    <span className="font-bold text-sm">বর্তমানে সক্রিয় রাখুন</span>
                  </label>
                  <div className="text-text-muted hover:text-primary transition-colors cursor-help group relative">
                    <HelpCircle size={20} />
                    <div className="absolute bottom-full right-0 mb-2 w-48 bg-black text-white text-[10px] p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      এটি আনচেক করলে কুপনটি আর কাজ করবে না।
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={saving}
                  className="w-full bg-primary text-white font-black py-5 rounded-3xl shadow-xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-all text-lg disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save size={24} />
                      সেভ করুন
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
