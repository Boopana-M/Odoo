import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  Search,
  RefreshCw,
  Eye,
  Download,
  Calendar,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ROLES } from '../utils/navigation';
import { getPayslipsApi, downloadPayslipPdfApi } from '../services/payslips';
import { getEmployeesApi } from '../services/employees';

import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Table } from '../components/tables/Table';
import { TableRow } from '../components/tables/TableRow';
import { TableCell } from '../components/tables/TableCell';
import { StatusCell } from '../components/tables/StatusCell';
import { ActionCell } from '../components/tables/ActionCell';
import { EmptyState } from '../components/ui/EmptyState';
import { SectionError } from '../components/ui/ErrorState';
import { PayslipDetailModal } from '../modules/payslip/PayslipDetailModal';

function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

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
 * PeoplePay360 Payslips Management Page
 */
export function PayslipsPage({ initialEmployeeFilter = '' }) {
  const { token, role } = useAuth();

  const isPayrollAdmin = [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER].includes(role);

  // Data states
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState(initialEmployeeFilter || '');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals & PDF
  const [activePayslip, setActivePayslip] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchPrerequisites = useCallback(async () => {
    if (!token) return;
    try {
      const empData = await getEmployeesApi(token);
      setEmployees(empData);
    } catch {
      // Non-blocking
    }
  }, [token]);

  const fetchPayslips = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const data = await getPayslipsApi(token, {
        employeeId: selectedEmpId || undefined,
        status: selectedStatus || undefined,
      });
      setPayslips(data);
    } catch (err) {
      setError(err.message || 'Failed to retrieve payslips.');
    } finally {
      setLoading(false);
    }
  }, [token, selectedEmpId, selectedStatus]);

  useEffect(() => {
    fetchPrerequisites();
    fetchPayslips();
  }, [fetchPrerequisites, fetchPayslips]);

  // Client-side text search
  const filteredPayslips = payslips.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const emp = typeof p.employeeId === 'object' ? p.employeeId : null;
    const empName = `${emp?.firstName || ''} ${emp?.lastName || ''}`.toLowerCase();
    const empCode = (emp?.employeeCode || '').toLowerCase();
    return empName.includes(q) || empCode.includes(q);
  });

  const handleOpenDetail = (payslip) => {
    setActivePayslip(payslip);
    setModalOpen(true);
  };

  const handleDownloadPdf = async (payslipId, empCode) => {
    setDownloadingId(payslipId);
    try {
      await downloadPayslipPdfApi(token, payslipId, `payslip_${empCode || payslipId}.pdf`);
    } catch (err) {
      setError(err.message || 'Failed to download payslip PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Page Header */}
      <PageHeader
        title="Payslips"
        description="View and download finalized employee payslips, salary breakdowns, deductions, and payment statuses."
        breadcrumbs={[{ label: 'Payroll Management' }, { label: 'Payslips' }]}
        secondaryAction={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={fetchPayslips}
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
              placeholder="Search by employee name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Employee Filter */}
            {isPayrollAdmin && (
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
            )}

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 px-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Computed">Computed</option>
              <option value="Validated">Validated</option>
              <option value="Paid">Paid</option>
              <option value="Draft">Draft</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <SectionError
          title="Failed to Load Payslips"
          message={error}
          onRetry={fetchPayslips}
          className="!bg-slate-900 !border-red-900/50 !text-red-300"
        />
      )}

      {/* Payslips Table */}
      <Table
        columns={[
          { label: 'Employee', width: '220px' },
          { label: 'Period', width: '200px' },
          { label: 'Worked Days', width: '110px' },
          { label: 'Gross Salary', width: '130px' },
          { label: 'Deductions', width: '120px' },
          { label: 'Net Take-Home', width: '140px' },
          { label: 'Status', width: '110px' },
          { label: 'Actions', width: '110px', align: 'right' },
        ]}
        loading={loading}
        loadingRows={6}
        wrapperClassName="!bg-slate-900 !border-slate-800"
        className="!text-slate-200 [&_thead]:!bg-slate-950/60 [&_thead_th]:!text-slate-400 [&_thead]:!border-slate-800 [&_tbody]:!divide-slate-800/80"
        emptyState={
          <EmptyState
            icon={<FileSpreadsheet size={28} />}
            title="No payslips found"
            description="There are no payslip records matching the active filter criteria."
            className="!bg-transparent !border-transparent !text-slate-300"
          />
        }
      >
        {filteredPayslips.map((payslip) => {
          const payslipId = payslip._id || payslip.id;
          const emp = typeof payslip.employeeId === 'object' ? payslip.employeeId : null;
          const empName = emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : 'Unknown Employee';
          const empCode = emp?.employeeCode || '—';

          return (
            <TableRow
              key={payslipId}
              onClick={() => handleOpenDetail(payslip)}
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

              {/* Period */}
              <TableCell className="text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-500 shrink-0" />
                  <span>
                    {formatDate(payslip.periodStart)} → {formatDate(payslip.periodEnd)}
                  </span>
                </div>
              </TableCell>

              {/* Worked Days */}
              <TableCell className="text-slate-300 font-mono text-xs">
                {payslip.workedDays ?? '—'}
              </TableCell>

              {/* Gross */}
              <TableCell className="font-mono text-emerald-400 font-semibold text-xs">
                {formatCurrency(payslip.gross)}
              </TableCell>

              {/* Deductions */}
              <TableCell className="font-mono text-amber-400 text-xs">
                {formatCurrency(payslip.deductions)}
              </TableCell>

              {/* Net */}
              <TableCell className="font-mono text-blue-400 font-bold text-xs">
                {formatCurrency(payslip.net)}
              </TableCell>

              {/* Status */}
              <StatusCell status={payslip.status || 'Computed'} />

              {/* Actions */}
              <ActionCell>
                <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="View Breakdown"
                    onClick={() => handleOpenDetail(payslip)}
                    className="!text-slate-400 hover:!text-white hover:!bg-slate-800"
                  >
                    <Eye size={15} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    title="Download PDF"
                    loading={downloadingId === payslipId}
                    onClick={() => handleDownloadPdf(payslipId, empCode)}
                    className="!text-slate-400 hover:!text-blue-400 hover:!bg-slate-800"
                  >
                    <Download size={15} />
                  </Button>
                </div>
              </ActionCell>
            </TableRow>
          );
        })}
      </Table>

      {/* Payslip Detail Modal */}
      <PayslipDetailModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setActivePayslip(null);
        }}
        payslip={activePayslip}
        token={token}
        canManage={isPayrollAdmin}
        onStatusUpdated={() => {
          fetchPayslips();
        }}
      />
    </div>
  );
}

export default PayslipsPage;
