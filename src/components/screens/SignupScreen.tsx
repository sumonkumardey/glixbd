import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, AlertCircle } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  signInWithPopup, 
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { toast } from 'react-hot-toast';

export default function SignupScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('সফলভাবে সাইন-ইন করা হয়েছে!');
      navigate('/profile');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no need for a scary error modal/alert
        toast.error('সাইন-ইন উইন্ডো বন্ধ করা হয়েছে।');
      } else if (err.code === 'auth/cancelled-by-user') {
        toast.error('সাইন-ইন বাতিল করা হয়েছে।');
      } else {
        setError('গুগল দিয়ে লগইন করতে সমস্যা হয়েছে।');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[40px] shadow-2xl shadow-gray-200/50 border border-gray-100 p-8 lg:p-12 mb-20"
      >
        <div className="text-center space-y-4 mb-10">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-[32px] flex items-center justify-center mx-auto mb-6 rotate-3">
            <User size={40} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-text-main">নতুন অ্যাকাউন্ট</h1>
          <p className="text-text-muted font-medium">নিরাপদ এবং দ্রুত কেনাকাটার জন্য গুগল দিয়ে অ্যাকাউন্ট তৈরি করুন</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 mb-8 border border-red-100"
          >
            <AlertCircle size={18} />
            {error}
          </motion.div>
        )}

        <div className="space-y-6">
          <button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 bg-white border-2 border-gray-100 py-5 rounded-[32px] shadow-sm font-black text-text-main active:scale-95 transition-all hover:border-primary/50 text-lg"
          >
            <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
            {loading ? 'প্রসেসিং হচ্ছে...' : 'গুগল দিয়ে শুরু করুন'}
          </button>

          <div className="pt-4 border-t border-gray-50 text-center">
            <p className="text-sm font-bold text-text-muted">
              ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
              <NavLink to="/login" className="text-primary hover:underline underline-offset-4">লগইন করুন</NavLink>
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-text-muted px-6 leading-relaxed mt-10 font-medium">
          এগিয়ে যাওয়ার মাধ্যমে আপনি আমাদের <span className="text-primary font-bold">শর্তাবলি</span> এবং <span className="text-primary font-bold">গোপনীয়তা নীতির</span> সাথে একমত পোষণ করছেন।
        </p>
      </motion.div>
    </div>
  );
}
