import { useState, useEffect } from 'react';
import { db, auth } from '@/src/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const ADMIN_EMAILS = [
  'oksumondey153@gmail.com'.toLowerCase(),
  'sumonkumardey23@gmail.com'.toLowerCase()
];

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userEmail = user.email?.toLowerCase();
          const adminRef = doc(db, 'admins', user.uid);
          
          const adminDoc = await getDoc(adminRef);
          
          if (adminDoc.exists()) {
            setIsAdmin(true);
          } else if (userEmail && ADMIN_EMAILS.includes(userEmail)) {
            // Self-promotion for the hardcoded owners
            try {
              await setDoc(adminRef, {
                email: user.email,
                createdAt: serverTimestamp(),
                isSuperAdmin: true
              });
              setIsAdmin(true);
            } catch (promoteErr) {
              setIsAdmin(true); 
            }
          } else if (userEmail) {
            // Check dynamic admin list
            const emailDocRef = doc(db, 'admin_emails', userEmail);
            const emailDoc = await getDoc(emailDocRef);
            if (emailDoc.exists()) {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          } else {
            setIsAdmin(false);
          }
        } catch (err) {
          console.error('Admin check failed:', err);
          const userEmail = user.email?.toLowerCase();
          if (userEmail && ADMIN_EMAILS.includes(userEmail)) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return { isAdmin, loading };
}
