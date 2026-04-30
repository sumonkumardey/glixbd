import React, { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';
import { Order, OrderStatusLabels } from '@/src/types';
import { formatDate, formatPrice, cn, compressImage } from '@/src/lib/utils';
import { User, Package, MapPin, Wallet, Bell, LogOut, ChevronRight, ShoppingBag, Heart, LogIn, ShieldCheck, MailWarning, AlertCircle, RefreshCw, Copy, Share2, Gift, Sparkles, Image as ImageIcon, Upload, Download, BellRing, Camera, X } from 'lucide-react';
import { useNavigate, NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '@/src/hooks/useAdmin';
import { toast } from 'react-hot-toast';
import { updateUserProfile, getReferralCount } from '@/src/services/userService';
import Logo from '../Logo';
import { toPng } from 'html-to-image';
import { requestNotificationPermission } from '@/src/services/pushNotificationService';
import WalletDashboard from '../wallet/WalletDashboard';

export default function ProfileScreen() {
  const [user, setUser] = useState(auth.currentUser);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(false);
  const [currentView, setCurrentView] = useState<'profile' | 'wallet'>('profile');
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [isPromoting, setIsPromoting] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const logoRef = React.useRef<HTMLDivElement>(null);

  const handleEnablePush = async () => {
    const token = await requestNotificationPermission();
    if (token) {
      toast.success('পুশ নোটিফিকেশন চালু হয়েছে!');
      setNotificationPermission('granted');
    } else {
      setNotificationPermission(Notification.permission);
    }
  };

  const downloadLogo = async () => {
    if (!logoRef.current) return;
    const toastId = toast.loading('লগো প্রসেস হচ্ছে...');
    try {
      const dataUrl = await toPng(logoRef.current, { 
        quality: 1, 
        pixelRatio: 4,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.download = 'GlixBD-Logo.png';
      link.href = dataUrl;
      link.click();
      toast.success('লগো ডাউনলোড শুরু হয়েছে!', { id: toastId });
    } catch (err) {
      toast.error('ডাউনলোড করতে সমস্যা হয়েছে', { id: toastId });
    }
  };

  const handleUpdatePhoto = async () => {
    if (!user || !newImageUrl) return;
    setIsUpdating(true);
    try {
      const success = await updateUserProfile(user.uid, { photoURL: newImageUrl });
      if (success) {
        toast.success('প্রোফাইল পিকচার আপডেট হয়েছে');
        setShowImageModal(false);
        setNewImageUrl('');
      }
    } catch (err) {
      toast.error('আপডেট করতে সমস্যা হয়েছে');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Check size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('ছবি ১০ এমবির বেশি হতে পারবে না');
      return;
    }

    const toastId = toast.loading('ছবি প্রসেস হচ্ছে...');
    setIsUpdating(true);
    try {
      // Use the shared compression utility
      const base64Image = await compressImage(file);
      
      toast.loading('প্রোফাইল আপডেট হচ্ছে...', { id: toastId });
      const success = await updateUserProfile(user.uid, { photoURL: base64Image });
      
      if (success) {
        toast.success('প্রোফাইল পিকচার আপডেট হয়েছে', { id: toastId });
        setShowImageModal(false);
      } else {
        toast.error('আপডেট ব্যর্থ হয়েছে', { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'ছবি আপলোড করতে সমস্যা হয়েছে', { id: toastId });
    } finally {
      setIsUpdating(false);
      // Reset input value to allow selecting same file again
      if (event.target) event.target.value = '';
    }
  };

  const handleClaimAdmin = async () => {
    if (!user) return;
    setIsPromoting(true);
    try {
      const { setDoc, doc, serverTimestamp } = await import('firebase/firestore');
      await setDoc(doc(db, 'admins', user.uid), {
        email: user.email,
        role: 'super_admin',
        createdAt: serverTimestamp()
      });
      window.location.reload();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `admins/${user.uid}`);
    } finally {
      setIsPromoting(false);
    }
  };

  useEffect(() => {
    let unsubUser = () => {};
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Real-time user profile listener
        unsubUser = onSnapshot(doc(db, 'users', u.uid), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setUserProfile(data);
            setEditName(data.name || u.displayName || '');
            setEditPhone(data.phone || '');
            
            // Fetch referral count
            if (data.referralCode) {
              getReferralCount(data.referralCode).then(setReferralCount);
            }
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, `users/${u.uid}`);
        });

        try {
          const q = query(
            collection(db, 'orders'), 
            where('userId', '==', u.uid), 
            orderBy('createdAt', 'desc'),
            limit(5)
          );
          const snap = await getDocs(q);
          setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, 'orders');
        }
      }
      setLoading(false);
    });
    return () => {
      unsubAuth();
      unsubUser();
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    if (!editName.trim()) {
      toast.error('নাম ফাঁকা রাখা যাবে না');
      return;
    }
    
    setIsUpdating(true);
    try {
      const success = await updateUserProfile(user.uid, { 
        name: editName, 
        phone: editPhone 
      });

      if (success) {
        // Also update Firebase Auth display name for consistency
        const { updateProfile } = await import('firebase/auth');
        await updateProfile(user, { displayName: editName });
        
        toast.success('প্রোফাইল আপডেট সফল হয়েছে');
        setIsEditingProfile(false);
      } else {
        toast.error('আপডেট ব্যর্থ হয়েছে');
      }
    } catch (err) {
      toast.error('কিছু একটা ভুল হয়েছে');
    } finally {
      setIsUpdating(false);
    }
  };




  const handleCopyReferral = async () => {
    if (!userProfile?.referralCode) return;
    const link = `https://glixbd.com?ref=${userProfile.referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'GlixBD Referral',
          text: 'আমার রেফারেল লিঙ্ক ব্যবহার করে কেনাকাটা করুন এবং বোনাস পান!',
          url: link,
        });
      } catch (err) {
        navigator.clipboard.writeText(link);
        toast.success('রেফারেল লিঙ্ক কপি করা হয়েছে!');
      }
    } else {
      navigator.clipboard.writeText(link);
      toast.success('রেফারেল লিঙ্ক কপি করা হয়েছে!');
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="p-8 text-center">লোড হচ্ছে...</div>;

  if (!user) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[80vh] space-y-8 max-w-sm mx-auto">
        <div className="w-24 h-24 bg-primary/10 text-primary rounded-[32px] rotate-12 flex items-center justify-center shadow-xl shadow-primary/5">
          <User size={48} className="-rotate-12" />
        </div>
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-black text-text-main">হ্যালো, স্বাগতম!</h2>
          <p className="text-sm text-text-muted font-medium px-4">আপনার অর্ডার ট্র্যাক করতে এবং পছন্দের পণ্যগুলো দেখতে লগইন করুন।</p>
        </div>

        <div className="w-full space-y-4">
          <NavLink 
            to="/login"
            className="w-full flex items-center justify-center gap-3 bg-primary text-white py-4 rounded-2xl shadow-xl shadow-primary/20 font-bold active:scale-95 transition-all"
          >
            <LogIn size={20} />
            ইমেল দিয়ে লগইন করুন
          </NavLink>

          <NavLink 
            to="/signup"
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-primary/20 text-primary py-4 rounded-2xl font-bold active:scale-95 transition-all"
          >
            <User size={20} />
            নতুন অ্যাকাউন্ট খুলুন
          </NavLink>

          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <span className="relative px-3 bg-white text-[10px] text-text-muted font-black uppercase tracking-widest">অথবা</span>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-4 bg-white border border-gray-200 py-4 rounded-2xl shadow-sm font-bold text-text-main active:scale-95 transition-all hover:bg-gray-50"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            গুগল দিয়ে লগইন করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 pb-12">
      {currentView === 'wallet' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setCurrentView('profile')}
              className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors font-bold"
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <ChevronRight size={18} className="rotate-180" />
              </div>
              প্রোফাইল
            </button>
            <h1 className="text-xl font-black">আমার ওয়ালেট</h1>
            <div className="w-8" /> {/* Spacer */}
          </div>
          <WalletDashboard />
        </div>
      ) : (
        <>
          {/* bKash Style Balance Bar */}
          {userProfile && (
            <section className="animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="bg-white rounded-[28px] p-2 shadow-sm border border-gray-100 flex items-center gap-3 overflow-hidden">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/20">
                  <Wallet size={24} />
                </div>
                
                <div className="flex-1">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">ওয়ালেট ব্যালেন্স</p>
                  <div 
                    onClick={() => setCurrentView('wallet')}
                    className="relative h-8 w-44 bg-gray-50 rounded-full mt-0.5 border border-gray-100 cursor-pointer overflow-hidden group"
                  >
                    <AnimatePresence mode="wait">
                      {!showBalance ? (
                        <motion.div 
                          key="tap-to-see"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="absolute inset-0 flex items-center px-4 gap-2"
                        >
                          <div className="w-2 h-2 bg-primary animate-ping rounded-full" />
                          <span className="text-[11px] font-black text-primary">ব্যালেন্স জানতে ট্যাপ করুন</span>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="balance-val"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.1 }}
                          className="absolute inset-0 flex items-center px-4"
                        >
                          <span className="text-lg font-black text-primary">৳ {userProfile.walletBalance || 0}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {!showBalance && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer" />}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Header */}
          <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Sparkles size={80} className="text-primary" />
        </div>
        <div 
          onClick={() => setShowImageModal(true)}
          className="w-20 h-20 rounded-full border-4 border-primary/20 overflow-hidden shadow-Inner relative z-10 shrink-0 group cursor-pointer"
        >
          <img 
            src={userProfile?.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
            alt={user.displayName || 'User'} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={20} className="text-white" />
          </div>
        </div>
        <div className="flex-1 space-y-1 relative z-10">
          <h2 className="text-xl font-bold line-clamp-1">{user.displayName}</h2>
          <p className="text-xs text-text-muted">{user.email}</p>
          <button 
            onClick={() => setIsEditingProfile(true)}
            className="text-[10px] font-black text-primary uppercase tracking-widest mt-1 bg-primary/10 px-2 py-0.5 rounded-lg"
          >
            এডিট প্রোফাইল
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingProfile(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-text-main">তথ্য পরিবর্তন করুন</h3>
                <button onClick={() => setIsEditingProfile(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">আপনার নাম</label>
                  <input 
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="আপনার নাম লিখুন"
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-primary transition-colors text-sm font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">ফোন নাম্বার</label>
                  <input 
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-primary transition-colors text-sm font-medium"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleUpdateProfile}
                    disabled={isUpdating}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isUpdating ? 'আপডেট হচ্ছে...' : 'সেভ করুন'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image URL Modal */}
      <AnimatePresence>
        {showImageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowImageModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-text-main">প্রোফাইল পিক সেট করুন</h3>
                <button onClick={() => setShowImageModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Gallery Upload Section */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUpdating}
                  className="w-full flex items-center justify-center gap-3 bg-primary/5 hover:bg-primary/10 text-primary py-10 rounded-2xl border-2 border-dashed border-primary/20 transition-all group"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload size={24} />
                    </div>
                    <span className="text-sm font-black underline decoration-dotted underline-offset-4">গ্যালারি থেকে ফটো দিন</span>
                    <span className="text-[10px] font-bold text-text-muted">JPG, PNG (Max 5MB)</span>
                  </div>
                </button>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileUpload}
                />

                <div className="relative flex items-center justify-center py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                  </div>
                  <span className="relative px-3 bg-white text-[10px] text-text-muted font-black uppercase tracking-widest">অথবা</span>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">ছবির লিঙ্ক (Image URL)</label>
                  <input 
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-primary transition-colors text-sm font-medium"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                  <p className="text-[10px] text-blue-600 font-bold leading-relaxed">
                    টিপস: আপনি গুগল থেকে কোনো ছবির লিঙ্ক কপি করে এখানে পেস্ট করতে পারেন।
                  </p>
                </div>

                <button 
                  onClick={handleUpdatePhoto}
                  disabled={isUpdating || !newImageUrl}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isUpdating ? 'আপডেট হচ্ছে...' : 'সেভ করুন'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="মোট অর্ডার" value={orders.length} color="bg-blue-50 text-blue-600" />
        <StatCard label="ওয়ালেট" value={`৳${userProfile?.walletBalance || 0}`} color="bg-orange-50 text-orange-600" />
        <StatCard label="পয়েন্টস" value={userProfile?.points || 0} color="bg-purple-50 text-purple-600" />
        <StatCard label="রেফারাল" value={referralCount} color="bg-green-50 text-green-600" />
      </div>

      {/* Referral Link Card */}
      {userProfile && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary to-indigo-600 rounded-[32px] p-6 text-white relative overflow-hidden shadow-xl shadow-primary/20"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                  <Gift size={20} />
                </div>
                <h3 className="text-lg font-black tracking-tight">আপনার রেফার লিঙ্ক</h3>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
                {referralCount} জন জয়েন করেছে
              </div>
            </div>
            
            <p className="text-sm text-white/80 font-medium mb-6 leading-relaxed">
              আপনার লিঙ্ক দিয়ে কেউ জয়েন করে ১০০০ টাকার কেনাকাটা করলে আপনি বোনাস পাবেন!
            </p>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 flex items-center justify-between group">
              <span className="font-mono font-bold tracking-tight text-[10px] truncate max-w-[150px]">glixbd.com?ref={userProfile.referralCode}</span>
              <div className="flex gap-2">
                <button onClick={handleCopyReferral} className="p-2 hover:bg-white/20 rounded-lg transition-colors" title="কপি করুন">
                  <Copy size={18} />
                </button>
                <button onClick={handleCopyReferral} className="p-2 hover:bg-white/20 rounded-lg transition-colors" title="শেয়ার করুন">
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Logo Download Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm overflow-hidden relative"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-text-main">অফিসিয়াল লগো</h3>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">গ্যালারিতে ডাউনলোড করুন</p>
            </div>
          </div>
          <button 
            onClick={downloadLogo}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            <Download size={16} />
            ডাউনলোড
          </button>
        </div>

        <div className="flex items-center justify-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <div ref={logoRef} className="bg-white p-6 rounded-2xl shadow-sm">
            <Logo size="xl" />
          </div>
        </div>
      </motion.div>

      {/* Push Notification Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              notificationPermission === 'granted' ? "bg-green-50 text-green-500" : "bg-primary/10 text-primary"
            )}>
              <BellRing size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-text-main">পুশ নোটিফিকেশন</h3>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">সর্বশেষ আপডেট পেতে</p>
            </div>
          </div>
          {notificationPermission !== 'granted' ? (
            <button 
              onClick={handleEnablePush}
              className="bg-primary text-white px-5 py-2 rounded-xl text-xs font-black shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              চালু করুন
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-green-500 bg-green-50 px-3 py-1.5 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-tight">Active</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Admin Panel Link */}
      {isAdmin && (
        <NavLink 
          to="/admin" 
          className="bg-primary/10 p-4 rounded-3xl border border-primary/20 flex items-center justify-between group active:scale-95 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-primary">অ্যাডমিন ড্যাশবোর্ড</h4>
              <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">সাইট কন্ট্রোল প্যানেল</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-primary" />
        </NavLink>
      )}

      {/* Developer Admin Claim Button */}
      {!isAdmin && user?.email === 'oksumondey153@gmail.com' && (
        <button 
          onClick={handleClaimAdmin}
          disabled={isPromoting}
          className="w-full bg-orange-500 text-white font-black py-4 rounded-3xl shadow-xl shadow-orange-200 active:scale-95 transition-all disabled:opacity-50"
        >
          {isPromoting ? 'প্রসেসিং...' : 'নিজেকে অ্যাডমিন হিসেবে সেট করুন'}
        </button>
      )}

      {/* Recent Orders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-sm">সাম্প্রতিক অর্ডার</h3>
          <button className="text-primary text-xs font-bold">সব দেখুন</button>
        </div>
        {orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map(order => (
              <NavLink 
                to={`/tracking/${order.orderNumber}`} 
                key={order.id} 
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-primary">
                    <Package size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">#{order.orderNumber}</h4>
                    <p className="text-[10px] text-text-muted">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-primary">{formatPrice(order.total)}</p>
                  <p className="text-[10px] text-orange-500 font-bold">{OrderStatusLabels[order.status]}</p>
                </div>
              </NavLink>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center space-y-2">
            <p className="text-xs text-text-muted">আপনি এখনো কোনো অর্ডার করেননি।</p>
            <NavLink to="/" className="text-primary text-xs font-bold underline">নতুন পণ্য খুঁজুন</NavLink>
          </div>
        )}
      </div>

      {/* Menu */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <MenuItem icon={<MapPin size={20} />} label="ডেলিভারি ঠিকানা" to="/profile" />
        <MenuItem icon={<Heart size={20} />} label="পছন্দের তালিকা" to="/wishlist" />
        <MenuItem icon={<Bell size={20} />} label="নোটিফিকেশন" to="/notifications" />
        <MenuItem icon={<Wallet size={20} />} label="ওয়ালেট ও উইথড্র" onClick={() => setCurrentView('wallet')} />
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-6 py-4 text-red-500 hover:bg-red-50 transition-colors border-t border-gray-50"
        >
          <LogOut size={20} />
          <span className="text-sm font-bold">লগআউট করুন</span>
        </button>
      </div>
    </>
    )}
    </div>
  );
}

function StatCard({ label, value, color, onClick }: { label: string, value: string | number, color: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-100 shadow-sm bg-white gap-1 transition-all",
        onClick && "cursor-pointer active:scale-95 hover:border-primary/20 hover:shadow-primary/5"
      )}
    >
      <span className="text-lg font-black text-text-main">{value}</span>
      <span className="text-[9px] font-bold text-text-muted uppercase text-center">{label}</span>
    </div>
  );
}

function MenuItem({ icon, label, to, onClick }: { icon: React.ReactNode, label: string, to?: string, onClick?: () => void }) {
  const Component = to ? Link : 'button';
  return (
    <Component 
      to={to || '#'} 
      onClick={onClick}
      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 group"
    >
      <div className="text-text-muted group-hover:text-primary transition-colors">
        {icon}
      </div>
      <span className="flex-1 text-sm font-bold text-left">{label}</span>
      <ChevronRight size={18} className="text-gray-300" />
    </Component>
  );
}
