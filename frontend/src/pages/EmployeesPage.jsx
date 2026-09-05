import React, { useState, useEffect, useCallback } from 'react';
import {
  List,
  LayoutGrid,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Users,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ROLES } from '../utils/navigation';
import {
  getEmployeesApi,
  getEmployeeByIdApi,
  getMyEmployeeProfileApi,
  createEmployeeApi,
  updateEmployeeApi,
  deleteEmployeeApi,
  getDepartmentsApi,
  getWorkingSchedulesApi,
} from '../services/employees';

import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { PageLoading } from '../components/ui/LoadingState';
import { PageError, SectionError } from '../components/ui/ErrorState';

import { EmployeeList } from '../modules/employees/EmployeeList';
import { EmployeeKanban } from '../modules/employees/EmployeeKanban';
import { EmployeeDetail } from '../modules/employees/EmployeeDetail';
import { EmployeeForm } from '../modules/employees/EmployeeForm';

/**
 * PeoplePay360 Employee Management Page
 * Handles role-aware directory views (List, Kanban), Detail hub, and Create/Edit forms.
 */
export function EmployeesPage({
  onNavigateToContracts = null,
  onNavigateToAttendance = null,
  onNavigateToTimeOff = null,
}) {
  const { user, token, role } = useAuth();

  const isEmployeeRole = role === ROLES.EMPLOYEE;
  const canManage = [ROLES.ADMIN, ROLES.HR_MANAGER].includes(role);

  // View mode: 'list' | 'kanban' | 'detail' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState(isEmployeeRole ? 'detail' : 'list');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Data state
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [schedules, setSchedules] = useState([]);

  // Loading & Error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  /**
   * Load dropdown relational metadata (Departments & Schedules)
   */
  const loadPrerequisites = useCallback(async () => {
    if (!token) return;
    try {
      const [deptList, schedList] = await Promise.all([
        getDepartmentsApi(token),
        getWorkingSchedulesApi(token),
      ]);
      setDepartments(deptList);
      setSchedules(schedList);
    } catch {
      // Non-blocking for directory display
    }
  }, [token]);

  /**
   * Fetch employees list based on filters (for HR/Admin roles)
   */
  const fetchEmployees = useCallback(async () => {
    if (!token) return;
    if (isEmployeeRole) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getEmployeesApi(token, {
        search: searchQuery,
        departmentId: selectedDept || undefined,
        employeeType: selectedType || undefined,
        status: selectedStatus || undefined,
      });
      setEmployees(data);
    } catch (err) {
      setError(err.message || 'Failed to retrieve employees.');
    } finally {
      setLoading(false);
    }
  }, [token, isEmployeeRole, searchQuery, selectedDept, selectedType, selectedStatus]);

  /**
   * Fetch self profile (for Employee role)
   */
  const fetchSelfProfile = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      let myProfile = null;
      try {
        myProfile = await getMyEmployeeProfileApi(token);
      } catch {
        if (user?.employeeId) {
          myProfile = await getEmployeeByIdApi(token, user.employeeId);
        }
      }

      if (!myProfile) {
        throw new Error('No employee record associated with your user account.');
      }

      setSelectedEmployee(myProfile);
    } catch (err) {
      setError(err.message || 'Unable to access your employee profile.');
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  // Initial data loading
  useEffect(() => {
    loadPrerequisites();
    if (isEmployeeRole) {
      fetchSelfProfile();
    } else {
      fetchEmployees();
    }
  }, [isEmployeeRole, fetchSelfProfile, fetchEmployees, loadPrerequisites]);

  /**
   * Drill-down to employee details
   */
  const handleSelectEmployee = (emp) => {
    setSelectedEmployee(emp);
    setViewMode('detail');
    setFormError(null);
  };

  /**
   * Open employee creation form
   */
  const handleOpenCreate = () => {
    if (!canManage) return;
    setSelectedEmployee(null);
    setFormError(null);
    setViewMode('create');
  };

  /**
   * Open employee editing form
   */
  const handleOpenEdit = (emp) => {
    if (!canManage) return;
    setSelectedEmployee(emp || selectedEmployee);
    setFormError(null);
    setViewMode('edit');
  };

  /**
   * Return to directory (list or kanban)
   */
  const handleBackToDirectory = () => {
    setViewMode('list');
    setFormError(null);
    fetchEmployees();
  };

  /**
   * Handle Create Employee Submission
   */
  const handleCreateSubmit = async (payload) => {
    setFormLoading(true);
    setFormError(null);

    try {
      const created = await createEmployeeApi(token, payload);
      await fetchEmployees();
      setSelectedEmployee(created);
      setViewMode('detail');
    } catch (err) {
      setFormError(err.message || 'Failed to create employee record.');
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * Handle Edit Employee Submission
   */
  const handleEditSubmit = async (payload) => {
    if (!selectedEmployee) return;

    setFormLoading(true);
    setFormError(null);

    try {
      const updated = await updateEmployeeApi(
        token,
        selectedEmployee._id || selectedEmployee.id,
        payload
      );
      await fetchEmployees();
      setSelectedEmployee(updated);
      setViewMode('detail');
    } catch (err) {
      setFormError(err.message || 'Failed to update employee record.');
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * Handle Delete Employee
   */
  const handleDeleteEmployee = async (id) => {
    if (!canManage) return;

    setIsDeleting(true);
    try {
      await deleteEmployeeApi(token, id);
      setSelectedEmployee(null);
      setViewMode('list');
      await fetchEmployees();
    } catch (err) {
      setError(err.message || 'Failed to delete employee record.');
    } finally {
      setIsDeleting(false);
    }
  };

  // 1. Employee Role View: Dedicated Self Profile Detail Hub
  if (isEmployeeRole) {
    if (loading) {
      return <PageLoading message="Loading your employee profile..." className="[&_p]:!text-slate-400" />;
    }

    if (error) {
      return (
        <PageError
          title="Employee Profile Unavailable"
          message={error}
          onRetry={fetchSelfProfile}
          className="!bg-slate-900 !border-slate-800 !text-slate-200"
        />
      );
    }

    return (
      <div className="space-y-6">
        <PageHeader
          title="My Employee Profile"
          description="View your official HR master record, job position, department, and direct deposit details."
          breadcrumbs={[{ label: 'Self-Service' }, { label: 'My Profile' }]}
        />
        <EmployeeDetail
          employee={selectedEmployee}
          isSelf={true}
          canEdit={false}
          canDelete={false}
        />
      </div>
    );
  }

  // 2. Create Employee Form View
  if (viewMode === 'create') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Create New Employee"
          description="Register a new employee record in the central HR directory."
          breadcrumbs={[
            { label: 'HR Management' },
            { label: 'Employees', href: '#' },
            { label: 'New Employee' },
          ]}
        />
        <EmployeeForm
          departments={departments}
          schedules={schedules}
          managers={employees}
          onSubmit={handleCreateSubmit}
          onCancel={handleBackToDirectory}
          isLoading={formLoading}
          error={formError}
        />
      </div>
    );
  }

  // 3. Edit Employee Form View
  if (viewMode === 'edit' && selectedEmployee) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`Edit Employee: ${selectedEmployee.employeeCode}`}
          description={`Update employee master record for ${selectedEmployee.firstName} ${selectedEmployee.lastName}.`}
          breadcrumbs={[
            { label: 'HR Management' },
            { label: 'Employees' },
            { label: selectedEmployee.employeeCode },
            { label: 'Edit' },
          ]}
        />
        <EmployeeForm
          initialData={selectedEmployee}
          departments={departments}
          schedules={schedules}
          managers={employees}
          onSubmit={handleEditSubmit}
          onCancel={() => setViewMode('detail')}
          isLoading={formLoading}
          error={formError}
        />
      </div>
    );
  }

  // 4. Employee Detail Hub View
  if (viewMode === 'detail' && selectedEmployee) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
          description={`Employee Code: ${selectedEmployee.employeeCode} · ${selectedEmployee.jobPosition}`}
          breadcrumbs={[
            { label: 'HR Management' },
            { label: 'Employees' },
            { label: selectedEmployee.employeeCode },
          ]}
        />
        <EmployeeDetail
          employee={selectedEmployee}
          onBack={handleBackToDirectory}
          onEdit={handleOpenEdit}
          onDelete={handleDeleteEmployee}
          onViewContracts={onNavigateToContracts ? (emp) => onNavigateToContracts(emp._id || emp.id) : null}
          onViewAttendance={onNavigateToAttendance ? (emp) => onNavigateToAttendance(emp._id || emp.id) : null}
          onViewTimeOff={onNavigateToTimeOff ? (emp) => onNavigateToTimeOff(emp._id || emp.id) : null}
          canEdit={canManage}
          canDelete={canManage}
          isDeleting={isDeleting}
        />
      </div>
    );
  }

  // 5. Main Employee Directory (List / Kanban View)
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Employee Directory"
        description="Centralized master repository of all organizational employee records, departments, and employment contracts."
        breadcrumbs={[{ label: 'HR Management' }, { label: 'Employees' }]}
        primaryAction={
          canManage ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={handleOpenCreate}
            >
              Add Employee
            </Button>
          ) : null
        }
        secondaryAction={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={fetchEmployees}
            className="!border-slate-800 !bg-slate-900 !text-slate-300 hover:!bg-slate-800"
          >
            Refresh
          </Button>
        }
      />

      {/* Filter & View Switcher Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email, employee code, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Controls: Department filter & View Switcher */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-9 px-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id || dept.id} value={dept._id || dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>

            {/* Employee Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-9 px-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Contract">Contract</option>
              <option value="Intern">Intern</option>
              <option value="Temporary">Temporary</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 px-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
              <option value="Terminated">Terminated</option>
            </select>

            {/* View Switcher: List vs Kanban */}
            <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-lg">
              <button
                type="button"
                title="List View"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <List size={16} />
              </button>
              <button
                type="button"
                title="Kanban View"
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Global Fetch Error Banner */}
      {error && (
        <SectionError
          title="Failed to Load Employees"
          message={error}
          onRetry={fetchEmployees}
          className="!bg-slate-900 !border-red-900/50 !text-red-300"
        />
      )}

      {/* View Content (List or Kanban) */}
      {viewMode === 'list' ? (
        <EmployeeList
          employees={employees}
          loading={loading}
          error={error}
          onRetry={fetchEmployees}
          onSelectEmployee={handleSelectEmployee}
          onCreateEmployee={handleOpenCreate}
          canCreate={canManage}
          canEdit={canManage}
          onEditEmployee={handleOpenEdit}
        />
      ) : (
        <EmployeeKanban
          employees={employees}
          loading={loading}
          error={error}
          onRetry={fetchEmployees}
          onSelectEmployee={handleSelectEmployee}
          onCreateEmployee={handleOpenCreate}
          canCreate={canManage}
        />
      )}
    </div>
  );
}

export default EmployeesPage;
