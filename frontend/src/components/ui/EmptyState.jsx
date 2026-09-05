import React from 'react';
import { Inbox } from 'lucide-react';
import './EmptyState.css';

/**
 * Reusable EmptyState Component
 * Communicates: No records / No results / No data
 */
export function EmptyState({
  icon = <Inbox size={24} />,
  title = 'No records found',
  description = 'There are no items to display at this time.',
  action = null,
  subtle = false,
  className = '',
}) {
  return (
    <div
      className={`empty-state ${subtle ? 'empty-state--subtle' : ''} ${className}`.trim()}
      role="status"
    >
      {icon && <div className="empty-state__icon">{icon}</div>}
      {title && <h4 className="empty-state__title">{title}</h4>}
      {description && <p className="empty-state__description">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}

export default EmptyState;
