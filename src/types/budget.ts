export type TransactionType = 'income' | 'expense';

export interface BudgetHeader {
  id: string; // Document ID
  householdId: string; // Reference to Household
  name: string;
  order: number;
  type: TransactionType;
  color?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string; // Document ID
  householdId: string;
  headerId: string; // Reference to BudgetHeader
  name: string;
  order: number;
  type: TransactionType;
  archived: boolean; // Soft delete
  createdAt: number;
  updatedAt: number;
}

export interface BudgetPeriod {
  id: string; // Format: "YYYY-MM"
  householdId: string;
  month: number; // 1-12
  year: number;
  createdAt: number;
  updatedAt: number;
}

export interface BudgetItem {
  id: string; // Document ID, or combination of periodId_categoryId
  householdId: string;
  periodId: string; // Reference to BudgetPeriod
  categoryId: string; // Reference to Category
  amount: number; // The planned budget amount
  createdAt: number;
  updatedAt: number;
}

// Note: Transactions collection might already exist, but for budget purposes we need:
// interface Transaction {
//   id: string;
//   categoryId: string | null;
//   amount: number; // positive for income, negative for expense (or absolute value if type is present)
//   type: TransactionType;
//   date: string; // ISO string 
//   ...
// }
