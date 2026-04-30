import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

const CATEGORIES = [
  { id: 'clothing', name: 'Clothing', nameBn: 'পোশাক', icon: 'https://cdn-icons-png.flaticon.com/512/3534/3534312.png' },
  { id: 'electronics', name: 'Electronics', nameBn: 'ইলেকট্রনিক্স', icon: 'https://cdn-icons-png.flaticon.com/512/3659/3659899.png' },
  { id: 'food', name: 'Food', nameBn: 'খাদ্য', icon: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png' },
  { id: 'beauty', name: 'Beauty', nameBn: 'সৌন্দর্য', icon: 'https://cdn-icons-png.flaticon.com/512/3163/3163206.png' },
  { id: 'home', name: 'Home', nameBn: 'গৃহস্থালি', icon: 'https://cdn-icons-png.flaticon.com/512/2544/2544131.png' },
  { id: 'toys', name: 'Toys', nameBn: 'খেলনা', icon: 'https://cdn-icons-png.flaticon.com/512/3082/3082060.png' },
];

const PRODUCTS = [
  {
    id: 'p1',
    categoryId: 'clothing',
    name: 'Men’s Premium Panjabi',
    nameBn: 'ছেলেদের প্রিমিয়াম পাঞ্জাবী',
    description: 'Cotton silk blended premium panjabi for festivals.',
    price: 2500,
    salePrice: 1999,
    stock: 50,
    sku: 'PAN-001',
    images: ['https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&q=80&w=400'],
    rating: 4.8,
    reviewCount: 125,
    isFeatured: true,
    isFlashSale: true,
  },
  {
    id: 'p2',
    categoryId: 'electronics',
    name: 'Wireless Earbuds',
    nameBn: 'ওয়্যারলেস ইয়ারবাডস',
    description: 'High quality sound with noise cancellation.',
    price: 3500,
    salePrice: 2800,
    stock: 30,
    sku: 'EAR-99',
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=400'],
    rating: 4.5,
    reviewCount: 88,
    isFeatured: true,
  },
  {
    id: 'p3',
    categoryId: 'beauty',
    name: 'Natural Face Wash',
    nameBn: 'ন্যাচারাল ফেস ওয়াশ',
    description: 'Organic ingredients for glowing skin.',
    price: 850,
    salePrice: 750,
    stock: 100,
    sku: 'BEA-01',
    images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=400'],
    rating: 4.9,
    reviewCount: 450,
    isFeatured: true,
    isFlashSale: true,
  },
  {
    id: 'p4',
    categoryId: 'food',
    name: 'Premium Honey (500g)',
    nameBn: 'প্রিমিয়াম মধু (৫০০ গ্রাম)',
    description: 'Pure sundarban honey.',
    price: 1200,
    salePrice: 950,
    stock: 20,
    sku: 'FOOD-H1',
    images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=400'],
    rating: 4.7,
    reviewCount: 200,
    isFeatured: true,
  }
];

export async function seedDatabase() {
  const batch = writeBatch(db);

  CATEGORIES.forEach(cat => {
    const ref = doc(db, 'categories', cat.id);
    batch.set(ref, { name: cat.name, nameBn: cat.nameBn, icon: cat.icon });
  });

  PRODUCTS.forEach(prod => {
    const ref = doc(db, 'products', prod.id);
    batch.set(ref, {
      ...prod,
      createdAt: new Date().toISOString()
    });
  });

  await batch.commit();
  console.log('Database seeded!');
}
