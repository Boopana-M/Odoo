import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  User,
  ArrowLeft,
  Calendar,
  FileText,
  Clock,
  Briefcase,
  Building,
  CreditCard,
  Edit2,
  Save,
  X,
  Plus
} from 'lucide-react';
import { employeeApi } from '../../api/employeeApi';
import { departmentApi } from '../../api/departmentApi';
import { scheduleApi } from '../../api/scheduleApi';
import { contractApi } from '../../api/contractApi';
import { attendanceApi } from '../../api/attendanceApi';
import { timeOffApi } from '../../api/timeOffApi';
import SmartButton from '../../components/SmartButton';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isHRManager, isEmployeeOnly } = useAuth();
  const { success, error } = useNotification();

  const [employee, setEmployee] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('work'); // 'work' | 'bank' | 'activity'

  // Counts for smart buttons
  const [counts, setCounts] = useState({
    timeOff: 0,
    contracts: 0,
    attendance: 0
  });

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    employeeCode: '',
    jobPosition: '',
    departmentId: '',
    managerId: '',
    scheduleId: '',
    employeeType: 'Full-Time',
    status: 'Active',
    bankDetails: {
      bankName: '',
      accountNumber: '',
      accountHolderName: '',
      routingNumber: '',
      swiftCode: '',
      iban: ''
    }
  });

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      const promises = [
        employeeApi.getById(id),
        departmentApi.getAll().catch(() => ({ data: [] })),
        scheduleApi.getAll().catch(() => ({ data: [] })),
        attendanceApi.getAll({ employeeId: id }).catch(() => ({ data: [] })),
        timeOffApi.getRequests({ employeeId: id }).catch(() => ({ data: [] }))
      ];

      if (!isEmployeeOnly) {
        promises.push(employeeApi.getAll().catch(() => ({ data: [] })));
        promises.push(contractApi.getAll({ employeeId: id }).catch(() => ({ data: [] })));
      }

      const results = await Promise.all(promises);
      const empRes = results[0];
      const deptRes = results[1];
      const schedRes = results[2];
      const attRes = results[3];
      const timeOffRes = results[4];
      const allEmpRes = !isEmployeeOnly ? results[5] : { data: [] };
      const contractsRes = !isEmployeeOnly ? results[6] : { data: [] };

      const emp = empRes.data;
      setEmployee(emp);
      setDepartments(deptRes.data || []);
      setSchedules(schedRes.data || []);
      setAllEmployees(allEmpRes.data || []);

      setCounts({
        contracts: contractsRes.data?.length || 0,
        attendance: attRes.data?.length || 0,
        timeOff: timeOffRes.data?.length || 0
      });

      setFormData({
        firstName: emp.firstName || '',
        lastName: emp.lastName || '',
        email: emp.email || '',
        employeeCode: emp.employeeCode || '',
        jobPosition: emp.jobPosition || '',
        departmentId: emp.departmentId?._id || emp.departmentId || '',
        managerId: emp.managerId?._id || emp.managerId || '',
        scheduleId: emp.scheduleId?._id || emp.scheduleId || '',
        employeeType: emp.employeeType || 'Full-Time',
        status: emp.status || 'Active',
        bankDetails: {
          bankName: emp.bankDetails?.bankName || '',
          accountNumber: emp.bankDetails?.accountNumber || '',
          accountHolderName: emp.bankDetails?.accountHolderName || '',
          routingNumber: emp.bankDetails?.routingNumber || '',
          swiftCode: emp.bankDetails?.swiftCode || '',
          iban: emp.bankDetails?.iban || ''
        }
      });
    } catch (err) {
      error(err.message || 'Failed to load employee details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  const handleSave = async (e) => {
    e?.preventDefault();
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        employeeCode: formData.employeeCode,
        jobPosition: formData.jobPosition,
        departmentId: formData.departmentId,
        managerId: formData.managerId || null,
        scheduleId: formData.scheduleId || null,
        employeeType: formData.employeeType,
        status: formData.status,
        bankDetails: formData.bankDetails
      };

      const res = await employeeApi.update(id, payload);
      setEmployee(res.data);
      setIsEditing(false);
      success('Employee profile updated successfully');
      fetchEmployeeData();
    } catch (err) {
      error(err.message || 'Failed to update employee profile');
    }
  };

  if (loading) {
    return <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>Loading employee details...</div>;
  }

  if (!employee) {
    return <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>Employee not found.</div>;
  }

  return (
    <div>
      {/* Header & Back Link */}
      <div className="page-header">
        <div className="page-title-area">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/employees')}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className="page-title">
              {employee.firstName} {employee.lastName}
            </h1>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>({employee.employeeCode})</span>
            <StatusBadge status={employee.status} />
          </div>
        </div>

        <div className="page-actions">
          {isHRManager && !isEditing && (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
              <Edit2 size={16} /> Edit Employee
            </button>
          )}

          {isEditing && (
            <>
              <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                <X size={16} /> Cancel
              </button>
              <button className="btn btn-success" onClick={handleSave}>
                <Save size={16} /> Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Smart Buttons Row (From Excalidraw Reference Hub) */}
      <div className="smart-buttons-bar">
        <SmartButton
          icon={Calendar}
          count={counts.timeOff}
          label="Time Off"
          onClick={() => navigate(`/time-off/requests?employeeId=${id}`)}
        />
        {isHRManager && (
          <SmartButton
            icon={FileText}
            count={counts.contracts}
            label="Contracts"
            onClick={() => navigate(`/contracts?employeeId=${id}`)}
          />
        )}
        <SmartButton
          icon={Clock}
          count={counts.attendance}
          label="Attendance"
          onClick={() => navigate(`/attendance?employeeId=${id}`)}
        />
      </div>

      {/* Profile Hub Card */}
      <div className="card">
        {/* Profile Hero */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--border)',
            marginBottom: '1.5rem'
          }}
        >
          <div
            className="avatar"
            style={{ width: 64, height: 64, fontSize: '1.5rem', background: '#e0e7ff', color: '#4338ca' }}
          >
            {employee.firstName?.[0]}{employee.lastName?.[0]}
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {employee.firstName} {employee.lastName}
            </h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.15rem' }}>
              {employee.jobPosition} • {employee.departmentId?.name || 'No Department'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Work Email: <strong>{employee.email}</strong>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-container">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'work' ? 'active' : ''}`}
            onClick={() => setActiveTab('work')}
          >
            <Briefcase size={16} /> Work Information
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'bank' ? 'active' : ''}`}
            onClick={() => setActiveTab('bank')}
          >
            <CreditCard size={16} /> Bank & Payment Details
          </button>
        </div>

        {/* Tab 1: Work Information */}
        {activeTab === 'work' && (
          <form onSubmit={handleSave} className="form-grid">
            <div className="form-group">
              <label className="form-label required">First Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={!isEditing}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Last Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={!isEditing}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Employee Code</label>
              <input
                type="text"
                className="form-control"
                value={formData.employeeCode}
                onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value.toUpperCase() })}
                disabled={!isEditing}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Work Email</label>
              <input
                type="email"
                className="form-control"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Job Position</label>
              <input
                type="text"
                className="form-control"
                value={formData.jobPosition}
                onChange={(e) => setFormData({ ...formData, jobPosition: e.target.value })}
                disabled={!isEditing}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Department</label>
              <select
                className="form-control"
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                disabled={!isEditing}
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
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                disabled={!isEditing}
              >
                <option value="">None (Top Level)</option>
                {allEmployees
                  .filter((e) => e._id !== id)
                  .map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} ({emp.jobPosition})
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Working Schedule</label>
              <select
                className="form-control"
                value={formData.scheduleId}
                onChange={(e) => setFormData({ ...formData, scheduleId: e.target.value })}
                disabled={!isEditing}
              >
                <option value="">Select Schedule</option>
                {schedules.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.weeklyHours} hrs/week)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Employee Type</label>
              <select
                className="form-control"
                value={formData.employeeType}
                onChange={(e) => setFormData({ ...formData, employeeType: e.target.value })}
                disabled={!isEditing}
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
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                disabled={!isEditing}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="On Leave">On Leave</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </form>
        )}

        {/* Tab 2: Bank Details */}
        {activeTab === 'bank' && (
          <form onSubmit={handleSave} className="form-grid">
            <div className="form-group">
              <label className="form-label">Bank Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. JPMorgan Chase / HDFC / Citibank"
                value={formData.bankDetails.bankName}
                onChange={(e) => setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails, bankName: e.target.value }
                })}
                disabled={!isEditing}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Account Holder Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.bankDetails.accountHolderName}
                onChange={(e) => setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails, accountHolderName: e.target.value }
                })}
                disabled={!isEditing}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Account Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="10-16 digits"
                value={formData.bankDetails.accountNumber}
                onChange={(e) => setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails, accountNumber: e.target.value }
                })}
                disabled={!isEditing}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Routing / IFSC / Sort Code</label>
              <input
                type="text"
                className="form-control"
                value={formData.bankDetails.routingNumber}
                onChange={(e) => setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails, routingNumber: e.target.value }
                })}
                disabled={!isEditing}
              />
            </div>

            <div className="form-group">
              <label className="form-label">SWIFT / BIC Code</label>
              <input
                type="text"
                className="form-control"
                value={formData.bankDetails.swiftCode}
                onChange={(e) => setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails, swiftCode: e.target.value }
                })}
                disabled={!isEditing}
              />
            </div>

            <div className="form-group">
              <label className="form-label">IBAN</label>
              <input
                type="text"
                className="form-control"
                value={formData.bankDetails.iban}
                onChange={(e) => setFormData({
                  ...formData,
                  bankDetails: { ...formData.bankDetails, iban: e.target.value }
                })}
                disabled={!isEditing}
              />
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default EmployeeDetail;
