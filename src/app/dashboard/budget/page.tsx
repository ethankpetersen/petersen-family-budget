'use client';

import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Copy, Trash2 } from 'lucide-react';
import { BudgetGrid } from '@/components/budget/BudgetGrid';
import { useBudget } from '@/lib/hooks/useBudget';
import { BudgetConfirmModal } from '@/components/budget/BudgetConfirmModal';
import './budget.css';

export default function BudgetPage() {
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);

  // Modal states
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'copy' | 'clear' | null;
    title: string;
    message: string;
    confirmText: string;
    isDanger?: boolean;
  }>({
    isOpen: false,
    type: null,
    title: '',
    message: '',
    confirmText: ''
  });

  const { copyFromLastMonth, clearMonth } = useBudget(year, month);

  const handlePrevMonth = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (month === 1) {
      setMonth(12);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  }, [month]);

  const handleNextMonth = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (month === 12) {
      setMonth(1);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  }, [month]);

  const currentMonthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });

  const initiateCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    setModalConfig({
      isOpen: true,
      type: 'copy',
      title: 'Copy Previous Budget',
      message: `This will copy all budgeted amounts from the previous month to ${currentMonthName} ${year}. Existing entries will be preserved unless specifically replaced.`,
      confirmText: 'Copy Budget',
      isDanger: false
    });
  };

  const initiateClear = (e: React.MouseEvent) => {
    e.preventDefault();
    setModalConfig({
      isOpen: true,
      type: 'clear',
      title: 'Clear Budget',
      message: `Are you sure you want to clear the entire budget for ${currentMonthName} ${year}? This cannot be undone.`,
      confirmText: 'Clear Everything',
      isDanger: true
    });
  };

  const handleConfirmAction = async () => {
    const { type } = modalConfig;
    if (type === 'copy') {
      let prevMonth = month - 1;
      let prevYear = year;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear -= 1;
      }
      const success = await copyFromLastMonth(prevYear, prevMonth);
      if (success) {
        alert('Budget copied successfully!');
      } else {
        alert('Nothing found to copy.');
      }
    } else if (type === 'clear') {
      const success = await clearMonth();
      if (success) {
        alert('Budget cleared successfully!');
      } else {
        alert('Failed to delete budget.');
      }
    }
  };

  return (
    <div className="budget-page">
      <header className="budget-header">
        <div className="header-text">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Budget</h1>
          <p className="text-gray-600">Plan and track your family financials.</p>
        </div>
        
        <div className="budget-controls">
          <div className="month-selector">
            <button type="button" onClick={handlePrevMonth} title="Previous Month">
              <ChevronLeft size={20} />
            </button>
            <span className="current-month">{currentMonthName} {year}</span>
            <button type="button" onClick={handleNextMonth} title="Next Month">
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="controls-divider"></div>
          
          <button 
            type="button" 
            onClick={initiateCopy} 
            className="btn-copy" 
            title="Copy from last month"
          >
            <Copy size={16} />
            <span className="btn-text">Copy Previous</span>
          </button>
          
          <button 
            type="button" 
            onClick={initiateClear} 
            className="btn-delete" 
            title="Clear this month's budget"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      <section className="budget-content">
        <BudgetGrid year={year} month={month} />
      </section>

      <BudgetConfirmModal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmAction}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        isDanger={modalConfig.isDanger}
      />
    </div>
  );
}
