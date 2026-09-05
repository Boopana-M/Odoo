import React from 'react';
import { Menu, LogOut } from 'lucide-react';

/**
 * Reusable Top Navigation Component with Tailwind CSS
 * Supports: context/page area, user profile area with role display, logout action, mobile menu toggle
 */
export function TopBar({
  pageContext = 'PeoplePay360',
  pageSubtitle = 'HR & Payroll Platform',
  user,
  onLogout,
  onToggleMobile,
  className = '',
}) {
  return (
    <header className={`h-16 bg-slate-900 border-b border-slate-800 text-slate-100 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 transition-all ${className}`.trim()}>
      <div className="flex items-center gap-3 md:gap-4">
        {onToggleMobile && (
          <button
            type="button"
            className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded transition-colors flex items-center justify-center cursor-pointer"
            onClick={onToggleMobile}
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">{pageContext}</span>
          {pageSubtitle && (
            <span className="text-xs text-slate-400">{pageSubtitle}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {user && (
          <div className="flex items-center gap-3 select-none">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-xs shrink-0 shadow-sm" aria-hidden="true">
              {user.initials || (user.name ? user.name.slice(0, 2).toUpperCase() : 'U')}
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-sm font-medium text-white">{user.name || 'User'}</span>
              {user.role && (
                <span className="text-xs text-slate-400">{user.role}</span>
              )}
            </div>
          </div>
        )}

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
            title="Sign out of PeoplePay360"
            aria-label="Sign out"
          >
            <LogOut size={15} />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        )}
      </div>
    </header>
  );
}

export default TopBar;
