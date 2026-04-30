import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, writeBatch, limit } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { Notification as NotificationType } from '@/src/types';
import { onAuthStateChanged } from 'firebase/auth';

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      const path = `users/${user.uid}/notifications`;
      const q = query(
        collection(db, 'users', user.uid, 'notifications'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as NotificationType[];
        
        // If there's a new notification, show a browser notification
        if (msgs.length > notifications.length && notifications.length > 0) {
          const latest = msgs[0];
          if (!latest.isRead) {
            // Show browser notification if permission granted
            if (Notification.permission === 'granted') {
              new Notification(latest.title, {
                body: latest.message,
                icon: '/favicon.ico'
              });
            }
          }
        }

        setNotifications(msgs);
        setUnreadCount(msgs.filter(m => !m.isRead).length);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    const user = auth.currentUser;
    if (!user) return;
    
    const path = `users/${user.uid}/notifications/${notificationId}`;
    try {
      const ref = doc(db, 'users', user.uid, 'notifications', notificationId);
      await updateDoc(ref, { isRead: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const markAllAsRead = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.isRead).forEach(n => {
        const ref = doc(db, 'users', user.uid, 'notifications', n.id);
        batch.update(ref, { isRead: true });
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/notifications/all`);
    }
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}

