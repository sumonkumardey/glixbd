import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, orderBy, serverTimestamp, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { Review, Product } from '@/src/types';
import { useAdmin } from '@/src/hooks/useAdmin';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Star, Reply, User, Package, Send, X, Clock, CheckCircle2 } from 'lucide-react';
import { formatPrice, formatDate, sanitizeForFirestore } from '@/src/lib/utils';
import { toast } from 'react-hot-toast';

export default function AdminReviews() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [reviews, setReviews] = useState<(Review & { productDetails?: Product })[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchReviews();
    }
  }, [isAdmin]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const reviewsData: any[] = [];
      
      // Fetch product details for each review
      const productIds = Array.from(new Set(querySnapshot.docs.map(doc => doc.data().productId)));
      const productDetailsMap: Record<string, Product> = {};
      
      // Batch fetch products (simulated as we can't do direct IN query easily for large sets, 
      // but for reviews, doing individual fetches or filtered batches is okay)
      for (const pid of productIds) {
        const prodSnap = await getDocs(query(collection(db, 'products'), where('__name__', '==', pid)));
        if (!prodSnap.empty) {
          productDetailsMap[pid] = { id: prodSnap.docs[0].id, ...prodSnap.docs[0].data() } as Product;
        }
      }

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reviewsData.push({
          id: doc.id,
          ...data,
          productDetails: productDetailsMap[data.productId]
        });
      });
      
      setReviews(reviewsData);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      await updateDoc(reviewRef, sanitizeForFirestore({
        reply: replyText,
        repliedAt: serverTimestamp()
      }));
      
      toast.success('রিপ্লাই সফলভাবে পাঠানো হয়েছে');
      setReplyingTo(null);
      setReplyText('');
      fetchReviews();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reviews/${reviewId}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (adminLoading || loading) return <div className="p-8 text-center font-bold">রিভিউ লোড হচ্ছে...</div>;
  if (!isAdmin) return null;

  return (
    <div className="space-y-8 p-4 lg:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-text-main flex items-center gap-3">
          <MessageSquare className="text-primary" />
          রিভিউ ম্যানেজমেন্ট
        </h1>
        <p className="text-sm text-text-muted">গ্রাহকদের রিভিউ দেখুন এবং রিপ্লাই দিন</p>
      </div>

      <div className="grid gap-6">
        {reviews.length === 0 ? (
          <div className="bg-white p-12 rounded-[32px] border border-dashed border-gray-200 text-center space-y-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400">
              <MessageSquare size={32} />
            </div>
            <p className="text-text-muted font-bold">এখনো কোনো রিভিউ পাওয়া যায়নি</p>
          </div>
        ) : (
          reviews.map((review) => (
            <motion.div
              layout
              key={review.id}
              className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="p-6 space-y-6">
                {/* Header: User & Product */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-start gap-3 sm:gap-4 w-full md:w-auto">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-primary shrink-0">
                      <User size={20} className="sm:size-24" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-text-main text-sm sm:text-base truncate">{review.userName}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs text-text-muted">
                        <div className="flex items-center gap-1">
                          <Star size={10} className="text-orange-400 fill-orange-400" />
                          <span className="font-bold">{review.rating}/5</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Clock size={10} />
                          <span>{formatDate(review.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {review.productDetails && (
                    <div className="flex items-center gap-3 bg-gray-50 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-gray-100 w-full md:w-auto overflow-hidden">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg overflow-hidden border border-gray-200 shrink-0">
                        <img 
                          src={review.productDetails.images[0]} 
                          className="w-full h-full object-cover" 
                          alt="" 
                        />
                      </div>
                      <div className="min-w-0 flex-1 md:flex-none">
                        <p className="text-[10px] sm:text-xs font-bold truncate max-w-[150px] sm:max-w-[200px]">{review.productDetails.nameBn}</p>
                        <p className="text-[9px] sm:text-[10px] text-text-muted">{formatPrice(review.productDetails.salePrice || review.productDetails.price)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content: Review Comment */}
                <div className="bg-gray-50/50 p-4 rounded-2xl italic text-text-main text-sm">
                  "{review.comment}"
                </div>

                {/* Footer: Reply Action or Existing Reply */}
                {review.reply ? (
                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <CheckCircle2 size={16} />
                      <span className="text-xs font-black uppercase tracking-widest">আপনার রিপ্লাই</span>
                    </div>
                    <p className="text-sm font-bold text-text-main pl-6">{review.reply}</p>
                    <button 
                      onClick={() => {
                        setReplyingTo(review.id);
                        setReplyText(review.reply || '');
                      }}
                      className="text-[10px] font-black text-primary hover:underline pl-6"
                    >
                      এডিট করুন
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    {replyingTo === review.id ? (
                      <div className="w-full space-y-3">
                        <textarea
                          placeholder="রিভাইউ এর রিপ্লাই লিখুন..."
                          className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-medium focus:border-primary outline-none min-h-[100px]"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                        />
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText('');
                            }}
                            className="px-4 py-2 text-xs font-black text-text-muted hover:text-red-500 transition-colors"
                          >
                            বাতিল করুন
                          </button>
                          <button
                            disabled={submitting || !replyText.trim()}
                            onClick={() => handleReply(review.id)}
                            className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-black flex items-center gap-2 disabled:opacity-50"
                          >
                            {submitting ? 'পাঠানো হচ্ছে...' : (
                              <>
                                <Send size={14} />
                                রিপ্লাই পাঠান
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyingTo(review.id)}
                        className="flex items-center gap-2 bg-primary/10 text-primary px-6 py-2 rounded-xl text-xs font-black hover:bg-primary hover:text-white transition-all"
                      >
                        < Reply size={14} />
                        রিপ্লাই দিন
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
