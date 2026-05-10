import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  PlusCircle,
  Smartphone,
  ChevronRight,
  History
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface WalletTransaction {
  id: string;
  type: 'referral_bonus' | 'purchase' | 'withdrawal' | 'refund' | 'adjustment';
  amount: number;
  description: string;
  createdAt: any;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  paymentMethod: string;
  accountNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

const WalletDashboard: React.FC = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'withdraw'>('history');
  
  // Withdrawal Form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [accountNumber, setAccountNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [minWithdrawal, setMinWithdrawal] = useState(500);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch user balance
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setBalance(docSnap.data().walletBalance || 0);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser?.uid}`);
    });

    // Fetch transactions
    const transPath = `users/${auth.currentUser.uid}/walletTransactions`;
    const transRef = collection(db, transPath);
    const qTrans = query(transRef, orderBy('createdAt', 'desc'), limit(20));
    const unsubscribeTrans = onSnapshot(qTrans, (snapshot) => {
      const transData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WalletTransaction[];
      setTransactions(transData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, transPath);
    });

    // Fetch withdrawal requests
    const withdrawPath = 'withdrawalRequests';
    const withdrawRef = collection(db, withdrawPath);
    const qWithdraw = query(
      withdrawRef, 
      where('userId', '==', auth.currentUser.uid),
      limit(50) // Fetch more to sort client side
    );
    const unsubscribeWithdraw = onSnapshot(qWithdraw, (snapshot) => {
      const withdrawData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WithdrawalRequest[];
      
      // Sort client-side to avoid needing composite index
      const sorted = withdrawData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      
      setWithdrawals(sorted.slice(0, 10)); // Take top 10
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, withdrawPath);
    });

    // Fetch settings for min withdrawal
    const fetchSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'config'));
        if (settingsSnap.exists()) {
          setMinWithdrawal(settingsSnap.data().minWithdrawalAmount || 500);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchSettings();

    return () => {
      unsubscribeUser();
      unsubscribeTrans();
      unsubscribeWithdraw();
    };
  }, []);

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < minWithdrawal) {
      toast.error(`সর্বনিম্ন ${minWithdrawal} টাকা উত্তোলন করা যাবে।`);
      return;
    }

    if (amount > balance) {
      toast.error('আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।');
      return;
    }

    if (accountNumber.length < 11) {
      toast.error('সঠিক মোবাইল নম্বর দিন।');
      return;
    }

    setIsSubmitting(true);
    try {
      const { runTransaction } = await import('firebase/firestore');
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', auth.currentUser!.uid);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw "User does not exist!";
        
        const currentBalance = userSnap.data().walletBalance || 0;
        if (currentBalance < amount) throw "Inconsistent balance. Please refresh.";

        // Deduct from balance
        transaction.update(userRef, {
          walletBalance: currentBalance - amount,
          updatedAt: serverTimestamp()
        });

        // Create withdrawal request
        const withdrawRef = doc(collection(db, 'withdrawalRequests'));
        transaction.set(withdrawRef, {
          userId: auth.currentUser!.uid,
          userName: auth.currentUser!.displayName || 'User',
          userPhone: auth.currentUser!.phoneNumber || '',
          amount,
          paymentMethod,
          accountNumber,
          status: 'pending',
          createdAt: serverTimestamp()
        });

        // Log transaction
        const transRef = doc(collection(db, `users/${auth.currentUser!.uid}/walletTransactions`));
        transaction.set(transRef, {
          userId: auth.currentUser!.uid,
          type: 'withdrawal',
          amount: -amount,
          description: `টাকা উত্তোলন রিকোয়েস্ট (৳${amount})`,
          referenceId: withdrawRef.id,
          createdAt: serverTimestamp()
        });
      });

      toast.success('উত্তোলন রিকোয়েস্ট পাঠানো হয়েছে। অ্যাডমিন শীঘ্রই এটি প্রসেস করবেন।');
      setWithdrawAmount('');
      setAccountNumber('');
      setActiveTab('history');
    } catch (err) {
      console.error('Withdrawal error:', err);
      toast.error('রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
          <CheckCircle2 size={12} /> অনুমোদিত
        </span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
          <XCircle size={12} /> বাতিল
        </span>;
      default:
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1">
          <Clock size={12} /> অপেক্ষমাণ
        </span>;
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Wallet Summary Card */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-primary-foreground/80 text-sm font-medium">মোট ব্যালেন্স</p>
              <h2 className="text-4xl font-bold mt-1">৳{balance.toLocaleString()}</h2>
            </div>
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Wallet size={24} />
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setActiveTab('withdraw')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'withdraw' 
                  ? 'bg-white text-primary' 
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              <ArrowUpRight size={18} /> উত্তোলন করুন
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'history' 
                  ? 'bg-white text-primary' 
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              <History size={18} /> ইতিহাস
            </button>
          </div>
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'history' ? (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Transactions Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <ArrowDownLeft size={20} className="text-primary" /> সাম্প্রতিক ট্রানজাকশন
                </h3>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                {transactions.length > 0 ? (
                  transactions.map((t) => (
                    <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${
                          t.amount > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {t.amount > 0 ? <PlusCircle size={20} /> : <ArrowUpRight size={20} />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{t.description}</p>
                          <p className="text-xs text-gray-500">
                            {t.createdAt ? format(t.createdAt.toDate(), 'dd MMM, yyyy • hh:mm a') : 'একটু আগে'}
                          </p>
                        </div>
                      </div>
                      <div className={`font-bold ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {t.amount > 0 ? '+' : ''}৳{t.amount}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    <History size={40} className="mx-auto mb-3 opacity-20" />
                    <p>আপনার কোনো ট্রানজাকশন নেই</p>
                  </div>
                )}
              </div>
            </section>

            {/* Withdrawals Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Smartphone size={20} className="text-primary" /> উত্তোলন রিকোয়েস্ট
                </h3>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {withdrawals.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">তারিখ</th>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">পরিমাণ</th>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">পদ্ধতি</th>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">স্ট্যাটাস</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {withdrawals.map((w) => (
                          <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4 text-sm text-gray-600">
                              {w.createdAt ? format(w.createdAt.toDate(), 'dd/MM/yy') : 'Pending'}
                            </td>
                            <td className="px-4 py-4 font-bold text-gray-900">৳{w.amount}</td>
                            <td className="px-4 py-4 text-sm">
                              <span className="capitalize text-gray-600">{w.paymentMethod}</span>
                              <p className="text-[10px] text-gray-400 font-mono">{w.accountNumber}</p>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex justify-end">{getStatusBadge(w.status)}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    <AlertCircle size={40} className="mx-auto mb-3 opacity-20" />
                    <p>কোনো উত্তোলন রিকোয়েস্ট নেই</p>
                  </div>
                )}
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div 
            key="withdraw"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl shadow-primary/5 p-6 border border-primary/10"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">টাকা উত্তোলন করুন</h3>
            
            <form onSubmit={handleWithdrawal} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bkash')}
                  className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'bkash' 
                      ? 'border-pink-500 bg-pink-50 text-pink-700' 
                      : 'border-gray-100 hover:border-gray-200 text-gray-500'
                  }`}
                >
                  <img src="https://static-00.iconduck.com/assets.00/bkash-icon-256x225-v0oioz9p.png" className="h-6 w-auto grayscale" alt="bKash" />
                  <span className="font-bold">বিকাশ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('nagad')}
                  className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'nagad' 
                      ? 'border-orange-500 bg-orange-50 text-orange-700' 
                      : 'border-gray-100 hover:border-gray-200 text-gray-500'
                  }`}
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Nagad_logo.svg/2560px-Nagad_logo.svg.png" className="h-4 w-auto grayscale" alt="Nagad" />
                  <span className="font-bold">নগদ</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">উত্তোলনের পরিমাণ (৳)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">৳</span>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Amount"
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-bold text-lg"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">
                    সর্বনিম্ন উত্তোলন: ৳{minWithdrawal} | বর্তমান ব্যালেন্স: ৳{balance}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">একাউন্ট নম্বর</label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="tel"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all tracking-widest font-mono"
                      maxLength={11}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-4 flex gap-3 border border-amber-100">
                <AlertCircle className="text-amber-600 shrink-0" size={20} />
                <p className="text-xs text-amber-800 leading-relaxed">
                  পেমেন্টটি অনুমোদিত হতে ২৪-৪৮ ঘণ্টা সময় লাগতে পারে। অনুগ্রহ করে সঠিক একাউন্ট নম্বর দিন। ভুল নম্বরে টাকা গেলে তার দায়ভার আমাদের নয়।
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !withdrawAmount || !accountNumber}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:translate-y-[-2px] active:translate-y-[0] transition-all disabled:opacity-50 disabled:translate-y-0"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    প্রসেসিং হচ্ছে...
                  </div>
                ) : 'রিকোয়েস্ট পাঠান'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Card */}
      <div className="bg-gray-50 rounded-2xl p-5 flex items-start gap-4 border border-gray-100">
        <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600">
          <AlertCircle size={20} />
        </div>
        <div>
          <h4 className="font-bold text-gray-900 text-sm mb-1">টাকা ব্যবহার করুন</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            আপনার ওয়ালেটের টাকা দিয়ে কেনাকাটা করতে চাইলে চেকআউট পেজে <strong>"Use Wallet Balance"</strong> অপশনটি সিলেক্ট করুন।
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletDashboard;
