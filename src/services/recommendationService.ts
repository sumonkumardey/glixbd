import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment, collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

export const trackCategoryView = async (categoryId: string) => {
  const user = auth.currentUser;
  if (!user || !categoryId) return;

  const path = `users/${user.uid}/categoryViews/${categoryId}`;
  const viewRef = doc(db, path);
  
  try {
    const docSnap = await getDoc(viewRef);
    if (docSnap.exists()) {
      await updateDoc(viewRef, {
        viewCount: increment(1),
        lastViewedAt: Timestamp.now()
      });
    } else {
      await setDoc(viewRef, {
        categoryId,
        viewCount: 1,
        lastViewedAt: Timestamp.now()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getUserPreferredCategories = async (): Promise<string[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  const path = `users/${user.uid}/categoryViews`;
  try {
    const q = query(
      collection(db, path),
      orderBy('viewCount', 'desc'),
      limit(5)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data().categoryId);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};
