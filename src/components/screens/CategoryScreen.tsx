import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { motion } from 'framer-motion';
import { ChevronLeft, SlidersHorizontal, ShoppingCart } from 'lucide-react';
import { Product } from '@/src/types';
import ProductCard from '../ProductCard';

export default function CategoryScreen() {
  const { id } = useParams<{ id: string }>();
  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setLoading(true);
      try {
        // Fetch category details
        const catDoc = await getDoc(doc(db, 'categories', id));
        if (catDoc.exists()) {
          setCategory({ id: catDoc.id, ...catDoc.data() });
        }

        // Fetch products in this category
        const q = query(collection(db, 'products'), where('categoryId', '==', id));
        const snap = await getDocs(q);
        setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-40 bg-gray-200 animate-pulse rounded-[40px]" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
           {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-3xl" />)}
        </div>
      </div>
    );
  }

  if (!category && !loading) {
    return (
      <div className="p-10 text-center space-y-4">
        <h2 className="text-xl font-black">ক্যাটাগরি পাওয়া যায়নি</h2>
        <NavLink to="/" className="inline-block bg-primary text-white px-6 py-3 rounded-2xl font-bold">হোমে ফিরে যান</NavLink>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Category Header */}
      <div className="relative h-48 lg:h-64 flex items-end p-6 lg:p-12 overflow-hidden bg-gray-50 lg:rounded-[40px] lg:mt-4 lg:mx-4">
        {category?.image && (
          <div className="absolute inset-0">
             <img src={category.image} alt="" className="w-full h-full object-cover opacity-20" />
             <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
          </div>
        )}
        <div className="relative z-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
           <div className="space-y-1">
              <NavLink to="/" className="flex items-center gap-1 text-text-muted hover:text-primary transition-colors text-xs font-black uppercase tracking-widest mb-2">
                 <ChevronLeft size={14} />
                 ফিরে যান
              </NavLink>
              <h1 className="text-4xl lg:text-6xl font-black text-text-main leading-none">
                {category?.nameBn || category?.name}
              </h1>
              <p className="text-text-muted font-bold">{products.length} টি পন্য পাওয়া গেছে</p>
           </div>
           
           <button className="flex items-center gap-2 bg-white border border-gray-100 px-6 py-3 rounded-2xl font-black shadow-sm active:scale-95 transition-all w-fit">
              <SlidersHorizontal size={18} />
              ফিল্টার
           </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="px-4">
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8">
            {products.map((product, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={product.id}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center space-y-4">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                <ShoppingCart size={40} />
             </div>
             <p className="font-bold text-text-muted">এই ক্যাটাগরিতে কোনো পন্য নেই</p>
          </div>
        )}
      </div>
    </div>
  );
}
