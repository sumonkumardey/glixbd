import React, { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../../lib/firebase';
import { useAdmin } from '@/src/hooks/useAdmin';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Save, Phone, CreditCard, CheckCircle2, AlertCircle, Truck, Gift, ShoppingCart, Wallet } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminSettings() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    bkashNumber: '',
    nagadNumber: '',
    deliveryChargeInsideDhaka: 60,
    deliveryChargeOutsideDhaka: 120,
    referralRewardAmount: 50,
    referralMinOrderAmount: 1000,
    shoppingRewardAmount: 0,
    shoppingRewardMinAmount: 0,
    minWithdrawalAmount: 500,
    isCodEnabled: true,
    steadfastApiKey: '',
    steadfastSecretKey: ''
  });

  useEffect(() => {
    async function fetchSettings() {
      if (!isAdmin) return;
      try {
        const docRef = doc(db, 'settings', 'payment');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings(prev => ({ 
            ...prev, 
            ...data,
            bkashNumber: data.bkashNumber || '',
            nagadNumber: data.nagadNumber || '',
          }));
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'settings/payment');
      } finally {
        setLoading(false);
      }
    }
    if (isAdmin) {
      fetchSettings();
    }
  }, [isAdmin]);

  const handleSave = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'payment'), {
        ...settings,
        updatedAt: serverTimestamp()
      });
      toast.success('সেটিংস সফলভাবে সেভ করা হয়েছে');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/payment');
      toast.error('সেভ করতে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  if (adminLoading || (isAdmin && loading)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-primary">পেমেন্ট সেটিংস</h2>
          <p className="text-text-muted">চেকআউট পেজের পেমেন্ট মেথড এবং নাম্বার সেট করুন</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
        >
          {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={20} />}
          সেভ করুন
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* bKash Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600">
              <CreditCard size={24} />
            </div>
            <div>
              <h3 className="font-black text-lg">বিকাশ পেমেন্ট</h3>
              <p className="text-xs text-text-muted">কাস্টমারকে এই নাম্বারে পেমেন্ট করতে হবে</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-text-main ml-1">বিকাশ নাম্বার</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="text"
                value={settings.bkashNumber}
                onChange={e => setSettings({...settings, bkashNumber: e.target.value})}
                placeholder="017XXXXXXXX"
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 font-bold"
              />
            </div>
          </div>
        </motion.div>

        {/* Nagad Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
              <CreditCard size={24} />
            </div>
            <div>
              <h3 className="font-black text-lg">নগদ পেমেন্ট</h3>
              <p className="text-xs text-text-muted">কাস্টমারকে এই নাম্বারে পেমেন্ট করতে হবে</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-text-main ml-1">নগদ নাম্বার</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="text"
                value={settings.nagadNumber}
                onChange={e => setSettings({...settings, nagadNumber: e.target.value})}
                placeholder="017XXXXXXXX"
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 font-bold"
              />
            </div>
          </div>
        </motion.div>

        {/* COD Toggle */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm lg:col-span-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="font-black text-lg">ক্যাশ অন ডেলিভারি (COD)</h3>
                <p className="text-xs text-text-muted">এই অপশনটি চালু বা বন্ধ করুন</p>
              </div>
            </div>

            <button
              onClick={() => setSettings({...settings, isCodEnabled: !settings.isCodEnabled})}
              className={`w-14 h-8 rounded-full p-1 transition-colors ${settings.isCodEnabled ? 'bg-primary' : 'bg-gray-200'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full transition-transform ${settings.isCodEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>
        </motion.div>
      </div>

      <div className="flex items-center justify-between mt-12 mb-6">
        <div>
          <h2 className="text-2xl font-black text-primary">কুরিয়ার সেটিংস (Steadfast)</h2>
          <p className="text-text-muted">অটোমেটিক পার্সেল বুকিং এর জন্য API কী সেট করুন</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Steadfast API Key */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
              <Truck size={24} />
            </div>
            <div>
              <h3 className="font-black text-lg">Steadfast API Key</h3>
              <p className="text-xs text-text-muted">আপনার Steadfast পোর্টাল থেকে পাবেন</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-text-main ml-1">API Key</label>
            <input
              type="password"
              value={settings.steadfastApiKey || ''}
              onChange={e => setSettings({...settings, steadfastApiKey: e.target.value})}
              placeholder="API Key লিখুন"
              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary/20 font-bold"
            />
          </div>
        </motion.div>

        {/* Steadfast Secret Key */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
              <Truck size={24} />
            </div>
            <div>
              <h3 className="font-black text-lg">Steadfast Secret Key</h3>
              <p className="text-xs text-text-muted">আপনার Steadfast পোর্টাল থেকে পাবেন</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-text-main ml-1">Secret Key</label>
            <input
              type="password"
              value={settings.steadfastSecretKey || ''}
              onChange={e => setSettings({...settings, steadfastSecretKey: e.target.value})}
              placeholder="Secret Key লিখুন"
              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary/20 font-bold"
            />
          </div>
        </motion.div>
      </div>

      <div className="flex items-center justify-between mt-12 mb-6">
        <div>
          <h2 className="text-2xl font-black text-primary">ডেলিভারি সেটিংস</h2>
          <p className="text-text-muted">ঢাকার ভেতরে এবং বাইরের ডেলিভারি চার্জ নির্ধারণ করুন</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Inside Dhaka */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
              <Truck size={24} />
            </div>
            <div>
              <h3 className="font-black text-lg">ঢাকার ভেতরে</h3>
              <p className="text-xs text-text-muted">ঢাকার ভেতরে ডেলিভারি চার্জ</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-text-main ml-1">চার্জ (টাকা)</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">৳</div>
              <input
                type="number"
                value={settings.deliveryChargeInsideDhaka}
                onChange={e => setSettings({...settings, deliveryChargeInsideDhaka: Number(e.target.value)})}
                placeholder="60"
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 font-bold"
              />
            </div>
          </div>
        </motion.div>

        {/* Delivery Outside Dhaka */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
              <Truck size={24} />
            </div>
            <div>
              <h3 className="font-black text-lg">ঢাকার বাইরে</h3>
              <p className="text-xs text-text-muted">ঢাকার বাইরে ডেলিভারি চার্জ</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-text-main ml-1">চার্জ (টাকা)</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">৳</div>
              <input
                type="number"
                value={settings.deliveryChargeOutsideDhaka}
                onChange={e => setSettings({...settings, deliveryChargeOutsideDhaka: Number(e.target.value)})}
                placeholder="120"
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 font-bold"
              />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex items-center justify-between mt-12 mb-6">
        <div>
          <h2 className="text-2xl font-black text-primary">রেফারেল রিওয়ার্ড</h2>
          <p className="text-text-muted">রেফারেল বোনাস এবং নূন্যতম অর্ডার অ্যামাউন্ট নির্ধারণ করুন</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referral Reward Amount */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600">
              <Gift size={24} />
            </div>
            <div>
              <h3 className="font-black text-lg">বোনাস অ্যামাউন্ট</h3>
              <p className="text-xs text-text-muted">প্রতি সফল রেফারে বোনাস</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-text-main ml-1">টাকা (৳)</label>
            <input
              type="number"
              value={settings.referralRewardAmount}
              onChange={e => setSettings({...settings, referralRewardAmount: Number(e.target.value)})}
              placeholder="50"
              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary/20 font-bold"
            />
          </div>
        </motion.div>

        {/* Min Order for Reward */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
              <ShoppingCart size={24} />
            </div>
            <div>
              <h3 className="font-black text-lg">মিনিমাম অর্ডার</h3>
              <p className="text-xs text-text-muted">বোনাস পেতে নূন্যতম শপিং</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-text-main ml-1">টাকা (৳)</label>
            <input
              type="number"
              value={settings.referralMinOrderAmount}
              onChange={e => setSettings({...settings, referralMinOrderAmount: Number(e.target.value)})}
              placeholder="1000"
              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary/20 font-bold"
            />
          </div>
        </motion.div>
      </div>

      <div className="flex items-center justify-between mt-12 mb-6">
        <div>
          <h2 className="text-2xl font-black text-primary">শপিং রিওয়ার্ড (ডেলিভারি বোনাস)</h2>
          <p className="text-text-muted">কতো টাকা শপিং করলে ডেলিভারি হওয়ার পর ওয়ালেটে কতো টাকা পাবে</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shopping Reward Min Amount */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
              <ShoppingCart size={24} />
            </div>
            <div>
              <h3 className="font-black text-lg">ন্যূনতম শপিং</h3>
              <p className="text-xs text-text-muted">বোনাস পেতে যতো টাকার শপিং করতে হবে</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-text-main ml-1">টাকা (৳)</label>
            <input
              type="number"
              value={settings.shoppingRewardMinAmount || 0}
              onChange={e => setSettings({...settings, shoppingRewardMinAmount: Number(e.target.value)})}
              placeholder="2000"
              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary/20 font-bold"
            />
          </div>
        </motion.div>

        {/* Shopping Reward Amount */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
              <Gift size={24} />
            </div>
            <div>
              <h3 className="font-black text-lg">বোনাস অ্যামাউন্ট</h3>
              <p className="text-xs text-text-muted">ডেলিভারি হওয়ার পর ওয়ালেটে যা যোগ হবে</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-text-main ml-1">টাকা (৳)</label>
            <input
              type="number"
              value={settings.shoppingRewardAmount || 0}
              onChange={e => setSettings({...settings, shoppingRewardAmount: Number(e.target.value)})}
              placeholder="100"
              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary/20 font-bold"
            />
          </div>
        </motion.div>
      </div>

      <div className="flex items-center justify-between mt-12 mb-6">
        <div>
          <h2 className="text-2xl font-black text-primary">ওয়ালেট ও উইথড্র সেটিংস</h2>
          <p className="text-text-muted">উইথড্র করার নূন্যতম অ্যামাউন্ট নির্ধারণ করুন</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Min Withdrawal Amount */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
              <Wallet size={24} />
            </div>
            <div>
              <h3 className="font-black text-lg">নূন্যতম উইথড্র</h3>
              <p className="text-xs text-text-muted">ইউজার সর্বনিম্ন কতো টাকা উইথড্র করতে পারবে</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-text-main ml-1">টাকা (৳)</label>
            <input
              type="number"
              value={settings.minWithdrawalAmount || 500}
              onChange={e => setSettings({...settings, minWithdrawalAmount: Number(e.target.value)})}
              placeholder="500"
              className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary/20 font-bold"
            />
          </div>
        </motion.div>
      </div>

      <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 flex gap-4">
        <AlertCircle className="text-primary shrink-0" size={24} />
        <div>
          <h4 className="font-black text-primary">নির্দেশনা</h4>
          <p className="text-sm text-primary/70 leading-relaxed mt-1">
            বিকাশ এবং নগদ নাম্বার দেয়ার সময় অবশ্যই পূর্ণ নাম্বারটি লিখুন। আপনি চাইলে চেকআউট থেকে ক্যাশ অন ডেলিভারি অপশনটি যেকোনো সময় বন্ধ রাখতে পারেন।
          </p>
        </div>
      </div>
    </div>
  );
}
