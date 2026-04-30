import { doc, setDoc, deleteDoc, getDoc, collection, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

export const toggleWishlist = async (productId: string, productData: any) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Please login to add items to wishlist');
  }

  const wishlistRef = doc(db, 'users', user.uid, 'wishlist', productId);
  const path = `users/${user.uid}/wishlist/${productId}`;

  try {
    const snap = await getDoc(wishlistRef);
    if (snap.exists()) {
      await deleteDoc(wishlistRef);
      return false; // Removed
    } else {
      await setDoc(wishlistRef, {
        ...productData,
        addedAt: serverTimestamp()
      });
      return true; // Added
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
};

export const isInWishlist = async (productId: string) => {
  const user = auth.currentUser;
  if (!user) return false;

  const wishlistRef = doc(db, 'users', user.uid, 'wishlist', productId);
  try {
    const snap = await getDoc(wishlistRef);
    return snap.exists();
  } catch (err) {
    return false;
  }
};

export const subscribeToWishlist = (callback: (items: any[]) => void) => {
  const user = auth.currentUser;
  if (!user) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, 'users', user.uid, 'wishlist'),
    orderBy('addedAt', 'desc')
  );

  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/wishlist`);
  });
};
