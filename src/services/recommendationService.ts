import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment, collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { sanitizeForFirestore } from '../lib/utils';

export const trackCategoryInteraction = async (categoryId: string, weight: number = 1) => {
  const user = auth.currentUser;
  if (!user || !categoryId) return;

  const path = `users/${user.uid}/categoryViews/${categoryId}`;
  const viewRef = doc(db, path);
  
  try {
    const docSnap = await getDoc(viewRef);
    if (docSnap.exists()) {
      await updateDoc(viewRef, sanitizeForFirestore({
        viewCount: increment(weight),
        lastViewedAt: Timestamp.now()
      }));
    } else {
      await setDoc(viewRef, sanitizeForFirestore({
        categoryId,
        viewCount: weight,
        lastViewedAt: Timestamp.now()
      }));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const trackCategoryView = (categoryId: string) => trackCategoryInteraction(categoryId, 1);

export const getUserPreferredCategories = async (): Promise<string[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  const path = `users/${user.uid}/categoryViews`;
  try {
    const q = query(
      collection(db, path),
      orderBy('viewCount', 'desc'),
      orderBy('lastViewedAt', 'desc'),
      limit(10)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data().categoryId);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};
