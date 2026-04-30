import React, { useEffect, useState } from 'react';
import { collection, getDocs, limit, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '@/src/lib/firebase';
import { Product, Category } from '@/src/types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ShoppingCart, Star, Sparkles, Wallet, Gift, Copy, Share2 } from 'lucide-react';
import { formatPrice, cn } from '@/src/lib/utils';
import { NavLink } from 'react-router-dom';
import { getUserPreferredCategories } from '@/src/services/recommendationService';
import { toggleWishlist, isInWishlist } from '@/src/services/wishlistService';
import { doc, getDoc } from 'firebase/firestore';
import { Heart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ProductCard from '../ProductCard';

export default function HomeScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showBalance, setShowBalance] = useState(false);

  useEffect(() => {
    // User Profile Listener
    let unsubUser = () => {};
    if (auth.currentUser) {
      unsubUser = onSnapshot(doc(db, 'users', auth.currentUser.uid), (snap) => {
        if (snap.exists()) {
          setUserProfile(snap.data());
        }
      });
    }
    // Categories Real-time Listener
    const qCats = query(collection(db, 'categories'), orderBy('sortOrder', 'asc'));
    const unsubCats = onSnapshot(qCats, (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error) => {
      console.error("Categories fetch error:", error);
    });

    // Fetch Banners
    const qBanners = query(collection(db, 'banners'), where('isActive', '==', true), orderBy('sortOrder', 'asc'));
    const unsubBanners = onSnapshot(qBanners, (snap) => {
      setBanners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Recommended/Personalized Products
    const fetchRecommendations = async () => {
      const preferredCatIds = await getUserPreferredCategories();
      
      if (preferredCatIds.length > 0) {
        // Fetch products from preferred categories
        try {
          const qRecs = query(
            collection(db, 'products'),
            where('categoryId', 'in', preferredCatIds.slice(0, 5)),
            limit(10)
          );
          const snapRecs = await getDocs(qRecs);
          const recs = snapRecs.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
          // Shuffle or sort by views/rating
          setRecommendedProducts(recs.sort(() => Math.random() - 0.5));
        } catch (err) {
          console.error("Failed to fetch categorized recommendations", err);
        }
      }
    };
    fetchRecommendations();

    // Latest Products Listener (Real-time)
    const latestQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(8));
    const unsubLatest = onSnapshot(latestQuery, (snapshot) => {
      setLatestProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'latest_products');
      setLoading(false);
    });

    // Featured Products query
    const featuredQuery = query(collection(db, 'products'), where('isFeatured', '==', true), limit(6));
    const unsubFeatured = onSnapshot(featuredQuery, (snapshot) => {
      setFeaturedProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    // Popular Products query
    const popularQuery = query(collection(db, 'products'), orderBy('views', 'desc'), limit(6));
    const unsubPopular = onSnapshot(popularQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setPopularProducts(items);
      setFlashSaleProducts(items.filter(p => p.salePrice && p.salePrice < p.price));
    });

    return () => {
      unsubLatest();
      unsubFeatured();
      unsubPopular();
      unsubBanners();
      unsubCats();
      unsubUser();
    };
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const timer = setInterval(() => {
        setCurrentBanner(prev => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [banners.length]);

  const handleCopyReferral = async () => {
    if (!userProfile?.referralCode) return;
    const link = `${window.location.origin}?ref=${userProfile.referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'GlixBD Referral',
          text: 'আমার রেফারেল লিংক ব্যবহার করে কেনাকাটা করুন এবং বোনাস পান!',
          url: link,
        });
      } catch (err) {
        navigator.clipboard.writeText(link);
        toast.success('রেফারেল লিংক কপি করা হয়েছে!');
      }
    } else {
      navigator.clipboard.writeText(link);
      toast.success('রেফারেল লিংক কপি করা হয়েছে!');
    }
  };

  if (loading) return (
    <div className="p-4 space-y-4">
      <div className="h-40 bg-gray-200 animate-pulse rounded-xl" />
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-lg" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      {/* bKash Style Balance Bar */}
      {userProfile && (
        <section className="px-4 pt-2 lg:px-0">
          <div className="bg-white rounded-[28px] p-2 shadow-sm border border-gray-100 flex items-center gap-3 overflow-hidden">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/20">
              <Wallet size={24} />
            </div>
            
            <div className="flex-1">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">আপনার ব্যালেন্স</p>
              <div 
                onClick={() => setShowBalance(!showBalance)}
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
                
                {/* Shimmer Effect */}
                {!showBalance && (
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer" />
                )}
              </div>
            </div>

            <button onClick={handleCopyReferral} className="flex flex-col items-center justify-center p-2 hover:bg-gray-50 rounded-2xl transition-colors">
              <Gift size={20} className="text-secondary" />
              <span className="text-[9px] font-black mt-1">রেফার</span>
            </button>
          </div>
        </section>
      )}

      {/* Refer & Earn Promo Card */}
      {userProfile && (
        <section className="px-4 lg:px-0">
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="bg-gradient-to-br from-indigo-600 to-primary rounded-[32px] p-6 text-white relative overflow-hidden shadow-xl shadow-primary/20"
          >
            {/* Decoration */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <h3 className="text-lg font-black tracking-tight">রেফার করুন, টাকা আয় করুন!</h3>
              </div>
              
              <p className="text-sm text-white/80 font-medium mb-6 leading-relaxed">
                আপনার লিংক দিয়ে জয়েন করে ১০০০ টাকার কেনাকাটা করলে আপনি বোনাস পাবেন!
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 flex-1 flex items-center justify-between group">
                  <span className="font-mono font-bold tracking-widest text-xs lg:text-sm">{userProfile.referralCode}</span>
                  <button onClick={handleCopyReferral} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                    <Copy size={18} />
                  </button>
                </div>
                <button 
                  onClick={handleCopyReferral}
                  className="bg-white text-primary font-black px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-opacity-90 active:scale-95 transition-all shadow-lg"
                >
                  <Share2 size={18} />
                  শেয়ার করুন
                </button>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Dynamic Banner Slider */}
      <section className="px-4 pt-4 lg:px-0">
        <div className="relative h-32 lg:h-44 rounded-3xl overflow-hidden shadow-xl shadow-primary/5">
          <AnimatePresence mode="wait">
            {banners.length > 0 ? (
              <motion.div
                key={banners[currentBanner].id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex items-center p-6 lg:p-10"
                style={{ backgroundColor: banners[currentBanner].bgColor || 'transparent' }}
              >
                {/* Background Image without overlay filter if not requested */}
                {banners[currentBanner].image && (
                  <div className="absolute inset-0 overflow-hidden">
                    <img 
                      src={banners[currentBanner].image} 
                      alt="" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}
                
                <div className="z-10 max-w-md space-y-2 lg:space-y-3">
                  {banners[currentBanner].tag && (
                    <motion.div 
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="bg-white text-primary text-[8px] lg:text-[10px] font-black px-3 py-1 rounded-full w-fit uppercase tracking-wider"
                    >
                      {banners[currentBanner].tag}
                    </motion.div>
                  )}
                  <h2 className="text-2xl lg:text-4xl font-black text-white leading-none">
                    {banners[currentBanner].title || 'GlixBD'}
                  </h2>
                  <p className="text-white/80 text-xs lg:text-base font-medium leading-tight line-clamp-2">
                    {banners[currentBanner].subtitle}
                  </p>
                  {banners[currentBanner].link && (
                    <NavLink 
                      to={banners[currentBanner].link}
                      className="inline-block bg-white text-primary text-xs lg:text-sm font-black px-6 py-2.5 rounded-xl hover:bg-gray-100 transition-colors shadow-lg active:scale-95 transform transition-transform"
                    >
                      এখনই দেখুন
                    </NavLink>
                  )}
                </div>

                {/* Banner Dots */}
                {banners.length > 1 && (
                  <div className="absolute bottom-4 right-8 flex gap-1.5 z-20">
                    {banners.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentBanner(idx)}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full transition-all",
                          idx === currentBanner ? "w-4 bg-white" : "bg-white/40"
                        )}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              /* Fallback if no banners */
              <div className="absolute inset-0 bg-primary flex items-center p-8">
                 <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white">Welcome to GlixBD</h2>
                    <p className="text-white/80">সেরা সব প্রোডাক্টের সমাহার এখানে।</p>
                 </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 lg:px-0">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-black text-xl lg:text-2xl flex items-center gap-2">
            <span className="w-1.5 h-8 bg-primary rounded-full"></span>
            ক্যাটাগরি
          </h3>
          <button className="text-primary text-sm font-bold flex items-center hover:gap-1 transition-all">সব দেখুন <ChevronRight size={18} /></button>
        </div>
        
        <div className="flex flex-wrap gap-4 px-4 pb-4">
          {categories.map((cat) => (
            <NavLink to={`/category/${cat.id}`} key={cat.id} className="group shrink-0">
              <div className="bg-white w-20 lg:w-32 aspect-square rounded-[32px] shadow-sm border border-gray-100 flex flex-col items-center justify-center p-3 group-hover:border-primary/30 group-hover:shadow-xl transition-all duration-300">
                <div className="w-10 h-10 lg:w-20 lg:h-20 mb-2 flex items-center justify-center group-hover:scale-110 transition-all transform overflow-hidden rounded-[24px]">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-xl lg:text-3xl bg-white w-full h-full flex items-center justify-center">
                      {cat.id === 'clothing' ? '👗' : cat.id === 'electronics' ? '📱' : cat.id === 'food' ? '🍕' : cat.id === 'home' ? '🏠' : cat.id === 'beauty' ? '💄' : '🧸'}
                    </div>
                  )}
                </div>
                <span className="text-[10px] lg:text-xs font-black text-text-muted group-hover:text-primary transition-colors text-center line-clamp-1">{cat.nameBn}</span>
              </div>
            </NavLink>
          ))}
        </div>
      </section>

      {/* Recommended Products (Personalized) */}
      {recommendedProducts.length > 0 && (
        <section className="px-4 lg:px-0">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-xl lg:text-2xl flex items-center gap-2">
              <Sparkles className="text-secondary fill-secondary/20" size={24} />
              আপনার জন্য স্পেশাল
            </h3>
            <span className="bg-secondary/10 text-secondary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">পারসোনালাইজড</span>
          </div>
          <div className="flex overflow-x-auto gap-4 no-scrollbar px-1 pb-4">
            {recommendedProducts.map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>
        </section>
      )}

      {/* Flash Sale */}
      {flashSaleProducts.length > 0 && (
        <section className="bg-orange-50 border-y border-orange-100 py-10 my-8 -mx-4 lg:-mx-0 lg:rounded-3xl lg:border-x">
          <div className="px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <span className="text-3xl animate-bounce">⚡</span>
              <div>
                <h3 className="font-black text-xl text-secondary">ফ্ল্যাশ সেল চলছে</h3>
                <p className="text-[10px] text-orange-700 font-bold uppercase tracking-widest">সীমিত সময়ের অফার</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 font-mono text-white text-lg">
                <span className="bg-gray-800 px-3 py-1.5 rounded-xl shadow-lg">০২</span>
                <span className="text-gray-800 font-bold">:</span>
                <span className="bg-gray-800 px-3 py-1.5 rounded-xl shadow-lg">৪৫</span>
                <span className="text-gray-800 font-bold">:</span>
                <span className="bg-gray-800 px-3 py-1.5 rounded-xl shadow-lg">১২</span>
              </div>
            </div>
          </div>
          <div className="flex overflow-x-auto gap-4 no-scrollbar px-4 lg:px-8 pb-4">
            {flashSaleProducts.map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>
        </section>
      ) }

      {/* New Arrivals */}
      <section className="px-4 lg:px-0">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-black text-xl lg:text-2xl flex items-center gap-2">
            <span className="w-1.5 h-8 bg-black rounded-full"></span>
            নতুন পণ্যসমূহ
          </h3>
          <span className="bg-black/5 text-gray-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">নিউ কালেকশন</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {latestProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section id="featured" className="px-4 lg:px-0">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-black text-xl lg:text-2xl flex items-center gap-2">
            <span className="w-1.5 h-8 bg-primary rounded-full"></span>
            আপনার জন্য বাছাইকৃত
          </h3>
          <button className="text-primary text-sm font-bold">সব দেখুন</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-8">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Popular Products (Based on Views) */}
      {popularProducts.length > 0 && (
        <section className="px-4 lg:px-0 py-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-xl lg:text-2xl flex items-center gap-2">
              <span className="w-1.5 h-8 bg-secondary rounded-full"></span>
              সবচেয়ে বেশি দেখা পন্য
            </h3>
            <span className="bg-secondary/10 text-secondary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">টপ চয়েস</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-8">
            {popularProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
