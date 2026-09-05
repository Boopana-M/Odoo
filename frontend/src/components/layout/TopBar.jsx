import React from 'react';
import { Menu } from 'lucide-react';

/**
 * Reusable Top Navigation Component with Tailwind CSS
 * Supports: context/page area, user profile area with role display, mobile menu toggle
 */
export function TopBar({
  pageContext = 'Design System & Application Shell',
  pageSubtitle = 'PeoplePay360 HR & Payroll Core',
  user = {
    name: 'Admin User',
    role: 'Administrator',
    initials: 'AU',
  },
  onToggleMobile,
  className = '',
}) {
  return (
    <header className={`h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 transition-all ${className}`.trim()}>
      <div className="flex items-center gap-3 md:gap-4">
        {onToggleMobile && (
          <button
            type="button"
            className="lg:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100 p-1.5 rounded transition-colors flex items-center justify-center"
            onClick={onToggleMobile}
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-900">{pageContext}</span>
          {pageSubtitle && (
            <span className="text-xs text-slate-500">{pageSubtitle}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3 select-none">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-semibold text-xs shrink-0" aria-hidden="true">
              {user.initials || (user.name ? user.name.slice(0, 2).toUpperCase() : 'U')}
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-sm font-medium text-slate-900">{user.name || 'User'}</span>
              {user.role && (
                <span className="text-xs text-slate-500">{user.role}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default TopBar;
