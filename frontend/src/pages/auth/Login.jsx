import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layers, Shield, ArrowRight, Lock, Mail, KeyRound, Check } from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { authApi } from '../../api/authApi';
import Modal from '../../components/Modal';

export function Login() {
  const { login } = useAuth();
  const { success, error } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot / Reset Password Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      success(`Welcome back, ${user.name}!`);
      if (user.role === 'Employee') {
        navigate('/employees/me', { replace: true });
      } else {
        const target = (from && from !== '/login' && from !== '/employees/me' && from !== '/') ? from : '/dashboard';
        navigate(target, { replace: true });
      }
    } catch (err) {
      error(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReset = () => {
    setResetEmail(email || '');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setIsResetModalOpen(true);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      error('Please enter your account email');
      return;
    }
    if (!resetNewPassword) {
      error('Please enter a new password');
      return;
    }
    if (resetNewPassword.length < 6) {
      error('New password must be at least 6 characters long');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      error('New passwords do not match');
      return;
    }

    setResetLoading(true);
    try {
      const res = await authApi.resetPassword({
        email: resetEmail.trim(),
        newPassword: resetNewPassword,
        confirmPassword: resetConfirmPassword
      });
      success(res.message || 'Password reset successfully! You can now log in.');
      setEmail(resetEmail.trim());
      setPassword(resetNewPassword);
      setIsResetModalOpen(false);
    } catch (err) {
      error(err.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #714B67 0%, #4a2e42 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 960,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        {/* Left Side: Login Form */}
        <div style={{ padding: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div style={{ background: '#714B67', padding: '8px', borderRadius: '8px', display: 'flex', boxShadow: '0 2px 8px rgba(113, 75, 103, 0.3)' }}>
              <Layers size={24} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#212529' }}>PeoplePay360</h2>
              <p style={{ fontSize: '0.8rem', color: '#6C757D' }}>HR & Payroll Operations</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label required">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '2.25rem', width: '100%' }}
                  placeholder="name@company.com"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail size={16} style={{ position: 'absolute', left: 10, top: 12, color: '#94A3B8' }} />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <label className="form-label required" style={{ margin: 0 }}>Password</label>
                <button
                  type="button"
                  onClick={handleOpenReset}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#714B67',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Forgot / Reset Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '2.25rem', width: '100%' }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock size={16} style={{ position: 'absolute', left: 10, top: 12, color: '#94A3B8' }} />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={18} />
            </button>
          </form>
        </div>

        {/* Right Side: Demo Role Credentials & 1-Click Fill */}
        <div style={{ background: '#F8FAFC', padding: '2.5rem', borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Shield size={18} color="#017E84" />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#212529' }}>Role-Based Demo Credentials</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#6C757D', marginBottom: '1.25rem' }}>
              Click any role to auto-fill credentials and test role permissions:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.password);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: email === acc.email ? '2px solid #714B67' : '1px solid #E2E8F0',
                    background: email === acc.email ? '#f7eff5' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#212529' }}>{acc.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6C757D', fontFamily: 'monospace' }}>{acc.email}</div>
                  </div>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: '#F1F5F9', color: '#017E84', fontWeight: 600, border: '1px solid #E2E8F0' }}>
                    {acc.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: '#f7eff5', border: '1px solid #e9d3e4', borderRadius: '8px', fontSize: '0.75rem', color: '#714B67', textAlign: 'center' }}>
            Uniform Password for All Roles: <code style={{ fontWeight: 700, background: '#ffffff', color: '#714B67', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e9d3e4' }}>Password123!</code>
          </div>
        </div>
      </div>

      {/* Public Reset Password Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Account Password"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setIsResetModalOpen(false)}
              disabled={resetLoading}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleResetSubmit}
              disabled={resetLoading}
            >
              {resetLoading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </>
        }
      >
        <form onSubmit={handleResetSubmit}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--text-light)', fontSize: '0.9rem' }}>
            <KeyRound size={18} color="var(--primary)" />
            <span>Enter your registered email address and choose a new secure password.</span>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label required">Registered Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. user@peoplepay360.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label required">New Password</label>
            <input
              type={showResetPassword ? 'text' : 'password'}
              className="form-control"
              placeholder="At least 6 characters"
              value={resetNewPassword}
              onChange={(e) => setResetNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label required">Confirm New Password</label>
            <input
              type={showResetPassword ? 'text' : 'password'}
              className="form-control"
              placeholder="Re-enter new password"
              value={resetConfirmPassword}
              onChange={(e) => setResetConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-light)' }}>
              <input
                type="checkbox"
                checked={showResetPassword}
                onChange={(e) => setShowResetPassword(e.target.checked)}
              />
              <span>Show password</span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Login;
