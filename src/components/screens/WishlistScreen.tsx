import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { subscribeToWishlist, toggleWishlist } from '@/src/services/wishlistService';
import { formatPrice } from '@/src/lib/utils';
import { Product } from '@/src/types';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../ProductCard';
import { auth } from '@/src/lib/firebase';

export default function WishlistScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToWishlist((wishlistItems) => {
      setItems(wishlistItems);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (!auth.currentUser) {
    return (
      <div className="p-10 text-center space-y-6">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
          <Heart size={40} />
        </div>
        <h2 className="text-xl font-bold">পছন্দের তালিকা দেখতে লগইন করুন</h2>
        <NavLink to="/login" className="inline-block bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-lg">
          লগইন করুন
        </NavLink>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-10 w-40 bg-gray-200 animate-pulse rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl lg:text-4xl font-black text-text-main flex items-center gap-3">
          <span className="w-2 h-10 bg-primary rounded-full"></span>
          পছন্দের তালিকা
        </h2>
        <span className="bg-gray-100 text-text-muted text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
          {items.length} টি পণ্য
        </span>
      </div>
      
      {items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group"
              >
                <ProductCard product={{ id: item.id, ...item } as Product} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 bg-primary/5 text-primary rounded-[40px] flex items-center justify-center animate-pulse">
              <Heart size={48} fill="currentColor" />
            </div>
            <div className="absolute -top-2 -right-2 bg-white p-2 rounded-full shadow-lg">
              <ShoppingCart size={20} className="text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-black text-xl lg:text-2xl">আপনার তালিকা খালি</h3>
            <p className="text-sm text-text-muted font-medium max-w-xs mx-auto">আপনার পছন্দের পণ্যগুলো এখানে জমা করে রাখতে পারেন এবং পরে সহজেই কিনতে পারেন।</p>
          </div>
          <NavLink 
            to="/" 
            className="group bg-primary text-white px-10 py-4 rounded-3xl font-black shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center gap-2"
          >
            শপিং শুরু করুন
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </NavLink>
        </div>
      )}
    </div>
  );
}
