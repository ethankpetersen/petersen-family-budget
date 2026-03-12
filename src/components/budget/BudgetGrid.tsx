import { useState } from 'react';
import { useCategories } from '@/lib/hooks/useCategories';
import { useBudget } from '@/lib/hooks/useBudget';
import { BudgetHeaderRow } from './BudgetHeaderRow';
import { BudgetCategoryRow } from './BudgetCategoryRow';
import { BudgetSummary } from './BudgetSummary';

interface Props {
  year: number;
  month: number;
}

export function BudgetGrid({ year, month }: Props) {
  const { headers, categories, loading: categoriesLoading } = useCategories();
  const { items, actuals, updateBudgetItem, loading: budgetLoading } = useBudget(year, month);
  
  const [expandedHeaders, setExpandedHeaders] = useState<Record<string, boolean>>({});

  if (categoriesLoading || budgetLoading) {
    return <div className="p-8 text-center text-gray-500">Loading budget data...</div>;
  }

  const toggleHeader = (headerId: string) => {
    setExpandedHeaders(prev => ({
      ...prev,
      [headerId]: prev[headerId] !== undefined ? !prev[headerId] : false
    }));
  };

  // Grand totals
  let grandTotalBudget = 0;
  let grandTotalActual = 0;

  return (
    <div className="budget-grid-container">
      <table className="budget-grid">
        <thead>
          <tr>
            <th style={{ width: '40%' }}>Category</th>
            <th style={{ width: '20%' }}>Budget</th>
            <th style={{ width: '20%' }}>Actual</th>
            <th style={{ width: '20%' }}>Difference</th>
          </tr>
        </thead>
        <tbody>
          {headers.map(header => {
            const headerCategories = categories.filter(c => c.headerId === header.id);
            if (headerCategories.length === 0) return null;

            // Simple absolute sums for display in header row
            let displaySubTotalBudget = 0;
            let displaySubTotalActual = 0;

            const rows = headerCategories.map(category => {
              const budgetItem = items.find(i => i.categoryId === category.id);
              const budgetAmount = budgetItem?.amount || 0;
              const actualAmount = actuals[category.id] || 0;

              displaySubTotalBudget += budgetAmount;
              displaySubTotalActual += Math.abs(actualAmount);

              // Grand totals: Actuals are already signed (negative for expense)
              // We need to sign budget amounts correctly for net flow
              const signedBudget = category.type === 'expense' ? -budgetAmount : budgetAmount;
              grandTotalBudget += signedBudget;
              grandTotalActual += actualAmount; 

              return (
                <BudgetCategoryRow
                  key={category.id}
                  category={category}
                  budgetItem={budgetItem}
                  actualAmount={actualAmount}
                  onUpdateBudget={updateBudgetItem}
                />
              );
            });

            // Difference for this group (absolute display)
            // For Income: Actual - Budget
            // For Expense: Budget - Actual (how much left)
            const subTotalDifference = header.type === 'income' 
              ? displaySubTotalActual - displaySubTotalBudget
              : displaySubTotalBudget - displaySubTotalActual;

            const isExpanded = expandedHeaders[header.id] !== false;

            return (
              <BudgetHeaderRow
                key={header.id}
                header={header}
                totalBudget={displaySubTotalBudget}
                totalActual={displaySubTotalActual}
                totalDifference={subTotalDifference}
                isExpanded={isExpanded}
                onToggle={() => toggleHeader(header.id)}
              >
                {rows}
              </BudgetHeaderRow>
            );
          })}
        </tbody>
        <BudgetSummary
          totalBudget={grandTotalBudget}
          totalActual={grandTotalActual}
          totalDifference={grandTotalActual - grandTotalBudget}
        />
      </table>
    </div>
  );
}
