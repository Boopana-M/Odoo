import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Calendar,
  Layers,
  Users,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ROLES } from '../utils/navigation';
import { getPayrunsApi, createPayrunApi } from '../services/payruns';
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
import { PayrunWizardModal } from '../modules/payrun/PayrunWizardModal';
import { PayrunDetailView } from '../modules/payrun/PayrunDetailView';
import { PayslipDetailModal } from '../modules/payslip/PayslipDetailModal';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * PeoplePay360 Payruns Management Page
 */
export function PayrunsPage() {
  const { token, role } = useAuth();

  // Admin, HR Payroll Manager, and HR Payroll User have payrun access
  const canManage = [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER].includes(role);

  // Active view: directory or drill-down detail
  const [selectedPayrunId, setSelectedPayrunId] = useState(null);

  // Data states
  const [payruns, setPayruns] = useState([]);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Wizard modal
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardLoading, setWizardLoading] = useState(false);
  const [wizardError, setWizardError] = useState(null);

  // Payslip detail modal (when viewing single payslip within payrun)
  const [activePayslip, setActivePayslip] = useState(null);
  const [payslipModalOpen, setPayslipModalOpen] = useState(false);

  const fetchPrerequisites = useCallback(async () => {
    if (!token) return;
    try {
      const structData = await getSalaryStructuresApi(token);
      setStructures(structData);
    } catch {
      // Non-blocking
    }
  }, [token]);

  const fetchPayruns = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const data = await getPayrunsApi(token);
      setPayruns(data);
    } catch (err) {
      setError(err.message || 'Failed to retrieve payruns.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPrerequisites();
    fetchPayruns();
  }, [fetchPrerequisites, fetchPayruns]);

  // Search and status filter
  const filteredPayruns = payruns.filter((p) => {
    if (selectedStatus && p.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesName = (p.name || '').toLowerCase().includes(q);
      const structName = typeof p.salaryStructureId === 'object' ? (p.salaryStructureId?.name || '').toLowerCase() : '';
      return matchesName || structName.includes(q);
    }
    return true;
  });

  const handleOpenWizard = () => {
    setWizardError(null);
    setWizardOpen(true);
  };

  const handleCreatePayrunSubmit = async (payload) => {
    setWizardLoading(true);
    setWizardError(null);

    try {
      const created = await createPayrunApi(token, payload);
      setWizardOpen(false);
      await fetchPayruns();
      // Directly open the created payrun processing workspace
      if (created?._id || created?.id) {
        setSelectedPayrunId(created._id || created.id);
      }
    } catch (err) {
      setWizardError(err.message || 'Failed to create payrun cycle.');
    } finally {
      setWizardLoading(false);
    }
  };

  // 1. Detailed Payrun Processing View
  if (selectedPayrunId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Payrun Processing Workspace"
          description="Compute wages, validate calculations, disburse payments, and dispatch employee payslips."
          breadcrumbs={[
            { label: 'Payroll Management' },
            { label: 'Payruns', href: '#' },
            { label: 'Processing' },
          ]}
        />
        <PayrunDetailView
          payrunId={selectedPayrunId}
          token={token}
          canManage={canManage}
          onBack={() => {
            setSelectedPayrunId(null);
            fetchPayruns();
          }}
          onViewPayslip={(payslip) => {
            setActivePayslip(payslip);
            setPayslipModalOpen(true);
          }}
        />

        {/* Payslip Breakdown Modal */}
        <PayslipDetailModal
          isOpen={payslipModalOpen}
          onClose={() => {
            setPayslipModalOpen(false);
            setActivePayslip(null);
          }}
          payslip={activePayslip}
          token={token}
          canManage={canManage}
          onStatusUpdated={() => {
            // refresh
          }}
        />
      </div>
    );
  }

  // 2. Directory List View
  return (
    <div className="space-y-6 text-slate-100">
      {/* Page Header */}
      <PageHeader
        title="Payruns"
        description="Manage organizational payroll disbursement cycles, salary calculations, and employee payslip processing."
        breadcrumbs={[{ label: 'Payroll Management' }, { label: 'Payruns' }]}
        primaryAction={
          canManage ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={handleOpenWizard}
            >
              New Payrun
            </Button>
          ) : null
        }
        secondaryAction={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={fetchPayruns}
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
              placeholder="Search payrun by cycle name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2.5">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 px-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Computed">Computed</option>
              <option value="Validated">Validated</option>
              <option value="Paid">Paid</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <SectionError
          title="Failed to Load Payruns"
          message={error}
          onRetry={fetchPayruns}
          className="!bg-slate-900 !border-red-900/50 !text-red-300"
        />
      )}

      {/* Payruns Table */}
      <Table
        columns={[
          { label: 'Payrun Name', width: '260px' },
          { label: 'Salary Structure', width: '200px' },
          { label: 'Payroll Period', width: '220px' },
          { label: 'Employees', width: '120px' },
          { label: 'Status', width: '120px' },
          { label: 'Actions', width: '110px', align: 'right' },
        ]}
        loading={loading}
        loadingRows={4}
        wrapperClassName="!bg-slate-900 !border-slate-800"
        className="!text-slate-200 [&_thead]:!bg-slate-950/60 [&_thead_th]:!text-slate-400 [&_thead]:!border-slate-800 [&_tbody]:!divide-slate-800/80"
        emptyState={
          <EmptyState
            icon={<FileSpreadsheet size={28} />}
            title="No payrun cycles found"
            description="Initiate a new payroll run cycle using the setup wizard."
            action={
              canManage ? (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus size={15} />}
                  onClick={handleOpenWizard}
                >
                  New Payrun
                </Button>
              ) : null
            }
            className="!bg-transparent !border-transparent !text-slate-300"
          />
        }
      >
        {filteredPayruns.map((payrun) => {
          const payrunId = payrun._id || payrun.id;
          const struct =
            typeof payrun.salaryStructureId === 'object'
              ? payrun.salaryStructureId
              : structures.find((s) => (s._id || s.id) === payrun.salaryStructureId);
          const empCount = payrun.employeeIds?.length || payrun.payslipIds?.length || 0;

          return (
            <TableRow
              key={payrunId}
              onClick={() => setSelectedPayrunId(payrunId)}
              className="hover:!bg-slate-800/60 cursor-pointer !border-slate-800/60 transition-colors"
            >
              {/* Name */}
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <span className="font-semibold text-white block hover:text-blue-400 transition-colors">
                      {payrun.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Created: {formatDate(payrun.createdAt)}
                    </span>
                  </div>
                </div>
              </TableCell>

              {/* Salary Structure */}
              <TableCell className="text-slate-300 text-xs">
                {struct?.name || 'Standard Structure'}
              </TableCell>

              {/* Period */}
              <TableCell className="text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-500 shrink-0" />
                  <span>
                    {formatDate(payrun.periodStart)} → {formatDate(payrun.periodEnd)}
                  </span>
                </div>
              </TableCell>

              {/* Employee Count */}
              <TableCell>
                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
                  <Users size={13} className="text-slate-500" />
                  <span>{empCount}</span>
                </div>
              </TableCell>

              {/* Status */}
              <StatusCell status={payrun.status || 'Draft'} />

              {/* Actions */}
              <ActionCell>
                <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Process Payrun"
                    onClick={() => setSelectedPayrunId(payrunId)}
                    className="!text-slate-400 hover:!text-white hover:!bg-slate-800"
                  >
                    <Eye size={15} />
                  </Button>
                </div>
              </ActionCell>
            </TableRow>
          );
        })}
      </Table>

      {/* Payrun 2-Step Creation Wizard Modal */}
      <PayrunWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        token={token}
        structures={structures}
        onSubmit={handleCreatePayrunSubmit}
        isLoading={wizardLoading}
        serverError={wizardError}
      />
    </div>
  );
}

export default PayrunsPage;
