import React from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import './ErrorState.css';

/**
 * Section or Inline Error Banner Component
 */
export function SectionError({
  title = 'An error occurred',
  message,
  onRetry,
  className = '',
}) {
  return (
    <div className={`error-banner ${className}`.trim()} role="alert">
      <AlertCircle size={18} className="error-banner__icon" />
      <div className="error-banner__content">
        {title && <div className="error-banner__title">{title}</div>}
        {message && <div className="error-banner__message">{message}</div>}
        {onRetry && (
          <div className="error-banner__action">
            <Button size="sm" variant="outline" onClick={onRetry}>
              Try again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Page-Level Error View
 */
export function PageError({
  title = 'Something went wrong',
  message = 'We encountered an error while loading this page. Please try again.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`page-error ${className}`.trim()} role="alert">
      <div className="page-error__icon">
        <AlertTriangle size={24} />
      </div>
      <h3 className="page-error__title">{title}</h3>
      <p className="page-error__message">{message}</p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}

/**
 * Form Field Inline Error
 */
export function InlineError({ message, className = '' }) {
  if (!message) return null;
  return (
    <span className={`inline-error ${className}`.trim()} role="alert">
      <AlertCircle size={14} />
      <span>{message}</span>
    </span>
  );
}

export default {
  SectionError,
  PageError,
  InlineError,
};
