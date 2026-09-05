import React from 'react';
import './AppShell.css';

/**
 * Reusable PageContainer Component
 * Provides responsive max-width bounds and consistent page centering
 */
export function PageContainer({ children, className = '', maxWidth }) {
  const style = maxWidth ? { maxWidth } : undefined;

  return (
    <div className={`page-container ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

export default PageContainer;
