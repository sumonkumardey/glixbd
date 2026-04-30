import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  increment,
  runTransaction
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { 
  Smartphone, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft,
  Search,
  ExternalLink,
  Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  amount: number;
  paymentMethod: 'bkash' | 'nagad';
  accountNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

const AdminWithdrawals: React.FC = () => {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'withdrawalRequests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WithdrawalRequest[];
      setRequests(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleStatusUpdate = async (requestId: string, userId: string, amount: number, newStatus: 'approved' | 'rejected') => {
    setProcessingId(requestId);
    try {
      await runTransaction(db, async (transaction) => {
        const requestRef = doc(db, 'withdrawalRequests', requestId);
        const userRef = doc(db, 'users', userId);
        
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("User does not exist!");

        if (newStatus === 'rejected') {
          // Refund the money since it was deducted on request
          transaction.update(userRef, {
            walletBalance: increment(amount),
            updatedAt: serverTimestamp()
          });

          // Log refund transaction
          const transRef = doc(collection(db, `users/${userId}/walletTransactions`));
          transaction.set(transRef, {
            userId,
            type: 'refund',
            amount: amount,
            description: `উইথড্র রিকোয়েস্ট রিজেক্টেড (৳${amount} ফেরত)`,
            referenceId: requestId,
            createdAt: serverTimestamp()
          });
        }

        // Update request status
        transaction.update(requestRef, {
          status: newStatus,
          processedAt: serverTimestamp()
        });
      });

      toast.success(newStatus === 'approved' ? 'অনুমোদন সফল হয়েছে!' : 'রিকোয়েস্ট বাতিল করা হয়েছে।');
    } catch (err: any) {
      console.error('Approval error:', err);
      handleFirestoreError(err, OperationType.WRITE, `withdrawalRequests/${requestId}`);
      toast.error(err.message || 'অপারেশন ব্যর্থ হয়েছে।');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const matchesSearch = r.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.accountNumber?.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return <div className="p-8 text-center font-bold">লোড হচ্ছে...</div>;
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-text-main">টাকা উত্তোলন রিকোয়েস্ট</h1>
          <p className="text-sm text-text-muted">ইউজারদের পাঠানো উইথড্র রিকোয়েস্ট ম্যানেজ করুন</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div className="flex bg-white rounded-xl border border-gray-100 p-1 self-start">
          {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                filter === f ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-gray-50'
              }`}
            >
              {f === 'pending' ? 'অপেক্ষমাণ' : f === 'approved' ? 'অনুমোদিত' : f === 'rejected' ? 'বাতিল' : 'সব'}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="নাম বা নম্বর দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl outline-none focus:border-primary transition-all w-full lg:w-72 font-medium"
          />
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-text-muted uppercase tracking-widest">তারিখ</th>
                <th className="px-6 py-4 text-xs font-black text-text-muted uppercase tracking-widest">ইউজার</th>
                <th className="px-6 py-4 text-xs font-black text-text-muted uppercase tracking-widest">পরিমাণ</th>
                <th className="px-6 py-4 text-xs font-black text-text-muted uppercase tracking-widest">পদ্ধতি</th>
                <th className="px-6 py-4 text-xs font-black text-text-muted uppercase tracking-widest">নম্বর</th>
                <th className="px-6 py-4 text-xs font-black text-text-muted uppercase tracking-widest text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRequests.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-bold text-text-main">
                      {r.createdAt ? format(r.createdAt.toDate(), 'dd MMM, yyyy') : '...'}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {r.createdAt ? format(r.createdAt.toDate(), 'hh:mm a') : ''}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                        {r.userName?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-main">{r.userName}</p>
                        <button 
                          onClick={() => navigate(`/admin/users?search=${r.userId}`)}
                          className="text-[10px] text-primary hover:underline flex items-center gap-1"
                        >
                          প্রোফাইল <ExternalLink size={10} />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-lg font-black text-text-main">৳{r.amount}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {r.paymentMethod === 'bkash' ? (
                        <div className="w-6 h-6 bg-pink-100 rounded flex items-center justify-center">
                          <img src="https://static-00.iconduck.com/assets.00/bkash-icon-256x225-v0oioz9p.png" alt="bKash" className="h-3 shadow-sm" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Nagad_logo.svg/2560px-Nagad_logo.svg.png" alt="Nagad" className="h-2 shadow-sm" />
                        </div>
                      )}
                      <span className="text-sm font-bold capitalize">{r.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-mono font-bold text-primary tracking-tighter">{r.accountNumber}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {r.status === 'pending' ? (
                        <>
                          <button 
                            onClick={() => handleStatusUpdate(r.id, r.userId, r.amount, 'approved')}
                            disabled={processingId === r.id}
                            className="bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            {processingId === r.id ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : <CheckCircle2 size={16} />}
                            অ্যাপ্রুভ
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(r.id, r.userId, r.amount, 'rejected')}
                            disabled={processingId === r.id}
                            className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            <XCircle size={16} /> বাতিল
                          </button>
                        </>
                      ) : (
                        <div className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                          r.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {r.status === 'approved' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                          {r.status === 'approved' ? 'অনুমোদিত' : 'বাতিল'}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-text-muted">
                    <Clock size={40} className="mx-auto mb-4 opacity-20" />
                    <p className="font-bold">কোনো রিকোয়েস্ট পাওয়া যায়নি</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminWithdrawals;
