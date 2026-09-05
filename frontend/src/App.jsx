import React, { useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { getNavigationForRole } from './utils/navigation';
import { AppShell } from './components/layout/AppShell';
import { PageLoading } from './components/ui/LoadingState';
import { Login } from './pages/Login';
import { RoleLanding } from './pages/RoleLanding';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { WorkingSchedulesPage } from './pages/WorkingSchedulesPage';
import { ContractsPage } from './pages/ContractsPage';
import { AttendancePage } from './pages/AttendancePage';
import { TimeOffPage } from './pages/TimeOffPage';
import { SalaryStructuresPage } from './pages/SalaryStructuresPage';
import { SalaryRulesPage } from './pages/SalaryRulesPage';
import { PayrunsPage } from './pages/PayrunsPage';
import { PayslipsPage } from './pages/PayslipsPage';

/**
 * Authenticated Core Application Router
 * Distinguishes unauthenticated (Login), authenticating (Loading), and authenticated (AppShell).
 */
function MainRouter() {
  const { user, role, isAuthenticated, isLoading, logout } = useAuth();
  const [selectedNavItem, setSelectedNavItem] = useState('');
  const [contractEmployeeFilter, setContractEmployeeFilter] = useState(null);
  const [attendanceEmployeeFilter, setAttendanceEmployeeFilter] = useState(null);
  const [timeOffEmployeeFilter, setTimeOffEmployeeFilter] = useState(null);
  const [salaryStructureRuleFilter, setSalaryStructureRuleFilter] = useState(null);
  const [payslipEmployeeFilter, setPayslipEmployeeFilter] = useState(null);

  // Determine role-permitted navigation sections
  const sidebarSections = getNavigationForRole(role);
  const defaultItem = sidebarSections[0]?.items[0]?.id || '';

  // Derive activeNavItem: if selectedNavItem is permitted in current role, use it; otherwise fallback to default
  const isAllowed = sidebarSections.some((sec) =>
    sec.items.some((item) => item.id === selectedNavItem)
  );
  const activeNavItem = isAllowed && selectedNavItem ? selectedNavItem : defaultItem;

  const handleNavigate = (itemId) => {
    if (itemId !== 'contracts') {
      setContractEmployeeFilter(null);
    }
    if (itemId !== 'attendance') {
      setAttendanceEmployeeFilter(null);
    }
    if (itemId !== 'time-off') {
      setTimeOffEmployeeFilter(null);
    }
    if (itemId !== 'salary-rules') {
      setSalaryStructureRuleFilter(null);
    }
    if (itemId !== 'payslips') {
      setPayslipEmployeeFilter(null);
    }
    setSelectedNavItem(itemId);
  };

  // 1. Initial Authentication & Session Restoration Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <PageLoading
          message="Verifying PeoplePay360 authentication session..."
          className="[&_p]:!text-slate-400 [&_div]:!border-t-blue-500"
        />
      </div>
    );
  }

  // 2. Unauthenticated Access -> Render Login Screen
  if (!isAuthenticated || !user) {
    return <Login />;
  }

  // 3. Render appropriate active module
  const renderActiveModule = () => {
    if (activeNavItem === 'dashboard') {
      return <DashboardPage onNavigate={handleNavigate} />;
    }
    if (activeNavItem === 'employees' || activeNavItem === 'employee-profile') {
      return (
        <EmployeesPage
          onNavigateToContracts={(empId) => {
            setContractEmployeeFilter(empId);
            setSelectedNavItem('contracts');
          }}
          onNavigateToAttendance={(empId) => {
            setAttendanceEmployeeFilter(empId);
            setSelectedNavItem('attendance');
          }}
          onNavigateToTimeOff={(empId) => {
            setTimeOffEmployeeFilter(empId);
            setSelectedNavItem('time-off');
          }}
        />
      );
    }
    if (activeNavItem === 'departments') {
      return <DepartmentsPage />;
    }
    if (activeNavItem === 'schedules') {
      return <WorkingSchedulesPage />;
    }
    if (activeNavItem === 'contracts') {
      return (
        <ContractsPage
          key={contractEmployeeFilter || 'all'}
          initialEmployeeFilter={contractEmployeeFilter}
        />
      );
    }
    if (activeNavItem === 'attendance') {
      return (
        <AttendancePage
          key={attendanceEmployeeFilter || 'all'}
          initialEmployeeFilter={attendanceEmployeeFilter}
        />
      );
    }
    if (activeNavItem === 'time-off') {
      return (
        <TimeOffPage
          key={timeOffEmployeeFilter || 'all'}
          initialEmployeeFilter={timeOffEmployeeFilter}
        />
      );
    }
    if (activeNavItem === 'salary-structures') {
      return (
        <SalaryStructuresPage
          onNavigateToRules={(structId) => {
            setSalaryStructureRuleFilter(structId);
            setSelectedNavItem('salary-rules');
          }}
        />
      );
    }
    if (activeNavItem === 'salary-rules') {
      return (
        <SalaryRulesPage
          key={salaryStructureRuleFilter || 'all'}
          initialStructureFilter={salaryStructureRuleFilter}
        />
      );
    }
    if (activeNavItem === 'payruns') {
      return <PayrunsPage />;
    }
    if (activeNavItem === 'payslips') {
      return (
        <PayslipsPage
          key={payslipEmployeeFilter || 'all'}
          initialEmployeeFilter={payslipEmployeeFilter}
        />
      );
    }
    return <RoleLanding activeNavItem={activeNavItem} />;
  };

  // 4. Authenticated Access -> Render Role-Aware AppShell
  return (
    <AppShell
      pageContext="PeoplePay360"
      pageSubtitle={`${user.role || 'HR & Payroll'} Suite`}
      user={user}
      sidebarSections={sidebarSections}
      activeNavItem={activeNavItem}
      onNavigate={handleNavigate}
      onLogout={logout}
    >
      {renderActiveModule()}
    </AppShell>
  );
}

/**
 * Root Application Component with Auth Provider
 */
export function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}

export default App;
