import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Plus, ArrowRight, Settings } from 'lucide-react';
import { salaryApi } from '../../api/salaryApi';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export function SalaryStructureList() {
  const navigate = useNavigate();
  const { isPayrollManager } = useAuth();
  const { success, error } = useNotification();

  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newStructure, setNewStructure] = useState({
    name: '',
    code: '',
    isActive: true
  });

  const fetchStructures = async () => {
    setLoading(true);
    try {
      const res = await salaryApi.getStructures();
      setStructures(res.data || []);
    } catch (err) {
      error(err.message || 'Failed to load salary structures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStructures();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await salaryApi.createStructure(newStructure);
      success('Salary structure created successfully');
      setIsCreateOpen(false);
      fetchStructures();
    } catch (err) {
      error(err.message || 'Failed to create salary structure');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-area">
          <Layers size={24} color="var(--primary)" />
          <h1 className="page-title">Salary Structures</h1>
        </div>

        <div className="page-actions">
          {isPayrollManager && (
            <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
              <Plus size={16} /> New Salary Structure
            </button>
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Structure Name</th>
              <th>Code</th>
              <th>Salary Rules Count</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {structures.map((s) => (
              <tr key={s._id}>
                <td style={{ fontWeight: 600 }}>{s.name}</td>
                <td>
                  <span className="badge badge-neutral">{s.code}</span>
                </td>
                <td>
                  <span className="badge badge-info">
                    {s.rules?.length || 0} rules included
                  </span>
                </td>
                <td>
                  <StatusBadge status={s.isActive ? 'Active' : 'Inactive'} />
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/payroll/structures/${s._id}`)}
                  >
                    View Rules & Config <ArrowRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {structures.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No salary structures configured yet.</p>
        </div>
      )}

      {/* Modal: Create Structure */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Salary Structure"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreate}>
              Save Structure
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="form-grid">
          <div className="form-group full-width">
            <label className="form-label required">Structure Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Regular Salary Structure"
              value={newStructure.name}
              onChange={(e) => setNewStructure({ ...newStructure, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group full-width">
            <label className="form-label required">Structure Code</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. REGULAR"
              value={newStructure.code}
              onChange={(e) => setNewStructure({ ...newStructure, code: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div className="form-group full-width">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={newStructure.isActive}
                onChange={(e) => setNewStructure({ ...newStructure, isActive: e.target.checked })}
              />
              <span>Structure Active</span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default SalaryStructureList;
