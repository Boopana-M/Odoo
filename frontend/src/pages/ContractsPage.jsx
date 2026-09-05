import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  Building2,
  Users,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ROLES } from '../utils/navigation';
import {
  getContractsApi,
  getContractByIdApi,
  getApplicableContractApi,
  createContractApi,
  updateContractApi,
  deleteContractApi,
} from '../services/contracts';
import { getEmployeesApi } from '../services/employees';
import { getDepartmentsApi } from '../services/departments';

import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Table } from '../components/tables/Table';
import { TableRow } from '../components/tables/TableRow';
import { TableCell } from '../components/tables/TableCell';
import { StatusCell } from '../components/tables/StatusCell';
import { ActionCell } from '../components/tables/ActionCell';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { PageError, SectionError } from '../components/ui/ErrorState';
import { Modal } from '../components/ui/Modal';
import { ContractModal } from '../modules/contracts/ContractModal';
import { ContractDetailModal } from '../modules/contracts/ContractDetailModal';

/**
 * Format ISO date string into readable format
 */
function formatDate(dateString) {
  if (!dateString) return 'Open-ended';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Format currency amount
 */
function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * PeoplePay360 Contracts Management Page with Tailwind CSS
 */
export function ContractsPage({ initialEmployeeFilter = null }) {
  const { token, role } = useAuth();

  // Backend restricts POST, PUT, DELETE to Admin and HR Manager
  const canManage = [ROLES.ADMIN, ROLES.HR_MANAGER].includes(role);
  const isEmployeeRole = role === ROLES.EMPLOYEE;

  // Data states
  const [contracts, setContracts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState(initialEmployeeFilter || '');

  // Modals state
  const [createEditModalOpen, setCreateEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [activeContract, setActiveContract] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Applicable contract checker state
  const [showApplicableChecker, setShowApplicableChecker] = useState(false);
  const [checkerEmpId, setCheckerEmpId] = useState('');
  const [checkerStart, setCheckerStart] = useState(new Date().toISOString().split('T')[0]);
  const [checkerEnd, setCheckerEnd] = useState(new Date().toISOString().split('T')[0]);
  const [checkerResult, setCheckerResult] = useState(null);
  const [checkerLoading, setCheckerLoading] = useState(false);
  const [checkerError, setCheckerError] = useState(null);

  /**
   * Load prerequisite dropdown metadata (Employees & Departments)
   */
  const loadPrerequisites = useCallback(async () => {
    if (!token) return;
    try {
      const [empList, deptList] = await Promise.all([
        getEmployeesApi(token),
        getDepartmentsApi(token),
      ]);
      setEmployees(empList);
      setDepartments(deptList);
    } catch {
      // Non-blocking
    }
  }, [token]);

  /**
   * Fetch contracts list with filters
   */
  const fetchContracts = useCallback(async () => {
    if (!token || isEmployeeRole) return;
    setLoading(true);
    setError(null);

    try {
      const data = await getContractsApi(token, {
        employeeId: selectedEmpId || undefined,
        departmentId: selectedDept || undefined,
        status: selectedStatus || undefined,
      });
      setContracts(data);
    } catch (err) {
      setError(err.message || 'Failed to retrieve contract records.');
    } finally {
      setLoading(false);
    }
  }, [token, isEmployeeRole, selectedEmpId, selectedDept, selectedStatus]);

  useEffect(() => {
    loadPrerequisites();
    fetchContracts();
  }, [loadPrerequisites, fetchContracts]);

  // Client-side text search over employee name, code, job position
  const filteredContracts = contracts.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();

    const emp = typeof c.employeeId === 'object' ? c.employeeId : null;
    const empName = `${emp?.firstName || ''} ${emp?.lastName || ''}`.toLowerCase();
    const empCode = (emp?.employeeCode || '').toLowerCase();
    const pos = (c.jobPosition || '').toLowerCase();
    const dept = typeof c.departmentId === 'object' ? (c.departmentId?.name || '').toLowerCase() : '';

    return empName.includes(q) || empCode.includes(q) || pos.includes(q) || dept.includes(q);
  });

  /**
   * Open Create Modal
   */
  const handleOpenCreate = () => {
    if (!canManage) return;
    setActiveContract(null);
    setModalError(null);
    setCreateEditModalOpen(true);
  };

  /**
   * Open Edit Modal
   */
  const handleOpenEdit = (contract) => {
    if (!canManage) return;
    setActiveContract(contract);
    setModalError(null);
    setCreateEditModalOpen(true);
  };

  /**
   * Open Detail View Modal
   */
  const handleOpenDetail = (contract) => {
    setActiveContract(contract);
    setDetailModalOpen(true);
  };

  /**
   * Open Delete Confirmation
   */
  const handleOpenDelete = (contract) => {
    if (!canManage) return;
    setActiveContract(contract);
    setDeleteConfirmOpen(true);
  };

  /**
   * Submit Create or Edit Contract
   */
  const handleSaveContract = async (payload) => {
    setModalLoading(true);
    setModalError(null);

    try {
      if (activeContract?._id || activeContract?.id) {
        await updateContractApi(token, activeContract._id || activeContract.id, payload);
      } else {
        await createContractApi(token, payload);
      }
      setCreateEditModalOpen(false);
      setActiveContract(null);
      await fetchContracts();
    } catch (err) {
      setModalError(err.message || 'Operation failed. Please check date ranges for active conflicts.');
    } finally {
      setModalLoading(false);
    }
  };

  /**
   * Delete Contract
   */
  const handleConfirmDelete = async () => {
    if (!activeContract || !canManage) return;
    setIsDeleting(true);

    try {
      await deleteContractApi(token, activeContract._id || activeContract.id);
      setDeleteConfirmOpen(false);
      setActiveContract(null);
      await fetchContracts();
    } catch (err) {
      setError(err.message || 'Failed to delete contract.');
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Run Applicable Contract Lookup (GET /api/contracts/applicable)
   */
  const handleCheckApplicable = async (e) => {
    e.preventDefault();
    if (!checkerEmpId || !checkerStart || !checkerEnd) return;

    setCheckerLoading(true);
    setCheckerError(null);
    setCheckerResult(null);

    try {
      const result = await getApplicableContractApi(token, checkerEmpId, checkerStart, checkerEnd);
      setCheckerResult(result);
    } catch (err) {
      setCheckerError(err.message || 'No active contract found for the specified period.');
    } finally {
      setCheckerLoading(false);
    }
  };

  // Unauthorized view for standard employee role
  if (isEmployeeRole) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Contracts"
          description="Employment agreements and compensation management."
          breadcrumbs={[{ label: 'Home' }, { label: 'Contracts' }]}
        />
        <SectionError
          title="Access Restricted"
          message="Contract administration is restricted to HR Managers, Payroll Administrators, and System Admins. Please consult HR for contract inquiries."
          className="!bg-slate-900 !border-slate-800 !text-slate-300"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100">
      {/* Page Header */}
      <PageHeader
        title="Contracts"
        description="Manage employee employment contracts, wage agreements, and active contract validity periods."
        breadcrumbs={[{ label: 'HR Management' }, { label: 'Contracts' }]}
        primaryAction={
          canManage ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={handleOpenCreate}
            >
              Add Contract
            </Button>
          ) : null
        }
        secondaryAction={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Clock size={14} />}
              onClick={() => setShowApplicableChecker(!showApplicableChecker)}
              className="!border-slate-800 !bg-slate-900 !text-slate-300 hover:!bg-slate-800"
            >
              {showApplicableChecker ? 'Hide Period Checker' : 'Applicable Contract Lookup'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchContracts}
              className="!border-slate-800 !bg-slate-900 !text-slate-300 hover:!bg-slate-800"
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Optional Applicable Contract Period Checker Tool */}
      {showApplicableChecker && (
        <div className="bg-slate-900 border border-blue-500/30 rounded-xl p-5 shadow-md space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock size={16} className="text-blue-400" />
                Active / Applicable Contract Period Lookup (API: /api/contracts/applicable)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Verify which active employment contract governs an employee during a given payroll cycle.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowApplicableChecker(false)}
              className="!text-slate-400 hover:!text-white"
            >
              ✕
            </Button>
          </div>

          <form onSubmit={handleCheckApplicable} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Employee</label>
              <select
                value={checkerEmpId}
                onChange={(e) => setCheckerEmpId(e.target.value)}
                required
                className="w-full h-9 px-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="" disabled>Select Employee...</option>
                {employees.map((emp) => (
                  <option key={emp._id || emp.id} value={emp._id || emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Period Start</label>
              <input
                type="date"
                value={checkerStart}
                onChange={(e) => setCheckerStart(e.target.value)}
                required
                className="w-full h-9 px-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Period End</label>
              <input
                type="date"
                value={checkerEnd}
                onChange={(e) => setCheckerEnd(e.target.value)}
                required
                className="w-full h-9 px-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={checkerLoading}
              className="h-9"
            >
              Lookup Applicable
            </Button>
          </form>

          {checkerError && (
            <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-400 shrink-0" />
              <span>{checkerError}</span>
            </div>
          )}

          {checkerResult && (
            <div className="p-4 bg-slate-950/60 border border-emerald-500/30 rounded-lg text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={15} /> Applicable Active Contract Found
                </span>
                <StatusBadge status={checkerResult.status || 'Active'} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-slate-300">
                <div>Position: <strong className="text-white">{checkerResult.jobPosition}</strong></div>
                <div>Wage: <strong className="text-emerald-400 font-mono">{formatCurrency(checkerResult.wage)}</strong></div>
                <div>Start: <strong className="text-white">{formatDate(checkerResult.startDate)}</strong></div>
                <div>End: <strong className="text-white">{formatDate(checkerResult.endDate)}</strong></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by employee name, code, position, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Employee Filter */}
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="h-9 px-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp._id || emp.id} value={emp._id || emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
            </select>

            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-9 px-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id || dept.id} value={dept._id || dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 px-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <SectionError
          title="Failed to Load Contracts"
          message={error}
          onRetry={fetchContracts}
          className="!bg-slate-900 !border-red-900/50 !text-red-300"
        />
      )}

      {/* Contracts Table */}
      <Table
        columns={[
          { label: 'Employee', width: '220px' },
          { label: 'Department' },
          { label: 'Job Position' },
          { label: 'Base Wage', width: '130px' },
          { label: 'Validity Period', width: '200px' },
          { label: 'Status', width: '110px' },
          { label: 'Actions', width: '110px', align: 'right' },
        ]}
        loading={loading}
        loadingRows={6}
        error={error}
        onRetry={fetchContracts}
        wrapperClassName="!bg-slate-900 !border-slate-800"
        className="!text-slate-200 [&_thead]:!bg-slate-950/60 [&_thead_th]:!text-slate-400 [&_thead]:!border-slate-800 [&_tbody]:!divide-slate-800/80"
        emptyState={
          <EmptyState
            icon={<FileText size={28} />}
            title="No contracts found"
            description="There are no employment contracts matching your criteria."
            action={
              canManage ? (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus size={15} />}
                  onClick={handleOpenCreate}
                >
                  Create Contract
                </Button>
              ) : null
            }
            className="!bg-transparent !border-transparent !text-slate-300"
          />
        }
        footer={
          filteredContracts.length > 0 ? (
            <div className="flex items-center justify-between w-full text-xs text-slate-400">
              <span>
                Showing <strong className="text-slate-200">{filteredContracts.length}</strong> total{' '}
                {filteredContracts.length === 1 ? 'contract' : 'contracts'}
              </span>
              <span className="text-slate-500">PeoplePay360 Wage & Employment Ledger</span>
            </div>
          ) : null
        }
      >
        {filteredContracts.map((contract) => {
          const emp = typeof contract.employeeId === 'object' ? contract.employeeId : null;
          const empName = emp
            ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim()
            : 'Unknown Employee';
          const empCode = emp?.employeeCode || '—';

          const dept = typeof contract.departmentId === 'object' ? contract.departmentId : null;
          const deptName = dept?.name || '—';

          return (
            <TableRow
              key={contract._id || contract.id}
              onClick={() => handleOpenDetail(contract)}
              className="hover:!bg-slate-800/60 cursor-pointer !border-slate-800/60 transition-colors"
            >
              {/* Employee */}
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold text-white hover:text-blue-400 transition-colors">
                    {empName}
                  </span>
                  <span className="text-xs font-mono text-blue-400">{empCode}</span>
                </div>
              </TableCell>

              {/* Department */}
              <TableCell className="text-slate-300">{deptName}</TableCell>

              {/* Job Position */}
              <TableCell className="text-slate-300">{contract.jobPosition || '—'}</TableCell>

              {/* Wage */}
              <TableCell>
                <span className="font-mono font-semibold text-emerald-400">
                  {formatCurrency(contract.wage)}
                </span>
              </TableCell>

              {/* Validity */}
              <TableCell className="text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-500 shrink-0" />
                  <span>
                    {formatDate(contract.startDate)} → {formatDate(contract.endDate)}
                  </span>
                </div>
              </TableCell>

              {/* Status */}
              <StatusCell status={contract.status || 'Active'} />

              {/* Actions */}
              <ActionCell>
                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    title="View Details"
                    onClick={() => handleOpenDetail(contract)}
                    className="!text-slate-400 hover:!text-white hover:!bg-slate-800"
                  >
                    <Eye size={15} />
                  </Button>

                  {canManage && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Edit Contract"
                        onClick={() => handleOpenEdit(contract)}
                        className="!text-slate-400 hover:!text-blue-400 hover:!bg-slate-800"
                      >
                        <Edit2 size={15} />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        title="Delete Contract"
                        onClick={() => handleOpenDelete(contract)}
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
      <ContractModal
        isOpen={createEditModalOpen}
        onClose={() => {
          setCreateEditModalOpen(false);
          setActiveContract(null);
          setModalError(null);
        }}
        contract={activeContract}
        employees={employees}
        departments={departments}
        preselectedEmployeeId={selectedEmpId}
        onSubmit={handleSaveContract}
        isLoading={modalLoading}
        serverError={modalError}
      />

      {/* Detail Modal */}
      <ContractDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setActiveContract(null);
        }}
        contract={activeContract}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        canManage={canManage}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setActiveContract(null);
        }}
        title="Delete Contract"
        description="Are you sure you want to delete this employment contract record?"
        className="!bg-slate-900 !border-slate-800 !text-slate-200 [&_h2]:!text-white [&_p]:!text-slate-400 [&_div]:!border-slate-800"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setActiveContract(null);
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
              Deleting this contract for{' '}
              <strong className="text-white">
                {activeContract?.employeeId?.firstName} {activeContract?.employeeId?.lastName}
              </strong>{' '}
              will remove the wage agreement from the system.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ContractsPage;
