import React, { useState, useEffect, useCallback } from 'react';
import {
  Sliders,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Layers,
  ArrowUpDown,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ROLES } from '../utils/navigation';
import {
  getSalaryRulesApi,
  createSalaryRuleApi,
  updateSalaryRuleApi,
  deleteSalaryRuleApi,
} from '../services/salaryRules';
import { getSalaryStructuresApi } from '../services/salaryStructures';

import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Table } from '../components/tables/Table';
import { TableRow } from '../components/tables/TableRow';
import { TableCell } from '../components/tables/TableCell';
import { StatusCell } from '../components/tables/StatusCell';
import { ActionCell } from '../components/tables/ActionCell';
import { EmptyState } from '../components/ui/EmptyState';
import { SectionError } from '../components/ui/ErrorState';
import { Modal } from '../components/ui/Modal';
import { SalaryRuleModal } from '../modules/salary/SalaryRuleModal';

function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * PeoplePay360 Salary Rules Management Page
 */
export function SalaryRulesPage({ initialStructureFilter = '' }) {
  const { token, role } = useAuth();

  // Admin & HR Payroll Manager have full CRUD; HR Payroll User has Read-Only
  const canManage = [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER].includes(role);

  // Data states
  const [rules, setRules] = useState([]);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedStructureId, setSelectedStructureId] = useState(initialStructureFilter || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeRule, setActiveRule] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPrerequisites = useCallback(async () => {
    if (!token) return;
    try {
      const structData = await getSalaryStructuresApi(token);
      setStructures(structData);
    } catch {
      // Non-blocking
    }
  }, [token]);

  const fetchRules = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const rulesData = await getSalaryRulesApi(token);
      setRules(rulesData);
    } catch (err) {
      setError(err.message || 'Failed to retrieve salary rules.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPrerequisites();
    fetchRules();
  }, [fetchPrerequisites, fetchRules]);

  // Client-side filtering & sequence sorting
  const filteredRules = rules
    .filter((r) => {
      const structId =
        typeof r.salaryStructureId === 'object'
          ? r.salaryStructureId?._id || r.salaryStructureId?.id
          : r.salaryStructureId;

      if (selectedStructureId && structId !== selectedStructureId) return false;
      if (selectedCategory && r.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (r.name || '').toLowerCase().includes(q);
        const matchesCode = (r.code || '').toLowerCase().includes(q);
        return matchesName || matchesCode;
      }
      return true;
    })
    .sort((a, b) => (a.sequence ?? 50) - (b.sequence ?? 50));

  const handleOpenCreate = () => {
    if (!canManage) return;
    setActiveRule(null);
    setModalError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (rule) => {
    if (!canManage) return;
    setActiveRule(rule);
    setModalError(null);
    setModalOpen(true);
  };

  const handleOpenDelete = (rule) => {
    if (!canManage) return;
    setActiveRule(rule);
    setDeleteConfirmOpen(true);
  };

  const handleSaveRule = async (payload) => {
    setModalLoading(true);
    setModalError(null);

    try {
      if (activeRule?._id || activeRule?.id) {
        await updateSalaryRuleApi(token, activeRule._id || activeRule.id, payload);
      } else {
        await createSalaryRuleApi(token, payload);
      }
      setModalOpen(false);
      setActiveRule(null);
      await fetchRules();
    } catch (err) {
      setModalError(err.message || 'Operation failed');
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeRule || !canManage) return;
    setIsDeleting(true);

    try {
      await deleteSalaryRuleApi(token, activeRule._id || activeRule.id);
      setDeleteConfirmOpen(false);
      setActiveRule(null);
      await fetchRules();
    } catch (err) {
      setError(err.message || 'Failed to delete salary rule.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Page Header */}
      <PageHeader
        title="Salary Rules"
        description="Configure sequential formula and percentage computation rules (Basic, Allowances, Gross, Deductions, Net)."
        breadcrumbs={[{ label: 'Payroll Management' }, { label: 'Salary Rules' }]}
        primaryAction={
          canManage ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={handleOpenCreate}
            >
              Add Salary Rule
            </Button>
          ) : null
        }
        secondaryAction={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={fetchRules}
            className="!border-slate-800 !bg-slate-900 !text-slate-300 hover:!bg-slate-800"
          >
            Refresh
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search rule by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Structure Filter */}
            <select
              value={selectedStructureId}
              onChange={(e) => setSelectedStructureId(e.target.value)}
              className="h-9 px-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Structures</option>
              {structures.map((s) => (
                <option key={s._id || s.id} value={s._id || s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 px-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Categories</option>
              <option value="Basic">Basic</option>
              <option value="Allowances">Allowances</option>
              <option value="Gross">Gross</option>
              <option value="Deductions">Deductions</option>
              <option value="Net">Net</option>
            </select>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <SectionError
          title="Failed to Load Salary Rules"
          message={error}
          onRetry={fetchRules}
          className="!bg-slate-900 !border-red-900/50 !text-red-300"
        />
      )}

      {/* Rules Table */}
      <Table
        columns={[
          { label: 'Seq', width: '70px' },
          { label: 'Rule Name', width: '220px' },
          { label: 'Code', width: '130px' },
          { label: 'Category', width: '130px' },
          { label: 'Structure', width: '180px' },
          { label: 'Computation / Value', width: '200px' },
          { label: 'Status', width: '100px' },
          { label: 'Actions', width: '110px', align: 'right' },
        ]}
        loading={loading}
        loadingRows={5}
        wrapperClassName="!bg-slate-900 !border-slate-800"
        className="!text-slate-200 [&_thead]:!bg-slate-950/60 [&_thead_th]:!text-slate-400 [&_thead]:!border-slate-800 [&_tbody]:!divide-slate-800/80"
        emptyState={
          <EmptyState
            icon={<Sliders size={28} />}
            title="No salary rules found"
            description="Create rules to automate calculation of base wages, allowances, taxes, and net totals."
            action={
              canManage ? (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus size={15} />}
                  onClick={handleOpenCreate}
                >
                  Create Rule
                </Button>
              ) : null
            }
            className="!bg-transparent !border-transparent !text-slate-300"
          />
        }
      >
        {filteredRules.map((rule) => {
          const ruleId = rule._id || rule.id;
          const struct =
            typeof rule.salaryStructureId === 'object'
              ? rule.salaryStructureId
              : structures.find((s) => (s._id || s.id) === rule.salaryStructureId);

          let computationDisplay = '—';
          if (rule.computationMethod === 'Fixed') {
            computationDisplay = `Fixed: ${formatCurrency(rule.amount)}`;
          } else if (rule.computationMethod === 'Percentage') {
            computationDisplay = `${rule.percentage}% of Base`;
          } else if (rule.computationMethod === 'Formula') {
            computationDisplay = rule.formulaExpression || 'Formula';
          }

          return (
            <TableRow key={ruleId} className="hover:!bg-slate-800/60 !border-slate-800/60 transition-colors">
              {/* Sequence */}
              <TableCell>
                <span className="font-mono text-xs font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {rule.sequence ?? 50}
                </span>
              </TableCell>

              {/* Name */}
              <TableCell>
                <span className="font-semibold text-white">{rule.name}</span>
              </TableCell>

              {/* Code */}
              <TableCell>
                <span className="font-mono text-xs font-semibold text-blue-400 uppercase bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/40">
                  {rule.code}
                </span>
              </TableCell>

              {/* Category */}
              <TableCell>
                <span className="text-[11px] uppercase font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                  {rule.category}
                </span>
              </TableCell>

              {/* Structure */}
              <TableCell className="text-slate-300 text-xs">
                {struct?.name || 'Standard Structure'}
              </TableCell>

              {/* Computation Display */}
              <TableCell>
                <span className="font-mono text-xs text-emerald-400">
                  {computationDisplay}
                </span>
              </TableCell>

              {/* Status */}
              <TableCell>
                <StatusCell status={rule.isActive ? 'Active' : 'Inactive'} />
              </TableCell>

              {/* Actions */}
              <ActionCell>
                {canManage && (
                  <div className="flex items-center gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Edit Rule"
                      onClick={() => handleOpenEdit(rule)}
                      className="!text-slate-400 hover:!text-blue-400 hover:!bg-slate-800"
                    >
                      <Edit2 size={15} />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      title="Delete Rule"
                      onClick={() => handleOpenDelete(rule)}
                      className="!text-slate-400 hover:!text-red-400 hover:!bg-slate-800"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                )}
              </ActionCell>
            </TableRow>
          );
        })}
      </Table>

      {/* Create & Edit Modal */}
      <SalaryRuleModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setActiveRule(null);
          setModalError(null);
        }}
        rule={activeRule}
        structures={structures}
        defaultStructureId={selectedStructureId}
        onSubmit={handleSaveRule}
        isLoading={modalLoading}
        serverError={modalError}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setActiveRule(null);
        }}
        title="Delete Salary Rule"
        description="Are you sure you want to permanently delete this salary computation rule?"
        className="!bg-slate-900 !border-slate-800 !text-slate-200 [&_h2]:!text-white [&_p]:!text-slate-400 [&_div]:!border-slate-800"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setActiveRule(null);
              }}
              className="!border-slate-700 !text-slate-300 hover:!bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              loading={isDeleting}
              onClick={handleConfirmDelete}
            >
              Delete Permanently
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3 p-3.5 bg-red-950/40 border border-red-900/50 rounded-lg text-sm text-red-200">
          <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-300">Warning: Permanent Deletion</p>
            <p className="text-xs text-red-300/80 mt-1">
              Deleting rule <strong className="text-white">{activeRule?.name}</strong> ({activeRule?.code}) will remove it from future payrun calculations.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default SalaryRulesPage;
