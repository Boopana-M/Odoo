import React from 'react';
import { Menu } from 'lucide-react';
import './TopBar.css';

/**
 * Reusable Top Navigation Component
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
    <header className={`topbar ${className}`.trim()}>
      <div className="topbar__left">
        {onToggleMobile && (
          <button
            type="button"
            className="topbar__mobile-toggle"
            onClick={onToggleMobile}
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="topbar__context">
          <span className="topbar__context-title">{pageContext}</span>
          {pageSubtitle && (
            <span className="topbar__context-subtitle">{pageSubtitle}</span>
          )}
        </div>
      </div>

      <div className="topbar__right">
        {user && (
          <div className="topbar__user">
            <div className="topbar__avatar" aria-hidden="true">
              {user.initials || (user.name ? user.name.slice(0, 2).toUpperCase() : 'U')}
            </div>
            <div className="topbar__user-info">
              <span className="topbar__user-name">{user.name || 'User'}</span>
              {user.role && (
                <span className="topbar__user-role">{user.role}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default TopBar;
