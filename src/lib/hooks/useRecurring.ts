import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { RecurringRule } from '@/types/recurring';
import { Transaction } from '@/types/transaction';
import { getCurrentDateString, addDays, addMonths } from '@/lib/utils/date';

export const calculateNextScheduledDate = (rule: Partial<RecurringRule>, fromDate: string): string => {
  let nextDate = fromDate;
  if (rule.frequency === 'weekly') {
    nextDate = addDays(nextDate, 7);
  } else if (rule.frequency === 'biweekly') {
    nextDate = addDays(nextDate, 14);
  } else if (rule.frequency === 'monthly') {
    // If dayOfMonth is provided, use it, otherwise keep the day of fromDate
    nextDate = addMonths(nextDate, 1, rule.dayOfMonth || parseInt(fromDate.split('-')[2]));
  }
  return nextDate;
};

export const useRecurring = () => {
  const { householdId } = useAuth();
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const generatedRef = useRef(false); // To prevent double-check on strict mode double mount

  // Auto-generation logic within the listener
  useEffect(() => {
    if (!householdId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'recurringRules'), where('householdId', '==', householdId));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const fetchedRules = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as RecurringRule[];

        setRules(fetchedRules);
        setLoading(false);

        // Auto-generate transactions for active rules that are due
        if (!generatedRef.current) {
          generatedRef.current = true;
          await checkAndGenerateTransactions(fetchedRules, householdId);
          
          // Allow future generations if rules change over a long session, 
          // but debounced securely by the nextScheduledDate condition.
          setTimeout(() => { generatedRef.current = false; }, 5000);
        }
      },
      (err) => {
        console.error("useRecurring error:", err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [householdId]);

  const checkAndGenerateTransactions = async (currentRules: RecurringRule[], hId: string) => {
    const today = getCurrentDateString();
    let generatedCount = 0;
    
    // We should ideally use a Firestore transaction, but batch is okay for this scope
    const batch = writeBatch(db);

    // Idempotency check: Fetch existing recurring transactions for these rules
    // to avoid duplicates if the rule update failed or logic re-runs.
    const ruleIds = currentRules.map(r => r.id);
    if (ruleIds.length === 0) return;

    const existingTxQuery = query(
      collection(db, 'transactions'),
      where('recurringRuleId', 'in', ruleIds.slice(0, 10)) // Firestore 'in' limit is 10
    );
    
    const existingTxSnapshot = await getDocs(existingTxQuery);
    const existingKeys = new Set(
      existingTxSnapshot.docs.map(d => {
        const data = d.data();
        return `${data.recurringRuleId}_${data.date}`;
      })
    );

    for (const rule of currentRules) {
      if (!rule.isActive) continue;
      
      let dateToProcess = rule.nextScheduledDate;
      let iterations = 0; // Guard against infinite loops if dates are way off
      
      while (dateToProcess <= today && iterations < 50) {
        // Stop if we reached an end date
        if (rule.endDate && dateToProcess > rule.endDate) break;

        // Generate the transaction document
        const tDocRef = doc(collection(db, 'transactions'));
        
        const newTx: Omit<Transaction, 'id'> = {
          householdId: hId,
          date: dateToProcess,
          description: rule.description,
          payee: rule.payee,
          amount: rule.amount,
          type: rule.type,
          categoryId: rule.categoryId,
          isSplit: rule.isSplit,
          isRecurring: true,
          recurringRuleId: rule.id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        if (rule.isSplit && rule.splits) {
          newTx.splits = rule.splits;
        }
        if (rule.notes) {
          newTx.notes = rule.notes;
        }

        // Only add if it doesn't already exist
        const txKey = `${rule.id}_${dateToProcess}`;
        if (!existingKeys.has(txKey)) {
          batch.set(tDocRef, newTx);
          generatedCount++;
        }
        
        // Advance schedule
        dateToProcess = calculateNextScheduledDate(rule, dateToProcess);
        iterations++;
      }

      if (iterations > 0) {
        // Update the rule itself with the new dates
        const ruleRef = doc(db, 'recurringRules', rule.id);
        batch.update(ruleRef, {
          nextScheduledDate: dateToProcess,
          lastGeneratedDate: today,
          updatedAt: Date.now(),
        });
      }
    }

    if (generatedCount > 0) {
      await batch.commit();
      // Normally we would use a toast library here, but window alert or native Notification works if missing
      console.log(`Successfully generated ${generatedCount} recurring transaction(s).`);
      // Could dispatch a custom event to show a toast in layout:
      window.dispatchEvent(new CustomEvent('recurring-generated', { detail: { count: generatedCount } }));
    }
  };

  const addRule = async (ruleData: Omit<RecurringRule, 'id' | 'householdId' | 'createdAt' | 'updatedAt'>) => {
    if (!householdId) throw new Error("No household ID");
    
    // Clean undefined values
    const cleanData = Object.fromEntries(
      Object.entries(ruleData).filter(([_, v]) => v !== undefined)
    );

    const docData = {
      ...cleanData,
      householdId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const docRef = await addDoc(collection(db, 'recurringRules'), docData);
    return docRef.id;
  };

  const updateRule = async (id: string, updates: Partial<RecurringRule>) => {
    const docRef = doc(db, 'recurringRules', id);
    // If nextScheduledDate is being updated or something, calculate new schedule? 
    // Handled by the form typically
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await updateDoc(docRef, { ...cleanUpdates, updatedAt: Date.now() });
  };

  const deleteRule = async (id: string) => {
    await deleteDoc(doc(db, 'recurringRules', id));
  };

  return {
    rules,
    loading,
    error,
    addRule,
    updateRule,
    deleteRule,
  };
};
