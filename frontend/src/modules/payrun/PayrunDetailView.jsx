import React, { useState, useEffect, useCallback } from 'react';
import {
  Calculator,
  CheckCircle2,
  DollarSign,
  Mail,
  FileText,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Download,
  Eye,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Table } from '../../components/tables/Table';
import { TableRow } from '../../components/tables/TableRow';
import { TableCell } from '../../components/tables/TableCell';
import { StatusCell } from '../../components/tables/StatusCell';
import { ActionCell } from '../../components/tables/ActionCell';
import { EmptyState } from '../../components/ui/EmptyState';
import { SectionError } from '../../components/ui/ErrorState';
import {
  getPayrunByIdApi,
  computePayrunApi,
  validatePayrunApi,
  markPayrunPaidApi,
  sendPayrunPayslipsApi,
} from '../../services/payruns';
import { getPayslipsByPayrunIdApi, downloadPayslipPdfApi } from '../../services/payslips';

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
 * Payrun Processing and Detail Workspace
 */
export function PayrunDetailView({
  payrunId,
  token,
  onBack,
  onViewPayslip,
  canManage = true,
}) {
  const [payrun, setPayrun] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Action loading states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchPayrunData = useCallback(async () => {
    if (!token || !payrunId) return;
    setLoading(true);
    setError(null);

    try {
      const [payrunData, payslipsData] = await Promise.all([
        getPayrunByIdApi(token, payrunId),
        getPayslipsByPayrunIdApi(token, payrunId),
      ]);
      setPayrun(payrunData);
      setPayslips(payslipsData);
    } catch (err) {
      setError(err.message || 'Failed to load payrun details');
    } finally {
      setLoading(false);
    }
  }, [token, payrunId]);

  useEffect(() => {
    fetchPayrunData();
  }, [fetchPayrunData]);

  // Compute Payrun
  const handleCompute = async () => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await computePayrunApi(token, payrunId);
      setActionSuccess('Payrun computed successfully. Payslips have been generated.');
      await fetchPayrunData();
    } catch (err) {
      setActionError(err.message || 'Failed to compute payrun.');
    } finally {
      setActionLoading(false);
    }
  };

  // Validate Payrun
  const handleValidate = async () => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await validatePayrunApi(token, payrunId);
      setActionSuccess('Payrun validated successfully.');
      await fetchPayrunData();
    } catch (err) {
      setActionError(err.message || 'Failed to validate payrun.');
    } finally {
      setActionLoading(false);
    }
  };

  // Mark Paid
  const handleMarkPaid = async () => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await markPayrunPaidApi(token, payrunId);
      setActionSuccess('Payrun marked as Paid. Employee payslips finalized.');
      await fetchPayrunData();
    } catch (err) {
      setActionError(err.message || 'Failed to mark payrun as paid.');
    } finally {
      setActionLoading(false);
    }
  };

  // Send Payslips Bulk Email
  const handleSendEmails = async () => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await sendPayrunPayslipsApi(token, payrunId);
      const sentCount = res?.sentCount !== undefined ? res.sentCount : payslips.length;
      setActionSuccess(`Payslips email delivery triggered successfully (${sentCount} sent).`);
      await fetchPayrunData();
    } catch (err) {
      setActionError(err.message || 'Failed to trigger bulk payslip emails.');
    } finally {
      setActionLoading(false);
    }
  };

  // Download individual PDF
  const handleDownloadPdf = async (payslipId, employeeCode) => {
    setDownloadingId(payslipId);
    try {
      await downloadPayslipPdfApi(token, payslipId, `payslip_${employeeCode || payslipId}.pdf`);
    } catch (err) {
      setActionError(err.message || 'Failed to download payslip PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading && !payrun) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-blue-500" />
        <p className="text-sm">Loading payrun processing workspace...</p>
      </div>
    );
  }

  if (error && !payrun) {
    return (
      <SectionError
        title="Payrun Unavailable"
        message={error}
        onRetry={fetchPayrunData}
        className="!bg-slate-900 !border-red-900/50"
      />
    );
  }

  // Totals calculations from actual backend payslip records
  const totalGross = payslips.reduce((sum, p) => sum + (p.gross || 0), 0);
  const totalNet = payslips.reduce((sum, p) => sum + (p.net || 0), 0);
  const totalDeductions = payslips.reduce((sum, p) => sum + (p.deductions || 0), 0);
  const totalAllowances = payslips.reduce((sum, p) => sum + (p.allowances || 0), 0);

  const status = payrun?.status || 'Draft';
  const structure = typeof payrun?.salaryStructureId === 'object' ? payrun.salaryStructureId : null;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft size={15} />}
            onClick={onBack}
            className="!border-slate-800 !bg-slate-950 !text-slate-300 hover:!bg-slate-800"
          >
            All Payruns
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-white">{payrun?.name}</h2>
              <StatusBadge status={status} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Period: <strong className="text-slate-200">{formatDate(payrun?.periodStart)} → {formatDate(payrun?.periodEnd)}</strong>
              {' · '}
              Structure: <strong className="text-slate-200">{structure?.name || 'Standard'}</strong>
            </p>
          </div>
        </div>

        {/* Lifecycle Action Buttons */}
        {canManage && (
          <div className="flex items-center gap-2 flex-wrap">
            {status === 'Draft' && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Calculator size={15} />}
                loading={actionLoading}
                onClick={handleCompute}
              >
                Compute Payslips
              </Button>
            )}

            {status === 'Computed' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCw size={14} />}
                  loading={actionLoading}
                  onClick={handleCompute}
                  className="!border-slate-700 !text-slate-300 hover:!bg-slate-800"
                >
                  Recompute
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<CheckCircle2 size={15} />}
                  loading={actionLoading}
                  onClick={handleValidate}
                  className="!bg-indigo-600 hover:!bg-indigo-500"
                >
                  Validate Payrun
                </Button>
              </>
            )}

            {status === 'Validated' && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<DollarSign size={15} />}
                loading={actionLoading}
                onClick={handleMarkPaid}
                className="!bg-emerald-600 hover:!bg-emerald-500"
              >
                Mark as Paid
              </Button>
            )}

            {(status === 'Validated' || status === 'Paid') && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Mail size={15} />}
                loading={actionLoading}
                onClick={handleSendEmails}
                className="!border-blue-500/40 !bg-blue-950/20 !text-blue-300 hover:!bg-blue-900/40"
              >
                Send Payslips (Email)
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchPayrunData}
              className="!border-slate-800 !bg-slate-950 !text-slate-400 hover:!text-white hover:!bg-slate-800"
            >
              Refresh
            </Button>
          </div>
        )}
      </div>

      {/* Feedback Messages */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 bg-red-950/40 border border-red-900/50 rounded-xl text-xs text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Warnings Banner (from backend payrun validation) */}
      {payrun?.warnings && payrun.warnings.length > 0 && (
        <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <AlertTriangle size={16} />
            <span>Payrun Validation Warnings ({payrun.warnings.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-xs text-amber-300/90">
            {payrun.warnings.map((w, idx) => (
              <div key={idx} className="flex items-start gap-1.5 p-2 bg-amber-950/40 rounded border border-amber-900/40">
                <span className="text-amber-400 shrink-0">•</span>
                <span>{w.message || w}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Included Employees</p>
          <p className="text-xl font-bold text-white mt-1">
            {payrun?.employeeIds?.length || payslips.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">{payslips.length} payslips generated</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Total Gross Salary</p>
          <p className="text-xl font-bold text-emerald-400 font-mono mt-1">
            {formatCurrency(totalGross)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Allowances: {formatCurrency(totalAllowances)}</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Total Deductions</p>
          <p className="text-xl font-bold text-amber-400 font-mono mt-1">
            {formatCurrency(totalDeductions)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Taxes & Deductions</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-xs text-slate-400 font-medium">Total Net Payroll</p>
          <p className="text-xl font-bold text-blue-400 font-mono mt-1">
            {formatCurrency(totalNet)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Net Disbursable</p>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText size={16} className="text-blue-400" />
            Generated Payslips ({payslips.length})
          </h3>
          {status === 'Draft' && payslips.length === 0 && (
            <span className="text-xs text-amber-400 font-medium">
              Click &quot;Compute Payslips&quot; above to run payroll calculations.
            </span>
          )}
        </div>

        <Table
          columns={[
            { label: 'Employee', width: '220px' },
            { label: 'Worked Days', width: '110px' },
            { label: 'Basic', width: '120px' },
            { label: 'Allowances', width: '120px' },
            { label: 'Gross', width: '120px' },
            { label: 'Deductions', width: '120px' },
            { label: 'Net Salary', width: '130px' },
            { label: 'Status', width: '110px' },
            { label: 'Actions', width: '100px', align: 'right' },
          ]}
          loading={loading}
          loadingRows={4}
          wrapperClassName="!bg-slate-900 !border-slate-800"
          className="!text-slate-200 [&_thead]:!bg-slate-950/60 [&_thead_th]:!text-slate-400 [&_thead]:!border-slate-800 [&_tbody]:!divide-slate-800/80"
          emptyState={
            <EmptyState
              icon={<FileText size={28} />}
              title="No payslips generated"
              description="This payrun is in Draft status. Click 'Compute Payslips' to calculate wages for selected employees."
              action={
                canManage && status === 'Draft' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Calculator size={15} />}
                    loading={actionLoading}
                    onClick={handleCompute}
                  >
                    Compute Payslips
                  </Button>
                ) : null
              }
              className="!bg-transparent !border-transparent !text-slate-300"
            />
          }
        >
          {payslips.map((payslip) => {
            const emp = typeof payslip.employeeId === 'object' ? payslip.employeeId : null;
            const empName = emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : 'Unknown';
            const empCode = emp?.employeeCode || '—';

            return (
              <TableRow
                key={payslip._id || payslip.id}
                onClick={() => onViewPayslip && onViewPayslip(payslip)}
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

                {/* Worked Days */}
                <TableCell className="text-slate-300 font-mono text-xs">
                  {payslip.workedDays !== undefined ? payslip.workedDays : '—'}
                </TableCell>

                {/* Basic */}
                <TableCell className="font-mono text-slate-300 text-xs">
                  {formatCurrency(payslip.basic)}
                </TableCell>

                {/* Allowances */}
                <TableCell className="font-mono text-slate-300 text-xs">
                  {formatCurrency(payslip.allowances)}
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
                <StatusCell status={payslip.status || 'Draft'} />

                {/* Actions */}
                <ActionCell>
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Inspect Payslip Breakdown"
                      onClick={() => onViewPayslip && onViewPayslip(payslip)}
                      className="!text-slate-400 hover:!text-white hover:!bg-slate-800"
                    >
                      <Eye size={15} />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      title="Download PDF Payslip"
                      loading={downloadingId === (payslip._id || payslip.id)}
                      onClick={() => handleDownloadPdf(payslip._id || payslip.id, empCode)}
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
      </div>
    </div>
  );
}
