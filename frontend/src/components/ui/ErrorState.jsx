import React from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

/**
 * Section or Inline Error Banner Component with Tailwind CSS
 */
export function SectionError({
  title = 'An error occurred',
  message,
  onRetry,
  className = '',
}) {
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-md bg-red-50 border border-red-200 text-red-900 text-sm mb-4 ${className}`.trim()}
      role="alert"
    >
      <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {title && <div className="font-semibold mb-1 text-red-900">{title}</div>}
        {message && <div className="text-xs text-red-800 leading-normal">{message}</div>}
        {onRetry && (
          <div className="mt-2">
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
    <div
      className={`flex flex-col items-center justify-center text-center p-10 md:p-12 bg-white border border-slate-200 rounded-lg my-4 ${className}`.trim()}
      role="alert"
    >
      <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
        <AlertTriangle size={24} />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-5 leading-normal">{message}</p>
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
    <span
      className={`inline-flex items-center gap-1 text-xs text-red-600 font-medium mt-1 ${className}`.trim()}
      role="alert"
    >
      <AlertCircle size={13} className="shrink-0" />
      <span>{message}</span>
    </span>
  );
}

export default {
  SectionError,
  PageError,
  InlineError,
};
