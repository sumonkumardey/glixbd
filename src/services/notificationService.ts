import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { Notification } from '@/src/types';
import { sanitizeForFirestore } from '@/src/lib/utils';

export const createNotification = async (userId: string, data: Omit<Notification, 'id' | 'createdAt' | 'isRead'> & { isRead?: boolean }) => {
  const path = `users/${userId}/notifications`;
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    await addDoc(notificationsRef, sanitizeForFirestore({
      ...data,
      isRead: data.isRead ?? false,
      createdAt: serverTimestamp(),
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const createAdminNotification = async (data: Omit<Notification, 'id' | 'createdAt' | 'isRead'> & { isRead?: boolean }) => {
  const path = 'admin_notifications';
  try {
    // Write to a central admin notifications collection
    // This allows guests/users to notify admins without needing to list administrative users
    const adminNotifRef = collection(db, 'admin_notifications');
    await addDoc(adminNotifRef, sanitizeForFirestore({
      ...data,
      isRead: data.isRead ?? false,
      createdAt: serverTimestamp(),
    }));

    // Optionally still try to send direct notifications if possible
    try {
      const adminsSnap = await getDocs(collection(db, 'admins'));
      if (!adminsSnap.empty) {
        const adminIds = adminsSnap.docs.map(doc => doc.id);
        const promises = adminIds.map(adminId => createNotification(adminId, data));
        await Promise.all(promises);
      }
    } catch (err) {
      // Silent fail for direct notifications - we already have the central record
      console.warn("Direct admin notification failed (intended behavior for non-admins):", err);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const broadcastNotification = async (data: Omit<Notification, 'id' | 'createdAt' | 'isRead'> & { isRead?: boolean }) => {
  const path = 'users';
  console.log("📢 [Broadcast] Starting broadcast...");
  try {
    // Get all users
    const usersSnap = await getDocs(collection(db, 'users'));
    const userIds = usersSnap.docs.map(doc => doc.id);
    
    console.log(`📢 [Broadcast] Found ${userIds.length} users:`, userIds);

    if (userIds.length === 0) {
      console.warn("📢 [Broadcast] No users found in 'users' collection.");
      throw new Error("No users found to notify. Please ensure users have logged in at least once.");
    }
    
    // Create notification for each user
    const promises = userIds.map(userId => {
      console.log(`📢 [Broadcast] Sending to user: ${userId}`);
      return createNotification(userId, data);
    });
    
    await Promise.all(promises);
    console.log("📢 [Broadcast] All notifications sent successfully.");
  } catch (err) {
    console.error("📢 [Broadcast] Failed:", err);
    handleFirestoreError(err, OperationType.LIST, path);
  }
};
