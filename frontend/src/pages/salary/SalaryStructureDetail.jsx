import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layers, ArrowLeft, Plus, Settings, Edit2, Save, X, Trash2 } from 'lucide-react';
import { salaryApi } from '../../api/salaryApi';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export function SalaryStructureDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isPayrollManager } = useAuth();
  const { success, error } = useNotification();

  const [structure, setStructure] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Structure
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', code: '', isActive: true });

  // Add Rule Modal
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    code: '',
    category: 'Basic',
    sequence: 10,
    computationMethod: 'Percentage',
    amount: '',
    percentage: '',
    formulaExpression: '',
    isActive: true
  });

  // Edit Rule Modal State
  const [editingRule, setEditingRule] = useState(null);

  // Delete Rule Confirmation State
  const [deleteRuleId, setDeleteRuleId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [structRes, rulesRes] = await Promise.all([
        salaryApi.getStructureById(id),
        salaryApi.getRulesByStructure(id)
      ]);

      const s = structRes.data;
      setStructure(s);
      setRules(rulesRes.data || s.rules || []);
      setEditData({ name: s.name, code: s.code, isActive: s.isActive });
    } catch (err) {
      error(err.message || 'Failed to load salary structure details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleUpdateStructure = async (e) => {
    e?.preventDefault();
    try {
      await salaryApi.updateStructure(id, editData);
      success('Salary structure updated successfully');
      setIsEditing(false);
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to update structure');
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        salaryStructureId: id,
        name: newRule.name,
        code: newRule.code.toUpperCase(),
        category: newRule.category,
        sequence: Number(newRule.sequence),
        computationMethod: newRule.computationMethod,
        amount: newRule.computationMethod === 'Fixed' ? Number(newRule.amount) : null,
        percentage: newRule.computationMethod === 'Percentage' ? Number(newRule.percentage) : null,
        formulaExpression: newRule.computationMethod === 'Formula' ? newRule.formulaExpression : null,
        isActive: newRule.isActive
      };

      await salaryApi.createRule(payload);
      success('Salary rule created and added to structure');
      setIsAddRuleOpen(false);
      setNewRule({
        name: '',
        code: '',
        category: 'Basic',
        sequence: 10,
        computationMethod: 'Percentage',
        amount: '',
        percentage: '',
        formulaExpression: '',
        isActive: true
      });
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to create salary rule');
    }
  };

  const handleOpenEditRule = (rule) => {
    setEditingRule({
      _id: rule._id,
      name: rule.name || '',
      code: rule.code || '',
      category: rule.category || 'Basic',
      sequence: rule.sequence || 10,
      computationMethod: rule.computationMethod || 'Percentage',
      amount: rule.amount ?? '',
      percentage: rule.percentage ?? '',
      formulaExpression: rule.formulaExpression || '',
      isActive: rule.isActive !== false
    });
  };

  const handleUpdateRule = async (e) => {
    e.preventDefault();
    if (!editingRule) return;

    try {
      const payload = {
        salaryStructureId: id,
        name: editingRule.name,
        code: editingRule.code.toUpperCase(),
        category: editingRule.category,
        sequence: Number(editingRule.sequence),
        computationMethod: editingRule.computationMethod,
        amount: editingRule.computationMethod === 'Fixed' ? Number(editingRule.amount) : null,
        percentage: editingRule.computationMethod === 'Percentage' ? Number(editingRule.percentage) : null,
        formulaExpression: editingRule.computationMethod === 'Formula' ? editingRule.formulaExpression : null,
        isActive: editingRule.isActive
      };

      await salaryApi.updateRule(editingRule._id, payload);
      success('Salary rule updated successfully');
      setEditingRule(null);
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to update salary rule');
    }
  };

  const handleDeleteRule = async () => {
    if (!deleteRuleId) return;
    setDeleteLoading(true);
    try {
      await salaryApi.deleteRule(deleteRuleId);
      success('Salary rule deleted successfully');
      setDeleteRuleId(null);
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to delete salary rule');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>Loading structure...</div>;
  }

  if (!structure) {
    return <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>Structure not found.</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title-area">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/payroll/structures')}
          >
            <ArrowLeft size={16} /> Back to Structures
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className="page-title">{structure.name}</h1>
            <span className="badge badge-neutral">{structure.code}</span>
            <StatusBadge status={structure.isActive ? 'Active' : 'Inactive'} />
          </div>
        </div>

        <div className="page-actions">
          {isPayrollManager && (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit2 size={16} /> {isEditing ? 'Cancel Edit' : 'Edit Structure'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsAddRuleOpen(true)}
              >
                <Plus size={16} /> Add Salary Rule
              </button>
            </>
          )}
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">Edit Salary Structure Details</h3>
          </div>
          <form onSubmit={handleUpdateStructure} className="form-grid">
            <div className="form-group">
              <label className="form-label required">Structure Name</label>
              <input
                type="text"
                className="form-control"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Code</label>
              <input
                type="text"
                className="form-control"
                value={editData.code}
                onChange={(e) => setEditData({ ...editData, code: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="form-group full-width" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button type="submit" className="btn btn-success btn-sm">Save</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Rules Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Associated Salary Rules ({rules.length})</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Rules are executed strictly in order of their sequence number during Payslip computation.
            </p>
          </div>
        </div>

        <div className="table-container" style={{ margin: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Seq #</th>
                <th>Rule Name</th>
                <th>Code</th>
                <th>Category</th>
                <th>Computation Method</th>
                <th>Value / Formula</th>
                <th>Status</th>
                {isPayrollManager && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r._id}>
                  <td style={{ fontWeight: 700, color: 'var(--primary)', width: 80 }}>
                    #{r.sequence}
                  </td>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td>
                    <span className="badge badge-neutral">{r.code}</span>
                  </td>
                  <td>
                    <span className={`badge ${
                      r.category === 'Basic' || r.category === 'Gross' || r.category === 'Net'
                        ? 'badge-success'
                        : r.category === 'Deductions'
                        ? 'badge-danger'
                        : 'badge-info'
                    }`}>
                      {r.category}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{r.computationMethod}</span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {r.computationMethod === 'Fixed' && `₹${r.amount}`}
                    {r.computationMethod === 'Percentage' && `${r.percentage}% of Base`}
                    {r.computationMethod === 'Formula' && (r.formulaExpression || '-')}
                  </td>
                  <td>
                    <StatusBadge status={r.isActive ? 'Active' : 'Inactive'} />
                  </td>
                  {isPayrollManager && (
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEditRule(r)}
                          title="Edit Salary Rule"
                          style={{ padding: '0.3rem 0.55rem' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeleteRuleId(r._id)}
                          title="Delete Salary Rule"
                          style={{ padding: '0.3rem 0.55rem' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Salary Rule */}
      <Modal
        isOpen={isAddRuleOpen}
        onClose={() => setIsAddRuleOpen(false)}
        title="Add Salary Rule to Structure"
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsAddRuleOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateRule}>
              Add Rule
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateRule} className="form-grid">
          <div className="form-group">
            <label className="form-label required">Rule Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Basic Salary / House Rent Allowance"
              value={newRule.name}
              onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Rule Code</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. BASIC / HRA / PF / NET"
              value={newRule.code}
              onChange={(e) => setNewRule({ ...newRule, code: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Category</label>
            <select
              className="form-control"
              value={newRule.category}
              onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
              required
            >
              <option value="Basic">Basic</option>
              <option value="Allowances">Allowances</option>
              <option value="Gross">Gross</option>
              <option value="Deductions">Deductions</option>
              <option value="Net">Net</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">Sequence Order</label>
            <input
              type="number"
              min="1"
              className="form-control"
              value={newRule.sequence}
              onChange={(e) => setNewRule({ ...newRule, sequence: e.target.value })}
              required
            />
          </div>

          <div className="form-group full-width">
            <label className="form-label required">Computation Method</label>
            <select
              className="form-control"
              value={newRule.computationMethod}
              onChange={(e) => setNewRule({ ...newRule, computationMethod: e.target.value })}
              required
            >
              <option value="Percentage">Percentage (% of Contract Wage or previous rule)</option>
              <option value="Fixed">Fixed (Specific rupee amount)</option>
              <option value="Formula">Formula (Arithmetic expression e.g. BASIC + HRA)</option>
            </select>
          </div>

          {newRule.computationMethod === 'Fixed' && (
            <div className="form-group full-width">
              <label className="form-label required">Fixed Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                placeholder="e.g. 500"
                value={newRule.amount}
                onChange={(e) => setNewRule({ ...newRule, amount: e.target.value })}
                required
              />
            </div>
          )}

          {newRule.computationMethod === 'Percentage' && (
            <div className="form-group full-width">
              <label className="form-label required">Percentage (%)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                placeholder="e.g. 40"
                value={newRule.percentage}
                onChange={(e) => setNewRule({ ...newRule, percentage: e.target.value })}
                required
              />
            </div>
          )}

          {newRule.computationMethod === 'Formula' && (
            <div className="form-group full-width">
              <label className="form-label required">Formula Expression</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. BASIC + HRA or GROSS - DEDUCTIONS"
                value={newRule.formulaExpression}
                onChange={(e) => setNewRule({ ...newRule, formulaExpression: e.target.value })}
                required
              />
            </div>
          )}
        </form>
      </Modal>

      {/* Modal: Edit Salary Rule */}
      {editingRule && (
        <Modal
          isOpen={!!editingRule}
          onClose={() => setEditingRule(null)}
          title={`Edit Salary Rule — ${editingRule.name}`}
          size="lg"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setEditingRule(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleUpdateRule}>
                Save Changes
              </button>
            </>
          }
        >
          <form onSubmit={handleUpdateRule} className="form-grid">
            <div className="form-group">
              <label className="form-label required">Rule Name</label>
              <input
                type="text"
                className="form-control"
                value={editingRule.name}
                onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Rule Code</label>
              <input
                type="text"
                className="form-control"
                value={editingRule.code}
                onChange={(e) => setEditingRule({ ...editingRule, code: e.target.value.toUpperCase() })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Category</label>
              <select
                className="form-control"
                value={editingRule.category}
                onChange={(e) => setEditingRule({ ...editingRule, category: e.target.value })}
                required
              >
                <option value="Basic">Basic</option>
                <option value="Allowances">Allowances</option>
                <option value="Gross">Gross</option>
                <option value="Deductions">Deductions</option>
                <option value="Net">Net</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Sequence Order</label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={editingRule.sequence}
                onChange={(e) => setEditingRule({ ...editingRule, sequence: e.target.value })}
                required
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label required">Computation Method</label>
              <select
                className="form-control"
                value={editingRule.computationMethod}
                onChange={(e) => setEditingRule({ ...editingRule, computationMethod: e.target.value })}
                required
              >
                <option value="Percentage">Percentage (% of Contract Wage or previous rule)</option>
                <option value="Fixed">Fixed (Specific rupee amount)</option>
                <option value="Formula">Formula (Arithmetic expression e.g. BASIC + HRA)</option>
              </select>
            </div>

            {editingRule.computationMethod === 'Fixed' && (
              <div className="form-group full-width">
                <label className="form-label required">Fixed Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={editingRule.amount}
                  onChange={(e) => setEditingRule({ ...editingRule, amount: e.target.value })}
                  required
                />
              </div>
            )}

            {editingRule.computationMethod === 'Percentage' && (
              <div className="form-group full-width">
                <label className="form-label required">Percentage (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={editingRule.percentage}
                  onChange={(e) => setEditingRule({ ...editingRule, percentage: e.target.value })}
                  required
                />
              </div>
            )}

            {editingRule.computationMethod === 'Formula' && (
              <div className="form-group full-width">
                <label className="form-label required">Formula Expression</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingRule.formulaExpression}
                  onChange={(e) => setEditingRule({ ...editingRule, formulaExpression: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="form-group full-width">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={editingRule.isActive}
                  onChange={(e) => setEditingRule({ ...editingRule, isActive: e.target.checked })}
                />
                <span>Rule is Active (Used in Payslip calculation)</span>
              </label>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmation Dialog: Delete Salary Rule */}
      <ConfirmDialog
        isOpen={!!deleteRuleId}
        onClose={() => setDeleteRuleId(null)}
        onConfirm={handleDeleteRule}
        title="Delete Salary Rule"
        message="Are you sure you want to delete this salary rule from this structure? This action cannot be undone."
        confirmText="Delete Rule"
        confirmVariant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}

export default SalaryStructureDetail;
