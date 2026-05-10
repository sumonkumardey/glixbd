import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Product } from '@/src/types';
import { Search, Filter, SlidersHorizontal, ShoppingCart, Star, History, TrendingUp, X, Layers, Mic, MicOff, Camera, Image as ImageIcon, Loader2, Stars } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { formatPrice, cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../ProductCard';
import { toast } from 'react-hot-toast';
import { analyzeImageForSearch, findSimilarProducts } from '@/src/services/aiService';

export default function SearchScreen() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialQuery = searchParams.get('q') || '';

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [aiSuggestedProducts, setAiSuggestedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [recentSearches, setRecentSearches] = useState(['পাঞ্জাবী', 'ইয়ারবাডস', 'মধু']);
  const [isListening, setIsListening] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Image Search Functionality
  const handleImageSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error('ছবি ৪ এমবি-র কম হতে হবে।');
      return;
    }

    setAnalyzingImage(true);
    toast('ছবি এনালাইজ করছি...', { icon: '🔍' });

    try {
      const base64 = await fileToBase64(file);
      const keywords = await analyzeImageForSearch(base64, file.type);
      
      if (keywords) {
        setSearchTerm(keywords);
        toast.success(`রেজাল্ট পাওয়া গেছে: ${keywords}`);
      } else {
        toast.error('ছবি থেকে কোনো প্রোডাক্ট চিনতে পারিনি।');
      }
    } catch (err) {
      console.error(err);
      toast.error('ভুল হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setAnalyzingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Voice Search Functionality
  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error('আপনার ব্রাউজার ভয়েস সার্চ সাপোর্ট করে না।');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'bn-BD'; // Set language to Bengali
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast('শুনছি... আপনার পছন্দের প্রোডাক্টটির নাম বলুন।', { icon: '🎙️' });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchTerm(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast.error('মাইক্রোফোন পারমিশন প্রয়োজন।');
      } else {
        toast.error('ভয়েস কমান্ড বুঝতে পারিনি। আবার চেষ্টা করুন।');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  useEffect(() => {
    async function fetchCategories() {
      try {
        const snap = await getDocs(query(collection(db, 'categories'), limit(5)));
        setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error(err);
      }
    }
    fetchCategories();
  }, []);

  const performSearch = async (term: string) => {
    if (!term.trim()) {
      setProducts([]);
      return;
    }
    setLoading(true);
    setAiSuggestedProducts([]);
    try {
      // 1. Try local simple filtering first for better responsiveness (word-based)
      const allProductsSnap = await getDocs(query(collection(db, 'products'), limit(100)));
      const allItems = allProductsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      
      const filtered = allItems.filter(p => {
        const searchLower = term.toLowerCase();
        const words = searchLower.split(/\s+/).filter(w => w.length > 0);
        const nameBn = (p.nameBn || '').toLowerCase();
        const nameEn = (p.name || '').toLowerCase();
        
        // Match if ALL words in the search query are present in either Bengali or English name
        return words.every(word => nameBn.includes(word) || nameEn.includes(word));
      });

      setProducts(filtered);
      
      // 2. Smart AI Matching if direct results are low (less than 2)
      if (filtered.length < 2 && term.length >= 2) {
        const suggestedIds = await findSimilarProducts(term, allItems);
        if (suggestedIds.length > 0) {
          const matched = allItems.filter(p => suggestedIds.includes(p.id));
          // Don't show suggested if they are already in direct results
          const newSuggestions = matched.filter(suggested => !filtered.some(f => f.id === suggested.id));
          if (newSuggestions.length > 0) {
            setAiSuggestedProducts(newSuggestions);
          }
        }
      }

      // Update recent searches
      if (term.trim() && !recentSearches.includes(term.trim())) {
        setRecentSearches(prev => [term.trim(), ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const queryTerm = new URLSearchParams(location.search).get('q');
    if (queryTerm && queryTerm !== searchTerm) {
      setSearchTerm(queryTerm);
    }
  }, [location.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-0 space-y-10 pb-20">
      {/* Premium Search Header */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-3xl lg:text-5xl font-black text-text-main tracking-tight flex items-center gap-3">
             <div className="w-3 h-10 lg:w-4 lg:h-14 bg-primary rounded-full"></div>
             খুঁজুন
          </h2>
          {searchTerm && (
            <p className="text-sm font-bold text-text-muted">
              সার্চ রেজাল্ট: <span className="text-primary">"{searchTerm}"</span> ({products.length} টি পণ্য)
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <div className="flex-1 bg-white border border-gray-100 rounded-[30px] flex items-center px-6 shadow-xl shadow-gray-100/50 focus-within:border-primary focus-within:shadow-primary/5 transition-all duration-300">
            <Search className="text-text-muted" size={24} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="আপনার পছন্দের পোশাক বা গিজমো খুঁজুন..." 
              className="flex-1 py-5 px-3 outline-none bg-transparent text-sm lg:text-lg font-medium"
            />
            <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageSearch}
                  accept="image/*"
                  className="hidden"
                />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={analyzingImage}
                  className={cn(
                    "p-3 rounded-full transition-all duration-300",
                    analyzingImage ? "bg-primary/10 text-primary" : "hover:bg-gray-50 text-text-muted"
                  )}
                  title="ছবি দিয়ে সার্চ"
                >
                  {analyzingImage ? <Loader2 size={22} className="animate-spin" /> : <Camera size={22} />}
                </button>
                <button 
                  type="button" 
                  onClick={startVoiceSearch}
                  className={cn(
                    "p-3 rounded-full transition-all duration-300 relative overflow-hidden",
                    isListening ? "bg-red-500 text-white shadow-lg shadow-red-200" : "hover:bg-gray-50 text-text-muted"
                  )}
                  title="ভয়েস সার্চ"
                >
                  {isListening && (
                    <motion.div 
                      layoutId="listening-ripple"
                      initial={{ scale: 0.8, opacity: 0.5 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute inset-0 bg-red-400 rounded-full"
                    />
                  )}
                  <div className="relative z-10">
                    {isListening ? <MicOff size={22} className="animate-pulse" /> : <Mic size={22} />}
                  </div>
                </button>
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="p-2 hover:bg-gray-50 rounded-full text-text-muted transition-colors">
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
          <button className="bg-primary text-white p-5 rounded-[30px] shadow-xl shadow-primary/20 active:scale-95 transition-all hover:bg-primary/90">
            <SlidersHorizontal size={28} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="aspect-[4/5] bg-gray-50 animate-pulse rounded-[40px] border border-gray-50" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-10">
          <AnimatePresence mode="popLayout">
            {products.map((p) => (
              <motion.div 
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : aiSuggestedProducts.length > 0 ? (
        <div className="space-y-8">
          <div className="flex items-center gap-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
             <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center animate-pulse">
               <Stars size={20} />
             </div>
             <div>
               <h3 className="font-black text-lg text-primary">AI স্মার্ট রেজাল্ট</h3>
               <p className="text-xs text-text-muted font-bold">সরাসরি মিল না থাকায় আপনার জন্য সম্ভাব্য সেরা মিলগুলো খুঁজে বের করা হয়েছে</p>
             </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-10">
            {aiSuggestedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      ) : searchTerm ? (
        <div className="py-24 text-center space-y-6 max-w-sm mx-auto">
          <div className="w-24 h-24 bg-gray-50 rounded-[40px] flex items-center justify-center mx-auto text-gray-200">
             <Search size={48} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">দুঃখিত, কোনো পণ্য পাওয়া যায়নি।</h3>
            <p className="text-sm text-text-muted font-medium">অন্য কোনো নাম দিয়ে চেষ্টা করুন অথবা ক্যাটাগরি ব্রাউজ করুন।</p>
          </div>
          <button onClick={() => setSearchTerm('')} className="bg-primary text-white font-black px-10 py-4 rounded-3xl shadow-xl shadow-primary/20 active:scale-95 transition-all">আবার সার্চ করুন</button>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="space-y-4">
               <h3 className="font-black text-sm lg:text-base text-text-muted flex items-center gap-2 uppercase tracking-widest">
                 <History size={16} />
                 আগের সার্চগুলো
               </h3>
               <div className="flex flex-wrap gap-3">
                 {recentSearches.map(tag => (
                   <button 
                     key={tag}
                     onClick={() => setSearchTerm(tag)} 
                     className="bg-white border border-gray-100 px-6 py-3 rounded-2xl text-sm font-bold text-text-main shadow-sm hover:border-primary hover:text-primary hover:shadow-lg transition-all"
                   >
                     {tag}
                   </button>
                 ))}
               </div>
            </div>
          )}

          {/* Trending Categories mockup */}
          <div className="space-y-6">
            <h3 className="font-black text-sm lg:text-base text-text-muted flex items-center gap-2 uppercase tracking-widest">
              <TrendingUp size={16} />
              জনপ্রিয় ক্যাটাগরি
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map(cat => (
                 <NavLink 
                  to={`/category/${cat.id}`}
                  key={cat.id}
                  className="bg-gray-50/80 backdrop-blur border border-gray-100 p-8 rounded-[40px] text-center hover:bg-white hover:shadow-xl hover:border-primary/20 transition-all font-black text-text-main flex flex-col items-center justify-center gap-3"
                 >
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-12 h-12 object-contain rounded-xl" />
                    ) : (
                      <Layers className="text-primary/40" size={32} />
                    )}
                    <span>{cat.nameBn}</span>
                 </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
