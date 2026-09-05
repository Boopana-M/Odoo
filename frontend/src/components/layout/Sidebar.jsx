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

/**
 * Reusable Sidebar Navigation Item Component with Tailwind CSS
 */
export function SidebarItem({
  icon,
  label,
  active = false,
  collapsed = false,
  onClick,
  badge = null,
}) {
  const activeClasses = active
    ? 'bg-blue-600 text-white hover:bg-blue-700'
    : 'text-slate-400 hover:bg-slate-800 hover:text-white';

  return (
    <button
      type="button"
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer border border-transparent whitespace-nowrap ${activeClasses}`}
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-current={active ? 'page' : undefined}
    >
      <span className="flex items-center justify-center shrink-0">{icon}</span>
      {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
      {!collapsed && badge && <span className="shrink-0">{badge}</span>}
    </button>
  );
}

/**
 * Reusable Sidebar Navigation Component with Tailwind CSS
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
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 bg-slate-900 text-slate-400 z-50 flex flex-col border-r border-slate-800 transition-all duration-200 ${
          collapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'
        } w-[260px] ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Primary Navigation"
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-md">
              P
            </div>
            {!collapsed && (
              <span className="text-base font-bold text-white whitespace-nowrap tracking-tight">
                PeoplePay360
              </span>
            )}
          </div>

          {onToggleCollapse && (
            <button
              type="button"
              className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded transition-colors hidden lg:flex items-center justify-center"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          )}
        </div>

        {/* Navigation body */}
        <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
          {activeSections.map((section, sIdx) => (
            <div key={section.title || sIdx} className="flex flex-col gap-1">
              {!collapsed && section.title && (
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 py-1.5 whitespace-nowrap overflow-hidden truncate">
                  {section.title}
                </div>
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

        {/* Footer */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between shrink-0">
            <span>PeoplePay360 HR</span>
            <span>v1.0.0</span>
          </div>
        )}
      </aside>
    </>
  );
}

export default Sidebar;
