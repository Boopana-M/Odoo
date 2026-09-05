import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, Edit2, Save, X, Building, DollarSign, Calendar } from 'lucide-react';
import { contractApi } from '../../api/contractApi';
import { departmentApi } from '../../api/departmentApi';
import { salaryApi } from '../../api/salaryApi';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export function ContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isHRManager } = useAuth();
  const { success, error } = useNotification();

  const [contract, setContract] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    wage: 0,
    startDate: '',
    endDate: '',
    departmentId: '',
    jobPosition: '',
    salaryStructureId: '',
    status: 'Active'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contractRes, deptRes, structRes] = await Promise.all([
        contractApi.getById(id),
        departmentApi.getAll(),
        salaryApi.getStructures()
      ]);

      const c = contractRes.data;
      setContract(c);
      setDepartments(deptRes.data || []);
      setStructures(structRes.data || []);

      setFormData({
        wage: c.wage || 0,
        startDate: c.startDate ? c.startDate.split('T')[0] : '',
        endDate: c.endDate ? c.endDate.split('T')[0] : '',
        departmentId: c.departmentId?._id || c.departmentId || '',
        jobPosition: c.jobPosition || '',
        salaryStructureId: c.salaryStructureId?._id || c.salaryStructureId || '',
        status: c.status || 'Active'
      });
    } catch (err) {
      error(err.message || 'Failed to load contract details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleSave = async (e) => {
    e?.preventDefault();
    try {
      const payload = {
        ...formData,
        wage: Number(formData.wage),
        endDate: formData.endDate || null,
        salaryStructureId: formData.salaryStructureId || null
      };

      const res = await contractApi.update(id, payload);
      setContract(res.data);
      setIsEditing(false);
      success('Contract updated successfully');
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to update contract');
    }
  };

  if (loading) {
    return <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>Loading contract...</div>;
  }

  if (!contract) {
    return <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>Contract not found.</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title-area">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/contracts')}
          >
            <ArrowLeft size={16} /> Back to Contracts
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className="page-title">Contract #{contract._id.slice(-6).toUpperCase()}</h1>
            <StatusBadge status={contract.status} />
          </div>
        </div>

        <div className="page-actions">
          {isHRManager && !isEditing && (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
              <Edit2 size={16} /> Edit Contract
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

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Employee</div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {contract.employeeId?.firstName} {contract.employeeId?.lastName}
            </h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Code: {contract.employeeId?.employeeCode} • Position: {contract.jobPosition}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Monthly Base Wage</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
              ₹{Number(formData.wage).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="form-grid">
          <div className="form-group">
            <label className="form-label required">Monthly Wage (₹)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              value={formData.wage}
              onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Start Date</label>
            <input
              type="date"
              className="form-control"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-control"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              disabled={!isEditing}
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
            <label className="form-label">Salary Structure</label>
            <select
              className="form-control"
              value={formData.salaryStructureId}
              onChange={(e) => setFormData({ ...formData, salaryStructureId: e.target.value })}
              disabled={!isEditing}
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
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              disabled={!isEditing}
              required
            >
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ContractDetail;
