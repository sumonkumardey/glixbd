import React, { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAdmin } from '@/src/hooks/useAdmin';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Plus, Search, Edit2, Trash2, X, Save, Upload, Type, Hash, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { compressImage } from '@/src/lib/utils';

export default function AdminCategories() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    nameBn: '',
    icon: 'Package',
    image: '',
    sortOrder: 0,
    parentId: '',
  });

  useEffect(() => {
    if (isAdmin) {
      fetchCategories();
    }
  }, [isAdmin]);

  const fetchCategories = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'categories'), orderBy('sortOrder', 'asc'));
      const snap = await getDocs(q);
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
      toast.error('ক্যাটাগরি লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await compressImage(file);
      setFormData({ ...formData, image: base64 });
    } catch (err) {
      toast.error('ছবি প্রসেস করতে সমস্যা হয়েছে');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const categoryData = {
        name: formData.name,
        nameBn: formData.nameBn,
        icon: formData.icon,
        image: formData.image,
        sortOrder: Number(formData.sortOrder),
        parentId: formData.parentId || null,
      };

      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), {
          ...categoryData,
          updatedAt: serverTimestamp()
        });
        toast.success('ক্যাটাগরি আপডেট হয়েছে');
      } else {
        await addDoc(collection(db, 'categories'), {
          ...categoryData,
          createdAt: serverTimestamp()
        });
        toast.success('নতুন ক্যাটাগরি তৈরি হয়েছে');
      }

      setShowForm(false);
      setEditingCategory(null);
      resetForm();
      fetchCategories();
    } catch (err) {
      console.error(err);
      toast.error('সেভ করতে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে আপনি এই ক্যাটাগরিটি ডিলিট করতে চান?')) {
      try {
        await deleteDoc(doc(db, 'categories', id));
        toast.success('ক্যাটাগরি ডিলিট হয়েছে');
        fetchCategories();
      } catch (err) {
        console.error(err);
        toast.error('ভুল হয়েছে');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nameBn: '',
      icon: 'Package',
      image: '',
      sortOrder: 0,
      parentId: '',
    });
  };

  if (adminLoading || (isAdmin && loading)) return <div className="p-12 text-center font-bold text-text-muted">লোড হচ্ছে...</div>;
  if (!isAdmin) return null;

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.nameBn.includes(searchTerm)
  );

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-text-main">ক্যাটাগরি ম্যানেজমেন্ট</h1>
          <p className="text-sm text-text-muted">আপনার শপের ক্যাটাগরিগুলো গুছিয়ে রাখুন</p>
        </div>
        <button 
          onClick={() => { resetForm(); setEditingCategory(null); setShowForm(true); }}
          className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          <Plus size={20} />
          নতুন ক্যাটাগরি
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

      {loading ? (
        <div className="p-12 text-center font-bold text-text-muted">লোড হচ্ছে...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map(category => (
            <motion.div 
              layout
              key={category.id}
              className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                  {category.image ? (
                    <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                  ) : (
                    <Layers className="text-gray-300" size={32} />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-lg text-text-main leading-tight">{category.name}</h3>
                  <p className="text-sm font-bold text-text-muted">{category.nameBn}</p>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">ORDER: {category.sortOrder}</p>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { 
                    setEditingCategory(category); 
                    setFormData({
                      name: category.name,
                      nameBn: category.nameBn,
                      icon: category.icon || 'Package',
                      image: category.image || '',
                      sortOrder: category.sortOrder || 0,
                      parentId: category.parentId || '',
                    }); 
                    setShowForm(true); 
                  }}
                  className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(category.id)}
                  className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
          {filteredCategories.length === 0 && (
            <div className="col-span-full py-20 text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-100">
               <Layers size={48} className="mx-auto text-gray-200 mb-4" />
               <p className="font-bold text-gray-400">কোনো ক্যাটাগরি খুঁজে পাওয়া যায়নি</p>
            </div>
          )}
        </div>
      )}

      {/* Category Form Modal */}
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
              className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl p-8 lg:p-10 max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                    <Layers />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">{editingCategory ? 'ক্যাটাগরি এডিট' : 'নতুন ক্যাটাগরি'}</h2>
                    <p className="text-xs text-text-muted font-bold">ডিটেইলস পূরণ করুন</p>
                  </div>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-2">নাম (English)</label>
                    <div className="relative">
                      <Type size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" required
                        placeholder="Electronics"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-primary pl-12 pr-6 py-4 rounded-2xl font-bold outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-2">নাম (বাংলা)</label>
                    <input 
                      type="text" required
                      placeholder="ইলেকট্রনিক্স"
                      value={formData.nameBn}
                      onChange={(e) => setFormData({...formData, nameBn: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-6 py-4 rounded-2xl font-bold outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-2">সরটিং অর্ডার</label>
                      <div className="relative">
                        <Hash size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="number" required
                          value={formData.sortOrder}
                          onChange={(e) => setFormData({...formData, sortOrder: e.target.value})}
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-primary pl-12 pr-6 py-4 rounded-2xl font-bold outline-none transition-all"
                        />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-2">প্যারেন্ট ক্যাটাগরি</label>
                      <select 
                        value={formData.parentId}
                        onChange={(e) => setFormData({...formData, parentId: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-6 py-4 rounded-2xl font-bold outline-none transition-all appearance-none"
                      >
                         <option value="">None (Top Level)</option>
                         {categories.filter(c => c.id !== editingCategory?.id).map(c => (
                           <option key={c.id} value={c.id}>{c.name}</option>
                         ))}
                      </select>
                   </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-2">ক্যাটাগরি ইমেজ</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square w-32 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all overflow-hidden relative group"
                  >
                     {formData.image ? (
                       <>
                         <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Upload size={20} className="text-white" />
                         </div>
                       </>
                     ) : (
                       <>
                         <ImageIcon size={24} className="text-gray-300" />
                         <span className="text-[8px] font-black uppercase text-gray-400">Upload</span>
                       </>
                     )}
                     <input 
                       type="file" ref={fileInputRef} className="hidden" 
                       accept="image/*" onChange={handleFileChange}
                     />
                  </div>
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
