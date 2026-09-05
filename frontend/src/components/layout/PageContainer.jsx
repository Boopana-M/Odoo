import React from 'react';

/**
 * Reusable PageContainer Component with Tailwind CSS
 * Provides responsive max-width bounds and consistent page centering
 */
export function PageContainer({ children, className = '', maxWidth }) {
  const style = maxWidth ? { maxWidth } : undefined;

  return (
    <div className={`w-full max-w-[1400px] mx-auto ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

export default PageContainer;
