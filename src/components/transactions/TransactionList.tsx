import React from 'react';
import { Transaction } from '@/types/transaction';
import styles from './TransactionsComponents.module.css';

interface TransactionListProps {
  transactions: Transaction[];
  categories: { id: string; name: string }[];
  loading: boolean;
  onSelectTransaction: (t: Transaction) => void;
  hasMore: boolean;
  onLoadMore: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categories,
  loading,
  onSelectTransaction,
  hasMore,
  onLoadMore,
}) => {
  const getCategoryName = (id: string | null) => {
    if (!id) return 'Uncategorized';
    return categories.find(c => c.id === id)?.name || id;
  };
  if (loading && transactions.length === 0) {
    return <div className={styles.loading}>Loading transactions...</div>;
  }

  if (!loading && transactions.length === 0) {
    return <div className={styles.empty}>No transactions found for this period.</div>;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount) / 100); // Assuming amount is in cents, if not adjust
  };

  const formatShortDate = (dateString: string) => {
    const d = new Date(dateString + 'T12:00:00');
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear().toString().slice(-2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={styles.listContainer}>
      <div className={styles.tableHeader}>
        <div className={styles.colDate}>Date</div>
        <div className={styles.colDesc}>Description</div>
        <div className={styles.colPayee}>Payee</div>
        <div className={styles.colCategory}>Category</div>
        <div className={styles.colAmount}>Amount</div>
      </div>
      
      <div className={styles.tableBody}>
        {transactions.map((t) => (
          <div 
            key={t.id} 
            className={styles.tableRow}
            onClick={() => onSelectTransaction(t)}
          >
            <div className={styles.colDate}>
              <span className={styles.desktopOnly}>{formatDate(t.date)}</span>
              <span className={styles.mobileOnly}>{formatShortDate(t.date)}</span>
            </div>
            <div className={styles.colDesc}>
              {t.description}
            </div>
            <div className={styles.colPayee}>
              {t.payee}
            </div>
            <div className={styles.colCategory}>
              {t.isSplit ? (
                <span className={styles.splitBadge}>Split ({t.splits?.length || 0})</span>
              ) : (
                getCategoryName(t.categoryId)
              )}
            </div>
            <div className={`${styles.colAmount} ${t.type === 'income' ? styles.income : styles.expense}`}>
              {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
            </div>
          </div>
        ))}
        
        {hasMore && (
          <div className={styles.loadMoreContainer}>
            <button 
              className={styles.loadMoreBtn} 
              onClick={onLoadMore}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
