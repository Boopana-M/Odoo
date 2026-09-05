import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MainContent } from './MainContent';
import { PageContainer } from './PageContainer';
import './AppShell.css';

/**
 * Reusable AppShell Component
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

  return (
    <div className={`app-shell ${className}`.trim()}>
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={handleCloseMobile}
        activeItem={activeNavItem}
        onNavigate={onNavigate}
        sections={sidebarSections}
      />

      <div
        className={`app-shell__body ${
          collapsed ? 'app-shell__body--collapsed' : ''
        }`}
      >
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
