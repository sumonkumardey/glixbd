import React, { useState, useMemo, useEffect } from 'react';
import { useCart } from '@/src/lib/CartContext';
import { formatPrice, cn } from '@/src/lib/utils';
import { ShoppingBag, ChevronLeft, CreditCard, MapPin, ShieldCheck, ArrowRight, Truck, Wallet, CheckCircle2, Phone, Copy, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs, limit, setDoc } from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '@/src/lib/firebase';
import { divisions, districts, upazilas } from '@/src/lib/bangladesh-data';
import Confetti from 'react-confetti';
import { toast } from 'react-hot-toast';
import useMeasure from 'react-use-measure';
import { createNotification, createAdminNotification } from '@/src/services/notificationService';
import { Tag, Ticket } from 'lucide-react';

export default function CheckoutScreen() {
  const { cart, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [measureRef, { width, height }] = useMeasure();
  const [isOrdered, setIsOrdered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad'>('cod');
  const [paymentDetails, setPaymentDetails] = useState({
    amount: '',
    transactionId: ''
  });
  const [promoCode, setPromoCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    minAmount?: number;
  } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [useWallet, setUseWallet] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState({
    bkashNumber: '01312257956',
    nagadNumber: '01312257956',
    deliveryChargeInsideDhaka: 60,
    deliveryChargeOutsideDhaka: 120,
    isCodEnabled: true
  });

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    
    setPromoLoading(true);
    try {
      const q = query(
        collection(db, 'coupons'), 
        where('code', '==', promoCode.trim().toUpperCase()),
        where('isActive', '==', true),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast.error('প্রোমো কোডটি সঠিক নয় অথবা মেয়াদ শেষ হয়ে গেছে');
        setPromoLoading(false);
        return;
      }
      
      const couponData = querySnapshot.docs[0].data() as any;
      
      // Check expiry
      if (couponData.expiry && couponData.expiry.toDate() < new Date()) {
        toast.error('প্রোমো কোডটির মেয়াদ শেষ হয়ে গেছে');
        setPromoLoading(false);
        return;
      }
      
      // Check min amount
      if (couponData.minAmount && subtotal < couponData.minAmount) {
        toast.error(`এই কোডটি ব্যবহার করতে কমপক্ষে ${formatPrice(couponData.minAmount)} টাকার অর্ডার করতে হবে`);
        setPromoLoading(false);
        return;
      }
      
      setAppliedCoupon({
        code: couponData.code,
        type: couponData.type,
        value: couponData.value,
        minAmount: couponData.minAmount
      });
      
      toast.success('প্রোমো কোড সফলভাবে যুক্ত হয়েছে!');
    } catch (err) {
      console.error('Promo error:', err);
      toast.error('প্রোমো কোড যাচাই করতে সমস্যা হয়েছে');
    } finally {
      setPromoLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setPromoCode('');
    toast.success('প্রোমো কোড সরিয়ে ফেলা হয়েছে');
  };

  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percentage') {
      return Math.round((subtotal * appliedCoupon.value) / 100);
    }
    return appliedCoupon.value;
  }, [appliedCoupon, subtotal]);

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    toast.success('নাম্বার কপি করা হয়েছে');
  };

  const handlePasteTrx = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        toast.error('আপনার ব্রাউজার অটো-পেস্ট সাপোর্ট করছে না। অনুগ্রহ করে ম্যানুয়ালি লিখুন।');
        return;
      }
      const text = await navigator.clipboard.readText();
      if (text) {
        setPaymentDetails(prev => ({ ...prev, transactionId: text }));
        toast.success('ট্রানজেকশন আইডি পেস্ট করা হয়েছে');
      } else {
        toast.error('ক্লিপবোর্ড খালি');
      }
    } catch (err: any) {
      console.error('Paste error:', err);
      // Special handling for browser security blocks in iframe
      if (err.name === 'NotAllowedError' || err.message?.includes('permissions policy') || err.message?.includes('Clipboard API has been blocked')) {
        toast.error('ব্রাউজার সিকিউরিটির কারণে অটো-পেস্ট সম্ভব নয়। অনুগ্রহ করে নিচের ঘরে সরাসরি পেস্ট করুন (Long Press or Ctrl+V)');
      } else {
        toast.error('পেস্ট করতে সমস্যা হয়েছে। অনুগ্রহ করে ম্যানুয়ালি আইডিটি লিখুন।');
      }
    }
  };
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Settings
        const docSnap = await getDoc(doc(db, 'settings', 'payment'));
        if (docSnap.exists()) {
          setPaymentSettings(docSnap.data() as any);
        }

        // Fetch user profile for wallet balance
        if (auth.currentUser) {
          const userSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userSnap.exists()) {
            setUserProfile(userSnap.data());
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    }
    fetchData();
  }, []);

  const [shippingInfo, setShippingInfo] = useState({
    fullName: auth.currentUser?.displayName || '',
    phone: '',
    division: '',
    divisionId: '',
    district: '',
    districtId: '',
    thana: '',
    thanaId: '',
    address: '',
    isDhaka: true
  });

  // Remove the strict login block to allow guest checkout
  // But we still want to fetch user profile if logged in
  useEffect(() => {
    if (auth.currentUser && !shippingInfo.fullName) {
      setShippingInfo(prev => ({
        ...prev,
        fullName: auth.currentUser?.displayName || ''
      }));
    }
  }, [auth.currentUser]);

  const filteredDistricts = useMemo(() => {
    return districts.filter(d => d.division_id === shippingInfo.divisionId);
  }, [shippingInfo.divisionId]);

  const filteredUpazilas = useMemo(() => {
    return upazilas.filter(u => u.district_id === shippingInfo.districtId);
  }, [shippingInfo.districtId]);

  const deliveryCharge = shippingInfo.isDhaka 
    ? (paymentSettings.deliveryChargeInsideDhaka || 60) 
    : (paymentSettings.deliveryChargeOutsideDhaka || 120);
  
  const walletBalance = userProfile?.walletBalance || 0;
  const initialTotal = subtotal + deliveryCharge - discount;
  const walletAmountUsed = useWallet ? Math.min(walletBalance, initialTotal) : 0;
  const total = initialTotal - walletAmountUsed;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    
    if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.division || !shippingInfo.district || !shippingInfo.address) {
      alert('দয়া করে সব তথ্য পূরণ করুন।');
      return;
    }

    if (paymentMethod !== 'cod' && total > 0) {
      if (!paymentDetails.amount || !paymentDetails.transactionId) {
        toast.error('দয়া করে পেমেন্টের তথ্যগুলো পূরণ করুন');
        return;
      }
    }

    setLoading(true);
    try {
      const generatedOrderNum = `GBD-${Date.now().toString().slice(-8)}`;
      setOrderNumber(generatedOrderNum);

      const orderData = {
        orderNumber: generatedOrderNum,
        userId: auth.currentUser?.uid || 'guest',
        shippingAddress: shippingInfo,
        paymentMethod,
        paymentDetails: paymentMethod === 'cod' ? null : paymentDetails,
        subtotal,
        deliveryCharge,
        discount,
        promoCode: appliedCoupon?.code || null,
        walletAmountUsed,
        total,
        status: 'pending',
        createdAt: serverTimestamp(),
        items: cart
      };

      try {
        const orderRef = doc(db, 'orders', generatedOrderNum);
        await setDoc(orderRef, orderData);

        // Deduct from wallet if used
        if (walletAmountUsed > 0 && auth.currentUser) {
          const { runTransaction } = await import('firebase/firestore');
          await runTransaction(db, async (transaction) => {
            const userRef = doc(db, 'users', auth.currentUser!.uid);
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists()) throw "User does not exist!";
            
            const newBalance = (userSnap.data().walletBalance || 0) - walletAmountUsed;
            transaction.update(userRef, { walletBalance: newBalance });
            
            // Log transaction
            const transRef = doc(collection(db, `users/${auth.currentUser!.uid}/walletTransactions`));
            transaction.set(transRef, {
              userId: auth.currentUser!.uid,
              type: 'purchase',
              amount: -walletAmountUsed,
              description: `অর্ডার #${generatedOrderNum} এর জন্য পেমেন্ট`,
              referenceId: generatedOrderNum,
              createdAt: serverTimestamp()
            });
          });
        }
        
        await addDoc(collection(db, `orders/${generatedOrderNum}/tracking`), {
          status: 'pending',
          statusBn: 'অর্ডার গৃহীত হয়েছে',
          message: 'Your order has been placed successfully.',
          messageBn: 'আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে।',
          createdAt: serverTimestamp()
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `orders/${generatedOrderNum}`);
        return;
      }

      // Create Notifications
      if (auth.currentUser) {
        try {
          await createNotification(auth.currentUser.uid, {
            title: 'অর্ডার সফল হয়েছে!',
            message: `আপনার অর্ডার #${generatedOrderNum} সফলভাবে গ্রহণ করা হয়েছে।`,
            type: 'order',
            isRead: false,
            link: `/tracking/${generatedOrderNum}`
          });

          await createAdminNotification({
            title: 'নতুন অর্ডার!',
            message: `${shippingInfo.fullName} একটি নতুন অর্ডার করেছেন (#${generatedOrderNum})।`,
            type: 'order',
            isRead: false,
            link: '/admin/orders'
          });
        } catch (e) {
          console.warn("Notification error:", e);
        }
      }

      setIsOrdered(true);
      clearCart();
    } catch (error: any) {
      console.error("Checkout Failed:", error);
      alert('অর্ডার করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  if (isOrdered) {
    return (
      <div ref={measureRef} className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-50 max-w-2xl mx-auto my-10 relative overflow-hidden">
        <Confetti width={width} height={height} recycle={false} numberOfPieces={300} />
        
        <motion.div 
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 15 }}
          className="w-32 h-32 bg-green-50 text-green-500 rounded-[40px] flex items-center justify-center shadow-lg shadow-green-100 border-2 border-green-100"
        >
          <ShoppingBag size={56} strokeWidth={2.5} />
        </motion.div>

        <div className="space-y-4 max-w-sm">
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl lg:text-4xl font-black text-text-main"
          >
            অর্ডার সফল হয়েছে!
          </motion.h2>
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-50 p-4 rounded-3xl border border-dashed border-gray-200"
          >
            <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] mb-1">অর্ডার নম্বর</p>
            <p className="text-2xl font-black text-primary">{orderNumber}</p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row w-full gap-4 pt-8"
        >
          <button 
            onClick={() => navigate(`/tracking/${orderNumber}`)}
            className="flex-1 bg-primary text-white font-black py-5 rounded-3xl shadow-2xl shadow-primary/30 active:scale-95 transition-all text-lg hover:bg-primary/90"
          >
            অর্ডার ট্র্যাক করুন
          </button>
          <button 
            onClick={() => navigate('/')}
            className="flex-1 bg-gray-100 text-text-main font-black py-5 rounded-3xl active:scale-95 transition-all text-lg hover:bg-gray-200"
          >
            শপিং চালিয়ে যান
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 p-4 lg:p-0">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:bg-gray-50">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-3xl lg:text-4xl font-black text-text-main">চেকআউট</h1>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-8 space-y-8">
          {/* Shipping Section */}
          <section className="bg-white p-8 lg:p-10 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-100/50 space-y-8">
            <h3 className="text-xl font-black text-text-main flex items-center gap-3">
              <div className="w-1.5 h-6 bg-primary rounded-full"></div>
              শিপিং তথ্য দিন
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-2">পূর্ণ নাম</label>
                <input 
                  type="text" 
                  placeholder="আপনার নাম..." 
                  value={shippingInfo.fullName}
                  onChange={(e) => setShippingInfo({...shippingInfo, fullName: e.target.value})}
                  className="w-full bg-gray-50 border border-transparent focus:border-primary focus:bg-white outline-none px-6 py-4 rounded-3xl font-bold transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-2">মোবাইল নম্বর</label>
                <input 
                  type="tel" 
                  placeholder="০১XXXXXXXXX" 
                  value={shippingInfo.phone}
                  onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                  className="w-full bg-gray-50 border border-transparent focus:border-primary focus:bg-white outline-none px-6 py-4 rounded-3xl font-bold transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-2">বিভাগ</label>
                <div className="relative">
                  <select 
                    value={shippingInfo.divisionId}
                    onChange={(e) => {
                      const divId = e.target.value;
                      const div = divisions.find(d => d.id === divId);
                      setShippingInfo({
                        ...shippingInfo, 
                        divisionId: divId, 
                        division: div?.bn_name || '',
                        districtId: '',
                        district: '',
                        thanaId: '',
                        thana: '',
                        isDhaka: div?.bn_name === 'ঢাকা'
                      });
                    }}
                    className="w-full bg-gray-50 border border-transparent focus:border-primary focus:bg-white outline-none px-6 py-4 rounded-3xl font-bold transition-all appearance-none cursor-pointer"
                  >
                    <option value="">নির্বাচন করুন</option>
                    {divisions.map(d => <option key={d.id} value={d.id}>{d.bn_name}</option>)}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                    <ChevronLeft className="-rotate-90" size={16} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-2">জেলা</label>
                <div className="relative">
                  <select 
                    disabled={!shippingInfo.divisionId}
                    value={shippingInfo.districtId}
                    onChange={(e) => {
                      const distId = e.target.value;
                      const dist = districts.find(d => d.id === distId);
                      setShippingInfo({
                        ...shippingInfo, 
                        districtId: distId, 
                        district: dist?.bn_name || '',
                        thanaId: '',
                        thana: ''
                      });
                    }}
                    className="w-full bg-gray-50 border border-transparent focus:border-primary focus:bg-white outline-none px-6 py-4 rounded-3xl font-bold transition-all appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="">নির্বাচন করুন</option>
                    {filteredDistricts.map(d => <option key={d.id} value={d.id}>{d.bn_name}</option>)}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                    <ChevronLeft className="-rotate-90" size={16} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-2">থানা/উপজেলা</label>
                <div className="relative">
                  {filteredUpazilas.length > 0 ? (
                    <>
                      <select 
                        disabled={!shippingInfo.districtId}
                        value={shippingInfo.thanaId}
                        onChange={(e) => {
                          const tId = e.target.value;
                          const t = upazilas.find(u => u.id === tId);
                          setShippingInfo({
                            ...shippingInfo, 
                            thanaId: tId, 
                            thana: t?.bn_name || ''
                          });
                        }}
                        className="w-full bg-gray-50 border border-transparent focus:border-primary focus:bg-white outline-none px-6 py-4 rounded-3xl font-bold transition-all appearance-none cursor-pointer disabled:opacity-50"
                      >
                        <option value="">নির্বাচন করুন</option>
                        {filteredUpazilas.map(u => <option key={u.id} value={u.id}>{u.bn_name}</option>)}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                        <ChevronLeft className="-rotate-90" size={16} />
                      </div>
                    </>
                  ) : (
                    <input 
                      type="text" 
                      placeholder="থানা লিখুন..." 
                      disabled={!shippingInfo.districtId}
                      value={shippingInfo.thana}
                      onChange={(e) => setShippingInfo({...shippingInfo, thana: e.target.value})}
                      className="w-full bg-gray-50 border border-transparent focus:border-primary focus:bg-white outline-none px-6 py-4 rounded-3xl font-bold transition-all disabled:opacity-50"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-2">বিস্তারিত ঠিকানা</label>
              <textarea 
                placeholder="বাসা নম্বর, রোড বা বিস্তারিত..." 
                rows={3}
                value={shippingInfo.address}
                onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                className="w-full bg-gray-50 border border-transparent focus:border-primary focus:bg-white outline-none px-6 py-4 rounded-3xl font-bold transition-all resize-none"
              />
            </div>
          </section>

          {/* Payment Section */}
          <section className="bg-white p-8 lg:p-10 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-100/50 space-y-8">
            <h3 className="text-xl font-black text-text-main flex items-center gap-3">
              <div className="w-1.5 h-6 bg-primary rounded-full"></div>
              পেমেন্ট পদ্ধতি
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {paymentSettings.isCodEnabled && (
                <button 
                  onClick={() => setPaymentMethod('cod')}
                  className={cn(
                    "p-6 rounded-[32px] border-2 flex flex-col items-center gap-3 transition-all duration-300 relative group",
                    paymentMethod === 'cod' ? "border-primary bg-primary/[0.03] shadow-lg shadow-primary/10" : "border-gray-50 bg-gray-50 hover:border-gray-200"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                    paymentMethod === 'cod' ? "bg-primary text-white" : "bg-white text-gray-400 group-hover:text-primary"
                  )}>
                    <Truck size={24} />
                  </div>
                  <div className="text-center">
                    <h4 className="font-black text-text-main text-sm">ক্যাশ অন ডেলিভারি</h4>
                  </div>
                  {paymentMethod === 'cod' && (
                    <CheckCircle2 size={18} className="absolute top-4 right-4 text-primary" />
                  )}
                </button>
              )}

              <button 
                onClick={() => setPaymentMethod('bkash')}
                className={cn(
                  "p-6 rounded-[32px] border-2 flex flex-col items-center gap-3 transition-all duration-300 relative group",
                  paymentMethod === 'bkash' ? "border-[#D12053] bg-[#D12053]/[0.03] shadow-lg shadow-[#D12053]/10" : "border-gray-50 bg-gray-50 hover:border-gray-200"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                  paymentMethod === 'bkash' ? "bg-[#D12053] text-white" : "bg-white text-gray-400 group-hover:text-[#D12053]"
                )}>
                  <Wallet size={24} />
                </div>
                <div className="text-center">
                  <h4 className="font-black text-text-main text-sm">বিকাশ</h4>
                </div>
                {paymentMethod === 'bkash' && (
                  <CheckCircle2 size={18} className="absolute top-4 right-4 text-[#D12053]" />
                )}
              </button>

              <button 
                onClick={() => setPaymentMethod('nagad')}
                className={cn(
                  "p-6 rounded-[32px] border-2 flex flex-col items-center gap-3 transition-all duration-300 relative group",
                  paymentMethod === 'nagad' ? "border-[#ED1C24] bg-[#ED1C24]/[0.03] shadow-lg shadow-[#ED1C24]/10" : "border-gray-50 bg-gray-50 hover:border-gray-200"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                  paymentMethod === 'nagad' ? "bg-[#ED1C24] text-white" : "bg-white text-gray-400 group-hover:text-[#ED1C24]"
                )}>
                  <Smartphone size={24} />
                </div>
                <div className="text-center">
                  <h4 className="font-black text-text-main text-sm">নগদ</h4>
                </div>
                {paymentMethod === 'nagad' && (
                  <CheckCircle2 size={18} className="absolute top-4 right-4 text-[#ED1C24]" />
                )}
              </button>
            </div>

            {/* Payment Details Card */}
            <AnimatePresence mode="wait">
              {paymentMethod !== 'cod' && (
                <motion.div 
                  key={paymentMethod}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={cn(
                    "p-6 rounded-[32px] border flex flex-col gap-6",
                    paymentMethod === 'bkash' ? "bg-[#D12053]/5 border-[#D12053]/20" : "bg-[#ED1C24]/5 border-[#ED1C24]/20"
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-white",
                        paymentMethod === 'bkash' ? "bg-[#D12053]" : "bg-[#ED1C24]"
                      )}>
                        <Phone size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">সেন্ড মানি করুন (পার্সোনাল)</p>
                        <p className="text-2xl font-black text-text-main">
                          {paymentMethod === 'bkash' ? paymentSettings.bkashNumber : paymentSettings.nagadNumber}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleCopyNumber(paymentMethod === 'bkash' ? paymentSettings.bkashNumber : paymentSettings.nagadNumber)}
                      className="p-3 bg-white rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all text-text-muted hover:text-primary"
                      title="Copy Number"
                    >
                      <Copy size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-text-muted ml-1 uppercase tracking-tighter">কত টাকা পাঠিয়েছেন?</label>
                      <input 
                        type="number"
                        value={paymentDetails.amount}
                        onChange={e => setPaymentDetails(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="অ্যামাউন্ট লিখুন"
                        className="w-full bg-white border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-primary/20 font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-text-muted ml-1 uppercase tracking-tighter">ট্রানজেকশন আইডি</label>
                      <div className="relative">
                        <input 
                          type="text"
                          value={paymentDetails.transactionId}
                          onChange={e => setPaymentDetails(prev => ({ ...prev, transactionId: e.target.value }))}
                          placeholder="TrxID"
                          className="w-full bg-white border-none rounded-2xl py-3 px-4 pr-20 focus:ring-2 focus:ring-primary/20 font-bold uppercase"
                        />
                        <button 
                          onClick={handlePasteTrx}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg hover:bg-primary hover:text-white transition-colors"
                        >
                          PASTE
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs font-medium text-text-muted leading-relaxed italic border-t border-black/5 pt-4">
                    * পেমেন্ট করার পর ট্রানজেকশন আইডি এবং সঠিক অ্যামাউন্ট দিয়ে অর্ডার কনফার্ম করুন।
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>

        <div className="lg:col-span-4 mt-8 lg:mt-0 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-2xl shadow-gray-200/40 space-y-8 sticky top-24">
            <h3 className="text-xl font-black text-text-main border-b border-gray-50 pb-6 flex items-center gap-3">
              <CreditCard size={24} className="text-primary" />
              অর্ডার সামারি
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between font-bold text-text-muted">
                <span>উপমোট</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between font-bold text-text-muted">
                <span>ডেলিভারি চার্জ</span>
                <span>{formatPrice(deliveryCharge)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between font-bold text-green-600 bg-green-50 p-2 rounded-xl border border-dashed border-green-200">
                  <div className="flex items-center gap-2">
                    <Tag size={14} />
                    <span>ডিসকাউন্ট ({appliedCoupon?.code})</span>
                  </div>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}

              {walletAmountUsed > 0 && (
                <div className="flex justify-between font-bold text-primary bg-primary/5 p-2 rounded-xl border border-dashed border-primary/20">
                  <div className="flex items-center gap-2">
                    <Wallet size={14} />
                    <span>ওয়ালেট ডিসকাউন্ট</span>
                  </div>
                  <span>-{formatPrice(walletAmountUsed)}</span>
                </div>
              )}

              <div className="h-px bg-gray-50 w-full" />
              
              {/* Wallet Usage */}
              {walletBalance > 0 && (
                <div className={cn(
                  "p-4 rounded-2xl border transition-all cursor-pointer",
                  useWallet ? "bg-primary/5 border-primary/20" : "bg-gray-50 border-gray-100"
                )} onClick={() => setUseWallet(!useWallet)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Wallet size={18} className={cn(useWallet ? "text-primary" : "text-gray-400")} />
                      <span className="text-sm font-bold text-text-main">ওয়ালেট ব্যালেন্স ব্যবহার করুন</span>
                    </div>
                    <div className={cn(
                      "w-10 h-5 rounded-full relative transition-colors",
                      useWallet ? "bg-primary" : "bg-gray-300"
                    )}>
                      <div className={cn(
                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                        useWallet ? "right-1" : "left-1"
                      )} />
                    </div>
                  </div>
                  <p className="text-[10px] text-text-muted font-bold">আপনার বর্তমানে {formatPrice(walletBalance)} আছে</p>
                </div>
              )}

              {/* Promo Code Input */}
              {!appliedCoupon ? (
                <div className="space-y-3 pt-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">প্রোমো কোড (যদি থাকে)</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Ticket size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input 
                        type="text"
                        placeholder="GLIXBDXX"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        className="w-full bg-gray-50 border border-gray-100 focus:border-primary outline-none pl-12 pr-4 py-3 rounded-2xl font-bold transition-all"
                      />
                    </div>
                    <button 
                      onClick={handleApplyPromo}
                      disabled={promoLoading || !promoCode}
                      className="px-6 bg-text-main text-white font-black rounded-2xl hover:bg-black active:scale-95 transition-all disabled:opacity-50"
                    >
                      {promoLoading ? "..." : "APPLY"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <Ticket size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-primary uppercase">{appliedCoupon.code}</p>
                      <p className="text-[10px] font-bold text-text-muted">ডিসকাউন্ট যুক্ত হয়েছে</p>
                    </div>
                  </div>
                  <button 
                    onClick={removeCoupon}
                    className="text-[10px] font-black text-red-500 hover:underline"
                  >
                    REMOVE
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-black">সর্বমোট</span>
                <span className="text-3xl font-black text-primary">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3 text-[10px] text-text-muted font-black uppercase tracking-widest bg-gray-50 p-4 rounded-2xl">
                <ShieldCheck size={16} className="text-green-500" />
                আপনার পেমেন্ট সম্পূর্ণ সুরক্ষিত
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full bg-primary text-white font-black py-5 rounded-[28px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-all text-xl disabled:opacity-50 hover:bg-primary/90 btn-rgb"
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    অর্ডার নিশ্চিত করুন
                    <ArrowRight size={24} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
