import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface FraudStats {
  totalOrders: number;
  deliveredCount: number;
  cancelledCount: number;
  successRate: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export const checkCustomerFraud = async (phone: string): Promise<FraudStats> => {
  if (!phone) {
    return {
      totalOrders: 0,
      deliveredCount: 0,
      cancelledCount: 0,
      successRate: 100,
      riskLevel: 'low'
    };
  }

  try {
    const q = query(collection(db, 'orders'), where('shippingAddress.phone', '==', phone));
    const snap = await getDocs(q);
    
    let total = 0;
    let delivered = 0;
    let cancelled = 0;

    snap.docs.forEach(doc => {
      const data = doc.data();
      total++;
      if (data.status === 'delivered') delivered++;
      if (data.status === 'cancelled') cancelled++;
    });

    const successRate = total > 0 ? (delivered / (delivered + cancelled || 1)) * 100 : 100;
    
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (cancelled > 2 && successRate < 50) {
      riskLevel = 'high';
    } else if (cancelled > 1 || successRate < 80) {
      riskLevel = 'medium';
    }

    return {
      totalOrders: total,
      deliveredCount: delivered,
      cancelledCount: cancelled,
      successRate,
      riskLevel
    };
  } catch (err) {
    console.error('Fraud check failed:', err);
    return {
      totalOrders: 0,
      deliveredCount: 0,
      cancelledCount: 0,
      successRate: 100,
      riskLevel: 'low'
    };
  }
};
