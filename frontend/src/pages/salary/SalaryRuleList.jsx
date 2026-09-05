import React, { useState, useEffect } from 'react';
import { Settings, Plus, Layers, Filter, Edit2, Trash2 } from 'lucide-react';
import { salaryApi } from '../../api/salaryApi';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export function SalaryRuleList() {
  const { isPayrollManager } = useAuth();
  const { success, error } = useNotification();

  const [rules, setRules] = useState([]);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStructure, setSelectedStructure] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    salaryStructureId: '',
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

  // Edit Modal State
  const [editingRule, setEditingRule] = useState(null);

  // Delete Confirmation State
  const [deleteRuleId, setDeleteRuleId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesRes, structRes] = await Promise.all([
        salaryApi.getRules(),
        salaryApi.getStructures()
      ]);
      setRules(rulesRes.data || []);
      setStructures(structRes.data || []);
    } catch (err) {
      error(err.message || 'Failed to load salary rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        salaryStructureId: newRule.salaryStructureId,
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
      success('Salary rule created successfully');
      setIsCreateOpen(false);
      setNewRule({
        salaryStructureId: '',
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

  const handleOpenEdit = (rule) => {
    setEditingRule({
      _id: rule._id,
      salaryStructureId: rule.salaryStructureId?._id || rule.salaryStructureId || '',
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingRule) return;

    try {
      const payload = {
        salaryStructureId: editingRule.salaryStructureId,
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

  const handleDelete = async () => {
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

  const filteredRules = rules.filter((r) => {
    const structMatch = !selectedStructure || (r.salaryStructureId?._id || r.salaryStructureId) === selectedStructure;
    const catMatch = !selectedCategory || r.category === selectedCategory;
    return structMatch && catMatch;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title-area">
          <Settings size={24} color="var(--primary)" />
          <h1 className="page-title">Salary Rules</h1>
        </div>

        <div className="page-actions">
          {isPayrollManager && (
            <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
              <Plus size={16} /> New Salary Rule
            </button>
          )}
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-inputs">
          <select
            className="form-control"
            value={selectedStructure}
            onChange={(e) => setSelectedStructure(e.target.value)}
          >
            <option value="">All Salary Structures</option>
            {structures.map((s) => (
              <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
            ))}
          </select>

          <select
            className="form-control"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Basic">Basic</option>
            <option value="Allowances">Allowances</option>
            <option value="Gross">Gross</option>
            <option value="Deductions">Deductions</option>
            <option value="Net">Net</option>
          </select>
        </div>

        {(selectedStructure || selectedCategory) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSelectedStructure('');
              setSelectedCategory('');
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Seq #</th>
              <th>Rule Name</th>
              <th>Code</th>
              <th>Structure</th>
              <th>Category</th>
              <th>Method</th>
              <th>Computation Definition</th>
              <th>Status</th>
              {isPayrollManager && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredRules.map((r) => (
              <tr key={r._id}>
                <td style={{ fontWeight: 700, color: 'var(--primary)' }}>#{r.sequence}</td>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td><span className="badge badge-neutral">{r.code}</span></td>
                <td>{r.salaryStructureId?.name || '-'}</td>
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
                <td><span className="badge badge-neutral">{r.computationMethod}</span></td>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {r.computationMethod === 'Fixed' && `₹${r.amount}`}
                  {r.computationMethod === 'Percentage' && `${r.percentage}%`}
                  {r.computationMethod === 'Formula' && (r.formulaExpression || '-')}
                </td>
                <td><StatusBadge status={r.isActive ? 'Active' : 'Inactive'} /></td>
                {isPayrollManager && (
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(r)}
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

      {filteredRules.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No salary rules found matching criteria.</p>
        </div>
      )}

      {/* Modal: Create Salary Rule */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Salary Rule"
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreate}>
              Save Rule
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="form-grid">
          <div className="form-group full-width">
            <label className="form-label required">Parent Salary Structure</label>
            <select
              className="form-control"
              value={newRule.salaryStructureId}
              onChange={(e) => setNewRule({ ...newRule, salaryStructureId: e.target.value })}
              required
            >
              <option value="">Select Salary Structure</option>
              {structures.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">Rule Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Provident Fund Deduction"
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
              placeholder="e.g. PF"
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
              <option value="Percentage">Percentage (% of Base Wage / Previous Component)</option>
              <option value="Fixed">Fixed (Specific rupee amount)</option>
              <option value="Formula">Formula (Expression e.g. BASIC + HRA)</option>
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
                placeholder="e.g. 12"
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
              <button className="btn btn-primary" onClick={handleUpdate}>
                Save Changes
              </button>
            </>
          }
        >
          <form onSubmit={handleUpdate} className="form-grid">
            <div className="form-group full-width">
              <label className="form-label required">Parent Salary Structure</label>
              <select
                className="form-control"
                value={editingRule.salaryStructureId}
                onChange={(e) => setEditingRule({ ...editingRule, salaryStructureId: e.target.value })}
                required
              >
                <option value="">Select Salary Structure</option>
                {structures.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

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
                <option value="Percentage">Percentage (% of Base Wage / Previous Component)</option>
                <option value="Fixed">Fixed (Specific rupee amount)</option>
                <option value="Formula">Formula (Expression e.g. BASIC + HRA)</option>
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
                <span>Rule is Active (Used in Payrun calculations)</span>
              </label>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmation Dialog: Delete Salary Rule */}
      <ConfirmDialog
        isOpen={!!deleteRuleId}
        onClose={() => setDeleteRuleId(null)}
        onConfirm={handleDelete}
        title="Delete Salary Rule"
        message="Are you sure you want to delete this salary rule? This action cannot be undone and will impact future payrun computations."
        confirmText="Delete Rule"
        confirmVariant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}

export default SalaryRuleList;
