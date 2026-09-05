import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MainContent } from './MainContent';
import { PageContainer } from './PageContainer';

/**
 * Reusable AppShell Component with Tailwind CSS
 * Assembles the full authenticated application shell:
 * - Sidebar (collapsible, mobile overlay)
 * - TopBar (page context, user info, role)
 * - MainContent area
 * - PageContainer
 */
export function AppShell({
  children,
  pageContext,
  pageSubtitle,
  user,
  sidebarSections,
  activeNavItem,
  onNavigate,
  className = '',
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => !prev);
  };

  const handleToggleMobile = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleCloseMobile = () => {
    setMobileOpen(false);
  };

  const marginClasses = collapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]';

  return (
    <div className={`flex min-h-screen bg-slate-50 text-slate-900 ${className}`.trim()}>
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={handleCloseMobile}
        activeItem={activeNavItem}
        onNavigate={onNavigate}
        sections={sidebarSections}
      />

      <div className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-200 ml-0 ${marginClasses}`}>
        <TopBar
          pageContext={pageContext}
          pageSubtitle={pageSubtitle}
          user={user}
          onToggleMobile={handleToggleMobile}
        />

        <MainContent>
          <PageContainer>{children}</PageContainer>
        </MainContent>
      </div>
    </div>
  );
}

export default AppShell;
