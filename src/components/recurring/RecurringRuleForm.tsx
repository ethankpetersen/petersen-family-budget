import React, { useState } from 'react';
import { RecurringRule, RecurringFrequency } from '@/types/recurring';
import { SplitItem } from '@/types/transaction';
import { SplitTransactionForm } from '@/components/transactions/SplitTransactionForm';
import { getCurrentDateString } from '@/lib/utils/date';
import styles from './RecurringComponents.module.css';

interface RecurringRuleFormProps {
  rule?: RecurringRule;
  categories: { id: string; name: string }[];
  onSave: (data: Omit<RecurringRule, 'id' | 'householdId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onClose: () => void;
}

export const RecurringRuleForm: React.FC<RecurringRuleFormProps> = ({
  rule,
  categories,
  onSave,
  onClose
}) => {
  const isEditing = !!rule;
  
  const [description, setDescription] = useState(rule?.description || '');
  const [payee, setPayee] = useState(rule?.payee || '');
  const [amountInput, setAmountInput] = useState(rule ? (Math.abs(rule.amount) / 100).toString() : '');
  const [type, setType] = useState<'income' | 'expense'>(rule?.type || 'expense');
  const [categoryId, setCategoryId] = useState(rule?.categoryId || '');
  const [notes, setNotes] = useState(rule?.notes || '');
  
  const [isSplit, setIsSplit] = useState(rule?.isSplit || false);
  const [splits, setSplits] = useState<SplitItem[]>(rule?.splits || [
    { categoryId: '', amount: 0 },
    { categoryId: '', amount: 0 }
  ]);

  // Scheduling
  const [frequency, setFrequency] = useState<RecurringFrequency>(rule?.frequency || 'monthly');
  const [startDate, setStartDate] = useState(rule?.startDate || getCurrentDateString());
  const [endDate, setEndDate] = useState(rule?.endDate || '');
  const [dayOfMonth, setDayOfMonth] = useState<number>(rule?.dayOfMonth || parseInt(getCurrentDateString().split('-')[2]));
  const [isActive, setIsActive] = useState<boolean>(rule ? rule.isActive : true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalAmountCents = Math.round(parseFloat(amountInput || '0') * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validations
    if (!description || !payee || !amountInput || !startDate) {
      setError('Please fill out all required fields.');
      return;
    }

    if (totalAmountCents <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }

    if (isSplit) {
      const allocatedCents = splits.reduce((sum: number, s: SplitItem) => sum + (s.amount || 0), 0);
      if (allocatedCents !== totalAmountCents) {
        setError('Split amounts must equal the total transaction amount.');
        return;
      }
      if (splits.some((s: SplitItem) => !s.categoryId)) {
        setError('All split items must have a category.');
        return;
      }
    } else {
      if (!categoryId) {
        setError('Please select a category.');
        return;
      }
    }

    if (frequency === 'monthly' && (dayOfMonth < 1 || dayOfMonth > 31)) {
      setError('Day of month must be between 1 and 31.');
      return;
    }

    if (endDate && endDate < startDate) {
      setError('End date cannot be before start date.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSave({
        description,
        payee,
        amount: type === 'expense' ? -totalAmountCents : totalAmountCents,
        type,
        categoryId: isSplit ? null : categoryId,
        isSplit,
        splits: isSplit ? splits : undefined,
        notes,
        frequency,
        startDate,
        endDate: endDate || null,
        nextScheduledDate: startDate, // For simplification, start scheduling from start date initially.
        lastGeneratedDate: rule?.lastGeneratedDate || null,
        dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
        isActive,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save recurring rule.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <form className={styles.modalContent} onSubmit={handleSubmit} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className={styles.modalHeader}>
          <h2>{isEditing ? 'Edit Recurring Rule' : 'Add Recurring Rule'}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} disabled={isSubmitting}>&times;</button>
        </div>
        
        <div className={styles.formBody}>
          {error && <div className={styles.splitWarning}>{error}</div>}

          {/* Core Transaction Fields */}
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
              <label>Amount * ($)</label>
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
            <div className={styles.formGroup} style={{ flex: 2 }}>
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
          </div>

          <hr style={{ margin: '1rem 0', borderColor: 'var(--border-color)', opacity: 0.5 }} />

          {/* Scheduling Fields */}
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>Schedule</h3>
          
          <div className={styles.formGroupRow} style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label>Frequency *</label>
              <select 
                value={frequency} 
                onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                className={styles.input}
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            {frequency === 'monthly' && (
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label>Day of Month (1-31) *</label>
                <input 
                  type="number" 
                  min="1"
                  max="31"
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                  required
                  className={styles.input}
                />
              </div>
            )}
          </div>

          <div className={styles.formGroupRow} style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label>Start Date *</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label>End Date (Optional)</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          <label className={styles.checkboxContainer} style={{ marginTop: '0.5rem' }}>
            <input 
              type="checkbox" 
              checked={isActive} 
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span>Rule is Active</span>
          </label>

          <hr style={{ margin: '1rem 0', borderColor: 'var(--border-color)', opacity: 0.5 }} />
          
          {/* Categorization & Options */}
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
              rows={2}
              className={styles.input}
            />
          </div>
        </div>
        
        <div className={styles.modalActions}>
          <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Rule'}
          </button>
        </div>
      </form>
    </div>
  );
};
