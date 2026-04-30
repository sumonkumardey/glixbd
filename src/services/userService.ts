import { doc, getDoc, setDoc, serverTimestamp, increment, collection, query, where, getDocs, updateDoc, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { User } from 'firebase/auth';
import { createNotification } from './notificationService';

export const handleReferralReward = async (order: any) => {
  if (order.status !== 'delivered' || !order.userId) return;

  try {
    // 1. Get user document
    const userRef = doc(db, 'users', order.userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const referredByCode = userData.referredBy;

    if (!referredByCode || userData.referralRewardPaid) return;

    // 2. Fetch Reward Settings
    const settingsSnap = await getDoc(doc(db, 'settings', 'payment'));
    const settings = settingsSnap.exists() ? settingsSnap.data() : { 
      referralRewardAmount: 50, 
      referralMinOrderAmount: 1000 
    };

    // 3. Check if order meets criteria
    if (order.total < (settings.referralMinOrderAmount || 1000)) return;

    // 4. Find the Referrer (the person who owns the code)
    const q = query(collection(db, 'users'), where('referralCode', '==', referredByCode));
    const referrerSnap = await getDocs(q);

    if (referrerSnap.empty) return;

    const referrerDoc = referrerSnap.docs[0];
    const referrerRef = doc(db, 'users', referrerDoc.id);
    const rewardAmount = settings.referralRewardAmount || 50;

    // 5. Credit Referrer and Mark User as Rewarded
    await setDoc(referrerRef, {
      walletBalance: increment(rewardAmount),
      updatedAt: serverTimestamp()
    }, { merge: true });

    // 6. Create Transaction Log for Referrer
    await addDoc(collection(db, `users/${referrerDoc.id}/walletTransactions`), {
      userId: referrerDoc.id,
      type: 'referral_bonus',
      amount: rewardAmount,
      description: `রেফারেল বোনাস (${userData.name})`,
      referenceId: order.id,
      createdAt: serverTimestamp()
    });

    // 7. Notify Referrer
    await createNotification(referrerDoc.id, {
      title: 'রেফার বোনাস পেয়েছেন!',
      message: `${userData.name} এর অর্ডারের জন্য আপনি ৳${rewardAmount} বোনাস পেয়েছেন।`,
      type: 'system',
      isRead: false,
      link: '/profile'
    });

    await setDoc(userRef, {
      referralRewardPaid: true
    }, { merge: true });

    console.log(`Referral reward of ${rewardAmount} given to ${referrerDoc.id} for order by ${order.userId}`);

  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'referral_reward_flow');
  }
};

export const handleShoppingReward = async (order: any) => {
  if (order.status !== 'delivered' || !order.userId) return;

  try {
    // 1. Fetch Reward Settings
    const settingsSnap = await getDoc(doc(db, 'settings', 'payment'));
    const settings = settingsSnap.exists() ? settingsSnap.data() : {};

    const minAmount = settings.shoppingRewardMinAmount || 0;
    const rewardAmount = settings.shoppingRewardAmount || 0;

    if (rewardAmount <= 0 || order.total < minAmount) return;

    // 2. Check if reward already paid for this order (to avoid double payment)
    if (order.shoppingRewardPaid) return;

    // 3. Credit User
    const userRef = doc(db, 'users', order.userId);
    await setDoc(userRef, {
      walletBalance: increment(rewardAmount),
      updatedAt: serverTimestamp()
    }, { merge: true });

    // 4. Create Transaction Log for User
    await addDoc(collection(db, `users/${order.userId}/walletTransactions`), {
      userId: order.userId,
      type: 'refund', // using refund type for cashback style
      amount: rewardAmount,
      description: `শপিং ক্যাশব্যাক (#${order.orderNumber})`,
      referenceId: order.id,
      createdAt: serverTimestamp()
    });

    // 5. Mark order as rewarded
    const orderRef = doc(db, 'orders', order.id);
    await updateDoc(orderRef, {
      shoppingRewardPaid: true
    });

    // 6. Notify user
    await createNotification(order.userId, {
      title: 'শপিং রিওয়ার্ড বোনাস!',
      message: `অভিনন্দন! আপনার #${order.orderNumber} অর্ডারের জন্য আপনি ৳${rewardAmount} ক্যাশব্যাক বোনাস পেয়েছেন। আপনার ওয়ালেট চেক করুন।`,
      type: 'system',
      isRead: false,
      link: '/profile'
    });

    console.log(`Shopping reward of ${rewardAmount} given to ${order.userId} for order #${order.orderNumber}`);

  } catch (error) {
    console.error('Error in handleShoppingReward:', error);
  }
};

export const ensureUserDocument = async (user: User) => {
  if (!user) return;
  
  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Check for referral code in localStorage
      const referredByCode = localStorage.getItem('referredBy');
      
      const userData: any = {
        uid: user.uid,
        name: user.displayName || 'Unnamed User',
        email: user.email || '',
        phone: user.phoneNumber || '',
        walletBalance: 0,
        points: 50,
        referralCode: user.uid.substring(0, 8).toUpperCase(), // Simple referral code
        isBlocked: false,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp()
      };

      if (referredByCode) {
        userData.referredBy = referredByCode;
      }
      
      await setDoc(userRef, userData, { merge: true });
      localStorage.removeItem('referredBy');
    } else {
      // Ensure existing users have a referral code
      const data = userDoc.data();
      if (!data.referralCode) {
        await setDoc(userRef, { 
          referralCode: user.uid.substring(0, 8).toUpperCase(),
          lastActive: serverTimestamp() 
        }, { merge: true });
      } else {
        await setDoc(userRef, { lastActive: serverTimestamp() }, { merge: true });
      }
    }
  } catch (err: any) {
    if (err?.message?.includes('offline')) {
      console.warn("Postponing user document sync: offline");
    } else {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
};

export const isProfileComplete = async (uid: string) => {
  try {
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (!userSnap.exists()) return false;
    const data = userSnap.data();
    return !!(data.name && data.phone);
  } catch (err) {
    console.error('Error checking profile completion:', err);
    return true; // Default to true to avoid redirect loops on error
  }
};

export const updateUserProfile = async (uid: string, data: { photoURL?: string, name?: string, phone?: string, referredBy?: string }) => {
  const userRef = doc(db, 'users', uid);
  
  // Remove undefined values to prevent Firestore errors
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );

  try {
    await setDoc(userRef, {
      ...cleanData,
      uid, // Ensure UID is present if this write creates the document
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    return false;
  }
};

export const getReferralCount = async (referralCode: string) => {
  if (!referralCode) return 0;
  try {
    const q = query(collection(db, 'users'), where('referredBy', '==', referralCode));
    const snap = await getDocs(q);
    return snap.size;
  } catch (error) {
    console.error('Error fetching referral count:', error);
    return 0;
  }
};

