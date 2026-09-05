import React from 'react';
import {
  Users,
  Calendar,
  FileText,
  Clock,
  Briefcase,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import './Sidebar.css';

/**
 * Reusable Sidebar Navigation Item Component
 */
export function SidebarItem({
  icon,
  label,
  active = false,
  collapsed = false,
  onClick,
  badge = null,
}) {
  return (
    <button
      type="button"
      className={`sidebar__item ${active ? 'sidebar__item--active' : ''}`}
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-current={active ? 'page' : undefined}
    >
      <span className="sidebar__item-icon">{icon}</span>
      {!collapsed && <span className="sidebar__item-text">{label}</span>}
      {!collapsed && badge && <span className="sidebar__item-badge">{badge}</span>}
    </button>
  );
}

/**
 * Reusable Sidebar Navigation Component
 * Supports: branding, sections, navigation items, collapse/expand, mobile responsiveness
 */
export function Sidebar({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
  activeItem = 'design-system',
  onNavigate,
  sections = null,
}) {
  // Default navigation structure based on current verified system capabilities
  const defaultSections = [
    {
      title: 'Design System',
      items: [
        {
          id: 'design-system',
          label: 'UI Design System',
          icon: <LayoutGrid size={18} />,
        },
      ],
    },
    {
      title: 'HR Modules (Future)',
      items: [
        {
          id: 'employees',
          label: 'Employees',
          icon: <Users size={18} />,
        },
        {
          id: 'contracts',
          label: 'Contracts',
          icon: <FileText size={18} />,
        },
        {
          id: 'attendance',
          label: 'Attendance',
          icon: <Clock size={18} />,
        },
        {
          id: 'time-off',
          label: 'Time Off',
          icon: <Calendar size={18} />,
        },
        {
          id: 'schedules',
          label: 'Working Schedules',
          icon: <Briefcase size={18} />,
        },
      ],
    },
    {
      title: 'Administration',
      items: [
        {
          id: 'admin',
          label: 'System Roles',
          icon: <Shield size={18} />,
        },
      ],
    },
  ];

  const activeSections = sections || defaultSections;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'sidebar-overlay--visible' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside
        className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${
          mobileOpen ? 'sidebar--mobile-open' : ''
        }`}
        aria-label="Primary Navigation"
      >
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <div className="sidebar__logo-icon">P</div>
            {!collapsed && <span className="sidebar__brand-text">PeoplePay360</span>}
          </div>

          {onToggleCollapse && (
            <button
              type="button"
              className="sidebar__collapse-btn"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          )}
        </div>

        <nav className="sidebar__nav">
          {activeSections.map((section, sIdx) => (
            <div key={section.title || sIdx} className="sidebar__section">
              {!collapsed && section.title && (
                <div className="sidebar__section-label">{section.title}</div>
              )}
              {section.items.map((item) => (
                <SidebarItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={activeItem === item.id}
                  collapsed={collapsed}
                  badge={item.badge}
                  onClick={() => {
                    if (onNavigate) onNavigate(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                />
              ))}
            </div>
          ))}
        </nav>

        {!collapsed && (
          <div className="sidebar__footer">
            <span>PeoplePay360 HR</span>
            <span>v1.0.0</span>
          </div>
        )}
      </aside>
    </>
  );
}

export default Sidebar;
