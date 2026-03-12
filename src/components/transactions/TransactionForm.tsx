import React, { useState, useEffect } from 'react';
import { Transaction, SplitItem } from '@/types/transaction';
import { SplitTransactionForm } from './SplitTransactionForm';
import styles from './TransactionsComponents.module.css';

interface TransactionFormProps {
  transaction?: Transaction;
  categories: { id: string; name: string }[];
  onSave: (data: Omit<Transaction, 'id' | 'householdId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onClose: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  transaction,
  categories,
  onSave,
  onClose
}) => {
  const isEditing = !!transaction;
  
  const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(transaction?.description || '');
  const [payee, setPayee] = useState(transaction?.payee || '');
  const [amountInput, setAmountInput] = useState(transaction ? (Math.abs(transaction.amount) / 100).toString() : '');
  const [type, setType] = useState<'income' | 'expense'>(transaction?.type || 'expense');
  const [categoryId, setCategoryId] = useState(transaction?.categoryId || '');
  const [notes, setNotes] = useState(transaction?.notes || '');
  
  const [isSplit, setIsSplit] = useState(transaction?.isSplit || false);
  const [splits, setSplits] = useState<SplitItem[]>(transaction?.splits || [
    { categoryId: '', amount: 0 },
    { categoryId: '', amount: 0 }
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalAmountCents = Math.round(parseFloat(amountInput || '0') * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validations
    if (!date || !description || !payee || !amountInput) {
      setError('Please fill out all required fields.');
      return;
    }

    if (totalAmountCents <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }

    if (isSplit) {
      const allocatedCents = splits.reduce((sum, s) => sum + (s.amount || 0), 0);
      if (allocatedCents !== totalAmountCents) {
        setError('Split amounts must equal the total transaction amount.');
        return;
      }
      if (splits.some(s => !s.categoryId)) {
        setError('All split items must have a category.');
        return;
      }
    } else {
      if (!categoryId) {
        setError('Please select a category.');
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      await onSave({
        date,
        description,
        payee,
        amount: type === 'expense' ? -totalAmountCents : totalAmountCents,
        type,
        categoryId: isSplit ? null : categoryId,
        isSplit,
        splits: isSplit ? splits : undefined,
        notes,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save transaction.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <form className={styles.modalContent} onSubmit={handleSubmit}>
        <div className={styles.modalHeader}>
          <h2>{isEditing ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} disabled={isSubmitting}>&times;</button>
        </div>
        
        <div className={styles.formBody}>
          {error && <div className={styles.splitWarning}>{error}</div>}
          
          <div className={styles.formGroupRow} style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label>Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value as 'income' | 'expense')}
                className={styles.input}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label>Date *</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className={styles.input}
              />
            </div>
          </div>
          
          <div className={styles.formGroupRow} style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <div className={styles.formGroup} style={{ flex: 2 }}>
              <label>Payee *</label>
              <input 
                type="text" 
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                required
                placeholder="Where or who?"
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label>Total Amount * ($)</label>
              <input 
                type="number" 
                step="0.01" 
                min="0.01"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                required
                placeholder="0.00"
                className={styles.input}
              />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label>Description *</label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="What was this for?"
              className={styles.input}
            />
          </div>
          
          <label className={styles.checkboxContainer}>
            <input 
              type="checkbox" 
              checked={isSplit} 
              onChange={(e) => setIsSplit(e.target.checked)}
            />
            <span>Split this transaction</span>
          </label>
          
          {isSplit ? (
            <SplitTransactionForm 
              totalAmount={totalAmountCents}
              splits={splits}
              categories={categories}
              onChange={setSplits}
            />
          ) : (
            <div className={styles.formGroup}>
              <label>Category *</label>
              <select 
                value={categoryId} 
                onChange={(e) => setCategoryId(e.target.value)}
                required={!isSplit}
                className={styles.input}
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className={styles.formGroup}>
            <label>Notes (Optional)</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={styles.input}
            />
          </div>
        </div>
        
        <div className={styles.modalActions}>
          <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Transaction'}
          </button>
        </div>
      </form>
    </div>
  );
};
