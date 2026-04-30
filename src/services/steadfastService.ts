import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Steadfast Courier API Integration
 */
export async function createSteadfastOrder(order: any) {
  try {
    // 1. Get Settings
    const settingsSnap = await getDoc(doc(db, 'settings', 'payment'));
    if (!settingsSnap.exists()) {
      throw new Error('কুরিয়ার সেটিংস পাওয়া যায়নি। দয়া করে সেটিংস থেকে API কী সেট করুন।');
    }
    
    const { steadfastApiKey, steadfastSecretKey } = settingsSnap.data();
    
    console.log('Steadfast Keys Check:', { 
      hasApiKey: !!steadfastApiKey, 
      hasSecretKey: !!steadfastSecretKey,
      apiKeyPrefix: steadfastApiKey ? steadfastApiKey.substring(0, 5) + '...' : 'none'
    });

    if (!steadfastApiKey || !steadfastSecretKey) {
      throw new Error('Steadfast API Key অথবা Secret Key সেট করা নেই।');
    }

    // 2. Prepare Data
    const payload = {
      invoice: order.orderNumber,
      recipient_name: order.shippingAddress.fullName,
      recipient_phone: order.shippingAddress.phone,
      recipient_address: `${order.shippingAddress.address}, ${order.shippingAddress.thana}, ${order.shippingAddress.district}`,
      cod_amount: order.paymentMethod === 'cod' ? order.total : 0, // Only collect if COD
      note: `Items: ${order.items.map((i: any) => `${i.name} (${i.quantity}pcs)`).join(', ')}`
    };

    // 3. Make API Call via Backend Proxy to bypass CORS
    const response = await fetch('/api/courier/steadfast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey: steadfastApiKey,
        secretKey: steadfastSecretKey,
        payload
      })
    });

    const result = await response.json();

    if (response.ok && result.status === 200) {
      return {
        success: true,
        consignment_id: result.consignment_id,
        tracking_code: result.tracking_code,
        message: 'Steadfast-এ সফলভাবে পার্সেল রিকোয়েস্ট পাঠানো হয়েছে'
      };
    } else {
      const errorMessage = result.message || 
                         (result.errors && typeof result.errors === 'object' ? Object.values(result.errors).flat().join(', ') : null) || 
                         result.errors?.join?.(', ') || 
                         'Steadfast API error';
      throw new Error(errorMessage);
    }
  } catch (error: any) {
    console.error('Steadfast API Error:', error);
    throw new Error(error.message || 'কুরিয়ার রিকোয়েস্ট পাঠাতে ব্যর্থ হয়েছে');
  }
}
