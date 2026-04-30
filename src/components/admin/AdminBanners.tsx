import React, { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAdmin } from '@/src/hooks/useAdmin';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Plus, Search, Edit2, Trash2, X, Save, Palette, Type, Link, Layers, Upload, Trash } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminBanners() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    tag: '',
    image: '',
    link: '#',
    bgColor: '#7c3aed',
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    if (isAdmin) {
      fetchBanners();
    }
  }, [isAdmin]);

  const fetchBanners = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'banners'), orderBy('sortOrder', 'asc'));
      const snap = await getDocs(q);
      setBanners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
      toast.error('ব্যানার লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) { // 800KB limit for Base64 in Firestore
      toast.error('ছবির সাইজ অনেক বড় (৮০০ কিলোবাইটের নিচে হতে হবে)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, image: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedImage = () => {
    setFormData({ ...formData, image: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image) {
      toast.error('দয়া করে একটি ব্যানার ইমেজ যুক্ত করুন');
      return;
    }
    setSaving(true);

    try {
      const bannerData = {
        title: formData.title,
        subtitle: formData.subtitle,
        tag: formData.tag,
        image: formData.image,
        link: formData.link,
        bgColor: formData.bgColor,
        isActive: formData.isActive,
        sortOrder: Number(formData.sortOrder),
      };

      if (editingBanner) {
        await updateDoc(doc(db, 'banners', editingBanner.id), {
          ...bannerData,
          updatedAt: serverTimestamp()
        });
        toast.success('ব্যানার আপডেট হয়েছে');
      } else {
        await addDoc(collection(db, 'banners'), {
          ...bannerData,
          createdAt: serverTimestamp()
        });
        toast.success('নতুন ব্যানার যুক্ত হয়েছে');
      }

      setShowForm(false);
      setEditingBanner(null);
      resetForm();
      fetchBanners();
    } catch (err) {
      console.error(err);
      toast.error('সেভ করতে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে আপনি এই ব্যানারটি ডিলিট করতে চান?')) {
      try {
        await deleteDoc(doc(db, 'banners', id));
        toast.success('ব্যানার ডিলিট হয়েছে');
        fetchBanners();
      } catch (err) {
        console.error(err);
        toast.error('ভুল হয়েছে');
      }
    }
  };

  const resetForm = () => {
    setFormData({
       title: '',
       subtitle: '',
       tag: '',
       image: '',
       link: '#',
       bgColor: '#7c3aed',
       isActive: true,
       sortOrder: 0,
    });
  };

  if (adminLoading || (isAdmin && loading)) return <div className="p-12 text-center font-bold text-text-muted">লোড হচ্ছে...</div>;
  if (!isAdmin) return null;

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-text-main">ব্যানার ম্যানেজমেন্ট</h1>
          <p className="text-sm text-text-muted">হোম স্ক্রিনের স্লাইডার ব্যানার সেট করুন</p>
        </div>
        <button 
          onClick={() => { resetForm(); setEditingBanner(null); setShowForm(true); }}
          className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          <Plus size={20} />
          নতুন ব্যানার
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center font-bold text-text-muted">লোড হচ্ছে...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map(banner => (
            <motion.div 
              layout
              key={banner.id}
              className={`bg-white rounded-[32px] border-2 border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all ${!banner.isActive ? 'opacity-60' : ''}`}
            >
              <div className="relative h-40 bg-gray-100">
                {banner.image ? (
                  <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ImageIcon size={40} />
                  </div>
                )}
                {/* Overlay with preview feel */}
                <div 
                  className="absolute inset-0 opacity-40" 
                  style={{ backgroundColor: banner.bgColor }}
                />
                <div className="absolute inset-0 p-6 flex items-center">
                   <div className="z-10 space-y-1">
                      <span className="bg-white text-primary text-[8px] font-black px-2 py-0.5 rounded-full uppercase">{banner.tag || 'PROMO'}</span>
                      <h3 className="text-white font-black text-lg leading-tight line-clamp-1">{banner.title || 'ব্যানার টাইটেল'}</h3>
                      <p className="text-white/80 text-[10px] font-bold line-clamp-1">{banner.subtitle || 'সাবটাইটেল এখানে'}</p>
                   </div>
                </div>
              </div>
              
              <div className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">অবস্থান: {banner.sortOrder}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: banner.bgColor }} />
                    <span className={`text-[10px] font-black uppercase ${banner.isActive ? 'text-green-600' : 'text-red-500'}`}>
                      {banner.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { 
                      setEditingBanner(banner); 
                      setFormData({
                        title: banner.title || '',
                        subtitle: banner.subtitle || '',
                        tag: banner.tag || '',
                        image: banner.image || '',
                        link: banner.link || '#',
                        bgColor: banner.bgColor || '#7c3aed',
                        isActive: banner.isActive,
                        sortOrder: banner.sortOrder || 0,
                      }); 
                      setShowForm(true); 
                    }}
                    className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(banner.id)}
                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {banners.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-100 rounded-[40px] bg-gray-50/50">
              <ImageIcon size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="font-bold text-gray-400">কোনো ব্যানার খুঁজে পাওয়া যায়নি</p>
            </div>
          )}
        </div>
      )}

      {/* Banner Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl p-8 lg:p-10 max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                    <ImageIcon />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">{editingBanner ? 'ব্যানার এডিট' : 'নতুন ব্যানার'}</h2>
                    <p className="text-xs text-text-muted font-bold">হোম স্ক্রিনের লুক আকর্ষণীয় করুন</p>
                  </div>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  {/* Image Upload Selection */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-2 block">ব্যানার ইমেজ</label>
                    
                    {formData.image ? (
                      <div className="relative group rounded-3xl overflow-hidden border-2 border-primary/20 aspect-[3/1] bg-gray-50">
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 bg-white text-primary rounded-xl hover:scale-110 transition-transform"
                          >
                            <Upload size={20} />
                          </button>
                          <button 
                            type="button" 
                            onClick={removeSelectedImage}
                            className="p-3 bg-white text-red-500 rounded-xl hover:scale-110 transition-transform"
                          >
                            <Trash size={20} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full aspect-[3/1] border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-primary/5 transition-all group"
                      >
                        <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <Upload size={24} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-black text-text-main">ছবি আপলোড করুন</p>
                          <p className="text-[10px] font-bold text-text-muted">PNG, JPG (Max 800KB)</p>
                        </div>
                      </button>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileChange}
                    />

                    <div className="relative mt-2">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-muted">
                        <Link size={14} />
                      </div>
                      <input 
                        type="text"
                        placeholder="অথবা সরাসরি ইমেজ লিংক (URL) দিন"
                        value={formData.image.startsWith('data:') ? '' : formData.image}
                        onChange={(e) => setFormData({...formData, image: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-primary pl-10 pr-6 py-3 rounded-2xl text-[11px] font-bold outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-2 mb-2 block">ব্যানার টাইটেল</label>
                      <input 
                        type="text"
                        placeholder="শীতকালীন মেগা সেল"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-6 py-4 rounded-2xl font-bold outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-2 mb-2 block">সাবটাইটেল</label>
                      <input 
                        type="text"
                        placeholder="সেরা দামে সেরা পন্য"
                        value={formData.subtitle}
                        onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-6 py-4 rounded-2xl font-bold outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-2 mb-2 block">ট্যাগ (যেমন: NEW)</label>
                      <input 
                        type="text"
                        placeholder="৫০% ছাড়"
                        value={formData.tag}
                        onChange={(e) => setFormData({...formData, tag: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-6 py-4 rounded-2xl font-bold outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-2 mb-2 block">লিংক URL</label>
                      <input 
                        type="text"
                        placeholder="/category/electronics"
                        value={formData.link}
                        onChange={(e) => setFormData({...formData, link: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-6 py-4 rounded-2xl font-bold outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-2 mb-2 block">ব্যাকগ্রাউন্ড কালার</label>
                      <div className="flex gap-2">
                        <input 
                          type="color"
                          value={formData.bgColor}
                          onChange={(e) => setFormData({...formData, bgColor: e.target.value})}
                          className="h-[52px] w-[52px] bg-gray-50 border-2 border-transparent rounded-2xl cursor-pointer"
                        />
                        <input 
                          type="text"
                          value={formData.bgColor}
                          onChange={(e) => setFormData({...formData, bgColor: e.target.value})}
                          className="flex-1 bg-gray-50 border-2 border-transparent focus:border-primary px-4 py-3 rounded-2xl font-mono text-sm leading-8 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-2 mb-2 block">সিরিয়াল নম্বর</label>
                      <input 
                        type="number"
                        placeholder="১, ২, ৩..."
                        value={formData.sortOrder}
                        onChange={(e) => setFormData({...formData, sortOrder: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-6 py-4 rounded-2xl font-bold outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                  <label className="flex items-center gap-3 cursor-pointer group flex-1">
                    <input 
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      className="w-6 h-6 rounded-lg accent-primary"
                    />
                    <span className="font-bold text-sm">হালনাগাদ হলে এটি সক্রিয় থাকবে</span>
                  </label>
                </div>

                <button 
                  type="submit"
                  disabled={saving}
                  className="w-full bg-primary text-white font-black py-5 rounded-3xl shadow-xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-all text-lg disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
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
