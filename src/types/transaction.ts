export type TransactionType = 'income' | 'expense';

export interface SplitItem {
  categoryId: string;
  amount: number;
}

export interface Transaction {
  id: string; // Document ID
  householdId: string;
  date: string; // ISO string YYYY-MM-DD
  description: string;
  payee: string;
  amount: number; // positive for income, negative for expense (or absolute value if type is present)
  type: TransactionType;
  categoryId: string | null; // null if split
  isSplit: boolean;
  splits?: SplitItem[]; // only if isSplit is true
  notes?: string;
  isRecurring?: boolean;
  recurringRuleId?: string;
  createdBy?: string; // User UID
  createdByName?: string; // User display name at time of creation
  createdAt: number;
  updatedAt: number;
}
