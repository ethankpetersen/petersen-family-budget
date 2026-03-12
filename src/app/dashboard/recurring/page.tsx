'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useRecurring } from '@/lib/hooks/useRecurring';
import { useCategories } from '@/lib/hooks/useCategories';
import { RecurringRuleList } from '@/components/recurring/RecurringRuleList';
import { RecurringRuleForm } from '@/components/recurring/RecurringRuleForm';
import { RecurringRule } from '@/types/recurring';
import styles from './Recurring.module.css';

export default function RecurringPage() {
  return (
    <Suspense fallback={<div className={styles.container}>Loading page...</div>}>
      <RecurringPageContent />
    </Suspense>
  );
}

function RecurringPageContent() {
  const { rules, loading, addRule, updateRule, deleteRule } = useRecurring();
  const { categories } = useCategories();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ruleIdToEdit = searchParams.get('edit');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringRule | undefined>(undefined);
  const lastOpenedRuleId = useRef<string | null>(null);

  // Auto-open edit form if rule ID is in URL
  useEffect(() => {
    if (ruleIdToEdit && rules.length > 0 && !isFormOpen && !editingRule) {
      if (ruleIdToEdit === lastOpenedRuleId.current) return;

      const rule = rules.find(r => r.id === ruleIdToEdit);
      if (rule) {
        setEditingRule(rule);
        setIsFormOpen(true);
        lastOpenedRuleId.current = ruleIdToEdit;
      }
    } else if (!ruleIdToEdit) {
      lastOpenedRuleId.current = null;
    }
  }, [ruleIdToEdit, rules, isFormOpen, editingRule]);

  const handleOpenAddForm = () => {
    setEditingRule(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (rule: RecurringRule) => {
    setEditingRule(rule);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingRule(undefined);
    // Clear query params if any
    if (searchParams.toString()) {
      router.replace(pathname);
    }
  };

  const handleSaveRule = async (data: any) => {
    if (editingRule) {
      await updateRule(editingRule.id, data);
    } else {
      await addRule(data);
    }
    handleCloseForm();
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    await updateRule(id, { isActive: !currentStatus });
  };

  const handleDeleteRule = async (id: string) => {
    await deleteRule(id);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Recurring Transactions</h1>
        
        <button className={styles.fab} onClick={handleOpenAddForm}>
          + Add Recurring Rule
        </button>
      </header>
      
      <main className={styles.main}>
        <RecurringRuleList 
          rules={rules}
          categories={categories}
          loading={loading}
          onEditRule={handleOpenEditForm}
          onToggleActive={handleToggleActive}
          onDeleteRule={handleDeleteRule}
        />
      </main>

      {isFormOpen && (
        <RecurringRuleForm 
          rule={editingRule}
          categories={categories}
          onSave={handleSaveRule}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
