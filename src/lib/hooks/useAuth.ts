import { useAuth as useFirebaseAuth } from '@/components/auth/AuthProvider';
import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User } from 'firebase/auth';

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isGlobalAdmin: boolean;
  isInvited: boolean;
  householdId: string | null;
}

export function useAuth(): UseAuthReturn {
  const { user, loading: authLoading } = useFirebaseAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [isInvited, setIsInvited] = useState(false);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: () => void;

    if (user) {
      unsubscribe = onSnapshot(doc(db, 'users', user.uid), (userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data();
          setIsAdmin(data.role === 'admin');
          setIsGlobalAdmin(!!data.isGlobalAdmin || user.email === 'ethankpetersen@gmail.com');
          setIsInvited(!!data.isInvited);
          setHouseholdId(data.householdId || null);
        } else {
          setIsAdmin(false);
          setIsGlobalAdmin(false);
          setIsInvited(false);
          setHouseholdId(null);
        }
        setLoading(false);
      }, (error) => {
        console.error('Error fetching user data:', error);
        setLoading(false);
      });
    } else {
      setIsAdmin(false);
      setIsGlobalAdmin(false);
      setIsInvited(false);
      setHouseholdId(null);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  return React.useMemo(() => ({
    user,
    loading: authLoading || loading,
    isAdmin,
    isGlobalAdmin,
    isInvited,
    householdId,
  }), [user, authLoading, loading, isAdmin, isGlobalAdmin, isInvited, householdId]);
}
