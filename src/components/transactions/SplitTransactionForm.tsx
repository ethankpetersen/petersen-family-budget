import React from 'react';
import styles from './TransactionsComponents.module.css';

interface SplitItem {
  categoryId: string;
  amount: number;
}

interface SplitTransactionFormProps {
  totalAmount: number;
  splits: SplitItem[];
  onChange: (splits: SplitItem[]) => void;
  categories: { id: string; name: string }[];
}

export const SplitTransactionForm: React.FC<SplitTransactionFormProps> = ({
  totalAmount,
  splits,
  onChange,
  categories
}) => {
  const currentTotal = splits.reduce((sum, split) => sum + (split.amount || 0), 0);
  const remaining = totalAmount - currentTotal;
  const isValid = remaining === 0;

  const handleSplitChange = (index: number, field: keyof SplitItem, value: any) => {
    const newSplits = [...splits];
    newSplits[index] = { ...newSplits[index], [field]: value };
    onChange(newSplits);
  };

  const addSplit = () => {
    onChange([...splits, { categoryId: '', amount: remaining > 0 ? remaining : 0 }]);
  };

  const removeSplit = (index: number) => {
    const newSplits = splits.filter((_, i) => i !== index);
    onChange(newSplits);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  return (
    <div className={styles.splitContainer}>
      <h4>Split Details</h4>
      
      {splits.map((split, index) => (
        <div key={index} className={styles.splitFormRow}>
          <div className={styles.formGroup}>
            <label>Category</label>
            <select 
              value={split.categoryId} 
              onChange={(e) => handleSplitChange(index, 'categoryId', e.target.value)}
              className={styles.input}
            >
              <option value="">Select Category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label>Amount</label>
            <input 
              type="number" 
              step="0.01"
              value={split.amount ? split.amount / 100 : ''}
              onChange={(e) => handleSplitChange(index, 'amount', Math.round(parseFloat(e.target.value || '0') * 100))}
              className={styles.input}
              placeholder="0.00"
            />
          </div>
          
          <button 
            type="button" 
            className={styles.removeBtn}
            onClick={() => removeSplit(index)}
            disabled={splits.length <= 1} // Require at least 1 split row
          >
            &times;
          </button>
        </div>
      ))}
      
      <button 
        type="button" 
        className={styles.btnSecondary} 
        onClick={addSplit}
        style={{ marginTop: 'var(--space-2)' }}
      >
        + Add Split Category
      </button>
      
      <div style={{ marginTop: 'var(--space-4)', fontWeight: 500 }}>
        Total Amount: {formatCurrency(totalAmount)}<br/>
        Allocated: {formatCurrency(currentTotal)}<br/>
        {!isValid && (
          <div className={styles.splitWarning}>
            Remaining to allocate: {formatCurrency(remaining)}
          </div>
        )}
        {isValid && (
          <div className={styles.splitSuccess}>
            Fully allocated!
          </div>
        )}
      </div>
    </div>
  );
};
