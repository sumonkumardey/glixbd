export interface Category {
  id: string;
  name: string;
  nameBn: string;
  icon: string;
  image?: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  nameBn: string;
  description: string;
  price: number;
  salePrice?: number;
  stock: number;
  sku: string;
  images: string[];
  sizes?: string[];
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  isFlashSale?: boolean;
  flashSaleEnds?: string;
  views?: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  email?: string;
  division?: string;
  district?: string;
  upazila?: string;
  walletBalance: number;
  points: number;
  isBlocked?: boolean;
  createdAt?: any;
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PACKAGING = 'packaging',
  SHIPPED = 'shipped',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned'
}

export const OrderStatusLabels: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'অপেক্ষমাণ',
  [OrderStatus.CONFIRMED]: 'নিশ্চিত করা হয়েছে',
  [OrderStatus.PACKAGING]: 'প্যাকেজিং চলছে',
  [OrderStatus.SHIPPED]: 'শিপিং করা হয়েছে',
  [OrderStatus.OUT_FOR_DELIVERY]: 'ডেলিভারি চলছে',
  [OrderStatus.DELIVERED]: 'ডেলিভারি সম্পন্ন',
  [OrderStatus.CANCELLED]: 'বাতিল করা হয়েছে',
  [OrderStatus.RETURNED]: 'রিটার্ন করা হয়েছে'
};

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  total: number;
  status: OrderStatus;
  createdAt: any;
  items: OrderItem[];
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
  size?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'promotion' | 'system' | 'wallet';
  isRead: boolean;
  createdAt: any;
  link?: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  images?: string[];
  likesCount?: number;
  reply?: string;
  createdAt: any;
}

export interface TrackingEvent {
  id: string;
  status: OrderStatus;
  statusBn: string;
  message: string;
  messageBn: string;
  location?: string;
  createdAt: any;
}
