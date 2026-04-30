import { getToken, onMessage } from 'firebase/messaging';
import { messaging, auth, db } from '../lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export const requestNotificationPermission = async () => {
  try {
    // Check if we are in an iframe
    if (window.self !== window.top) {
      toast.error('সিকিউরিটি কারণে এটি একটি নতুন ট্যাবে খুলুন (Open in new tab)', { duration: 6000 });
      return null;
    }

    if (!('Notification' in window)) {
      toast.error('এই ব্রাউজার নোটিফিকেশন সাপোর্ট করে না');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'denied') {
      toast.error('আপনি নোটিফিকেশন ব্লক করেছেন। ব্রাউজার সেটিংস থেকে এটি এলাউ করুন।');
      return null;
    }

    if (permission === 'granted') {
      const msg = await messaging();
      if (!msg) return null;

      // Register explicitly to ensure getToken finds it
      const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

      const token = await getToken(msg, {
        serviceWorkerRegistration: swRegistration,
        vapidKey: 'BMD-gZz60pS1M_oH_u9iFm1lXp_t-Y_z5_0-5_0-5_0-5_0-5_0-5_0-5_0-5_0'
      });

      if (token && auth.currentUser) {
        // Save token to user document
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(token)
        });
        return token;
      }
    }
    return null;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    toast.error('একটি কারিগরি সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    return null;
  }
};

export const initializeForegroundMessaging = async () => {
  const msg = await messaging();
  if (!msg) return;

  onMessage(msg, (payload) => {
    console.log('Message received. ', payload);
    // Show a custom toast or browser notification
    if (payload.notification) {
      toast.success(`${payload.notification.title}: ${payload.notification.body}`, {
        duration: 5000,
        position: 'top-right',
      });

      // Browser notification
      new Notification(payload.notification.title || 'Notification', {
        body: payload.notification.body,
        icon: '/favicon.ico'
      });
    }
  });
};
