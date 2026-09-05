import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/auth/Login';
import UserManagement from './pages/auth/UserManagement';
import Dashboard from './pages/dashboard/Dashboard';
import EmployeeList from './pages/employees/EmployeeList';
import EmployeeDetail from './pages/employees/EmployeeDetail';
import DepartmentList from './pages/departments/DepartmentList';
import ContractList from './pages/contracts/ContractList';
import ContractDetail from './pages/contracts/ContractDetail';
import ScheduleList from './pages/schedules/ScheduleList';
import ScheduleDetail from './pages/schedules/ScheduleDetail';
import AttendanceList from './pages/attendance/AttendanceList';
import TimeOffHub from './pages/timeoff/TimeOffHub';
import SalaryStructureList from './pages/salary/SalaryStructureList';
import SalaryStructureDetail from './pages/salary/SalaryStructureDetail';
import SalaryRuleList from './pages/salary/SalaryRuleList';
import PayrunList from './pages/payrun/PayrunList';
import PayrunDetail from './pages/payrun/PayrunDetail';
import PayslipList from './pages/payslip/PayslipList';
import PayslipDetail from './pages/payslip/PayslipDetail';

import { useAuth } from './context/AuthContext';

function RootRedirect() {
  const { isEmployeeOnly, role } = useAuth();
  if (isEmployeeOnly || role === 'Employee') {
    return <Navigate to="/employees" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

export function App() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public Auth */}
          <Route path="/login" element={<Login />} />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Employees */}
          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <EmployeeList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/:id"
            element={
              <ProtectedRoute>
                <EmployeeDetail />
              </ProtectedRoute>
            }
          />

          {/* Departments Management */}
          <Route
            path="/departments"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'HR Manager']}>
                <DepartmentList />
              </ProtectedRoute>
            }
          />

          {/* Contracts */}
          <Route
            path="/contracts"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User']}>
                <ContractList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contracts/:id"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User']}>
                <ContractDetail />
              </ProtectedRoute>
            }
          />

          {/* Working Schedules */}
          <Route
            path="/schedules"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User']}>
                <ScheduleList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedules/:id"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User']}>
                <ScheduleDetail />
              </ProtectedRoute>
            }
          />

          {/* Attendance */}
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <AttendanceList />
              </ProtectedRoute>
            }
          />

          {/* Time Off Hub */}
          <Route
            path="/time-off"
            element={<Navigate to="/time-off/requests" replace />}
          />
          <Route
            path="/time-off/requests"
            element={
              <ProtectedRoute>
                <TimeOffHub />
              </ProtectedRoute>
            }
          />
          <Route
            path="/time-off/allocations"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Employee']}>
                <TimeOffHub />
              </ProtectedRoute>
            }
          />
          <Route
            path="/time-off/types"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User']}>
                <TimeOffHub />
              </ProtectedRoute>
            }
          />

          {/* Salary Structures & Rules */}
          <Route
            path="/payroll/structures"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'HR Payroll Manager', 'HR Payroll User']}>
                <SalaryStructureList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payroll/structures/:id"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'HR Payroll Manager', 'HR Payroll User']}>
                <SalaryStructureDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payroll/rules"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'HR Payroll Manager', 'HR Payroll User']}>
                <SalaryRuleList />
              </ProtectedRoute>
            }
          />

          {/* Payruns */}
          <Route
            path="/payroll/payruns"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'HR Payroll Manager', 'HR Payroll User']}>
                <PayrunList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payroll/payruns/:id"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'HR Payroll Manager', 'HR Payroll User']}>
                <PayrunDetail />
              </ProtectedRoute>
            }
          />

          {/* Payslips */}
          <Route
            path="/payroll/payslips"
            element={
              <ProtectedRoute>
                <PayslipList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payroll/payslips/:id"
            element={
              <ProtectedRoute>
                <PayslipDetail />
              </ProtectedRoute>
            }
          />

          {/* Admin User Management */}
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />

          {/* Default catch-all */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
