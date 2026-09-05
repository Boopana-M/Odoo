import React, { useState, useEffect } from 'react';
import { Settings, Plus, Layers, Filter } from 'lucide-react';
import { salaryApi } from '../../api/salaryApi';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
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
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to create salary rule');
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
                  {r.computationMethod === 'Fixed' && `$${r.amount}`}
                  {r.computationMethod === 'Percentage' && `${r.percentage}%`}
                  {r.computationMethod === 'Formula' && (r.formulaExpression || '-')}
                </td>
                <td><StatusBadge status={r.isActive ? 'Active' : 'Inactive'} /></td>
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
              <option value="Fixed">Fixed (Specific dollar amount)</option>
              <option value="Formula">Formula (Expression e.g. BASIC + HRA)</option>
            </select>
          </div>

          {newRule.computationMethod === 'Fixed' && (
            <div className="form-group full-width">
              <label className="form-label required">Fixed Amount ($)</label>
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
    </div>
  );
}

export default SalaryRuleList;
