import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { Notification } from '@/src/types';

export const createNotification = async (userId: string, data: Omit<Notification, 'id' | 'createdAt' | 'isRead'> & { isRead?: boolean }) => {
  const path = `users/${userId}/notifications`;
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    await addDoc(notificationsRef, {
      ...data,
      isRead: data.isRead ?? false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const createAdminNotification = async (data: Omit<Notification, 'id' | 'createdAt' | 'isRead'> & { isRead?: boolean }) => {
  const path = 'admins';
  try {
    // Get all admin users
    const adminsSnap = await getDocs(collection(db, 'admins'));
    const adminIds = adminsSnap.docs.map(doc => doc.id);
    
    // Create notification for each admin
    const promises = adminIds.map(adminId => createNotification(adminId, data));
    await Promise.all(promises);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
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
