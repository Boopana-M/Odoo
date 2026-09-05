import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, Check, X, User, Building, Briefcase, CreditCard, KeyRound } from 'lucide-react';
import { authApi } from '../../api/authApi';
import { employeeApi } from '../../api/employeeApi';
import { departmentApi } from '../../api/departmentApi';
import { scheduleApi } from '../../api/scheduleApi';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useNotification } from '../../context/NotificationContext';

export function UserManagement() {
  const { success, error } = useNotification();
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteUserId, setDeleteUserId] = useState(null);

  // Reset Password Modal State
  const [resetUserTarget, setResetUserTarget] = useState(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showAdminResetPassword, setShowAdminResetPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const initialFormState = {
    role: 'Employee',
    name: '',
    email: '',
    password: '',
    isActive: true,
    // Employee profile fields
    firstName: '',
    lastName: '',
    employeeCode: '',
    departmentId: '',
    managerId: '',
    scheduleId: '',
    jobPosition: '',
    employeeType: 'Full-Time',
    status: 'Active',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    swiftCode: '',
    iban: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, empRes, deptRes, schedRes] = await Promise.all([
        authApi.getUsers(),
        employeeApi.getAll().catch(() => ({ data: [] })),
        departmentApi.getAll().catch(() => ({ data: [] })),
        scheduleApi.getAll().catch(() => ({ data: [] }))
      ]);
      setUsers(usersRes.data || []);
      setEmployees(empRes.data || []);
      setDepartments(deptRes.data || []);
      setSchedules(schedRes.data || []);
    } catch (err) {
      error(err.message || 'Failed to load user management data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setFormData({
      ...initialFormState,
      role: u.role,
      name: u.name,
      email: u.email,
      password: '',
      isActive: u.isActive
    });
    setIsModalOpen(true);
  };

  const handleOpenResetPassword = (u) => {
    setResetUserTarget(u);
    setResetNewPassword('');
    setResetConfirmPassword('');
    setShowAdminResetPassword(false);
  };

  const handleGeneratePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setResetNewPassword(pass);
    setResetConfirmPassword(pass);
    setShowAdminResetPassword(true);
  };

  const handleAdminResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetUserTarget) return;
    if (!resetNewPassword) {
      error('Please enter a new password');
      return;
    }
    if (resetNewPassword.length < 6) {
      error('Password must be at least 6 characters long');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      error('New passwords do not match');
      return;
    }

    setResetLoading(true);
    try {
      const res = await authApi.adminResetPassword(resetUserTarget._id, { password: resetNewPassword });
      success(res.message || `Password for ${resetUserTarget.name} has been reset successfully`);
      setResetUserTarget(null);
      setResetNewPassword('');
      setResetConfirmPassword('');
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const handleFirstNameChange = (val) => {
    const updated = { ...formData, firstName: val };
    if (!editingUser) {
      updated.name = `${val} ${formData.lastName}`.trim();
    }
    setFormData(updated);
  };

  const handleLastNameChange = (val) => {
    const updated = { ...formData, lastName: val };
    if (!editingUser) {
      updated.name = `${formData.firstName} ${val}`.trim();
    }
    setFormData(updated);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Edit existing user
        const updatePayload = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          isActive: formData.isActive
        };
        if (formData.password) {
          updatePayload.password = formData.password;
        }
        await authApi.updateUser(editingUser._id, updatePayload);
        success('User updated successfully');
      } else {
        // Create new user
        if (!formData.password) {
          error('Password is required when creating a user account');
          return;
        }

        if (formData.role === 'Employee') {
          if (!formData.firstName.trim() || !formData.lastName.trim()) {
            error('Employee first name and last name are required');
            return;
          }
          if (!formData.employeeCode.trim()) {
            error('Employee code is required for Employee role');
            return;
          }
          if (!formData.departmentId) {
            error('Please select a department for the employee');
            return;
          }
          if (!formData.jobPosition.trim()) {
            error('Job position is required for the employee');
            return;
          }

          const payload = {
            role: 'Employee',
            name: formData.name || `${formData.firstName} ${formData.lastName}`.trim(),
            email: formData.email,
            password: formData.password,
            isActive: formData.isActive,
            employee: {
              employeeCode: formData.employeeCode.trim().toUpperCase(),
              firstName: formData.firstName.trim(),
              lastName: formData.lastName.trim(),
              email: formData.email.trim().toLowerCase(),
              departmentId: formData.departmentId,
              managerId: formData.managerId || null,
              scheduleId: formData.scheduleId || null,
              jobPosition: formData.jobPosition.trim(),
              employeeType: formData.employeeType,
              status: formData.status,
              bankDetails: {
                bankName: formData.bankName.trim(),
                accountNumber: formData.accountNumber.trim(),
                routingNumber: formData.routingNumber.trim(),
                swiftCode: formData.swiftCode.trim(),
                iban: formData.iban.trim()
              }
            }
          };

          await authApi.createUser(payload);
          success('Employee account & profile created successfully');
        } else {
          // Non-employee role
          const payload = {
            role: formData.role,
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            isActive: formData.isActive
          };

          await authApi.createUser(payload);
          success(`${formData.role} account created successfully`);
        }
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to save user account');
    }
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    try {
      await authApi.deleteUser(deleteUserId);
      success('User deleted successfully');
      setDeleteUserId(null);
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to delete user');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-area">
          <Shield size={24} color="var(--primary)" />
          <h1 className="page-title">User & Role Management</h1>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Create User Account
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">System Users ({users.length})</h3>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Linked Employee</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const linkedEmp = u.employeeId
                  ? typeof u.employeeId === 'object'
                    ? u.employeeId
                    : employees.find((e) => e._id === u.employeeId)
                  : null;

                return (
                  <tr key={u._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.name}</div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'Admin' ? 'badge-danger' : u.role === 'Employee' ? 'badge-secondary' : 'badge-info'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {linkedEmp ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <User size={14} color="var(--primary)" />
                          <span>
                            {linkedEmp.firstName} {linkedEmp.lastName} ({linkedEmp.employeeCode || 'Emp'})
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-light)' }}>None (Standalone User)</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: '0.4rem' }}
                        title="Reset User Password"
                        onClick={() => handleOpenResetPassword(u)}
                      >
                        <KeyRound size={14} /> Reset
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: '0.4rem' }}
                        onClick={() => handleOpenEdit(u)}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteUserId(u._id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit User Account' : 'Create User Account'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              Save User
            </button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          {/* 1. ROLE IS THE FIRST FIELD */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label required" style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              ROLE *
            </label>
            <select
              className="form-control"
              style={{ fontWeight: 600, borderColor: 'var(--primary)', background: '#f8fafc' }}
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            >
              <option value="Employee">Employee</option>
              <option value="HR Manager">HR Manager</option>
              <option value="HR Payroll User">HR Payroll User</option>
              <option value="HR Payroll Manager">HR Payroll Manager</option>
              <option value="Admin">Admin</option>
            </select>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.25rem', display: 'block' }}>
              {formData.role === 'Employee'
                ? 'Selecting Employee will automatically create both the User Account and linked Employee Profile.'
                : `Selecting ${formData.role} will create a standalone administrative User Account.`}
            </span>
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '1rem 0' }} />

          {/* 2. ACCOUNT FIELDS */}
          <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)', marginBottom: '0.75rem' }}>
            Account Credentials
          </h4>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label required">Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Arun Kumar"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Login Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="e.g. arun@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">{editingUser ? 'New Password (Optional)' : 'Password'}</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '1.5rem' }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <span style={{ fontWeight: 500 }}>Account Active</span>
              </label>
            </div>
          </div>

          {/* 3. CONDITIONAL EMPLOYEE PROFILE SECTION */}
          {!editingUser && formData.role === 'Employee' && (
            <div style={{ marginTop: '1.5rem', borderTop: '2px dashed var(--border)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Briefcase size={18} color="var(--primary)" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)', margin: 0 }}>
                  EMPLOYEE PROFILE
                </h4>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label required">First Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Arun"
                    value={formData.firstName}
                    onChange={(e) => handleFirstNameChange(e.target.value)}
                    required={formData.role === 'Employee'}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Last Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Kumar"
                    value={formData.lastName}
                    onChange={(e) => handleLastNameChange(e.target.value)}
                    required={formData.role === 'Employee'}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Employee Code</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. EMP001"
                    style={{ textTransform: 'uppercase' }}
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    required={formData.role === 'Employee'}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Department</label>
                  <select
                    className="form-control"
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    required={formData.role === 'Employee'}
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label required">Job Position</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Software Engineer"
                    value={formData.jobPosition}
                    onChange={(e) => setFormData({ ...formData, jobPosition: e.target.value })}
                    required={formData.role === 'Employee'}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Manager</label>
                  <select
                    className="form-control"
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  >
                    <option value="">-- None / No Manager --</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} ({emp.jobPosition})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Employee Type</label>
                  <select
                    className="form-control"
                    value={formData.employeeType}
                    onChange={(e) => setFormData({ ...formData, employeeType: e.target.value })}
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                    <option value="Temporary">Temporary</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Working Schedule</label>
                  <select
                    className="form-control"
                    value={formData.scheduleId}
                    onChange={(e) => setFormData({ ...formData, scheduleId: e.target.value })}
                  >
                    <option value="">-- Select Working Schedule --</option>
                    {schedules.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.weeklyHours || 0} hrs/week)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>

              {/* Bank Details section */}
              <div style={{ marginTop: '1rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <CreditCard size={15} color="var(--primary)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Bank Details (Optional for Payroll)</span>
                </div>
                <div className="form-grid" style={{ gap: '0.5rem' }}>
                  <div className="form-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Bank Name"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Account Number"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Routing Number"
                      value={formData.routingNumber}
                      onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="SWIFT / IBAN"
                      value={formData.swiftCode}
                      onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Admin Reset Password Modal */}
      <Modal
        isOpen={!!resetUserTarget}
        onClose={() => setResetUserTarget(null)}
        title={`Reset Password for ${resetUserTarget?.name || 'User'}`}
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setResetUserTarget(null)}
              disabled={resetLoading}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAdminResetSubmit}
              disabled={resetLoading}
            >
              {resetLoading ? 'Resetting...' : 'Set New Password'}
            </button>
          </>
        }
      >
        <form onSubmit={handleAdminResetSubmit}>
          <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Target User: {resetUserTarget?.name} ({resetUserTarget?.email})
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Role: <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{resetUserTarget?.role}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleGeneratePassword}
              style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
            >
              🎲 Generate Strong Password
            </button>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label required">New Password</label>
            <input
              type={showAdminResetPassword ? 'text' : 'password'}
              className="form-control"
              placeholder="At least 6 characters"
              value={resetNewPassword}
              onChange={(e) => setResetNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label required">Confirm New Password</label>
            <input
              type={showAdminResetPassword ? 'text' : 'password'}
              className="form-control"
              placeholder="Re-enter new password"
              value={resetConfirmPassword}
              onChange={(e) => setResetConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-light)' }}>
              <input
                type="checkbox"
                checked={showAdminResetPassword}
                onChange={(e) => setShowAdminResetPassword(e.target.checked)}
              />
              <span>Show password</span>
            </label>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message="Are you sure you want to delete this user account? This cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}

export default UserManagement;
