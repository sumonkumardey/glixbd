import React, { useState } from 'react';
import { auth } from '@/src/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { User, LogIn, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useNavigate, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../Logo';

import { toast } from 'react-hot-toast';

export default function LoginScreen() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      toast.success('লগইন সফল হয়েছে!');
      navigate('/profile');
    } catch (err: any) {
      console.error(err);
      setError('ইমেল অথবা পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('গুগল লগইন সফল হয়েছে!');
      navigate('/profile');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        toast.error('লগইন উইন্ডো বন্ধ করা হয়েছে।');
      } else if (err.code === 'auth/cancelled-by-user') {
        toast.error('লগইন বাতিল করা হয়েছে।');
      } else {
        setError('গুগল লগইন করতে সমস্যা হয়েছে।');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-[90vh] space-y-8 max-w-md mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div className="flex flex-col items-center gap-4 mb-10">
          <Logo size="xl" />
          <div className="text-center">
            <p className="text-sm text-text-muted font-medium">বাংলাদেশের সেরা ই-কমার্স প্ল্যাটফর্ম</p>
          </div>
        </div>

        <div className="w-full space-y-6 bg-white p-8 rounded-[40px] shadow-2xl shadow-gray-200/50 border border-gray-50">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-text-main">স্বাগতম!</h2>
            <p className="text-sm text-text-muted">আপনার ফিঙ্গারপ্রিন্ট অথবা গুগল দিয়ে লগইর করুন।</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 border border-red-100"
            >
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}

          <div className="space-y-4 pt-4">
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-4 bg-white border-2 border-gray-100 py-5 rounded-[32px] shadow-sm font-black text-text-main active:scale-95 transition-all hover:border-primary/50"
            >
              <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
              {loading ? 'প্রসেসিং হচ্ছে...' : 'গুগল দিয়ে লগইন করুন'}
            </button>

            <NavLink 
              to="/signup" 
              className="w-full flex items-center justify-center gap-3 bg-primary/5 text-primary py-5 rounded-[32px] font-black active:scale-95 transition-all text-center"
            >
              নতুন অ্যাকাউন্ট তৈরি করুন
            </NavLink>
          </div>
        </div>

        <p className="text-center text-[10px] text-text-muted px-6 leading-relaxed mt-8 font-medium">
          লগইন করার মাধ্যমে আপনি আমাদের <span className="text-primary font-bold">শর্তাবলি</span> এবং <span className="text-primary font-bold">গোপনীয়তা নীতির</span> সাথে একমত পোষণ করছেন।
        </p>
      </motion.div>
    </div>
  );
}
