import React from 'react';

/**
 * Reusable MainContent wrapper component with Tailwind CSS
 */
export function MainContent({ children, className = '' }) {
  return (
    <main className={`flex-1 p-4 md:p-6 ${className}`.trim()} role="main">
      {children}
    </main>
  );
}

export default MainContent;
