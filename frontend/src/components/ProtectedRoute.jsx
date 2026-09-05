import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading PeoplePay360 session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div className="card" style={{ maxWidth: 500, margin: '4rem auto', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Access Restricted</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Your role (<strong>{user?.role}</strong>) does not have permission to view this section.
        </p>
        <button className="btn btn-secondary" onClick={() => window.history.back()}>
          Go Back
        </button>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
