import React from 'react';
import { RecurringRule } from '@/types/recurring';
import styles from './RecurringComponents.module.css';

interface RecurringRuleListProps {
  rules: RecurringRule[];
  categories: { id: string; name: string }[];
  loading: boolean;
  onEditRule: (rule: RecurringRule) => void;
  onToggleActive: (id: string, currentStatus: boolean) => void;
  onDeleteRule: (id: string) => void;
}

export const RecurringRuleList: React.FC<RecurringRuleListProps> = ({
  rules,
  categories,
  loading,
  onEditRule,
  onToggleActive,
  onDeleteRule,
}) => {
  const getCategoryName = (id: string | null) => {
    if (!id) return 'Uncategorized';
    return categories.find(c => c.id === id)?.name || id;
  };

  if (loading && rules.length === 0) {
    return <div className={styles.loading}>Loading recurring rules...</div>;
  }

  if (!loading && rules.length === 0) {
    return <div className={styles.empty}>No recurring rules found. Create one to get started!</div>;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount) / 100);
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
        <div className={styles.colDesc}>Description</div>
        <div className={styles.colPayee}>Payee</div>
        <div className={styles.colAmount}>Amount</div>
        <div className={styles.colFreq}>Frequency</div>
        <div className={styles.colNextDate}>Next Date</div>
        <div className={styles.colStatus}>Status</div>
        <div className={styles.colActions}>Actions</div>
      </div>
      
      <div className={styles.tableBody}>
        {rules.map((r) => (
          <div key={r.id} className={`${styles.tableRow} ${!r.isActive ? styles.inactiveRow : ''}`}>
            <div className={styles.colDesc}>
              <div className={styles.mainText}>{r.description}</div>
              <div className={styles.subText}>
                {r.isSplit ? `Split (${r.splits?.length || 0})` : getCategoryName(r.categoryId)}
              </div>
            </div>
            
            <div className={styles.colPayee}>
              {r.payee}
            </div>

            <div className={`${styles.colAmount} ${r.type === 'income' ? styles.income : styles.expense}`}>
              {r.type === 'expense' ? '-' : '+'}{formatCurrency(r.amount)}
            </div>

            <div className={styles.colFreq} style={{ textTransform: 'capitalize' }}>
              {r.frequency}
            </div>

            <div className={styles.colNextDate}>
              {formatDate(r.nextScheduledDate)}
            </div>

            <div className={styles.colStatus}>
              <button 
                className={`${styles.statusBadge} ${r.isActive ? styles.statusActive : styles.statusPaused}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleActive(r.id, r.isActive);
                }}
              >
                {r.isActive ? 'Active' : 'Paused'}
              </button>
            </div>

            <div className={styles.colActions}>
              <button 
                className={styles.actionBtn} 
                onClick={(e) => {
                  e.stopPropagation();
                  onEditRule(r);
                }}
                title="Edit"
              >
                ✏️
              </button>
              <button 
                className={styles.actionBtnDelete} 
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Are you sure you want to delete this recurring rule?')) {
                    onDeleteRule(r.id);
                  }
                }}
                title="Delete"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
