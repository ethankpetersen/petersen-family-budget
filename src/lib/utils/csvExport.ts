import { Transaction } from '@/types/transaction';

/**
 * Escapes a string for CSV format.
 * Quotes the string if it contains commas, quotes, or newlines.
 * Double-escapes quotes.
 */
function escapeCSVValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Downloads a string as a CSV file.
 */
function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export transactions to CSV
 */
export function exportTransactionsToCSV(
  transactions: Transaction[],
  categoriesMap: Record<string, string>,
  filename: string = 'transactions.csv'
) {
  const headers = ['Date', 'Description', 'Payee', 'Amount', 'Category', 'Notes'];
  
  const rows = transactions.map(tx => {
    // Determine category text
    let categoryText = '';
    if (tx.isSplit && tx.splits) {
      // Combined row with categories comma-separated
      const splitNames = tx.splits.map(s => categoriesMap[s.categoryId || ''] || 'Uncategorized');
      categoryText = `Split (${splitNames.join(', ')})`;
    } else {
      categoryText = categoriesMap[tx.categoryId || ''] || 'Uncategorized';
    }

    const amountStr = (tx.type === 'expense' ? -Math.abs(tx.amount) : Math.abs(tx.amount)) / 100;

    return [
      escapeCSVValue(tx.date),
      escapeCSVValue(tx.description),
      escapeCSVValue(tx.payee),
      escapeCSVValue(amountStr.toFixed(2)),
      escapeCSVValue(categoryText),
      escapeCSVValue(tx.notes || '')
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  downloadCSV(csvContent, filename);
}

export interface BudgetExportItem {
  headerName: string;
  categoryName: string;
  budgetAmount: number; // in cents
  actualAmount: number; // in cents
}

/**
 * Export budget to CSV
 */
export function exportBudgetToCSV(
  items: BudgetExportItem[],
  filename: string = 'budget.csv'
) {
  const headers = ['Header', 'Category', 'Budget', 'Actual', 'Difference'];

  const rows = items.map(item => {
    const budgetStr = (item.budgetAmount / 100).toFixed(2);
    const actualStr = (item.actualAmount / 100).toFixed(2);
    const diffStr = ((item.budgetAmount - item.actualAmount) / 100).toFixed(2);

    return [
      escapeCSVValue(item.headerName),
      escapeCSVValue(item.categoryName),
      escapeCSVValue(budgetStr),
      escapeCSVValue(actualStr),
      escapeCSVValue(diffStr)
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  downloadCSV(csvContent, filename);
}
