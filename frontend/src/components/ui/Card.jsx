import React from 'react';
import './Card.css';

/**
 * Reusable Card Component
 * Supports: title, description, actions, children, footer, hoverable
 */
export function Card({
  title,
  description,
  action,
  footer,
  children,
  hoverable = false,
  className = '',
  ...props
}) {
  const hasHeader = title || description || action;

  return (
    <div
      className={`card ${hoverable ? 'card--hoverable' : ''} ${className}`.trim()}
      {...props}
    >
      {hasHeader && (
        <div className="card__header">
          <div className="card__header-content">
            {title && <h3 className="card__title">{title}</h3>}
            {description && <p className="card__description">{description}</p>}
          </div>
          {action && <div className="card__action">{action}</div>}
        </div>
      )}
      <div className="card__body">{children}</div>
      {footer && <div className="card__footer">{footer}</div>}
    </div>
  );
}

export default Card;
