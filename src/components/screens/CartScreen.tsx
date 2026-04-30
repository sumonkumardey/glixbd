import React from 'react';
import { useCart } from '@/src/lib/CartContext';
import { formatPrice, cn } from '@/src/lib/utils';
import { Trash2, ShoppingBag, Plus, Minus, Ticket, ChevronLeft, CreditCard, ShieldCheck, ShoppingCart } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartScreen() {
  const { cart, removeFromCart, updateQuantity, subtotal } = useCart();
  const navigate = useNavigate();

  const handleProceedToCheckout = () => {
    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-8 bg-gray-50/50 rounded-[40px] border border-dashed border-gray-200 max-w-2xl mx-auto my-10">
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="w-24 h-24 bg-white rounded-[40px] shadow-xl flex items-center justify-center text-gray-200"
        >
          <ShoppingBag size={48} />
        </motion.div>
        <div className="space-y-3">
          <h2 className="text-2xl font-black text-text-main">আপনার শপিং কার্ট খালি</h2>
          <p className="text-text-muted font-medium px-4">এখনো কোনো পণ্য পছন্দ করেননি? আমাদের লেটেস্ট কালেকশন থেকে সেরা পণ্যটি বেছে নিন।</p>
        </div>
        <NavLink to="/" className="bg-primary text-white px-12 py-4 rounded-3xl font-black shadow-2xl shadow-primary/20 active:scale-95 transition-all text-lg hover:shadow-primary/40">
          কেনাকাটা শুরু করুন
        </NavLink>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 p-4 lg:p-0">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl lg:text-5xl font-black text-text-main flex items-center gap-4">
          <div className="w-4 h-12 bg-primary rounded-full"></div>
          শপিং কার্ট
          <span className="text-primary/30 ml-2">({cart.length})</span>
        </h1>
        <button onClick={() => navigate(-1)} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:bg-gray-50">
          <ChevronLeft size={24} />
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-start">
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="popLayout">
            {cart.map((item) => (
              <motion.div 
                key={item.productId}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className={cn(
                  "bg-white p-4 lg:p-6 rounded-[34px] border border-gray-100 shadow-sm flex gap-4 lg:gap-8 items-center",
                  "hover:shadow-xl hover:shadow-gray-200/40 hover:border-primary/10 transition-all duration-300"
                )}
              >
                <div className="relative group shrink-0">
                  <img src={item.image} alt={item.name} className="w-24 h-24 lg:w-32 lg:h-32 object-cover rounded-[24px] lg:rounded-[32px] bg-gray-50 group-hover:scale-105 transition-transform" />
                  <button 
                    onClick={() => removeFromCart(item.productId)} 
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm lg:text-xl font-black text-text-main line-clamp-1 flex-1 pr-4">{item.name}</h4>
                    <p className="text-primary font-black lg:text-2xl whitespace-nowrap">{formatPrice(item.price)}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-4 bg-gray-50 rounded-2xl px-2 py-1.5 border border-gray-100">
                      <button onClick={() => updateQuantity(item.productId, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm hover:text-primary transition-colors">
                        <Minus size={16} />
                      </button>
                      <span className="text-sm font-black w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm hover:text-primary transition-colors">
                        <Plus size={16} />
                      </button>
                    </div>
                    
                    <button onClick={() => removeFromCart(item.productId)} className="lg:hidden text-red-500 font-bold text-xs bg-red-50 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">
                      মুছুন
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-4 mt-12 lg:mt-0">
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-2xl shadow-gray-200/40 space-y-8 sticky top-24">
            <h3 className="text-xl font-black text-text-main flex items-center gap-3 border-b border-gray-50 pb-6">
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
                <span className="text-[10px] text-green-500 uppercase font-black">চেকআউটে হিসাব করা হবে</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="h-px bg-gray-100 w-full" />
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-black">মোট খরচ</span>
                <span className="text-3xl font-black text-primary tracking-tighter">{formatPrice(subtotal)}</span>
              </div>

              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-2xl border border-gray-100 group focus-within:border-primary transition-all">
                <Ticket size={20} className="ml-2 text-text-muted group-focus-within:text-primary" />
                <input type="text" placeholder="কুপন কোড (যদি থাকে)" className="bg-transparent border-none outline-none flex-1 font-bold text-sm" />
                <button className="bg-primary text-white text-xs font-black px-5 py-2 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">প্রয়োগ</button>
              </div>

              <button 
                onClick={handleProceedToCheckout}
                className="w-full bg-primary text-white font-black py-5 rounded-[28px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-all text-xl hover:bg-primary/90 btn-rgb"
              >
                চেকআউটে যান
                <CreditCard size={24} />
              </button>

              <div className="flex items-center justify-center gap-4 text-[10px] font-black text-text-muted uppercase tracking-widest pt-4">
                <div className="flex items-center gap-1">
                  <ShieldCheck size={14} className="text-green-500" />
                  নিরাপদ চেকআউট
                </div>
                <div className="flex items-center gap-1">
                  <ShoppingCart size={14} className="text-blue-500" />
                  সহজ রিটার্ন
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
