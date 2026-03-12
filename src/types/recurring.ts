import { SplitItem, TransactionType } from './transaction';

export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly';

export interface RecurringRule {
  id: string; // Document ID
  householdId: string;
  description: string;
  payee: string;
  amount: number;
  type: TransactionType;
  categoryId: string | null;
  isSplit: boolean;
  splits?: SplitItem[];
  notes?: string;

  // Scheduling
  frequency: RecurringFrequency;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null; // Optional end date YYYY-MM-DD
  nextScheduledDate: string; // YYYY-MM-DD, the next date this rule should trigger
  lastGeneratedDate?: string | null; // YYYY-MM-DD, the last date an actual transaction was made

  // Options for 'monthly'
  dayOfMonth?: number; // 1-31

  // Options for 'weekly' and 'biweekly' (can use startDate to determine exact interval)
  // Biweekly occurs every 14 days from startDate
  // Weekly occurs every 7 days from startDate

  isActive: boolean; // paused vs active

  createdAt: number;
  updatedAt: number;
}
