import React, { useState, useEffect } from 'react';
import { Product } from '@/src/types';
import { NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Heart, Download, Zap } from 'lucide-react';
import { formatPrice, cn } from '@/src/lib/utils';
import { auth } from '@/src/lib/firebase';
import { toast } from 'react-hot-toast';
import { toggleWishlist, isInWishlist } from '@/src/services/wishlistService';
import { useCart } from '@/src/lib/CartContext';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  key?: any;
}

export default function ProductCard({ product, compact = false }: ProductCardProps) {
  const discount = product.salePrice ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0;
  const [isFavorite, setIsFavorite] = useState(false);
  const { addToCart, clearCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const checkWishlist = async () => {
      const favorited = await isInWishlist(product.id);
      setIsFavorite(favorited);
    };
    checkWishlist();
  }, [product.id, auth.currentUser?.uid]);

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!auth.currentUser) {
      toast.error('দয়া করে লগইন করুন');
      return;
    }

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
      if (added) toast.success('পছন্দের তালিকায় যোগ হয়েছে');
      else toast.success('তালিকা থেকে সরানো হয়েছে');
    } catch (err: any) {
      toast.error(err.message || 'একটি সমস্যা হয়েছে');
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart({
      productId: product.id,
      name: product.nameBn,
      price: product.salePrice || product.price,
      quantity: 1,
      image: product.images[0]
    });
    toast.success('কার্টে যোগ করা হয়েছে');
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    clearCart();
    addToCart({
      productId: product.id,
      name: product.nameBn,
      price: product.salePrice || product.price,
      quantity: 1,
      image: product.images[0]
    });
    navigate('/checkout');
  };

  const handleDownloadImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const response = await fetch(product.images[0]);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `glixbd-${product.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('ছবি ডাউনলোড হচ্ছে...');
    } catch (err) {
      console.error('Download error:', err);
      window.open(product.images[0], '_blank');
      toast.error('নতুন ট্যাবে ছবি ওপেন করা হলো');
    }
  };

  return (
    <NavLink 
      to={`/product/${product.id}`}
      className={cn(
        "bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col group hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300",
        compact ? "min-w-[160px] w-[160px]" : "w-full"
      )}
    >
      <div className="relative aspect-square bg-white overflow-hidden">
        <img 
          src={product.images[0]} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
        />
        {discount > 0 && (
          <div className="absolute top-3 left-3 bg-primary text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg shadow-primary/25">
            -{discount}% ছাড়
          </div>
        )}
        
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button 
            onClick={handleToggleWishlist}
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-lg",
              isFavorite ? "bg-primary text-white" : "bg-white/80 text-primary hover:bg-white"
            )}
          >
            <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
          </button>
          
          <button 
            onClick={handleDownloadImage}
            className="w-8 h-8 bg-white/80 text-text-muted rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-lg hover:bg-white hover:text-primary"
            title="Download Image"
          >
            <Download size={14} />
          </button>
        </div>

        <button 
          onClick={handleAddToCart}
          className="absolute bottom-3 right-3 w-10 h-10 bg-white/90 backdrop-blur shadow-lg rounded-full flex items-center justify-center text-primary transform translate-y-12 group-hover:translate-y-0 transition-transform duration-300 hover:bg-primary hover:text-white"
        >
          <ShoppingCart size={18} />
        </button>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-1">
          <div className="flex items-center">
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={10} fill={i <= Math.round(product.rating) ? "#facc15" : "none"} className={i <= Math.round(product.rating) ? "text-yellow-400" : "text-gray-300"} />
            ))}
          </div>
          <span className="text-[10px] text-text-muted font-bold">({product.rating})</span>
        </div>
        <h4 className={cn("font-bold text-text-main line-clamp-2 leading-tight group-hover:text-primary transition-colors", compact ? "text-xs" : "text-sm md:text-base")}>{product.nameBn}</h4>
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-primary font-black text-base">{formatPrice(product.salePrice || product.price)}</p>
            {product.salePrice && (
              <p className="text-[10px] text-text-muted line-through font-bold">{formatPrice(product.price)}</p>
            )}
          </div>
          <button 
            onClick={handleBuyNow}
            className="bg-primary text-white text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <Zap size={10} fill="currentColor" />
            অর্ডার
          </button>
        </div>
      </div>
    </NavLink>
  );
}
