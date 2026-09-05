import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import Modal from './Modal';
import { authApi } from '../api/authApi';
import { useNotification } from '../context/NotificationContext';

export function ChangePasswordModal({ isOpen, onClose }) {
  const { success, error } = useNotification();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      error('Current password is required');
      return;
    }

    if (!newPassword) {
      error('New password is required');
      return;
    }

    if (newPassword.length < 6) {
      error('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      error('New passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });
      success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      error(err.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change Password"
      footer={
        <>
          <button className="btn btn-secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Updating...' : 'Update Password'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--text-light)', fontSize: '0.9rem' }}>
          <KeyRound size={18} color="var(--primary)" />
          <span>Enter your current password and choose a new secure password.</span>
        </div>

        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label required">Current Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPasswords ? 'text' : 'password'}
              className="form-control"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label required">New Password</label>
          <input
            type={showPasswords ? 'text' : 'password'}
            className="form-control"
            placeholder="At least 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label required">Confirm New Password</label>
          <input
            type={showPasswords ? 'text' : 'password'}
            className="form-control"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-light)' }}>
            <input
              type="checkbox"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
            />
            <span>Show passwords</span>
          </label>
        </div>
      </form>
    </Modal>
  );
}

export default ChangePasswordModal;
