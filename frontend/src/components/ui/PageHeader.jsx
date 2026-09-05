import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * Reusable PageHeader Component with Tailwind CSS
 * Supports: title, description, primary actions, secondary actions, breadcrumbs
 */
export function PageHeader({
  title,
  description,
  subtitle,
  breadcrumbs = [],
  primaryAction = null,
  secondaryAction = null,
  action = null,
  className = '',
}) {
  const finalDescription = description || subtitle;
  const finalPrimaryAction = primaryAction || action;

  return (
    <header className={`flex flex-col gap-2 mb-6 ${className}`.trim()}>
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && (
                <ChevronRight size={12} className="text-slate-500 shrink-0" />
              )}
              {idx === breadcrumbs.length - 1 ? (
                <span className="text-slate-200 font-medium" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <span className="text-slate-400 hover:text-slate-200 transition-colors">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[240px]">
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight leading-tight">{title}</h1>
          {finalDescription && <p className="text-sm text-slate-400 mt-1 leading-normal">{finalDescription}</p>}
        </div>

        {(finalPrimaryAction || secondaryAction) && (
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {secondaryAction}
            {finalPrimaryAction}
          </div>
        )}
      </div>
    </header>
  );
}

export default PageHeader;
