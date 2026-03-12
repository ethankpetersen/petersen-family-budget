import React, { useState } from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './TransactionsComponents.module.css';

interface TransactionFiltersProps {
  onFilterChange: (filters: { searchTerm: string; startDate: string; endDate: string }) => void;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({ onFilterChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleApplyFilters = () => {
    onFilterChange({ searchTerm, startDate, endDate });
  };

  const handleClear = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    onFilterChange({ searchTerm: '', startDate: '', endDate: '' });
  };

  return (
    <div className={styles.filtersWrapper}>
      <button 
        className={styles.filtersToggle} 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Filter size={18} />
        <span>Filters</span>
        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {isExpanded && (
        <div className={styles.filtersContainer}>
          <div className={styles.filterGroup}>
            <input 
              type="text" 
              placeholder="Search description or payee..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.input}
            />
          </div>
          
          <div className={styles.filterGroupRow}>
            <div className={styles.filterGroup}>
              <label>Start Date</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.filterGroup}>
              <label>End Date</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>
          
          <div className={styles.filterActions}>
            <button className={styles.btnSecondary} onClick={handleClear}>Clear</button>
            <button className={styles.btnPrimary} onClick={handleApplyFilters}>Apply Filters</button>
          </div>
        </div>
      )}
    </div>
  );
};
