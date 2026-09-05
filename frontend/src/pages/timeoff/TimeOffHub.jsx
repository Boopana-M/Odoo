import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Calendar,
  Layers,
  Settings,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  AlertCircle
} from 'lucide-react';
import { timeOffApi } from '../../api/timeOffApi';
import { employeeApi } from '../../api/employeeApi';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export function TimeOffHub() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isHRManager, isEmployeeOnly } = useAuth();
  const { success, error } = useNotification();

  // Determine subtab from path or default to requests
  const currentPath = location.pathname;
  let defaultTab = 'requests';
  if (currentPath.includes('/allocations')) defaultTab = 'allocations';
  if (currentPath.includes('/types')) defaultTab = 'types';

  const [activeTab, setActiveTab] = useState(defaultTab);

  const employeeFilterParam = searchParams.get('employeeId') || '';

  // Data states
  const [requests, setRequests] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [types, setTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedEmp, setSelectedEmp] = useState(isEmployeeOnly ? user?.employeeId : employeeFilterParam);
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

  // Form states
  const [requestForm, setRequestForm] = useState({
    employeeId: isEmployeeOnly ? user?.employeeId : '',
    timeOffTypeId: '',
    allocationId: '',
    startDate: '',
    endDate: '',
    duration: 1
  });

  const [allocForm, setAllocForm] = useState({
    employeeId: '',
    timeOffTypeId: '',
    allocatedAmount: 10,
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
  });

  const [typeForm, setTypeForm] = useState({
    name: '',
    unit: 'Days',
    allocationRequired: true,
    approvalRequired: true,
    payrollIntegration: false
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [typesRes, reqRes, allocRes, empRes] = await Promise.all([
        timeOffApi.getTypes(),
        timeOffApi.getRequests({
          employeeId: selectedEmp,
          timeOffTypeId: selectedType,
          status: selectedStatus
        }),
        isHRManager || isEmployeeOnly
          ? timeOffApi.getAllocations({ employeeId: selectedEmp, timeOffTypeId: selectedType })
          : Promise.resolve({ data: [] }),
        isEmployeeOnly ? Promise.resolve({ data: [] }) : employeeApi.getAll()
      ]);

      setTypes(typesRes.data || []);
      setRequests(reqRes.data || []);
      setAllocations(allocRes.data || []);
      setEmployees(empRes.data || []);
    } catch (err) {
      error(err.message || 'Failed to load time off data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedEmp, selectedType, selectedStatus]);

  // Request Form Actions
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        employeeId: isEmployeeOnly ? user?.employeeId : requestForm.employeeId,
        timeOffTypeId: requestForm.timeOffTypeId,
        allocationId: requestForm.allocationId || undefined,
        startDate: requestForm.startDate,
        endDate: requestForm.endDate,
        duration: Number(requestForm.duration)
      };

      await timeOffApi.createRequest(payload);
      success('Time off request submitted successfully');
      setIsRequestModalOpen(false);
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to submit time off request');
    }
  };

  const handleApproveRequest = async (id) => {
    try {
      await timeOffApi.approveRequest(id);
      success('Time off request approved and balance deducted!');
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to approve request');
    }
  };

  const handleRefuseRequest = async (id) => {
    try {
      await timeOffApi.refuseRequest(id);
      success('Time off request refused');
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to refuse request');
    }
  };

  // Allocation Form Actions
  const handleCreateAlloc = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        employeeId: allocForm.employeeId,
        timeOffTypeId: allocForm.timeOffTypeId,
        allocatedAmount: Number(allocForm.allocatedAmount),
        validFrom: allocForm.validFrom,
        validTo: allocForm.validTo
      };

      await timeOffApi.createAllocation(payload);
      success('Allocation created successfully (Pending approval)');
      setIsAllocModalOpen(false);
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to create allocation');
    }
  };

  const handleApproveAlloc = async (id) => {
    try {
      await timeOffApi.approveAllocation(id);
      success('Allocation approved! Balance is now active.');
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to approve allocation');
    }
  };

  // Type Form Actions
  const handleCreateType = async (e) => {
    e.preventDefault();
    try {
      await timeOffApi.createType(typeForm);
      success('Time off type created successfully');
      setIsTypeModalOpen(false);
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to create type');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-area">
          <Calendar size={24} color="var(--primary)" />
          <h1 className="page-title">Time Off Management</h1>
        </div>

        <div className="page-actions">
          {activeTab === 'requests' && (
            <button className="btn btn-primary" onClick={() => setIsRequestModalOpen(true)}>
              <Plus size={16} /> Request Time Off
            </button>
          )}

          {activeTab === 'allocations' && isHRManager && (
            <button className="btn btn-primary" onClick={() => setIsAllocModalOpen(true)}>
              <Plus size={16} /> New Allocation
            </button>
          )}

          {activeTab === 'types' && isHRManager && (
            <button className="btn btn-primary" onClick={() => setIsTypeModalOpen(true)}>
              <Plus size={16} /> New Time Off Type
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="tab-container">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('requests');
            navigate('/time-off/requests');
          }}
        >
          <Calendar size={16} /> Requests ({requests.length})
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'allocations' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('allocations');
            navigate('/time-off/allocations');
          }}
        >
          <Layers size={16} /> Allocations & Balances ({allocations.length})
        </button>

        {isHRManager && (
          <button
            type="button"
            className={`tab-btn ${activeTab === 'types' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('types');
              navigate('/time-off/types');
            }}
          >
            <Settings size={16} /> Time Off Types ({types.length})
          </button>
        )}
      </div>

      {/* Filter Bar for Requests and Allocations */}
      {activeTab !== 'types' && (
        <div className="filter-bar">
          <div className="filter-inputs">
            {!isEmployeeOnly && (
              <select
                className="form-control"
                value={selectedEmp}
                onChange={(e) => setSelectedEmp(e.target.value)}
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            )}

            <select
              className="form-control"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">All Leave Types</option>
              {types.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>

            {activeTab === 'requests' && (
              <select
                className="form-control"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Refused">Refused</option>
              </select>
            )}
          </div>

          {(selectedType || selectedStatus || (!isEmployeeOnly && selectedEmp)) && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (!isEmployeeOnly) setSelectedEmp('');
                setSelectedType('');
                setSelectedStatus('');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* SUB-TAB 1: REQUESTS */}
      {activeTab === 'requests' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Time Off Type</th>
                <th>Dates</th>
                <th>Duration</th>
                <th>Status</th>
                {isHRManager && <th style={{ textAlign: 'right' }}>Approvals</th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>
                      {r.employeeId?.firstName} {r.employeeId?.lastName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {r.employeeId?.employeeCode}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info">{r.timeOffTypeId?.name}</span>
                  </td>
                  <td>
                    {new Date(r.startDate).toLocaleDateString()} — {new Date(r.endDate).toLocaleDateString()}
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {r.duration} {r.timeOffTypeId?.unit || 'Days'}
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  {isHRManager && (
                    <td style={{ textAlign: 'right' }}>
                      {r.status === 'Pending' ? (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleApproveRequest(r._id)}
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRefuseRequest(r._id)}
                          >
                            <XCircle size={14} /> Refuse
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Decided</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-TAB 2: ALLOCATIONS */}
      {activeTab === 'allocations' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Time Off Type</th>
                <th>Allocated</th>
                <th>Taken</th>
                <th>Remaining Balance</th>
                <th>Validity Period</th>
                <th>Status</th>
                {isHRManager && <th style={{ textAlign: 'right' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {allocations.map((a) => (
                <tr key={a._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>
                      {a.employeeId?.firstName} {a.employeeId?.lastName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {a.employeeId?.employeeCode}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info">{a.timeOffTypeId?.name}</span>
                  </td>
                  <td>{a.allocatedAmount} {a.timeOffTypeId?.unit || 'Days'}</td>
                  <td>{a.takenAmount}</td>
                  <td style={{ fontWeight: 800, color: a.remainingAmount > 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {a.remainingAmount} {a.timeOffTypeId?.unit || 'Days'}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {new Date(a.validFrom).toLocaleDateString()} to {new Date(a.validTo).toLocaleDateString()}
                  </td>
                  <td>
                    <StatusBadge status={a.approvalStatus} />
                  </td>
                  {isHRManager && (
                    <td style={{ textAlign: 'right' }}>
                      {a.approvalStatus === 'Pending' ? (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleApproveAlloc(a._id)}
                        >
                          <CheckCircle size={14} /> Approve Allocation
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-TAB 3: TYPES */}
      {activeTab === 'types' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Type Name</th>
                <th>Unit</th>
                <th>Allocation Required</th>
                <th>Approval Required</th>
                <th>Payroll Integration</th>
              </tr>
            </thead>
            <tbody>
              {types.map((t) => (
                <tr key={t._id}>
                  <td style={{ fontWeight: 600 }}>{t.name}</td>
                  <td>
                    <span className="badge badge-neutral">{t.unit}</span>
                  </td>
                  <td>
                    <span className={`badge ${t.allocationRequired ? 'badge-info' : 'badge-neutral'}`}>
                      {t.allocationRequired ? 'Yes (Balance Tracked)' : 'No (Direct Request)'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${t.approvalRequired ? 'badge-warning' : 'badge-success'}`}>
                      {t.approvalRequired ? 'Manager Approval' : 'Auto-Approved'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${t.payrollIntegration ? 'badge-success' : 'badge-neutral'}`}>
                      {t.payrollIntegration ? 'Integrated with Payroll' : 'Standard Leave'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Create Request */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Submit Time Off Request"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsRequestModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateRequest}>
              Submit Request
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateRequest} className="form-grid">
          {!isEmployeeOnly && (
            <div className="form-group full-width">
              <label className="form-label required">Employee</label>
              <select
                className="form-control"
                value={requestForm.employeeId}
                onChange={(e) => setRequestForm({ ...requestForm, employeeId: e.target.value })}
                required
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label required">Time Off Type</label>
            <select
              className="form-control"
              value={requestForm.timeOffTypeId}
              onChange={(e) => setRequestForm({ ...requestForm, timeOffTypeId: e.target.value })}
              required
            >
              <option value="">Select Type</option>
              {types.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">Duration (Days/Hours)</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              className="form-control"
              value={requestForm.duration}
              onChange={(e) => setRequestForm({ ...requestForm, duration: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Start Date</label>
            <input
              type="date"
              className="form-control"
              value={requestForm.startDate}
              onChange={(e) => setRequestForm({ ...requestForm, startDate: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">End Date</label>
            <input
              type="date"
              className="form-control"
              value={requestForm.endDate}
              onChange={(e) => setRequestForm({ ...requestForm, endDate: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Create Allocation */}
      <Modal
        isOpen={isAllocModalOpen}
        onClose={() => setIsAllocModalOpen(false)}
        title="Create Leave Allocation"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsAllocModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateAlloc}>
              Create Allocation
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateAlloc} className="form-grid">
          <div className="form-group full-width">
            <label className="form-label required">Employee</label>
            <select
              className="form-control"
              value={allocForm.employeeId}
              onChange={(e) => setAllocForm({ ...allocForm, employeeId: e.target.value })}
              required
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">Time Off Type</label>
            <select
              className="form-control"
              value={allocForm.timeOffTypeId}
              onChange={(e) => setAllocForm({ ...allocForm, timeOffTypeId: e.target.value })}
              required
            >
              <option value="">Select Type</option>
              {types.map((t) => (
                <option key={t._id} value={t._id}>{t.name} ({t.unit})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">Allocated Amount</label>
            <input
              type="number"
              step="0.5"
              min="1"
              className="form-control"
              value={allocForm.allocatedAmount}
              onChange={(e) => setAllocForm({ ...allocForm, allocatedAmount: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Valid From</label>
            <input
              type="date"
              className="form-control"
              value={allocForm.validFrom}
              onChange={(e) => setAllocForm({ ...allocForm, validFrom: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Valid To</label>
            <input
              type="date"
              className="form-control"
              value={allocForm.validTo}
              onChange={(e) => setAllocForm({ ...allocForm, validTo: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Create Type */}
      <Modal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        title="Create Time Off Type"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsTypeModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateType}>
              Save Type
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateType} className="form-grid">
          <div className="form-group full-width">
            <label className="form-label required">Type Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Paid Time Off / Sick Leave"
              value={typeForm.name}
              onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group full-width">
            <label className="form-label required">Unit</label>
            <select
              className="form-control"
              value={typeForm.unit}
              onChange={(e) => setTypeForm({ ...typeForm, unit: e.target.value })}
            >
              <option value="Days">Days</option>
              <option value="Hours">Hours</option>
            </select>
          </div>

          <div className="form-group full-width">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={typeForm.allocationRequired}
                onChange={(e) => setTypeForm({ ...typeForm, allocationRequired: e.target.checked })}
              />
              <span>Allocation Required (Requires approved balance to request)</span>
            </label>
          </div>

          <div className="form-group full-width">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={typeForm.approvalRequired}
                onChange={(e) => setTypeForm({ ...typeForm, approvalRequired: e.target.checked })}
              />
              <span>Manager Approval Required</span>
            </label>
          </div>

          <div className="form-group full-width">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={typeForm.payrollIntegration}
                onChange={(e) => setTypeForm({ ...typeForm, payrollIntegration: e.target.checked })}
              />
              <span>Integrate with Payroll Calculations</span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default TimeOffHub;
