import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '@/src/lib/firebase';
import { Product, Review } from '@/src/types';
import { formatPrice, cn } from '@/src/lib/utils';
import { trackCategoryView } from '@/src/services/recommendationService';
import { toggleWishlist, isInWishlist } from '@/src/services/wishlistService';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ShoppingCart, Star, ShieldCheck, Truck, RotateCcw, Minus, Plus, Heart, Share2, Package, Send, MessageSquare, ThumbsUp, Users, X, Download } from 'lucide-react';
import { useCart } from '@/src/lib/CartContext';
import { toast } from 'react-hot-toast';

export default function ProductDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, clearCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});
  const [likeListReview, setLikeListReview] = useState<Review | null>(null);
  const [likeList, setLikeList] = useState<any[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const productRef = doc(db, 'products', id);
        const snap = await getDoc(productRef);
        if (snap.exists()) {
          const productData = { id: snap.id, ...snap.data() } as Product;
          setProduct(productData);
          
          // Check wishlist status
          const favorited = await isInWishlist(id);
          setIsFavorite(favorited);

          // Increment view count
          try {
            await updateDoc(productRef, {
              views: increment(1)
            });
            // Track category view for recommendations
            trackCategoryView(productData.categoryId);
          } catch (e) {
            console.warn('Could not increment view count', e);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('productId', '==', id),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(reviewsQuery, (snap) => {
      const reviewsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
      setReviews(reviewsData);
    }, (error) => {
      console.error('Reviews snapshot error:', error);
    });

    return unsub;
  }, [id]);

  useEffect(() => {
    if (!auth.currentUser || reviews.length === 0) {
      setUserLikes({});
      return;
    }

    // Fetch likes for reviews that the user has liked
    // Note: In a real app, we might want to batch this or use a different approach
    // to avoid many individual getDoc calls.
    const fetchUserLikes = async () => {
      const newLikes: Record<string, boolean> = {};
      const promises = reviews.map(async (review) => {
        try {
          const likeDoc = await getDoc(doc(db, `reviews/${review.id}/likes`, auth.currentUser!.uid));
          newLikes[review.id] = likeDoc.exists();
        } catch (e) {
          newLikes[review.id] = false;
        }
      });
      await Promise.all(promises);
      setUserLikes(newLikes);
    };

    fetchUserLikes();
  }, [reviews, auth.currentUser?.uid]);

  const handleToggleLike = async (review: Review) => {
    if (!auth.currentUser) {
      alert('লাইক দিতে দয়া করে লগইন করুন।');
      navigate('/login');
      return;
    }

    const reviewRef = doc(db, 'reviews', review.id);
    const likeRef = doc(db, `reviews/${review.id}/likes`, auth.currentUser.uid);
    const currentlyLiked = userLikes[review.id];

    try {
      if (currentlyLiked) {
        await deleteDoc(likeRef);
        await updateDoc(reviewRef, { likesCount: increment(-1) });
        setUserLikes(prev => ({ ...prev, [review.id]: false }));
      } else {
        await setDoc(likeRef, {
          userId: auth.currentUser.uid,
          userName: auth.currentUser.displayName || 'সম্মানিত গ্রাহক',
          createdAt: serverTimestamp()
        });
        await updateDoc(reviewRef, { likesCount: increment(1) });
        setUserLikes(prev => ({ ...prev, [review.id]: true }));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `reviews/${review.id}/likes`);
    }
  };

  const showLikeList = async (review: Review) => {
    setLikeListReview(review);
    try {
      const likesSnap = await getDocs(collection(db, `reviews/${review.id}/likes`));
      setLikeList(likesSnap.docs.map(doc => doc.data()));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `reviews/${review.id}/likes`);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert('রিভিউ দিতে দয়া করে লগইন করুন।');
      navigate('/login');
      return;
    }
    if (!newReview.comment.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId: id,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'সম্মানিত গ্রাহক',
        userPhoto: auth.currentUser.photoURL,
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: serverTimestamp()
      });
      
      // Update product rating (simple logic)
      if (id) {
        await updateDoc(doc(db, 'products', id), {
          reviewCount: increment(1)
        });
      }
      
      setNewReview({ rating: 5, comment: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reviews');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white gap-4 relative z-[100]">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="font-bold text-text-muted">লোড হচ্ছে...</p>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-white p-12 text-center space-y-4 relative z-[100]">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-red-400">
        <ShoppingCart size={40} />
      </div>
      <h2 className="text-xl font-bold">পণ্যটি পাওয়া যায়নি।</h2>
      <button onClick={() => navigate('/')} className="text-primary font-bold underline">হোমে ফিরে যান</button>
    </div>
  );

  const discount = product.salePrice ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0;

  const handleAddToCart = () => {
    if (product.sizes?.length && !selectedSize) {
      alert('দয়া করে আপনার সাইজ সিলেক্ট করুন।');
      return;
    }

    addToCart({
      productId: product.id,
      name: product.nameBn,
      price: product.salePrice || product.price,
      quantity: qty,
      image: product.images[activeImage],
      size: selectedSize || undefined
    });
  };

  const handleBuyNow = () => {
    if (product.sizes?.length && !selectedSize) {
      alert('দয়া করে আপনার সাইজ সিলেক্ট করুন।');
      return;
    }

    clearCart();
    addToCart({
      productId: product.id,
      name: product.nameBn,
      price: product.salePrice || product.price,
      quantity: qty,
      image: product.images[activeImage],
      size: selectedSize || undefined
    });
    navigate('/checkout');
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    try {
      const added = await toggleWishlist(product.id, {
        nameBn: product.nameBn,
        price: product.price,
        salePrice: product.salePrice,
        images: product.images,
        rating: product.rating,
        categoryId: product.categoryId
      });
      setIsFavorite(added);
      if (added) {
        toast.success('পছন্দের তালিকায় যোগ করা হয়েছে');
      } else {
        toast.success('পছন্দের তালিকা থেকে সরানো হয়েছে');
      }
    } catch (err: any) {
      toast.error(err.message || 'একটি সমস্যা হয়েছে');
    }
  };

  const handleDownloadImage = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `glixbd-product-${product?.id || 'image'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('ছবি ডাউনলোড হচ্ছে...');
    } catch (err) {
      console.error('Download error:', err);
      // Fallback: open in new tab if fetch fails (CORS issues)
      window.open(url, '_blank');
      toast.error('ডাউনলোড শুরু করা যাচ্ছে না, নতুন ট্যাবে ওপেন করা হলো।');
    }
  };

  return (
    <div className="min-h-screen bg-white relative z-10 pb-24">
      {/* Standalone Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-50 px-4 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 bg-gray-50 hover:bg-primary/10 hover:text-primary rounded-xl transition-all active:scale-95 text-text-muted"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">G</div>
            <span className="hidden sm:block text-xl font-black text-primary tracking-tight">GlixBD</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/cart')} className="p-2 text-text-muted hover:text-primary transition-colors relative">
            <ShoppingCart size={22} />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-6 lg:grid lg:grid-cols-2 lg:gap-12 items-start">

      {/* Image Gallery */}
      <div className="space-y-6 lg:sticky lg:top-24">
        <div className="relative aspect-square bg-white lg:rounded-[40px] overflow-hidden group border border-gray-100 shadow-inner">
          <AnimatePresence mode="wait">
            <motion.img 
              key={activeImage}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              src={product.images[activeImage]} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </AnimatePresence>

          <div className="absolute top-6 right-6 flex flex-col gap-3">
            <button 
              onClick={handleToggleWishlist}
              className={cn(
                "w-12 h-12 backdrop-blur shadow-xl rounded-2xl flex items-center justify-center transition-all active:scale-90",
                isFavorite ? "bg-primary text-white" : "bg-white/90 text-primary lg:opacity-0 lg:group-hover:opacity-100"
              )}
            >
              <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
            </button>

            <button 
              onClick={() => handleDownloadImage(product.images[activeImage])}
              className="w-12 h-12 bg-white/90 backdrop-blur shadow-xl rounded-2xl flex items-center justify-center text-text-muted hover:text-primary lg:opacity-0 lg:group-hover:opacity-100 transition-all active:scale-90"
              title="Download Image"
            >
              <Download size={20} />
            </button>
          </div>

          {discount > 0 && (
            <div className="absolute top-6 left-6 bg-primary text-white text-[10px] lg:text-xs font-black px-4 py-2 rounded-2xl shadow-xl shadow-primary/30">
              {discount}% ছাড়
            </div>
          )}
          
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 px-4">
            {product.images.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  idx === activeImage ? "bg-primary w-8" : "bg-white/40 w-2 hover:bg-white/60"
                )}
              />
            ))}
          </div>

          <button 
            onClick={handleToggleWishlist}
            className={cn(
              "absolute top-6 right-6 p-3 backdrop-blur shadow-xl rounded-2xl transition-colors shrink-0",
              isFavorite ? "bg-primary text-white" : "bg-white/90 text-text-muted hover:text-red-500"
            )}
          >
            <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>

        {product.images.length > 1 && (
          <div className="flex gap-4 px-4 lg:px-0 overflow-x-auto no-scrollbar">
            {product.images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={cn(
                  "w-20 h-20 lg:w-24 lg:h-24 rounded-3xl overflow-hidden border-2 transition-all p-1 bg-white shrink-0",
                  idx === activeImage ? "border-primary shadow-xl shadow-primary/10" : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <img src={img} className="w-full h-full object-cover rounded-2xl" alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-6 lg:p-0 space-y-10 lg:mt-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-primary/10 text-primary text-[10px] lg:text-xs font-black uppercase px-4 py-1.5 rounded-full tracking-widest">
              প্রিমিয়াম কালেকশন
            </span>
            <div className="flex items-center gap-1.5 text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full">
              <Star size={14} fill="currentColor" />
              <span className="text-xs font-black text-yellow-700">{product.rating}</span>
            </div>
            <span className="text-xs text-text-muted font-bold">({product.reviewCount} রিভিউজ)</span>
          </div>
          
          <h1 className="text-3xl lg:text-5xl font-black text-text-main leading-tight tracking-tight">{product.nameBn}</h1>
          
          <div className="flex items-end gap-4">
            <div className="space-y-1">
              <p className="text-[10px] text-text-muted font-black uppercase tracking-widest leading-none">বর্তমান দাম</p>
              <span className="text-4xl font-black text-primary tracking-tighter">{formatPrice(product.salePrice || product.price)}</span>
            </div>
            {product.salePrice && (
              <div className="flex flex-col mb-1 gap-2">
                <span className="text-lg text-text-muted line-through font-bold">{formatPrice(product.price)}</span>
                <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-xl shadow-lg shadow-red-500/20 w-fit">
                  {Math.round(((product.price - product.salePrice) / product.price) * 100)}% ছাড়
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Size Selection */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-black text-sm lg:text-base flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded-full"></span>
              সাইজ সিলেক্ট করুন
            </h3>
            <div className="flex flex-wrap gap-3">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    "min-w-[60px] h-12 rounded-2xl font-black text-sm border-2 transition-all active:scale-95",
                    selectedSize === size 
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                      : "bg-white border-gray-100 text-text-main hover:border-primary/40"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm lg:text-base flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded-full"></span>
              পণ্যের বিবরণ
            </h3>
            <button className="text-primary p-2 hover:bg-primary/10 rounded-xl transition-colors">
              <Share2 size={18} />
            </button>
          </div>
          <p className="text-sm lg:text-lg text-text-muted leading-relaxed font-medium bg-gray-50 p-6 rounded-[32px] border border-gray-100">
            {product.descriptionBn || product.description}
          </p>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-2 gap-4">
          <FeatureCard icon={<ShieldCheck size={24} className="text-blue-500" />} title="১০০% অথেনটিক" subtitle="সরাসরি আমদানিকৃত" />
          <FeatureCard icon={<Truck size={24} className="text-green-500" />} title="বিদ্যুৎ গতিতে" subtitle="২৪-৪৮ ঘন্টায় পৌঁছে যাবে" />
          <FeatureCard icon={<RotateCcw size={24} className="text-orange-500" />} title="৭ দিনের রিটার্ন" subtitle="সহজ শর্তে ফেরতযোগ্য" />
          <FeatureCard icon={<Package size={24} className="text-purple-500" />} title="নিরাপদ প্যাকিং" subtitle="পণ্য সুরক্ষায় নিশ্চিন্ত" />
        </div>

        {/* Reviews Section */}
        <div className="space-y-8 pt-10 border-t border-gray-100 pb-20">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-xl lg:text-3xl text-text-main flex items-center gap-3">
              <MessageSquare size={24} className="text-secondary" />
              গ্রাহক রিভিউসমূহ ({reviews.length})
            </h3>
          </div>

          {/* Review Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-100 flex flex-col items-center justify-center text-center">
              <span className="text-6xl font-black text-text-main leading-none">{product.rating}</span>
              <div className="flex gap-1 my-3 text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={20} fill={star <= product.rating ? "currentColor" : "none"} />
                ))}
              </div>
              <p className="text-xs font-black text-text-muted uppercase tracking-widest">ভেরিফাইড রেটিং</p>
            </div>
            
            <div className="md:col-span-2 bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-100/50">
              <h4 className="font-black text-lg mb-6">আপনার একটি রিভিউ দিন</h4>
              <form onSubmit={handleSubmitReview} className="space-y-6">
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      className={cn(
                        "p-2 rounded-xl transition-all",
                        newReview.rating >= star ? "text-yellow-400 bg-yellow-50" : "text-gray-300 hover:text-yellow-200"
                      )}
                    >
                      <Star size={28} fill={newReview.rating >= star ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="পণ্যটি সম্পর্কে আপনার মতামত লিখুন..."
                    className="w-full bg-gray-50 border border-transparent focus:border-primary focus:bg-white outline-none px-6 py-4 rounded-3xl font-bold transition-all resize-none min-h-[120px]"
                  />
                  <button
                    disabled={submitting || !newReview.comment.trim()}
                    className="absolute bottom-4 right-4 bg-primary text-white p-3 rounded-2xl shadow-xl shadow-primary/20 active:scale-90 transition-all disabled:opacity-50"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Review List */}
          <div className="space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  key={review.id}
                  className="bg-white p-6 rounded-[34px] border border-gray-100 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black overflow-hidden border border-primary/10">
                        {review.userPhoto ? (
                          <img src={review.userPhoto} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                        ) : (
                          review.userName.charAt(0)
                        )}
                      </div>
                      <div>
                        <h5 className="font-black text-text-main">{review.userName}</h5>
                        <div className="flex gap-0.5 text-yellow-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} size={10} fill={star <= review.rating ? "currentColor" : "none"} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">
                      ভেরিফাইড পারচেজ
                    </span>
                  </div>
                  <p className="text-text-muted font-bold leading-relaxed">{review.comment}</p>
                  
                  <div className="flex items-center gap-6 pt-2">
                    <button
                      onClick={() => handleToggleLike(review)}
                      className={cn(
                        "flex items-center gap-2 text-sm font-black transition-all active:scale-90",
                        userLikes[review.id] ? "text-primary" : "text-text-muted hover:text-primary"
                      )}
                    >
                      <ThumbsUp size={16} fill={userLikes[review.id] ? "currentColor" : "none"} />
                      {review.likesCount || 0}
                    </button>

                    <button
                      onClick={() => showLikeList(review)}
                      className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-primary transition-all"
                    >
                      <Users size={14} />
                      লাইক লিস্ট
                    </button>
                  </div>

                  {review.reply && (
                    <div className="bg-gray-50 p-4 rounded-2xl border-l-4 border-primary mt-2">
                      <p className="text-xs font-black text-primary mb-1">সেলার রিপ্লাই:</p>
                      <p className="text-xs font-bold text-text-muted">{review.reply}</p>
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="text-center py-10 bg-gray-50/50 rounded-[40px] border border-dashed border-gray-200">
                <p className="text-text-muted font-bold">এখনো কোনো রিভিউ নেই। আপনিই প্রথম রিভিউ দিন!</p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        <div className="space-y-8 pt-10 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-xl lg:text-3xl text-text-main flex items-center gap-3">
              <Package size={24} className="text-primary" />
              আপনার জন্য আরও কিছু পণ্য
            </h3>
            <button onClick={() => navigate('/')} className="text-primary font-bold text-sm bg-primary/10 px-4 py-2 rounded-xl hover:bg-primary hover:text-white transition-all">
              সব দেখুন
            </button>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-1 pb-10">
            {/* We could fetch real related products here, for now showing a few placeholders or fetching from DB */}
            <RelatedProducts productId={id!} categoryId={product.categoryId} />
          </div>
        </div>
      </div>

    </div>
      
      {/* Fixed Bottom Order Actions - Optimized for Mobile Bottom Edge */}
      <div className="fixed lg:static bottom-0 left-0 right-0 lg:mt-10 bg-white lg:bg-transparent border-t lg:border-none border-gray-100 p-2.5 pb-[env(safe-area-inset-bottom,6px)] lg:p-0 z-[60] transition-all duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] lg:shadow-none">
        <div className="max-w-7xl mx-auto flex lg:flex-col gap-2.5">
          {/* Qty & Add to Cart Row */}
          <div className="flex gap-2.5 flex-1 lg:flex-none">
            <div className="flex items-center bg-gray-100/50 rounded-2xl px-1 py-1 w-28 lg:w-full shrink-0 lg:justify-between">
              <button 
                onClick={() => setQty(q => Math.max(1, q-1))}
                className="w-9 h-9 flex items-center justify-center bg-white rounded-xl shadow-sm active:scale-90 transition-all hover:bg-primary/5"
              >
                <Minus size={14} />
              </button>
              <span className="flex-1 text-center font-black text-sm">{qty}</span>
              <button 
                onClick={() => setQty(q => q+1)}
                className="w-9 h-9 flex items-center justify-center bg-white rounded-xl shadow-sm active:scale-90 transition-all hover:bg-primary/5"
              >
                <Plus size={14} />
              </button>
            </div>
            
            <button 
              onClick={handleAddToCart}
              className="flex-1 lg:flex-none lg:w-full bg-primary/10 text-primary font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-primary hover:text-white active:scale-95 transition-all text-xs lg:text-sm border border-primary/20"
            >
              <ShoppingCart size={16} />
              কার্টে যোগ
            </button>
          </div>
          
          {/* Buy Now Button */}
          <button 
            onClick={handleBuyNow}
            className="flex-1 lg:w-full bg-primary text-white font-black py-3.5 lg:py-5 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center active:scale-95 transition-all text-sm lg:text-base hover:bg-primary/90 btn-rgb"
          >
            এখনই অর্ডার করুন
          </button>
        </div>
      </div>
      
      {/* Like List Modal */}
      <AnimatePresence>
        {likeListReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLikeListReview(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-black text-xl flex items-center gap-3">
                  <Users className="text-primary" />
                  যারা পছন্দ করেছেন
                </h3>
                <button 
                  onClick={() => setLikeListReview(null)}
                  className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-text-muted hover:bg-red-50 hover:text-red-500 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4">
                {likeList.length > 0 ? (
                  likeList.map((like, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black">
                        {like.userName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-text-main">{like.userName}</p>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">ভেরিফাইড ইউজার</p>
                      </div>
                      <div className="text-secondary">
                        <ThumbsUp size={16} fill="currentColor" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-text-muted font-bold">এখনো কেউ লাইক করেনি।</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RelatedProducts({ productId, categoryId }: { productId: string, categoryId: string }) {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchRelated() {
      try {
        const q = query(
          collection(db, 'products'),
          where('categoryId', '==', categoryId),
          orderBy('createdAt', 'desc')
          // Note: Firestore doesn't support != for id easily with other filters, 
          // we'll filter the current product out manually
        );
        const snap = await getDocs(q);
        const items = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Product))
          .filter(p => p.id !== productId)
          .slice(0, 4);
        setRelatedProducts(items);
      } catch (err) {
        console.error('Error fetching related products:', err);
      }
    }
    fetchRelated();
  }, [productId, categoryId]);

  if (relatedProducts.length === 0) return null;

  return (
    <>
      {relatedProducts.map((p) => (
        <motion.div 
          key={p.id}
          whileHover={{ y: -5 }}
          onClick={() => {
            navigate(`/product/${p.id}`);
            window.scrollTo(0, 0);
          }}
          className="bg-white rounded-[32px] border border-gray-100 overflow-hidden cursor-pointer group shadow-sm hover:shadow-xl transition-all"
        >
          <div className="relative aspect-[4/5] overflow-hidden">
            <img src={p.images[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={p.nameBn} />
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[8px] font-black uppercase text-primary">নতুন</div>
          </div>
          <div className="p-4 space-y-2">
            <h4 className="font-bold text-xs truncate group-hover:text-primary transition-colors">{p.nameBn}</h4>
            <div className="flex items-center justify-between">
              <span className="font-black text-primary text-sm">{formatPrice(p.salePrice || p.price)}</span>
              {p.salePrice && (
                <span className="text-[10px] text-text-muted line-through">{formatPrice(p.price)}</span>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </>
  );
}

function FeatureCard({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle: string }) {
  return (
    <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm flex flex-col gap-3 group hover:border-primary/20 hover:shadow-lg transition-all">
      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-black text-text-main">{title}</h4>
        <p className="text-[10px] text-text-muted font-bold mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
