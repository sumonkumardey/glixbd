import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, getDoc, limit } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { Order, TrackingEvent, OrderStatus, OrderStatusLabels } from '@/src/types';
import { formatDate, cn, formatPrice } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle2, Package, Truck, MapPin, Calendar, Phone, Copy, ChevronRight, History } from 'lucide-react';

export default function OrderTrackingScreen() {
  const { orderNumber: urlParam } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'track' | 'history'>('track');
  const [searchInput, setSearchInput] = useState(() => {
    return urlParam || localStorage.getItem('last_tracked_order') || '';
  });
  const [order, setOrder] = useState<Order | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentLoading, setRecentLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRecentOrders = async () => {
    if (!auth.currentUser) return;
    setRecentLoading(true);
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const snap = await getDocs(q);
      const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setRecentOrders(orders);
      
      // If no order is currently tracked and no URL param exists, stay on history or track latest
      if (orders.length > 0 && !urlParam && !order) {
        // We now have tabs, so we don't automatically trigger search if on history tab
      }
    } catch (err) {
      console.error('Error fetching recent orders:', err);
    } finally {
      setRecentLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentOrders();
  }, [auth.currentUser, urlParam]);

  useEffect(() => {
    if (urlParam) {
      setActiveTab('track');
    }
  }, [urlParam]);

  const handleSearch = async (num: string) => {
    if (!num) return;
    const cleanNum = num.trim();
    setLoading(true);
    setError('');
    setActiveTab('track');

    try {
      // 1. Try to fetch by ID directly first (most efficient)
      let orderSnap = await getDoc(doc(db, 'orders', cleanNum));
      let orderData: Order | null = null;

      if (orderSnap.exists()) {
        orderData = { id: orderSnap.id, ...orderSnap.data() } as Order;
      } else {
        // 2. Fallback: Search by orderNumber field
        const q = query(collection(db, 'orders'), where('orderNumber', '==', cleanNum), limit(1));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          orderSnap = qSnap.docs[0];
          orderData = { id: orderSnap.id, ...orderSnap.data() } as Order;
        }
      }

      if (!orderData) {
        setError('অর্ডার নম্বরটি পাওয়া যায়নি।');
        setLoading(false);
        setOrder(null);
        return;
      }

      localStorage.setItem('last_tracked_order', cleanNum);
      setOrder(orderData);

      // Listen for tracking updates in real-time
      const trackQ = query(
        collection(db, `orders/${orderSnap.id}/tracking`),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(trackQ, (trackSnap) => {
        setEvents(trackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrackingEvent)));
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, `orders/${orderSnap.id}/tracking`);
      });

      setLoading(false);
      return unsubscribe;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `orders/${cleanNum}`);
      setError('একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      setLoading(false);
      setOrder(null);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const initialNum = urlParam || (activeTab === 'track' ? searchInput : '');
    if (initialNum && activeTab === 'track') {
      handleSearch(initialNum).then(unsub => {
        if (typeof unsub === 'function') {
          unsubscribe = unsub;
        }
      });
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [urlParam, activeTab]);

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20">
      {/* Search Header */}
      <div className="bg-white px-4 pt-6 pb-4 border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-text-main">অর্ডার ট্র্যাকিং</h2>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('track')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeTab === 'track' ? "bg-white text-primary shadow-sm" : "text-text-muted"
              )}
            >
              ট্র্যাক করুন
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeTab === 'history' ? "bg-white text-primary shadow-sm" : "text-text-muted"
              )}
            >
              অর্ডার হিস্টোরি
            </button>
          </div>
        </div>

        {activeTab === 'track' && (
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl flex items-center px-4 focus-within:bg-white focus-within:border-primary transition-all">
              <Search className="text-text-muted" size={18} />
              <input 
                type="text" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="অর্ডার নম্বর দিন..." 
                className="flex-1 py-3 px-2 outline-none bg-transparent text-sm font-medium"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchInput)}
              />
            </div>
            <button 
              onClick={() => handleSearch(searchInput)}
              className="bg-primary text-white px-6 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-transform font-bold text-sm"
            >
              খুঁজুন
            </button>
          </div>
        )}
      </div>

      <div className="p-4 space-y-6">
        {activeTab === 'track' ? (
          <>
            {loading && (
              <div className="flex flex-col items-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-bold text-text-muted">আপনার অর্ডার তথ্য খোঁজা হচ্ছে...</p>
              </div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 text-red-600 p-4 rounded-2xl text-center text-sm font-bold border border-red-100 flex items-center justify-center gap-2"
              >
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                {error}
              </motion.div>
            )}

            {order && !loading && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Summary Card */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/50 space-y-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12" />
                  
                  <div className="flex justify-between items-start relative">
                    <div className="space-y-1">
                      <p className="text-[10px] text-text-muted uppercase font-black tracking-[0.2em]">Current Tracking</p>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-text-main tracking-tight">#{order.orderNumber}</h3>
                        <button onClick={() => {
                          navigator.clipboard.writeText(order.orderNumber);
                          // Could add a toast here
                        }} className="text-primary p-1.5 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>
                    <span className={cn(
                      "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm",
                      order.status === 'delivered' ? "bg-green-500 text-white" : 
                      order.status === 'cancelled' ? "bg-red-500 text-white" : "bg-primary text-white"
                    )}>
                      {OrderStatusLabels[order.status]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-6 py-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-text-muted">
                        <Calendar size={14} className="text-primary/60" />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Ordered On</span>
                      </div>
                      <p className="text-sm font-black text-text-main">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-text-muted">
                        <Truck size={14} className="text-primary/60" />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Carrier</span>
                      </div>
                      <p className="text-sm font-black text-text-main">{order.shippingMethod === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka'}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-5 rounded-2xl border border-primary/10 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] text-primary font-black uppercase tracking-wider">Estimated for</p>
                      <p className="text-base font-black text-text-main">
                        {order.status === 'delivered' ? 'ডেলিভারি সম্পন্ন' : '১-৩ কর্মদিবস'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-white text-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/5 border border-primary/5 relative">
                      <Package size={24} />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white animate-ping" />
                    </div>
                  </div>
                </div>

                {/* Items Detail */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="font-black text-sm text-text-main uppercase tracking-widest">Order Summary</h4>
                    <span className="text-[10px] font-bold text-text-muted bg-gray-100 px-2 py-0.5 rounded-full">
                      {order.items?.length || 0} Items
                    </span>
                  </div>
                  <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-50">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-5 hover:bg-gray-50/50 transition-colors">
                          <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden border border-gray-100 shrink-0 shadow-inner">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-black text-sm text-text-main truncate tracking-tight">{item.name}</h5>
                            <div className="flex items-center gap-3 mt-1.5">
                              <p className="text-[11px] font-bold text-text-muted">
                                {item.quantity} পিস • {item.price} ৳
                              </p>
                              {item.size && (
                                <span className="bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-lg uppercase">
                                  Size: {item.size}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-primary text-sm tracking-tight">{item.quantity * item.price} ৳</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-gray-50/80 p-6 space-y-3">
                      <div className="flex justify-between text-[11px] font-bold text-text-muted uppercase tracking-wider">
                        <span>Items Total</span>
                        <span>{order.total - (order.deliveryCharge || 0) + (order.discount || 0)} ৳</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold text-text-muted uppercase tracking-wider">
                        <span>Delivery</span>
                        <span>{order.deliveryCharge || 0} ৳</span>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between text-[11px] font-black text-green-600 uppercase tracking-wider">
                          <span>Discount Applied</span>
                          <span>-{order.discount} ৳</span>
                        </div>
                      )}
                      <div className="h-px bg-gray-200/50 my-2" />
                      <div className="flex justify-between text-base font-black text-text-main">
                        <span className="uppercase tracking-widest text-[10px]">Grand Total</span>
                        <span className="text-primary text-lg">{order.total} ৳</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-6">
                  <h4 className="font-black text-sm text-text-main px-1 uppercase tracking-widest">Live Updates</h4>
                  <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
                    {events.length === 0 ? (
                      <div className="text-center py-6 space-y-3">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                          <Package size={24} />
                        </div>
                        <p className="text-xs font-bold text-text-muted">আপনার অর্ডারের কোনো আপডেট এখনো পাওয়া যায়নি।</p>
                      </div>
                    ) : (
                      <div className="relative pl-8 space-y-10 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-primary before:to-gray-100">
                        {events.map((event, idx) => (
                          <div key={event.id} className="relative">
                            <div className={cn(
                              "absolute -left-11 top-0 w-6 h-6 rounded-full border-4 border-white shadow-md flex items-center justify-center z-10",
                              idx === 0 ? "bg-primary" : "bg-gray-200"
                            )}>
                              {idx === 0 ? (
                                <motion.div 
                                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                                  transition={{ repeat: Infinity, duration: 2 }}
                                  className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" 
                                />
                              ) : (
                                <CheckCircle2 size={10} className="text-white" />
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h5 className={cn(
                                  "text-sm font-black tracking-tight",
                                  idx === 0 ? "text-primary" : "text-text-main"
                                )}>
                                  {event.statusBn}
                                </h5>
                                <span className="text-[10px] font-bold text-text-muted bg-gray-100 px-2 py-0.5 rounded-full">{formatDate(event.createdAt)}</span>
                              </div>
                              <p className="text-xs text-text-muted leading-relaxed font-medium">{event.messageBn}</p>
                              {event.location && (
                                <div className="flex items-center gap-1.5 text-[9px] text-primary font-black bg-primary/5 px-2.5 py-1 rounded-lg inline-flex uppercase tracking-wider">
                                  <MapPin size={10} />
                                  <span>{event.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {!order && !loading && !searchInput && (
              <div className="py-24 text-center space-y-6">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-primary/10 border-8 border-primary/5 text-primary">
                  <Truck size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-black text-xl text-text-main">ট্র্যাকিং শুরু করুন</h3>
                  <p className="text-sm text-text-muted px-12 leading-relaxed font-medium">
                    আপনার ইনভয়েস থেকে অর্ডার নম্বরটি ওপরে দিন এবং রিয়েল-টাইম আপডেট দেখুন।
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          /* History Tab Contents */
          <div className="space-y-6 pb-12">
            {recentLoading ? (
              <div className="flex flex-col items-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-bold text-text-muted">আপনার অর্ডার হিস্টোরি লোড হচ্ছে...</p>
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <History size={18} />
                    </div>
                    <h3 className="font-black text-base text-text-main tracking-tight">পূর্ববর্তী অর্ডারসমূহ</h3>
                  </div>
                  <span className="text-[10px] font-bold text-text-muted bg-gray-100 px-2 py-0.5 rounded-full">{recentOrders.length} Orders</span>
                </div>
                
                <div className="space-y-4">
                  {recentOrders.map((ro, index) => (
                    <motion.div
                      key={ro.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        setSearchInput(ro.orderNumber);
                        handleSearch(ro.orderNumber);
                      }}
                      className="group bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gray-50 rounded-full -mr-8 -mt-8 group-hover:bg-primary/5 transition-colors" />
                      
                      <div className="flex items-start justify-between relative">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                            <Package size={24} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-black text-text-main tracking-tight">#{ro.orderNumber}</h4>
                            <p className="text-[10px] text-text-muted font-bold flex items-center gap-1.5 shadow-sm">
                              <Calendar size={10} />
                              {formatDate(ro.createdAt)}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={cn(
                                "text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider border",
                                ro.status === 'delivered' ? "bg-green-50 text-green-600 border-green-100" :
                                ro.status === 'cancelled' ? "bg-red-50 text-red-600 border-red-100" :
                                "bg-primary/5 text-primary border-primary/10"
                              )}>
                                {OrderStatusLabels[ro.status]}
                              </span>
                              <span className="text-[9px] font-bold text-text-muted bg-gray-100 px-2 py-0.5 rounded-full">
                                {ro.items?.length || 0} আইটেম
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-base font-black text-primary tracking-tight">{formatPrice(ro.total)}</p>
                          <div className="flex items-center justify-end gap-1 mt-2 text-primary font-bold">
                            <span className="text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Track</span>
                            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-24 text-center space-y-6">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-2xl border-8 border-gray-50 text-gray-200">
                  <Package size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-black text-xl text-text-main">কোনো অর্ডার পাওয়া যায়নি</h3>
                  <p className="text-sm text-text-muted px-12 leading-relaxed font-medium">
                    আপনি এখনো কোনো অর্ডার করেননি। আমাদের নতুন কালেকশন গুলো দেখতে পারেন।
                  </p>
                  <Link to="/" className="inline-block mt-4 text-primary font-black text-sm hover:underline">কেনাকাটা শুরু করুন</Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
