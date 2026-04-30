import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '@/src/lib/firebase';
import { useAdmin } from '@/src/hooks/useAdmin';
import { motion } from 'framer-motion';
import { Package, Search, ExternalLink, Calendar, Truck, CheckCircle, XCircle, Image as ImageIcon, CreditCard } from 'lucide-react';
import { formatPrice, formatDate } from '@/src/lib/utils';
import { OrderStatusLabels } from '@/src/types';
import { createNotification } from '@/src/services/notificationService';
import { handleReferralReward, handleShoppingReward } from '@/src/services/userService';
import { createSteadfastOrder } from '@/src/services/steadfastService';
import { getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

const StatusDetails: Record<string, { bn: string, message: string, messageBn: string }> = {
  pending: { bn: 'পেন্ডিং', message: 'Order is pending confirmation.', messageBn: 'অর্ডারটি কনফার্মেশনের জন্য অপেক্ষায় আছে।' },
  processing: { bn: 'প্রসেসিং', message: 'Order is being prepared.', messageBn: 'আপনার অর্ডারটি প্যাকেট করা হচ্ছে।' },
  shipped: { bn: 'শিপড', message: 'Order has been handed over to courier.', messageBn: 'আপনার অর্ডারটি কুরিয়ারে হস্তান্তর করা হয়েছে।' },
  delivered: { bn: 'ডেলিভারড', message: 'Order has been delivered.', messageBn: 'আপনার অর্ডারটি সফলভাবে ডেলিভারি করা হয়েছে।' },
  cancelled: { bn: 'ক্যান্সেল', message: 'Order has been cancelled.', messageBn: 'দুঃখিত, আপনার অর্ডারটি বাতিল করা হয়েছে।' },
};

export default function AdminOrders() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [courierLoading, setCourierLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [isAdmin]);

  const handleSendToSteadfast = async (order: any) => {
    console.log('Steadfast button click detected for order:', order.id);
    
    setCourierLoading(order.id);
    const toastId = toast.loading('Steadfast-এ পার্সেল রিকোয়েস্ট পাঠানো হচ্ছে...');
    try {
      console.log('Starting Steadfast order creation for:', order.orderNumber);
      const result = await createSteadfastOrder(order);
      console.log('Steadfast Service result:', result);
      
      if (result.success) {
        // Update order with courier details
        const docRef = doc(db, 'orders', order.id);
        await updateDoc(docRef, {
          courier: 'steadfast',
          courierDetails: {
            consignmentId: result.consignment_id || '',
            trackingCode: result.tracking_code || '',
            sentAt: new Date().toISOString()
          },
          status: 'shipped' // Automatically set to shipped
        });

        // Add tracking history event
        await addDoc(collection(db, `orders/${order.id}/tracking`), {
          status: 'shipped',
          statusBn: 'শিপড (Steadfast)',
          message: 'Order has been handed over to Steadfast Courier.',
          messageBn: 'আপনার অর্ডারটি Steadfast কুরিয়ারে হস্তান্তর করা হয়েছে।',
          createdAt: serverTimestamp()
        });

        toast.success(result.message, { id: toastId });
        fetchOrders();
      }
    } catch (err: any) {
      console.error('Steadfast creation error:', err);
      toast.error(err.message || 'কুরিয়ার রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে', { id: toastId });
      // We also alert because toasts sometimes get covered or missed in complex layouts
      alert('Error: ' + (err.message || 'Steadfast request failed'));
    } finally {
      setCourierLoading(null);
    }
  };

  const fetchOrders = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'orders');
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading || (isAdmin && loading)) return <div className="p-8 text-center font-bold">লোড হচ্ছে...</div>;
  if (!isAdmin) return null;

  const updateStatus = async (orderId: string, newStatus: string) => {
    console.log(`Updating status for ${orderId} to ${newStatus}`);
    const toastId = toast.loading('স্ট্যাটাস আপডেট করা হচ্ছে...');
    try {
      const details = StatusDetails[newStatus];
      const docRef = doc(db, 'orders', orderId);
      
      // Update order status
      await updateDoc(docRef, { status: newStatus });
      
      // Add tracking history event
      await addDoc(collection(db, `orders/${orderId}/tracking`), {
        status: newStatus,
        statusBn: details.bn,
        message: details.message,
        messageBn: details.messageBn,
        createdAt: serverTimestamp()
      });

      // Send Notification to user & Handle Referral Reward if delivered
      const orderSnap = await getDoc(docRef);
      if (orderSnap.exists()) {
        const orderData = { id: orderSnap.id, ...orderSnap.data() } as any;
        
        // Reward checks
        if (newStatus === 'delivered') {
          await handleReferralReward(orderData);
          await handleShoppingReward(orderData);
        }

        if (orderData.userId) {
          try {
            await createNotification(orderData.userId, {
              title: 'অর্ডার আপডেট!',
              message: `আপনার অর্ডার #${orderData.orderNumber} এখন ${details.bn} পর্যায়ে আছে।`,
              type: 'order',
              isRead: false,
              link: `/tracking/${orderData.orderNumber}`
            });
          } catch (notifErr) {
            console.warn('Silent notification error:', notifErr);
          }
        }
      }

      fetchOrders();
      toast.success('অর্ডার স্ট্যাটাস আপডেট হয়েছে', { id: toastId });
    } catch (err: any) {
      console.error('Update status failed:', err);
      toast.error('অর্ডার স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।', { id: toastId });
      alert('Error updating status: ' + (err.message || 'Unknown error'));
    }
  };

  const filteredOrders = orders.filter(o => 
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.shippingAddress?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-text-main">অর্ডার ম্যানেজমেন্ট</h1>
        <p className="text-sm text-text-muted">সব ইনকমিং অর্ডার ট্র্যাক ও আপডেট করুন</p>
      </div>

      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="অর্ডার নাম্বার বা কাস্টমার নাম লিখে সার্চ দিন..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-gray-100 px-14 py-4 rounded-3xl font-bold shadow-sm focus:border-primary outline-none"
        />
      </div>

      {loading ? (
        <div className="p-12 text-center font-bold">লোড হচ্ছে...</div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map(order => (
            <motion.div 
              layout
              key={order.id}
              className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-50 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary/5 text-primary rounded-2xl flex items-center justify-center">
                    <Package size={28} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg">#{order.orderNumber}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-text-muted font-bold uppercase tracking-wider">
                      <Calendar size={12} />
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Steadfast Courier Button */}
                  {!order.courier && order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <button
                      onClick={() => handleSendToSteadfast(order)}
                      disabled={courierLoading === order.id}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                      {courierLoading === order.id ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Truck size={14} />
                      )}
                      Steadfast-এ পাঠান
                    </button>
                  )}

                  {order.courier === 'steadfast' && (
                    <div className="bg-green-50 text-green-600 border border-green-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle size={14} />
                      Steadfast (# {order.courierDetails?.trackingCode})
                    </div>
                  )}

                  <StatusButton 
                    active={order.status === 'pending'} 
                    label="পেন্ডিং" 
                    color="orange"
                    onClick={() => updateStatus(order.id, 'pending')} 
                  />
                  <StatusButton 
                    active={order.status === 'processing'} 
                    label="প্রসেসিং" 
                    color="blue"
                    onClick={() => updateStatus(order.id, 'processing')} 
                  />
                  <StatusButton 
                    active={order.status === 'shipped'} 
                    label="শিপড" 
                    color="purple"
                    onClick={() => updateStatus(order.id, 'shipped')} 
                  />
                  <StatusButton 
                    active={order.status === 'delivered'} 
                    label="ডেলিভারড" 
                    color="green"
                    onClick={() => updateStatus(order.id, 'delivered')} 
                  />
                  <StatusButton 
                    active={order.status === 'cancelled'} 
                    label="ক্যান্সেল" 
                    color="red"
                    onClick={() => updateStatus(order.id, 'cancelled')} 
                  />
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Customer Info */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                    <Truck size={12} />
                    শিপিং অ্যাড্রেস
                  </p>
                  <div className="text-sm font-bold space-y-1">
                    <p className="text-text-main text-base">{order.shippingAddress?.fullName}</p>
                    <p className="text-primary font-black">{order.shippingAddress?.phone}</p>
                    <p className="text-text-muted leading-relaxed">
                      {order.shippingAddress?.address}, {order.shippingAddress?.thana}, {order.shippingAddress?.district}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="lg:col-span-2 space-y-4">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">অর্ডার আইটেম ({order.items?.length || 0})</p>
                  
                  <div className="space-y-3">
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100 items-center">
                        <div className="w-16 h-16 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 flex items-center justify-center">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="text-gray-300"><ImageIcon size={20} /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-text-main truncate">{item.name}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <p className="text-[10px] font-bold text-text-muted">
                              {formatPrice(item.price)} × {item.quantity} পিস
                            </p>
                            {item.size && (
                              <span className="bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-lg uppercase">
                                সাইজ: {item.size}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-primary text-sm">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                    <div className="bg-primary/5 rounded-2xl p-5 flex flex-col gap-4 border border-primary/10 transition-all hover:bg-primary/10">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <CreditCard size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">পেমেন্ট মেথড</p>
                            <p className="font-black text-text-main text-sm uppercase">
                              {order.paymentMethod === 'cod' ? 'ক্যাশ অন ডেলিভারি' : 
                               order.paymentMethod === 'bkash' ? 'বিকাশ পেমেন্ট' : 
                               order.paymentMethod === 'nagad' ? 'নগদ পেমেন্ট' : order.paymentMethod}
                            </p>
                            {order.paymentDetails && (
                              <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-1 min-w-[200px]">
                                <div className="flex justify-between text-xs">
                                  <span className="text-text-muted font-bold">TrxID:</span>
                                  <span className="font-black text-primary uppercase">{order.paymentDetails.transactionId}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-text-muted font-bold">Amount:</span>
                                  <span className="font-black text-success">৳{order.paymentDetails.amount}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="space-y-1 mb-2">
                             <p className="text-[10px] font-bold text-text-muted">উপমোট: {formatPrice(order.subtotal || 0)}</p>
                             <p className="text-[10px] font-bold text-text-muted">ডেলিভারি: {formatPrice(order.deliveryCharge || 0)}</p>
                             {order.discount > 0 && (
                               <p className="text-[10px] font-bold text-green-600">ডিসকাউন্ট ({order.promoCode}): -{formatPrice(order.discount)}</p>
                             )}
                          </div>
                          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">সর্বমোট পেমেন্ট</p>
                          <p className="text-2xl font-black text-primary">{formatPrice(order.total)}</p>
                        </div>
                      </div>
                    </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusButton({ active, label, onClick, color }: { active: boolean, label: string, onClick: () => void, color: string }) {
  const colors: Record<string, string> = {
    orange: 'bg-orange-50 text-orange-500 border-orange-100',
    blue: 'bg-blue-50 text-blue-500 border-blue-100',
    purple: 'bg-purple-50 text-purple-500 border-purple-100',
    green: 'bg-green-50 text-green-500 border-green-100',
    red: 'bg-red-50 text-red-500 border-red-100'
  };

  const activeColors: Record<string, string> = {
    orange: 'bg-orange-500 text-white shadow-lg shadow-orange-200',
    blue: 'bg-blue-500 text-white shadow-lg shadow-blue-200',
    purple: 'bg-purple-500 text-white shadow-lg shadow-purple-200',
    green: 'bg-green-500 text-white shadow-lg shadow-green-200',
    red: 'bg-red-500 text-white shadow-lg shadow-red-200'
  };

  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${active ? activeColors[color] : `bg-white text-text-muted hover:${colors[color]} border-gray-100`}`}
    >
      {label}
    </button>
  );
}
