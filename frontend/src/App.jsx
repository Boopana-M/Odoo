import React, { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { DesignSystemPreview } from './pages/DesignSystemPreview';

/**
 * Main Application Component
 * Demonstrates the Phase 1 Application Shell + Design System
 */
export function App() {
  const [activeNavItem, setActiveNavItem] = useState('design-system');

  // Active user representation for TopBar display
  const currentUser = {
    name: 'Admin User',
    role: 'HR & Payroll Admin',
    initials: 'AD',
  };

  return (
    <AppShell
      pageContext="UI Design System"
      pageSubtitle="PeoplePay360 Foundation"
      user={currentUser}
      activeNavItem={activeNavItem}
      onNavigate={(itemId) => setActiveNavItem(itemId)}
    >
      <DesignSystemPreview />
    </AppShell>
  );
}

export default App;
