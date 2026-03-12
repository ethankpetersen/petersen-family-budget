import React from 'react';
import { useRouter } from 'next/navigation';
import { Transaction } from '@/types/transaction';
import styles from './TransactionsComponents.module.css';

interface TransactionDetailProps {
  transaction: Transaction | null;
  categories: { id: string; name: string }[];
  onClose: () => void;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}

export const TransactionDetail: React.FC<TransactionDetailProps> = ({
  transaction,
  categories,
  onClose,
  onEdit,
  onDelete
}) => {
  const router = useRouter();
  const getCategoryName = (id: string | null) => {
    if (!id) return 'Uncategorized';
    return categories.find(c => c.id === id)?.name || id;
  };
  if (!transaction) return null;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount) / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const [isDeleting, setIsDeleting] = React.useState(false);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2>Transaction Details</h2>
            {transaction.isRecurring && (
              <span 
                className={`${styles.recurringBadge} ${styles.clickableBadge}`} 
                title="Click to view/edit recurring rule"
                onClick={() => router.push(`/dashboard/recurring?edit=${transaction.recurringRuleId}`)}
              >
                🔄 Recurring
              </span>
            )}
          </div>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        
        <div className={styles.detailBody}>
          <div className={`${styles.detailAmount} ${transaction.type === 'income' ? styles.income : styles.expense}`}>
            {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
          </div>
          
          <div className={styles.detailGroup}>
            <div className={styles.detailLabel}>Date</div>
            <div className={styles.detailValue}>{formatDate(transaction.date)}</div>
          </div>
          
          <div className={styles.detailGroup}>
            <div className={styles.detailLabel}>Payee</div>
            <div className={styles.detailValue}>{transaction.payee}</div>
          </div>
          
          <div className={styles.detailGroup}>
            <div className={styles.detailLabel}>Description</div>
            <div className={styles.detailValue}>{transaction.description}</div>
          </div>
          
          <div className={styles.detailGroup}>
            <div className={styles.detailLabel}>Category</div>
            <div className={styles.detailValue}>
                {transaction.isSplit ? (
                  <div className={styles.splitList}>
                    <div className={styles.splitBadge}>Split Transaction</div>
                    {transaction.splits?.map((s, i) => (
                      <div key={i} className={styles.splitItem}>
                        <span>{getCategoryName(s.categoryId)}</span>
                        <span>{formatCurrency(s.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  getCategoryName(transaction.categoryId)
                )}
            </div>
          </div>

          {transaction.notes && (
            <div className={styles.detailGroup}>
              <div className={styles.detailLabel}>Notes</div>
              <div className={styles.detailValue}>{transaction.notes}</div>
            </div>
          )}

          {transaction.createdByName && (
            <div className={styles.detailGroup}>
              <div className={styles.detailLabel}>Created By</div>
              <div className={styles.detailValue} style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {transaction.createdByName}
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.modalActions}>
          {isDeleting ? (
            <div className={styles.deleteConfirm}>
              <span className={styles.deleteTitle}>Are you sure?</span>
              <div className={styles.deleteBtns}>
                <button className={styles.btnDanger} onClick={() => onDelete(transaction)}>Confirm</button>
                <button className={styles.btnSecondary} onClick={() => setIsDeleting(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <button className={styles.btnDanger} onClick={() => setIsDeleting(true)}>Delete</button>
              <div className={styles.actionGroupRight}>
                <button className={styles.btnSecondary} onClick={onClose}>Close</button>
                <button className={styles.btnPrimary} onClick={() => onEdit(transaction)}>Edit</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
