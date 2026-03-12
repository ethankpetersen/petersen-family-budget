import { useState } from 'react';
import { BudgetHeader } from '@/types/budget';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  header: BudgetHeader;
  totalBudget: number;
  totalActual: number;
  totalDifference: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function BudgetHeaderRow({
  header,
  totalBudget,
  totalActual,
  totalDifference,
  isExpanded,
  onToggle,
  children
}: Props) {
  
  const getDifferenceColor = (diff: number) => {
    if (diff > 0) return 'text-positive';
    if (diff < 0) return 'text-negative';
    return 'text-neutral';
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <>
      <tr className="group-header-row" onClick={onToggle} style={{ position: 'relative' }}>
        <td colSpan={1} style={{ position: 'relative', paddingLeft: '0' }}>
          <div 
            className="group-header-indicator" 
            style={{ backgroundColor: header.color || 'var(--color-primary)' }}
          />
          <div className="group-title" style={{ paddingLeft: '1rem' }}>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            {header.name}
          </div>
        </td>
        <td>{formatCurrency(totalBudget)}</td>
        <td>{formatCurrency(totalActual)}</td>
        <td className={getDifferenceColor(totalDifference)}>
          {formatCurrency(totalDifference)}
        </td>
      </tr>
      {isExpanded && children}
    </>
  );
}
