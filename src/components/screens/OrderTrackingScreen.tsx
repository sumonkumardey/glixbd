import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { Order, TrackingEvent, OrderStatus, OrderStatusLabels } from '@/src/types';
import { formatDate, cn } from '@/src/lib/utils';
import { motion } from 'framer-motion';
import { Search, CheckCircle2, Package, Truck, MapPin, Calendar, Phone, Copy } from 'lucide-react';

export default function OrderTrackingScreen() {
  const { orderNumber: urlParam } = useParams();
  const [searchInput, setSearchInput] = useState(() => {
    return urlParam || localStorage.getItem('last_tracked_order') || '';
  });
  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (num: string) => {
    if (!num) return;
    setLoading(true);
    setError('');
    // Don't clear current order immediately to keep UI stable during search
    // setOrder(null); 
    // setEvents([]);

    try {
      const orderRef = doc(db, 'orders', num);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        setError('অর্ডার নম্বরটি পাওয়া যায়নি।');
        setLoading(false);
        return;
      }

      localStorage.setItem('last_tracked_order', num);
      const orderData = { id: orderSnap.id, ...orderSnap.data() } as Order;
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
      handleFirestoreError(err, OperationType.GET, `orders/${num}`);
      setError('একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const initialNum = urlParam || searchInput;
    if (initialNum) {
      handleSearch(initialNum).then(unsub => {
        if (typeof unsub === 'function') {
          unsubscribe = unsub;
        }
      });
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [urlParam]);

  return (
    <div className="p-4 space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold border-l-4 border-primary pl-3">অর্ডার ট্র্যাক করুন</h2>
        <div className="flex gap-2">
          <div className="flex-1 bg-white border border-gray-100 rounded-2xl flex items-center px-4 shadow-sm focus-within:border-primary transition-colors">
            <Search className="text-text-muted" size={20} />
            <input 
              type="text" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="অর্ডার নম্বর (e.g. GBD-...)" 
              className="flex-1 py-3 px-2 outline-none bg-transparent text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchInput)}
            />
          </div>
          <button 
            onClick={() => handleSearch(searchInput)}
            className="bg-primary text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-transform"
          >
            <Search size={24} />
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center py-12 gap-3 text-text-muted">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>অনুসন্ধান করা হচ্ছে...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-xl text-center text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {order && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Summary Card */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest leading-none">আপনার অর্ডার</span>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-text-main">#{order.orderNumber}</h3>
                  <button onClick={() => navigator.clipboard.writeText(order.orderNumber)} className="text-primary p-1 bg-primary/5 rounded">
                    <Copy size={12} />
                  </button>
                </div>
              </div>
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                order.status === 'delivered' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
              )}>
                {OrderStatusLabels[order.status]}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-2">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-text-muted font-bold">
                  <Calendar size={12} />
                  <span>অর্ডারের তারিখ</span>
                </div>
                <p className="text-xs font-bold">{formatDate(order.createdAt)}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-text-muted font-bold">
                  <Truck size={12} />
                  <span>কুরিয়ার কোম্পানি</span>
                </div>
                <p className="text-xs font-bold">পাঠাও / রেডেক্স</p>
              </div>
            </div>

            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-primary font-black uppercase">আনুমানিক ডেলিভারি</p>
                  <p className="text-sm font-bold text-text-main mt-1">১৮ জানুয়ারি, ২০২৫</p>
                </div>
                <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                  <Package size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm px-1">অর্ডার আপডেট</h4>
            <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
              {events.map((event, idx) => (
                <div key={event.id} className="relative">
                  {/* Timeline Dot */}
                  <div className={cn(
                    "absolute -left-8 top-1 w-7 h-7 rounded-full border-4 border-white shadow-md flex items-center justify-center z-10 transition-all duration-500",
                    idx === 0 ? "bg-primary scale-110" : "bg-gray-200"
                  )}>
                    {idx === 0 ? (
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-2 h-2 bg-white rounded-full" 
                      />
                    ) : (
                      <CheckCircle2 size={12} className="text-white" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h5 className={cn(
                        "text-sm font-bold",
                        idx === 0 ? "text-primary" : "text-text-main"
                      )}>
                        {event.statusBn}
                      </h5>
                      <span className="text-[10px] text-text-muted">{formatDate(event.createdAt)}</span>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed">{event.messageBn}</p>
                    {event.location && (
                      <div className="flex items-center gap-1 text-[10px] text-primary font-medium bg-primary/5 px-2 py-1 rounded inline-flex">
                        <MapPin size={10} />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Courier Card if shipped */}
          {order.status === 'shipped' && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-text-muted font-bold">কুরিয়ার প্রতিনিধির সাথে কথা বলুন</p>
                  <p className="text-sm font-bold">০১৭XXXXXXXX</p>
                </div>
              </div>
              <button className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl">কল করুন</button>
            </div>
          )}
        </motion.div>
      )}

      {!order && !loading && !urlParam && (
        <div className="py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-300">
            <Truck size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg">আপনার অর্ডার ট্র্যাক করুন</h3>
            <p className="text-sm text-text-muted px-10">আপনার ইনভয়েস থেকে অর্ডার নম্বরটি দিন এবং আপনার পণ্যের বর্তমান অবস্থান জানুন।</p>
          </div>
        </div>
      )}
    </div>
  );
}
