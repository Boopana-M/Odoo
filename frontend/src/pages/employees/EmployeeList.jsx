import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Users, LayoutGrid, List, Plus, Search, Filter, Mail, Briefcase, Building } from 'lucide-react';
import { employeeApi } from '../../api/employeeApi';
import { departmentApi } from '../../api/departmentApi';
import { scheduleApi } from '../../api/scheduleApi';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export function EmployeeList() {
  const navigate = useNavigate();
  const { isHRManager, isEmployeeOnly, user } = useAuth();
  const { success, error } = useNotification();

  if (isEmployeeOnly) {
    return <Navigate to="/employees/me" replace />;
  }

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'

  // Filters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    departmentId: '',
    managerId: '',
    scheduleId: '',
    jobPosition: '',
    employeeType: 'Full-Time',
    status: 'Active',
    bankDetails: {
      bankName: '',
      accountNumber: '',
      accountHolderName: '',
      routingNumber: ''
    }
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      if (isEmployeeOnly) {
        // If employee user, fetch own profile
        const res = await employeeApi.getMyProfile();
        setEmployees(res?.data ? [res.data] : []);
      } else {
        const [empRes, deptRes, schedRes] = await Promise.all([
          employeeApi.getAll({
            search,
            departmentId: deptFilter,
            employeeType: typeFilter,
            status: statusFilter
          }),
          departmentApi.getAll(),
          scheduleApi.getAll()
        ]);
        setEmployees(empRes.data || []);
        setDepartments(deptRes.data || []);
        setSchedules(schedRes.data || []);
      }
    } catch (err) {
      error(err.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, deptFilter, typeFilter, statusFilter, isEmployeeOnly]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newEmployee,
        managerId: newEmployee.managerId || null,
        scheduleId: newEmployee.scheduleId || null
      };
      const res = await employeeApi.create(payload);
      success('Employee created successfully');
      setIsCreateOpen(false);
      fetchEmployees();
      navigate(`/employees/${res.data._id}`);
    } catch (err) {
      error(err.message || 'Failed to create employee');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-area">
          <Users size={24} color="var(--primary)" />
          <h1 className="page-title">Employees Directory</h1>
        </div>

        <div className="page-actions">
          {/* View Mode Switcher */}
          {!isEmployeeOnly && (
            <div style={{ display: 'flex', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('kanban')}
                style={{ border: 'none' }}
              >
                <LayoutGrid size={16} /> Kanban
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('list')}
                style={{ border: 'none' }}
              >
                <List size={16} /> List
              </button>
            </div>
          )}

          {isHRManager && (
            <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
              <Plus size={16} /> New Employee
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      {!isEmployeeOnly && (
        <div className="filter-bar">
          <div className="filter-inputs" style={{ flex: 1 }}>
            <div style={{ position: 'relative', minWidth: 240 }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, code, title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.2rem', width: '100%' }}
              />
              <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
            </div>

            <select
              className="form-control"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>

            <select
              className="form-control"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Employee Types</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Contract">Contract</option>
              <option value="Intern">Intern</option>
              <option value="Temporary">Temporary</option>
            </select>

            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>
        </div>
      )}

      {/* Employees Kanban View */}
      {viewMode === 'kanban' && (
        <div className="kanban-grid">
          {employees.map((emp) => (
            <div
              key={emp._id}
              className="kanban-card"
              onClick={() => navigate(`/employees/${emp._id}`)}
            >
              <div>
                <div className="kanban-header">
                  <div className="avatar">
                    {emp.firstName?.[0]}{emp.lastName?.[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {emp.firstName} {emp.lastName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {emp.jobPosition}
                    </div>
                  </div>
                  <StatusBadge status={emp.status} />
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Building size={14} />
                    <span>{emp.departmentId?.name || 'No Dept'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Mail size={14} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Briefcase size={14} />
                    <span>{emp.employeeType} ({emp.employeeCode})</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Employees List View */}
      {viewMode === 'list' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Employee Name</th>
                <th>Job Position</th>
                <th>Department</th>
                <th>Email</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr
                  key={emp._id}
                  onClick={() => navigate(`/employees/${emp._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontWeight: 600 }}>{emp.employeeCode}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                        {emp.firstName?.[0]}{emp.lastName?.[0]}
                      </div>
                      <span style={{ fontWeight: 600 }}>{emp.firstName} {emp.lastName}</span>
                    </div>
                  </td>
                  <td>{emp.jobPosition}</td>
                  <td>{emp.departmentId?.name || '-'}</td>
                  <td>{emp.email}</td>
                  <td><span className="badge badge-neutral">{emp.employeeType}</span></td>
                  <td><StatusBadge status={emp.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {employees.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No employees found matching criteria.</p>
        </div>
      )}

      {/* Create Employee Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Employee"
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreate}>
              Save Employee
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="form-grid">
          <div className="form-group">
            <label className="form-label required">Employee Code</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. EMP001"
              value={newEmployee.employeeCode}
              onChange={(e) => setNewEmployee({ ...newEmployee, employeeCode: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Job Position</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Senior Software Engineer"
              value={newEmployee.jobPosition}
              onChange={(e) => setNewEmployee({ ...newEmployee, jobPosition: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">First Name</label>
            <input
              type="text"
              className="form-control"
              value={newEmployee.firstName}
              onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Last Name</label>
            <input
              type="text"
              className="form-control"
              value={newEmployee.lastName}
              onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Work Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="employee@company.com"
              value={newEmployee.email}
              onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Department</label>
            <select
              className="form-control"
              value={newEmployee.departmentId}
              onChange={(e) => setNewEmployee({ ...newEmployee, departmentId: e.target.value })}
              required
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Manager</label>
            <select
              className="form-control"
              value={newEmployee.managerId}
              onChange={(e) => setNewEmployee({ ...newEmployee, managerId: e.target.value })}
            >
              <option value="">None (Top Level)</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName} ({emp.jobPosition})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Working Schedule</label>
            <select
              className="form-control"
              value={newEmployee.scheduleId}
              onChange={(e) => setNewEmployee({ ...newEmployee, scheduleId: e.target.value })}
            >
              <option value="">Select Working Schedule</option>
              {schedules.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.weeklyHours} hrs/week)</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">Employee Type</label>
            <select
              className="form-control"
              value={newEmployee.employeeType}
              onChange={(e) => setNewEmployee({ ...newEmployee, employeeType: e.target.value })}
            >
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Contract">Contract</option>
              <option value="Intern">Intern</option>
              <option value="Temporary">Temporary</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">Status</label>
            <select
              className="form-control"
              value={newEmployee.status}
              onChange={(e) => setNewEmployee({ ...newEmployee, status: e.target.value })}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>

          <div className="form-group full-width" style={{ marginTop: '0.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Bank Details (For Direct Payroll Checks)
            </h4>
          </div>

          <div className="form-group">
            <label className="form-label">Bank Name</label>
            <input
              type="text"
              className="form-control"
              value={newEmployee.bankDetails.bankName}
              onChange={(e) => setNewEmployee({
                ...newEmployee,
                bankDetails: { ...newEmployee.bankDetails, bankName: e.target.value }
              })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Account Number</label>
            <input
              type="text"
              className="form-control"
              value={newEmployee.bankDetails.accountNumber}
              onChange={(e) => setNewEmployee({
                ...newEmployee,
                bankDetails: { ...newEmployee.bankDetails, accountNumber: e.target.value }
              })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default EmployeeList;
