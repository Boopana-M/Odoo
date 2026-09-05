import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { contractApi } from '../../api/contractApi';
import { employeeApi } from '../../api/employeeApi';
import { departmentApi } from '../../api/departmentApi';
import { salaryApi } from '../../api/salaryApi';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export function ContractList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isHRManager } = useAuth();
  const { success, error } = useNotification();

  const employeeFilterParam = searchParams.get('employeeId') || '';

  const [contracts, setContracts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedEmp, setSelectedEmp] = useState(employeeFilterParam);
  const [statusFilter, setStatusFilter] = useState('');

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newContract, setNewContract] = useState({
    employeeId: employeeFilterParam,
    startDate: '',
    endDate: '',
    departmentId: '',
    jobPosition: '',
    wage: '',
    salaryStructureId: '',
    status: 'Active'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contractsRes, empRes, deptRes, structRes] = await Promise.all([
        contractApi.getAll({
          employeeId: selectedEmp,
          status: statusFilter
        }),
        employeeApi.getAll(),
        departmentApi.getAll(),
        salaryApi.getStructures()
      ]);

      setContracts(contractsRes.data || []);
      setEmployees(empRes.data || []);
      setDepartments(deptRes.data || []);
      setStructures(structRes.data || []);
    } catch (err) {
      error(err.message || 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedEmp, statusFilter]);

  const handleEmployeeSelectForCreate = (empId) => {
    const emp = employees.find((e) => e._id === empId);
    setNewContract({
      ...newContract,
      employeeId: empId,
      departmentId: emp?.departmentId?._id || emp?.departmentId || '',
      jobPosition: emp?.jobPosition || ''
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newContract,
        wage: Number(newContract.wage),
        endDate: newContract.endDate || null,
        salaryStructureId: newContract.salaryStructureId || null
      };

      await contractApi.create(payload);
      success('Contract created successfully');
      setIsCreateOpen(false);
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to create contract');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-area">
          <FileText size={24} color="var(--primary)" />
          <h1 className="page-title">Employment Contracts</h1>
        </div>

        <div className="page-actions">
          {isHRManager && (
            <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
              <Plus size={16} /> New Contract
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-inputs">
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

          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Closed">Closed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {selectedEmp && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setSelectedEmp('')}
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Contracts Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Contract Reference / ID</th>
              <th>Employee</th>
              <th>Department</th>
              <th>Position</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Wage / Month</th>
              <th>Salary Structure</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c._id}>
                <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                  #{c._id.slice(-6).toUpperCase()}
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>
                    {c.employeeId?.firstName} {c.employeeId?.lastName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {c.employeeId?.employeeCode}
                  </div>
                </td>
                <td>{c.departmentId?.name || '-'}</td>
                <td>{c.jobPosition}</td>
                <td>{new Date(c.startDate).toLocaleDateString()}</td>
                <td>{c.endDate ? new Date(c.endDate).toLocaleDateString() : 'Indefinite'}</td>
                <td style={{ fontWeight: 700 }}>
                  ₹{Number(c.wage).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td>
                  <span className="badge badge-neutral">
                    {c.salaryStructureId?.name || 'Standard'}
                  </span>
                </td>
                <td>
                  <StatusBadge status={c.status} />
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/contracts/${c._id}`)}
                  >
                    View <ArrowRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contracts.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No contracts found.</p>
        </div>
      )}

      {/* Create Contract Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Contract"
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreate}>
              Save Contract
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="form-grid">
          <div className="form-group">
            <label className="form-label required">Employee</label>
            <select
              className="form-control"
              value={newContract.employeeId}
              onChange={(e) => handleEmployeeSelectForCreate(e.target.value)}
              required
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode} - {emp.jobPosition})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">Monthly Wage (₹)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="e.g. 5000"
              value={newContract.wage}
              onChange={(e) => setNewContract({ ...newContract, wage: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Start Date</label>
            <input
              type="date"
              className="form-control"
              value={newContract.startDate}
              onChange={(e) => setNewContract({ ...newContract, startDate: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">End Date (Leave blank for indefinite)</label>
            <input
              type="date"
              className="form-control"
              value={newContract.endDate}
              onChange={(e) => setNewContract({ ...newContract, endDate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Department</label>
            <select
              className="form-control"
              value={newContract.departmentId}
              onChange={(e) => setNewContract({ ...newContract, departmentId: e.target.value })}
              required
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">Job Position</label>
            <input
              type="text"
              className="form-control"
              value={newContract.jobPosition}
              onChange={(e) => setNewContract({ ...newContract, jobPosition: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Salary Structure</label>
            <select
              className="form-control"
              value={newContract.salaryStructureId}
              onChange={(e) => setNewContract({ ...newContract, salaryStructureId: e.target.value })}
            >
              <option value="">Select Salary Structure</option>
              {structures.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">Status</label>
            <select
              className="form-control"
              value={newContract.status}
              onChange={(e) => setNewContract({ ...newContract, status: e.target.value })}
              required
            >
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ContractList;
