export interface User {
  id: string;
  email: string;
  displayName?: string;
  householdId: string;
  role: 'admin' | 'member';
  createdAt: Date;
}

export interface Household {
  id: string;
  name: string;
  createdAt: Date;
  createdBy: string;
}

export interface Category {
  id: string;
  householdId: string;
  name: string;
  type: 'income' | 'expense';
  color?: string;
  icon?: string;
}

export interface Budget {
  id: string;
  householdId: string;
  categoryId: string;
  amount: number;
  period: 'monthly' | 'weekly' | 'yearly';
  startDate: Date;
  endDate?: Date;
}

export interface Transaction {
  id: string;
  householdId: string;
  categoryId: string;
  userId: string;
  amount: number;
  type: 'income' | 'expense';
  date: Date;
  description: string;
  notes?: string;
  createdAt: Date;
}
