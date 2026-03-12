'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import styles from './Dashboard.module.css';

interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  budgetUsedPercent: number;
}

export default function DashboardPage() {
  const { user, householdId } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
    budgetUsedPercent: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!householdId) return;

    // Get current month boundaries as strings
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const periodId = `${householdId}_${year}-${month.toString().padStart(2, '0')}`;
    
    const startOfMonth = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endOfMonth = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

    console.log('Dashboard fetching for period:', periodId, 'dates:', startOfMonth, 'to', endOfMonth);

    const transactionsRef = collection(db, 'transactions');
    const qTransactions = query(
      transactionsRef,
      where('householdId', '==', householdId),
      where('date', '>=', startOfMonth),
      where('date', '<=', endOfMonth)
    );

    const budgetItemsRef = collection(db, 'budgetItems');
    const qBudgets = query(
      budgetItemsRef,
      where('householdId', '==', householdId),
      where('periodId', '==', periodId)
    );

    let totalBudget = 0;
    let currentIncome = 0;
    let currentExpenses = 0;
    
    // Listen to budgets
    const unsubscribeBudgets = onSnapshot(qBudgets, (snapshot) => {
      totalBudget = snapshot.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);
      updateStats();
    }, (error) => console.error("Snapshot error (budgets):", error));

    // Listen to transactions
    const unsubscribeTransactions = onSnapshot(qTransactions, (snapshot) => {
      currentIncome = 0;
      currentExpenses = 0;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const amount = data.amount || 0;
        
        if (data.type === 'income') {
          currentIncome += Math.abs(amount);
        } else if (data.type === 'expense') {
          currentExpenses += Math.abs(amount);
        }
      });
      
      updateStats();
    }, (error) => console.error("Snapshot error (transactions):", error));

    function updateStats() {
      // Data is in cents in Firestore for transactions.
      const incomeDollars = currentIncome / 100;
      const expenseDollars = currentExpenses / 100;

      setStats({
        totalIncome: incomeDollars,
        totalExpenses: expenseDollars,
        netIncome: incomeDollars - expenseDollars,
        budgetUsedPercent: incomeDollars > 0 ? (expenseDollars / incomeDollars) * 100 : 0,
      });
      setLoading(false);
    }

    return () => {
      unsubscribeBudgets();
      unsubscribeTransactions();
    };
  }, [householdId]);

  if (!user || !householdId) return null; // Wait for layout to handle setup

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Overview</h1>
          <p className={styles.pageSubtitle}>Here's what's happening this month.</p>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Total Income Card */}
        <div className={styles.card} id="card-income">
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Total Income</h3>
            <div className={`${styles.cardIcon} ${styles.iconSuccess}`}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          {loading ? (
            <div className={styles.skeletonValue} />
          ) : (
            <div className={styles.cardValue}>{formatCurrency(stats.totalIncome)}</div>
          )}
        </div>

        {/* Total Expenses Card */}
        <div className={styles.card} id="card-expenses">
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Total Expenses</h3>
            <div className={`${styles.cardIcon} ${styles.iconDanger}`}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
          {loading ? (
            <div className={styles.skeletonValue} />
          ) : (
            <div className={styles.cardValue}>{formatCurrency(stats.totalExpenses)}</div>
          )}
        </div>

        {/* Net Income Card */}
        <div className={styles.card} id="card-net">
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Net (Income - Expenses)</h3>
            <div className={`${styles.cardIcon} ${stats.netIncome >= 0 ? styles.iconPrimary : styles.iconWarning}`}>
               <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
          </div>
          {loading ? (
            <div className={styles.skeletonValue} />
          ) : (
            <div className={styles.cardValue}>{formatCurrency(stats.netIncome)}</div>
          )}
        </div>

        {/* Budget Used Percent Card */}
        <div className={styles.card} id="card-budget-percent">
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Spend Rate</h3>
            <div className={`${styles.cardIcon} ${stats.budgetUsedPercent > 100 ? styles.iconDanger : styles.iconSuccess}`}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
          </div>
          {loading ? (
            <div className={styles.skeletonValue} />
          ) : (
            <div>
              <div className={styles.cardValue}>{Math.round(stats.budgetUsedPercent)}%</div>
              <div className={styles.progressBarContainer}>
                <div 
                  className={`${styles.progressBar} ${stats.budgetUsedPercent > 100 ? styles.progressDanger : styles.progressSuccess}`}
                  style={{ width: `${Math.min(stats.budgetUsedPercent, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
