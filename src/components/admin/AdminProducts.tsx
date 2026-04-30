import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/src/lib/firebase';
import { useAdmin } from '@/src/hooks/useAdmin';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Search, Edit2, Trash2, X, Image as ImageIcon, Save, Upload, Loader2 } from 'lucide-react';
import { formatPrice, compressImage } from '@/src/lib/utils';

export default function AdminProducts() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    nameBn: '',
    price: '' as string | number,
    salePrice: '' as string | number,
    stock: '' as string | number,
    description: '',
    images: [] as string[],
    categoryId: '',
    isFeatured: false,
    sizes: [] as string[]
  });

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
      fetchCategories();
    }
  }, [isAdmin]);

  const fetchCategories = async () => {
    if (!isAdmin) return;
    try {
      const snap = await getDocs(collection(db, 'categories'));
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchProducts = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'products'));
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading || (isAdmin && loading)) return <div className="p-8 text-center font-bold">লোড হচ্ছে...</div>;
  if (!isAdmin) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      alert('আপনার লগইন সেশন এক্সপায়ার হয়েছে। আবার লগইন করুন।');
      return;
    }

    if (!auth.currentUser.emailVerified && auth.currentUser.email !== 'oksumondey153@gmail.com') { // Exception for the user if needed, but safer to just check verification
      console.warn("User email not verified:", auth.currentUser.email);
    }

    setUploading(true);
    setUploadStatus('প্রস্তুত হচ্ছে...');
    console.log("🚀 Starting product save process...");
    console.log("👤 User:", auth.currentUser.email, "Verified:", auth.currentUser.emailVerified);

    try {
      let finalImages = [...formData.images].filter(url => url !== '');
      
      // Process new files as Base64 strings
      if (selectedFiles.length > 0) {
        console.log(`📸 Found ${selectedFiles.length} new files to process.`);
        const newImages: string[] = [];
        
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          setUploadStatus(`প্রসেসিং: ${i + 1}/${selectedFiles.length}`);
          
          try {
            console.log(`🖼️ Processing ${file.name} (Base64 conversion)...`);
            const base64Data = await compressImage(file);
            newImages.push(base64Data);
            console.log(`✅ Processed: ${file.name}`);
          } catch (err: any) {
            console.error(`❌ Failed to process ${file.name}:`, err);
            throw new Error(`${file.name} প্রসেস করতে সমস্যা হয়েছে: ${err.message || 'অজানা সমস্যা'}`);
          }
        }
        finalImages = [...finalImages, ...newImages];
      }

      setUploadStatus('ডেটা সেভ হচ্ছে...');
      console.log("📝 Saving product data to Firestore...");
      const productData = {
        name: formData.name,
        nameBn: formData.nameBn,
        price: Number(formData.price),
        salePrice: Number(formData.salePrice),
        stock: Number(formData.stock),
        description: formData.description,
        images: finalImages,
        sizes: formData.sizes || [],
        categoryId: formData.categoryId,
        isFeatured: formData.isFeatured,
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), {
          ...productData,
          updatedAt: serverTimestamp()
        });
        console.log("✅ Product updated successfully!");
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          views: 0,
          rating: 4.5,
          reviewCount: 0,
          createdAt: serverTimestamp()
        });
        console.log("✅ Product added successfully!");
      }
      
      alert('সফলভাবে সেভ হয়েছে!');
      setShowForm(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (err: any) {
      console.error("🔥 Error in handleSubmit:", err);
      alert(err.message || 'প্রোডাক্ট সেভ করতে সমস্যা হয়েছে।');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে আপনি এই প্রোডাক্টটি ডিলিট করতে চান?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
        fetchProducts();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nameBn: '',
      price: '',
      salePrice: '',
      stock: '',
      description: '',
      images: [],
      categoryId: '',
      isFeatured: false,
      sizes: []
    });
    setSelectedFiles([]);
    setPreviewUrls([]);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.nameBn.includes(searchTerm)
  );

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-text-main">প্রোডাক্ট ম্যানেজমেন্ট</h1>
          <p className="text-sm text-text-muted">আপনার ইনভেন্টরি ম্যানেজ করুন</p>
        </div>
        <button 
          onClick={() => { resetForm(); setEditingProduct(null); setShowForm(true); }}
          className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          <Plus size={20} />
          নতুন প্রোডাক্ট
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="সার্চ করুন..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-gray-100 px-14 py-4 rounded-2xl font-bold shadow-sm focus:border-primary outline-none"
        />
      </div>

      {/* Products Table/Grid */}
      {loading ? (
        <div className="p-12 text-center font-bold">লোড হচ্ছে...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <motion.div 
              layout
              key={product.id}
              className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm flex flex-col gap-4"
            >
              <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden group">
                <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button 
                    onClick={() => { 
                      setEditingProduct(product); 
                      setFormData({
                        name: product.name || '',
                        nameBn: product.nameBn || '',
                        price: product.price || '',
                        salePrice: product.salePrice || '',
                        stock: product.stock || '',
                        description: product.description || '',
                        images: product.images || [],
                        categoryId: product.categoryId || '',
                        isFeatured: product.isFeatured || false,
                        sizes: product.sizes || []
                      }); 
                      setShowForm(true); 
                    }}
                    className="p-3 bg-white text-blue-500 rounded-xl shadow-lg hover:bg-blue-50 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(product.id)}
                    className="p-3 bg-white text-red-500 rounded-xl shadow-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm line-clamp-1">{product.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-primary font-black text-sm">{formatPrice(product.salePrice || product.price)}</span>
                  {product.salePrice > 0 && (
                    <span className="text-[10px] text-text-muted line-through">{formatPrice(product.price)}</span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${product.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    স্টক: {product.stock}
                  </span>
                  <span className="text-[10px] text-text-muted">ক্যাটাগরি: {categories.find(c => c.id === product.categoryId)?.name || 'N/A'}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Product Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl p-8 lg:p-10 max-h-[90vh] overflow-y-auto overflow-x-hidden scrollbar-hide"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black">{editingProduct ? 'প্রোডাক্ট এডিট' : 'নতুন প্রোডাক্ট'}</h2>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-2">প্রোডাক্ট নাম (EN)</label>
                    <input 
                      type="text" required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-6 py-4 rounded-2xl font-bold outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-2">প্রোডাক্ট নাম (BN)</label>
                    <input 
                      type="text" required
                      value={formData.nameBn}
                      onChange={(e) => setFormData({...formData, nameBn: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-6 py-4 rounded-2xl font-bold outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-2">ক্যাটাগরি</label>
                  <select 
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-6 py-4 rounded-2xl font-bold outline-none transition-all appearance-none"
                  >
                    <option value="">ক্যাটাগরি সিলেক্ট করুন</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name} ({cat.nameBn})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-2">মেইন প্রাইস</label>
                    <input 
                      type="number" required
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-6 py-4 rounded-2xl font-bold outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-2">সেল প্রাইস</label>
                    <input 
                      type="number"
                      value={formData.salePrice}
                      onChange={(e) => setFormData({...formData, salePrice: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-6 py-4 rounded-2xl font-bold outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-2">স্টক</label>
                    <input 
                      type="number" required
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-6 py-4 rounded-2xl font-bold outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-2">প্রোডাক্ট ইমেজ (সর্বোচ্চ ১০টি)</label>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {/* Existing Images */}
                    {formData.images.map((url, idx) => url && (
                      <div key={`existing-${idx}`} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 group">
                        <img src={url} className="w-full h-full object-cover" alt="" />
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, images: formData.images.filter((_, i) => i !== idx)})}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}

                    {/* New Previews */}
                    {previewUrls.map((url, idx) => (
                      <div key={`new-${idx}`} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-primary/20 group">
                        <img src={url} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-0 bg-primary/10" />
                        <button 
                          type="button"
                          onClick={() => {
                            setSelectedFiles(selectedFiles.filter((_, i) => i !== idx));
                            setPreviewUrls(previewUrls.filter((_, i) => i !== idx));
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}

                    {/* Upload Button */}
                    {(formData.images.length + selectedFiles.length) < 10 && (
                      <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 text-text-muted hover:text-primary">
                        <Upload size={24} />
                        <span className="text-[10px] font-black uppercase">আপলোড</span>
                        <input 
                          type="file" multiple accept="image/*" className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []) as File[];
                            const remaining = 10 - (formData.images.length + selectedFiles.length);
                            const allowed = files.slice(0, remaining);
                            
                            setSelectedFiles(prev => [...prev, ...allowed]);
                            const urls = allowed.map(file => URL.createObjectURL(file));
                            setPreviewUrls(prev => [...prev, ...urls]);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-2">বিবরণ</label>
                  <textarea 
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-6 py-4 rounded-2xl font-bold outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
                      className="w-5 h-5 accent-primary"
                    />
                    <span className="font-bold text-sm">ফিচার্ড প্রোডাক্ট হিসেবে দেখান</span>
                  </label>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-text-muted uppercase tracking-widest pl-2">উপলব্ধ সাইজসমূহ</label>
                  <div className="flex flex-wrap gap-2">
                    {formData.sizes?.map((size, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-xl font-bold">
                        <span>{size}</span>
                        <button type="button" onClick={() => setFormData({...formData, sizes: formData.sizes.filter((_, i) => i !== idx)})} className="hover:text-red-500">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      id="newSizeInput"
                      placeholder="যেমন: M, XL, 42"
                      className="flex-1 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim();
                          if (val) {
                            setFormData({...formData, sizes: [...(formData.sizes || []), val]});
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('newSizeInput') as HTMLInputElement;
                        const val = input.value.trim();
                        if (val) {
                          setFormData({...formData, sizes: [...(formData.sizes || []), val]});
                          input.value = '';
                        }
                      }}
                      className="bg-primary text-white p-2 rounded-xl hover:bg-black transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-primary text-white font-black py-5 rounded-3xl shadow-xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-all text-lg disabled:opacity-50 disabled:scale-100"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={24} className="animate-spin" />
                      {uploadStatus || 'আপলোড হচ্ছে...'}
                    </>
                  ) : (
                    <>
                      <Save size={24} />
                      সেভ করুন
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
