import React, { useState, useEffect } from 'react';
import { auth, db } from '@/src/lib/firebase';
import { useNavigate } from 'react-router-dom';
import { updateUserProfile } from '@/src/services/userService';
import { motion } from 'framer-motion';
import { User, Phone, Gift, ArrowRight, UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CompleteProfileScreen() {
  const [name, setName] = useState(auth.currentUser?.displayName || '');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for saved referral in localStorage
    const savedRef = localStorage.getItem('referredBy');
    if (savedRef) {
      setReferralCode(savedRef);
    }

    if (!auth.currentUser) {
      navigate('/login');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    if (!name || name.length < 3) {
      toast.error('সঠিক নাম দিন');
      return;
    }
    
    if (!phone || phone.length < 11) {
      toast.error('সঠিক ফোন নাম্বার দিন');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await updateUserProfile(auth.currentUser.uid, {
        name,
        phone,
        referredBy: referralCode || undefined
      });

      if (success) {
        localStorage.removeItem('referredBy');
        toast.success('রজিস্ট্রেশন সফল হয়েছে!');
        navigate('/');
      } else {
        toast.error('তথ্য সাবমিট করতে সমস্যা হয়েছে');
      }
    } catch (err) {
      toast.error('একটি ভুল হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-12 space-y-2"
      >
        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-6">
          <UserPlus size={32} />
        </div>
        <h1 className="text-[32px] font-black text-text-main leading-tight">
          প্রোফাইল <span className="text-primary">সম্পূর্ণ</span> করুন
        </h1>
        <p className="text-text-muted font-medium">কেনাকাটা শুরু করার আগে আপনার বেসিক তথ্যগুলো দিয়ে আমাদের সাহায্য করুন।</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="mt-12 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">পুরো নাম (Full Name)</label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="আপনার নাম লিখুন"
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-bold"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">ফোন নাম্বার (Phone)</label>
          <div className="relative group">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="০১৭XXXXXXXX"
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-bold"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">রেফার কোড (Referral - থাকলে দিন)</label>
          <div className="relative group">
            <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="আপনার যদি কোনো রেফার কোড থাকে"
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-bold"
            />
          </div>
        </div>

        <div className="pt-6">
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white py-5 rounded-[24px] font-black text-lg shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'সেভ হচ্ছে...' : 'শুরু করুন'}
            {!isSubmitting && <ArrowRight size={20} />}
          </button>
        </div>
      </form>

      <div className="mt-auto py-8 text-center">
        <p className="text-[10px] text-text-muted font-bold font-mono">SECURE BY GlixBD CLOUD INFRASTRUCTURE</p>
      </div>
    </div>
  );
}
