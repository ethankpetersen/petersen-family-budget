import { useState, useRef, useEffect } from 'react';
import { Category, BudgetItem } from '@/types/budget';

interface Props {
  category: Category;
  budgetItem?: BudgetItem;
  actualAmount: number;
  onUpdateBudget: (categoryId: string, amount: number) => void;
}

export function BudgetCategoryRow({ category, budgetItem, actualAmount, onUpdateBudget }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const budgetAmount = budgetItem?.amount || 0;
  
  // Calculate difference. 
  // For Income: difference = actual - budget (positive is good)
  // For Expense: difference = budget - actual (positive is under budget/good)
  const absActual = Math.abs(actualAmount);
  const difference = category.type === 'income' 
    ? absActual - budgetAmount 
    : budgetAmount - absActual;

  const getDifferenceColor = (diff: number) => {
    if (diff > 0) return 'text-positive';
    if (diff < 0) return 'text-negative';
    return 'text-neutral';
  };

  const handleEditClick = () => {
    setEditValue(budgetAmount === 0 ? '' : budgetAmount.toString());
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const numValue = parseFloat(editValue);
    if (!isNaN(numValue) && numValue !== budgetAmount) {
      onUpdateBudget(category.id, numValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <tr className="category-row">
      <td className="pl-6">{category.name}</td>
      <td className="editable-cell" onClick={!isEditing ? handleEditClick : undefined}>
        {isEditing ? (
          <input
            ref={inputRef}
            type="number"
            className="category-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            step="0.01"
          />
        ) : (
          <span className="editable-cell-content">{formatCurrency(budgetAmount)}</span>
        )}
      </td>
      <td>{formatCurrency(actualAmount)}</td>
      <td className={`font-semibold ${getDifferenceColor(difference)}`}>
        {formatCurrency(difference)}
      </td>
    </tr>
  );
}
