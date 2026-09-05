import React from 'react';

export function SmartButton({ icon: Icon, count, label, onClick }) {
  return (
    <button type="button" className="smart-button" onClick={onClick}>
      {Icon && (
        <div className="smart-button-icon">
          <Icon size={20} />
        </div>
      )}
      <div className="smart-button-content">
        <span className="smart-button-count">{count ?? 0}</span>
        <span className="smart-button-label">{label}</span>
      </div>
    </button>
  );
}

export default SmartButton;
