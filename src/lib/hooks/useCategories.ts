import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '../firebase/firestore';
import { Category, BudgetHeader } from '@/types/budget';
import { where, orderBy } from 'firebase/firestore';

export function useCategories() {
  const { householdId } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [headers, setHeaders] = useState<BudgetHeader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!householdId) {
      setCategories([]);
      setHeaders([]);
      setLoading(false);
      return;
    }

    let unsubscribeCategories: () => void;
    let unsubscribeHeaders: () => void;

    setLoading(true);

    try {
      unsubscribeHeaders = subscribeToCollection<BudgetHeader>(
        'budgetHeaders',
        (data) => {
          setHeaders(data.sort((a, b) => a.order - b.order));
        },
        [where('householdId', '==', householdId)]
      ) as unknown as () => void;

      unsubscribeCategories = subscribeToCollection<Category>(
        'categories',
        (data) => {
          setCategories(data.sort((a, b) => a.order - b.order));
          setLoading(false);
        },
        [where('householdId', '==', householdId)]
      ) as unknown as () => void;
    } catch (error) {
      console.error('Error subscribing to categories/headers:', error);
      setLoading(false);
    }

    return () => {
      if (unsubscribeCategories) unsubscribeCategories();
      if (unsubscribeHeaders) unsubscribeHeaders();
    };
  }, [householdId]);

  const activeCategories = categories.filter((c) => !c.archived);

  // --- Header Methods ---
  const addHeader = async (name: string, type: 'income' | 'expense', color?: string) => {
    if (!householdId) return;
    const newOrder = headers.length ? Math.max(...headers.map(h => h.order)) + 1 : 0;
    const newHeader: Omit<BudgetHeader, 'id'> = {
      householdId,
      name,
      order: newOrder,
      type,
      color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await addDocument('budgetHeaders', newHeader);
  };

  const updateHeader = async (id: string, data: Partial<BudgetHeader>) => {
    await updateDocument('budgetHeaders', id, { ...data, updatedAt: Date.now() });
  };

  const deleteHeader = async (id: string) => {
    // In a real app we might want to check if it has categories first, or cascade delete
    await deleteDocument('budgetHeaders', id);
  };

  const reorderHeaders = async (reorderedHeaders: BudgetHeader[]) => {
    const promises = reorderedHeaders.map((header, index) =>
      updateDocument('budgetHeaders', header.id, { order: index, updatedAt: Date.now() })
    );
    await Promise.all(promises);
  };

  // --- Category Methods ---
  const addCategory = async (headerId: string, name: string, type: 'income' | 'expense') => {
    if (!householdId) return;
    const headerCategories = categories.filter(c => c.headerId === headerId);
    const newOrder = headerCategories.length ? Math.max(...headerCategories.map(c => c.order)) + 1 : 0;

    const newCategory: Omit<Category, 'id'> = {
      householdId,
      headerId,
      name,
      order: newOrder,
      type,
      archived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await addDocument('categories', newCategory);
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    await updateDocument('categories', id, { ...data, updatedAt: Date.now() });
  };

  const archiveCategory = async (id: string) => {
    await updateDocument('categories', id, { archived: true, updatedAt: Date.now() });
  };

  const reorderCategories = async (reorderedCategories: Category[]) => {
    const promises = reorderedCategories.map((category, index) =>
      updateDocument('categories', category.id, { order: index, updatedAt: Date.now() })
    );
    await Promise.all(promises);
  };

  return {
    headers,
    categories: activeCategories,
    allCategories: categories, // Includes archived
    loading,
    addHeader,
    updateHeader,
    deleteHeader,
    reorderHeaders,
    addCategory,
    updateCategory,
    archiveCategory,
    reorderCategories,
  };
}
