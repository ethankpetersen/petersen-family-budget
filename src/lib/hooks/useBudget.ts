import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { subscribeToCollection, subscribeToDocument, updateDocument, addDocument } from '../firebase/firestore';
import { BudgetPeriod, BudgetItem } from '@/types/budget';
import { where, doc, getDoc, setDoc, collection, query, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';

export function useBudget(year: number, month: number) {
  const { householdId } = useAuth();
  const [period, setPeriod] = useState<BudgetPeriod | null>(null);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [actuals, setActuals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const periodId = `${year}-${month.toString().padStart(2, '0')}`;
  
  // 1. Listen to Period & Items
  useEffect(() => {
    if (!householdId) {
      setPeriod(null);
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const docId = `${householdId}_${periodId}`;
    
    const unsubscribePeriod = subscribeToDocument<BudgetPeriod>(
      'budgetPeriods',
      docId,
      (data) => setPeriod(data)
    );

    const unsubscribeItems = subscribeToCollection<BudgetItem>(
      'budgetItems',
      (data) => {
        const itemsWithDollars = data.map(item => ({
          ...item,
          amount: (item.amount || 0) / 100
        }));
        setItems(itemsWithDollars);
        setLoading(false);
      },
      [where('householdId', '==', householdId), where('periodId', '==', docId)]
    ) as unknown as () => void;
    
    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    const unsubscribeTransactions = subscribeToCollection<any>(
      'transactions',
      (data) => {
        const newActuals: Record<string, number> = {};
        for (const tx of data) {
          if (tx.isSplit && tx.splits) {
            for (const split of tx.splits) {
              if (split.categoryId) {
                const splitAmt = tx.type === 'expense' ? -Math.abs(split.amount || 0) : Math.abs(split.amount || 0);
                newActuals[split.categoryId] = (newActuals[split.categoryId] || 0) + (splitAmt / 100);
              }
            }
          } else if (tx.categoryId) {
            newActuals[tx.categoryId] = (newActuals[tx.categoryId] || 0) + ((tx.amount || 0) / 100);
          }
        }
        setActuals(newActuals);
      },
      [
        where('householdId', '==', householdId),
        where('date', '>=', startOfMonth),
        where('date', '<=', endOfMonth)
      ]
    ) as unknown as () => void;

    return () => {
      if (typeof unsubscribePeriod === 'function') unsubscribePeriod();
      if (typeof unsubscribeItems === 'function') unsubscribeItems();
      if (typeof unsubscribeTransactions === 'function') unsubscribeTransactions();
    };
  }, [householdId, periodId, year, month]);

  const ensurePeriodExists = useCallback(async () => {
    if (!householdId) return null;
    const docId = `${householdId}_${periodId}`;
    const periodRef = doc(db, 'budgetPeriods', docId);
    const snap = await getDoc(periodRef);
    if (!snap.exists()) {
      const newPeriod: BudgetPeriod = {
        id: docId,
        householdId,
        month,
        year,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await setDoc(periodRef, newPeriod);
      return docId;
    }
    return docId;
  }, [householdId, periodId, month, year]);

  const updateBudgetItem = useCallback(async (categoryId: string, amount: number) => {
    if (!householdId) return;
    const docId = `${householdId}_${periodId}`;
    await ensurePeriodExists();
    const itemId = `${docId}_${categoryId}`;
    const amountInCents = Math.round(amount * 100);
    const existing = items.find(i => i.categoryId === categoryId);
    
    if (existing) {
      await updateDocument('budgetItems', itemId, { amount: amountInCents, updatedAt: Date.now() });
    } else {
      const newItem: BudgetItem = {
        id: itemId, householdId, periodId: docId, categoryId,
        amount: amountInCents, createdAt: Date.now(), updatedAt: Date.now(),
      };
      await setDoc(doc(db, 'budgetItems', itemId), newItem);
    }
  }, [householdId, periodId, items, ensurePeriodExists]);

  const copyFromLastMonth = useCallback(async (prevYear: number, prevMonth: number) => {
    if (!householdId) return false;
    const thisDocId = await ensurePeriodExists();
    if (!thisDocId) return false;
    const prevDocId = `${householdId}_${prevYear}-${prevMonth.toString().padStart(2, '0')}`;
    
    const q = query(collection(db, 'budgetItems'), where('periodId', '==', prevDocId));
    try {
      const snap = await getDocs(q);
      if (snap.empty) return false;
      const promises = snap.docs.map(d => {
        const prev = d.data();
        const itemId = `${thisDocId}_${prev.categoryId}`;
        return setDoc(doc(db, 'budgetItems', itemId), {
          id: itemId, householdId, periodId: thisDocId, categoryId: prev.categoryId,
          amount: prev.amount, createdAt: Date.now(), updatedAt: Date.now()
        });
      });
      await Promise.all(promises);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }, [householdId, periodId, ensurePeriodExists]);

  const clearMonth = useCallback(async () => {
    if (!householdId) return false;
    const docId = `${householdId}_${periodId}`;
    const q = query(collection(db, 'budgetItems'), where('periodId', '==', docId));
    try {
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      batch.delete(doc(db, 'budgetPeriods', docId));
      await batch.commit();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }, [householdId, periodId]);

  return React.useMemo(() => ({
    period, items, actuals, loading,
    updateBudgetItem, copyFromLastMonth, clearMonth
  }), [period, items, actuals, loading, updateBudgetItem, copyFromLastMonth, clearMonth]);
}
