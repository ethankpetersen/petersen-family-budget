'use client';

import React, { useState } from 'react';
import { useTransactions } from '@/lib/hooks/useTransactions';
import { useCategories } from '@/lib/hooks/useCategories';
import { TransactionList } from '@/components/transactions/TransactionList';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionDetail } from '@/components/transactions/TransactionDetail';
import { Transaction } from '@/types/transaction';
import { ExportButton } from '@/components/settings/ExportManager';
import { exportTransactionsToCSV } from '@/lib/utils/csvExport';
import styles from './Transactions.module.css';

export default function TransactionsPage() {
  const [filters, setFilters] = useState<{ searchTerm?: string; startDate?: string; endDate?: string }>({});
  
  const { categories } = useCategories();
  
  const memoizedFilters = React.useMemo(() => filters, [JSON.stringify(filters)]);

  const { 
    transactions, 
    loading, 
    hasMore, 
    loadMore, 
    addTransaction,
    updateTransaction,
    deleteTransaction
  } = useTransactions({ filters: memoizedFilters });
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);


  const handleFilterChange = (newFilters: { searchTerm: string; startDate: string; endDate: string }) => {
    setFilters({
      searchTerm: newFilters.searchTerm || undefined,
      startDate: newFilters.startDate || undefined,
      endDate: newFilters.endDate || undefined,
    });
  };

  const handleOpenAddForm = () => {
    setEditingTransaction(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (t: Transaction) => {
    setViewingTransaction(null);
    setEditingTransaction(t);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTransaction(undefined);
  };

  const handleSaveTransaction = async (data: any) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, data);
    } else {
      await addTransaction(data);
    }
    handleCloseForm();
  };

  const handleDeleteTransaction = async (t: Transaction) => {
    console.log("Delete confirmed in UI. Deleting transaction:", t.id);
    await deleteTransaction(t.id);
    setViewingTransaction(null);
  };

  const handleExport = () => {
    const categoryMap = categories.reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {} as Record<string, string>);
    exportTransactionsToCSV(transactions, categoryMap);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Transactions</h1>
        
        <div className={styles.headerActions}>
          <TransactionFilters onFilterChange={handleFilterChange} />
          <ExportButton onExport={handleExport} />
          <button className={styles.fab} onClick={handleOpenAddForm}>
            + Add Transaction
          </button>
        </div>
      </header>
      
      <main className={styles.main}>
        <TransactionList 
          transactions={transactions}
          categories={categories}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onSelectTransaction={setViewingTransaction}
        />
      </main>

      {isFormOpen && (
        <TransactionForm 
          transaction={editingTransaction}
          categories={categories}
          onSave={handleSaveTransaction}
          onClose={handleCloseForm}
        />
      )}

      <div className={styles.stickyFabContainer}>
        <button className={styles.stickyFab} onClick={handleOpenAddForm}>
          + Add Transaction
        </button>
      </div>

      {viewingTransaction && (
        <TransactionDetail 
          transaction={viewingTransaction}
          categories={categories}
          onClose={() => setViewingTransaction(null)}
          onEdit={handleOpenEditForm}
          onDelete={handleDeleteTransaction}
        />
      )}
    </div>
  );
}
