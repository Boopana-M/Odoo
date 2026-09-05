import React from 'react';
import './AppShell.css';

/**
 * Reusable MainContent wrapper component
 */
export function MainContent({ children, className = '' }) {
  return (
    <main className={`main-content ${className}`.trim()} role="main">
      {children}
    </main>
  );
}

export default MainContent;
