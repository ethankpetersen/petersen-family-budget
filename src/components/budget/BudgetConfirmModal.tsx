'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import styles from './BudgetConfirmModal.module.css';

interface BudgetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export function BudgetConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
}: BudgetConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <AlertTriangle className={isDanger ? styles.dangerIcon : styles.warningIcon} size={32} />
          <h3>{title}</h3>
        </div>
        <div className={styles.modalBody}>
          <p>{message}</p>
        </div>
        <div className={styles.modalFooter}>
          <button 
            type="button"
            onClick={onClose} 
            className={styles.cancelBtn}
          >
            {cancelText}
          </button>
          <button 
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }} 
            className={isDanger ? styles.dangerBtn : styles.confirmBtn}
          >
            {confirmText}
          </button>
        </div>
        <button type="button" className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
