import React from 'react';
import styles from './ExportManager.module.css';

interface ExportButtonProps {
  onExport: () => void;
  label?: string;
  isExporting?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ 
  onExport, 
  label = 'Export CSV',
  isExporting = false
}) => {
  return (
    <button 
      onClick={onExport} 
      className={styles.exportBtn}
      disabled={isExporting}
      title="Download as CSV"
    >
      <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {isExporting ? 'Exporting...' : label}
    </button>
  );
};

// If there was a larger Export Manager panel in settings, it could go here too.
export const ExportManager: React.FC = () => {
  return (
    <div className={styles.managerContainer}>
      <h2>Data Export</h2>
      <p>Download your transactions and budget history to CSV format for use in Excel, Numbers, or other spreadsheet software.</p>
      {/* Could wire up global exports here if needed */}
    </div>
  );
};
