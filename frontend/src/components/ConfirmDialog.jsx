import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmVariant = 'primary', loading = false }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Confirm Action'}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className={`btn btn-${confirmVariant}`} onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing...' : confirmText}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ color: confirmVariant === 'danger' ? 'var(--danger)' : 'var(--warning)' }}>
          <AlertTriangle size={32} />
        </div>
        <p style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{message}</p>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
