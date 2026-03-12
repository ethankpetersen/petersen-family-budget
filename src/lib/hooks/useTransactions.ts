import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, QueryConstraint, limit, startAfter, QueryDocumentSnapshot, DocumentData, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { Transaction } from '@/types/transaction';

export type SortField = 'date' | 'amount' | 'description';
export type SortDirection = 'asc' | 'desc';

interface UseTransactionsOptions {
  filters?: {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    searchTerm?: string;
  };
  sort?: {
    field: SortField;
    direction: SortDirection;
  };
  limitCount?: number;
}

export const useTransactions = (options: UseTransactionsOptions = {}) => {
  const { householdId, user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Use a local limit state for "load more"
  const [limitCount, setLimitCount] = useState(options.limitCount || 20);
  const [hasMore, setHasMore] = useState(true);

  // Memoize filters and sort to stabilize the listener
  const filtersJson = JSON.stringify(options.filters);
  const sortJson = JSON.stringify(options.sort);

  useEffect(() => {
    if (!householdId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const constraints: QueryConstraint[] = [where('householdId', '==', householdId)];

    // Apply Filters
    const filters = options.filters || {};
    if (filters.startDate) constraints.push(where('date', '>=', filters.startDate));
    if (filters.endDate) constraints.push(where('date', '<=', filters.endDate));
    if (filters.categoryId) constraints.push(where('categoryId', '==', filters.categoryId));

    // Sorting
    const field = options.sort?.field || 'date';
    const direction = options.sort?.direction || 'desc';
    constraints.push(orderBy(field, direction));

    // Limit (the window size)
    constraints.push(limit(limitCount));

    const q = query(collection(db, 'transactions'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newTransactions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Transaction[];

        // Client-side search (Firestore doesn't support partial match well)
        let processed = newTransactions;
        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          processed = newTransactions.filter(
            (t) =>
              t.description.toLowerCase().includes(term) ||
              t.payee.toLowerCase().includes(term)
          );
        }

        setTransactions(processed);
        setHasMore(snapshot.docs.length === limitCount);
        setLoading(false);
      },
      (err) => {
        console.error("useTransactions error:", err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [householdId, filtersJson, sortJson, limitCount]);

  const loadMore = () => {
    if (hasMore && !loading) {
      setLimitCount((prev) => prev + (options.limitCount || 20));
    }
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'householdId' | 'createdAt' | 'updatedAt'>) => {
    if (!householdId) throw new Error("No household ID");
    
    const cleanData = Object.fromEntries(
      Object.entries(transactionData).filter(([_, v]) => v !== undefined)
    );

    const docData = {
      ...cleanData,
      householdId,
      createdBy: user?.uid,
      createdByName: user?.displayName || user?.email || 'Unknown',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const docRef = await addDoc(collection(db, 'transactions'), docData);
    return docRef.id;
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const docRef = doc(db, 'transactions', id);
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await updateDoc(docRef, { ...cleanUpdates, updatedAt: Date.now() });
  };

  const deleteTransaction = async (id: string) => {
    await deleteDoc(doc(db, 'transactions', id));
  };

  return {
    transactions,
    loading,
    error,
    hasMore,
    loadMore,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
};
