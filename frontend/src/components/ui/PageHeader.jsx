import React from 'react';
import { ChevronRight } from 'lucide-react';
import './PageHeader.css';

/**
 * Reusable PageHeader Component
 * Supports: title, description, primary actions, secondary actions, breadcrumbs
 */
export function PageHeader({
  title,
  description,
  breadcrumbs = [],
  primaryAction = null,
  secondaryAction = null,
  className = '',
}) {
  return (
    <header className={`page-header ${className}`.trim()}>
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="page-header__breadcrumbs">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && (
                <ChevronRight size={12} className="page-header__breadcrumb-separator" />
              )}
              {idx === breadcrumbs.length - 1 ? (
                <span className="page-header__breadcrumb-item page-header__breadcrumb-item--active" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <span className="page-header__breadcrumb-item">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="page-header__main">
        <div className="page-header__content">
          <h1 className="page-header__title">{title}</h1>
          {description && <p className="page-header__description">{description}</p>}
        </div>

        {(primaryAction || secondaryAction) && (
          <div className="page-header__actions">
            {secondaryAction}
            {primaryAction}
          </div>
        )}
      </div>
    </header>
  );
}

export default PageHeader;
