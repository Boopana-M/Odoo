import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Sliders,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ROLES } from '../utils/navigation';
import {
  getSalaryStructuresApi,
  createSalaryStructureApi,
  updateSalaryStructureApi,
  deleteSalaryStructureApi,
} from '../services/salaryStructures';
import { getSalaryRulesApi } from '../services/salaryRules';

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
import { SalaryStructureModal } from '../modules/salary/SalaryStructureModal';

/**
 * PeoplePay360 Salary Structures Management Page
 */
export function SalaryStructuresPage({ onNavigateToRules = null }) {
  const { token, role } = useAuth();

  // Admin & HR Payroll Manager have full CRUD; HR Payroll User has Read-Only
  const canManage = [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER].includes(role);

  // Data states
  const [structures, setStructures] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeStructure, setActiveStructure] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStructures = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const [structuresData, rulesData] = await Promise.all([
        getSalaryStructuresApi(token),
        getSalaryRulesApi(token).catch(() => []),
      ]);
      setStructures(structuresData);
      setRules(rulesData);
    } catch (err) {
      setError(err.message || 'Failed to retrieve salary structures.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStructures();
  }, [fetchStructures]);

  // Search filter
  const filteredStructures = structures.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (s.name || '').toLowerCase().includes(q) || (s.code || '').toLowerCase().includes(q);
  });

  const handleOpenCreate = () => {
    if (!canManage) return;
    setActiveStructure(null);
    setModalError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (struct) => {
    if (!canManage) return;
    setActiveStructure(struct);
    setModalError(null);
    setModalOpen(true);
  };

  const handleOpenDelete = (struct) => {
    if (!canManage) return;
    setActiveStructure(struct);
    setDeleteConfirmOpen(true);
  };

  const handleSaveStructure = async (payload) => {
    setModalLoading(true);
    setModalError(null);

    try {
      if (activeStructure?._id || activeStructure?.id) {
        await updateSalaryStructureApi(token, activeStructure._id || activeStructure.id, payload);
      } else {
        await createSalaryStructureApi(token, payload);
      }
      setModalOpen(false);
      setActiveStructure(null);
      await fetchStructures();
    } catch (err) {
      setModalError(err.message || 'Operation failed');
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeStructure || !canManage) return;
    setIsDeleting(true);

    try {
      await deleteSalaryStructureApi(token, activeStructure._id || activeStructure.id);
      setDeleteConfirmOpen(false);
      setActiveStructure(null);
      await fetchStructures();
    } catch (err) {
      setError(err.message || 'Failed to delete salary structure.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Page Header */}
      <PageHeader
        title="Salary Structures"
        description="Organize salary rules into reusable payroll calculation templates for employment contracts and payrun cycles."
        breadcrumbs={[{ label: 'Payroll Management' }, { label: 'Salary Structures' }]}
        primaryAction={
          canManage ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={handleOpenCreate}
            >
              Add Structure
            </Button>
          ) : null
        }
        secondaryAction={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={fetchStructures}
            className="!border-slate-800 !bg-slate-900 !text-slate-300 hover:!bg-slate-800"
          >
            Refresh
          </Button>
        }
      />

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search structure by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        {!canManage && (
          <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            Read-Only Access
          </span>
        )}
      </div>

      {/* Global Error Banner */}
      {error && (
        <SectionError
          title="Failed to Load Structures"
          message={error}
          onRetry={fetchStructures}
          className="!bg-slate-900 !border-red-900/50 !text-red-300"
        />
      )}

      {/* Structures Table */}
      <Table
        columns={[
          { label: 'Structure Name', width: '260px' },
          { label: 'Code', width: '160px' },
          { label: 'Associated Rules', width: '150px' },
          { label: 'Status', width: '120px' },
          { label: 'Actions', width: '140px', align: 'right' },
        ]}
        loading={loading}
        loadingRows={4}
        wrapperClassName="!bg-slate-900 !border-slate-800"
        className="!text-slate-200 [&_thead]:!bg-slate-950/60 [&_thead_th]:!text-slate-400 [&_thead]:!border-slate-800 [&_tbody]:!divide-slate-800/80"
        emptyState={
          <EmptyState
            icon={<Layers size={28} />}
            title="No salary structures found"
            description="Create your first salary structure to begin defining salary rules."
            action={
              canManage ? (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus size={15} />}
                  onClick={handleOpenCreate}
                >
                  Create Structure
                </Button>
              ) : null
            }
            className="!bg-transparent !border-transparent !text-slate-300"
          />
        }
      >
        {filteredStructures.map((struct) => {
          const structId = struct._id || struct.id;
          const ruleCount = rules.filter(
            (r) =>
              (typeof r.salaryStructureId === 'object'
                ? r.salaryStructureId?._id || r.salaryStructureId?.id
                : r.salaryStructureId) === structId
          ).length;

          return (
            <TableRow key={structId} className="hover:!bg-slate-800/60 !border-slate-800/60 transition-colors">
              {/* Name */}
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                    <Layers size={16} />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">{struct.name}</span>
                    <span className="text-[11px] text-slate-500">ID: {structId.slice(-6)}</span>
                  </div>
                </div>
              </TableCell>

              {/* Code */}
              <TableCell>
                <span className="font-mono text-xs font-semibold text-blue-400 uppercase bg-blue-950/40 px-2 py-1 rounded border border-blue-900/40">
                  {struct.code}
                </span>
              </TableCell>

              {/* Rules Count */}
              <TableCell>
                <button
                  type="button"
                  onClick={() => onNavigateToRules && onNavigateToRules(structId)}
                  className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-blue-400 transition-colors"
                >
                  <Sliders size={13} className="text-slate-500" />
                  <span>{ruleCount} {ruleCount === 1 ? 'rule' : 'rules'}</span>
                </button>
              </TableCell>

              {/* Status */}
              <TableCell>
                <StatusCell status={struct.isActive ? 'Active' : 'Inactive'} />
              </TableCell>

              {/* Actions */}
              <ActionCell>
                <div className="flex items-center gap-1 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    title="View & Manage Rules"
                    onClick={() => onNavigateToRules && onNavigateToRules(structId)}
                    className="!text-slate-400 hover:!text-white hover:!bg-slate-800"
                  >
                    <Sliders size={15} />
                  </Button>

                  {canManage && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Edit Structure"
                        onClick={() => handleOpenEdit(struct)}
                        className="!text-slate-400 hover:!text-blue-400 hover:!bg-slate-800"
                      >
                        <Edit2 size={15} />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        title="Delete Structure"
                        onClick={() => handleOpenDelete(struct)}
                        className="!text-slate-400 hover:!text-red-400 hover:!bg-slate-800"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </>
                  )}
                </div>
              </ActionCell>
            </TableRow>
          );
        })}
      </Table>

      {/* Create & Edit Modal */}
      <SalaryStructureModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setActiveStructure(null);
          setModalError(null);
        }}
        structure={activeStructure}
        onSubmit={handleSaveStructure}
        isLoading={modalLoading}
        serverError={modalError}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setActiveStructure(null);
        }}
        title="Delete Salary Structure"
        description="Are you sure you want to permanently delete this salary structure?"
        className="!bg-slate-900 !border-slate-800 !text-slate-200 [&_h2]:!text-white [&_p]:!text-slate-400 [&_div]:!border-slate-800"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setActiveStructure(null);
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
            <p className="font-semibold text-red-300">Warning: Permanent Action</p>
            <p className="text-xs text-red-300/80 mt-1">
              Deleting structure <strong className="text-white">{activeStructure?.name}</strong> ({activeStructure?.code}) may affect associated salary rules and payrun computations.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default SalaryStructuresPage;
