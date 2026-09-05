import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { downloadPayslipPdfApi, validatePayslipApi, markPayslipPaidApi } from '../../services/payslips';
import {
  FileText,
  Download,
  CheckCircle2,
  DollarSign,
  User,
  Building2,
  Calendar,
  Layers,
  CreditCard,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';

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
 * Payslip Detail & Rule Line Breakdown Modal
 */
export function PayslipDetailModal({
  isOpen,
  onClose,
  payslip = null,
  token,
  onStatusUpdated,
  canManage = false,
}) {
  const [downloading, setDownloading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!payslip) return null;

  const emp = typeof payslip.employeeId === 'object' ? payslip.employeeId : null;
  const empName = emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : 'Unknown Employee';
  const empCode = emp?.employeeCode || '—';
  const jobPosition = emp?.jobPosition || '—';
  const deptName = emp?.departmentId?.name || emp?.department?.name || '—';

  const structure = typeof payslip.salaryStructureId === 'object' ? payslip.salaryStructureId : null;
  const payrun = typeof payslip.payrunId === 'object' ? payslip.payrunId : null;

  const handleDownloadPdf = async () => {
    setDownloading(true);
    setError(null);
    try {
      await downloadPayslipPdfApi(token, payslip._id || payslip.id, `payslip_${empCode}.pdf`);
    } catch (err) {
      setError(err.message || 'Failed to download payslip PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleValidate = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const updated = await validatePayslipApi(token, payslip._id || payslip.id);
      if (onStatusUpdated) onStatusUpdated(updated);
    } catch (err) {
      setError(err.message || 'Failed to validate payslip');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const updated = await markPayslipPaidApi(token, payslip._id || payslip.id);
      if (onStatusUpdated) onStatusUpdated(updated);
    } catch (err) {
      setError(err.message || 'Failed to mark payslip as paid');
    } finally {
      setActionLoading(false);
    }
  };

  const lines = payslip.lines || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Payslip: ${empName}`}
      description={`Official salary breakdown for ${formatDate(payslip.periodStart)} → ${formatDate(payslip.periodEnd)}.`}
      size="lg"
      className="!bg-slate-900 !border-slate-800 !text-slate-200 [&_h2]:!text-white [&_p]:!text-slate-400 [&_div]:!border-slate-800"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Download size={15} />}
              loading={downloading}
              onClick={handleDownloadPdf}
              className="!border-slate-700 !text-slate-300 hover:!bg-slate-800"
            >
              Download PDF
            </Button>

            {canManage && payslip.status === 'Computed' && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                leftIcon={<CheckCircle2 size={15} />}
                loading={actionLoading}
                onClick={handleValidate}
                className="!bg-indigo-600 hover:!bg-indigo-500"
              >
                Validate
              </Button>
            )}

            {canManage && payslip.status === 'Validated' && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                leftIcon={<DollarSign size={15} />}
                loading={actionLoading}
                onClick={handleMarkPaid}
                className="!bg-emerald-600 hover:!bg-emerald-500"
              >
                Mark Paid
              </Button>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="!border-slate-700 !text-slate-300 hover:!bg-slate-800"
          >
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle size={15} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Employee & Cycle Context Card */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">{empName}</span>
                <span className="text-xs font-mono text-blue-400 font-semibold">{empCode}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {jobPosition} · {deptName}
              </p>
            </div>
            <StatusBadge status={payslip.status || 'Draft'} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-300">
            <div>
              <span className="text-slate-500 block text-[11px]">Payrun Cycle</span>
              <span className="font-semibold text-white">{payrun?.name || 'Standard Payrun'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Salary Structure</span>
              <span className="font-semibold text-white">{structure?.name || 'Standard Structure'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Worked Days</span>
              <span className="font-mono font-semibold text-white">{payslip.workedDays ?? '—'}</span>
            </div>
          </div>
        </div>

        {/* Computation Summary Cards */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg">
            <span className="text-[11px] text-slate-400 block font-medium">Gross Salary</span>
            <span className="text-sm font-bold font-mono text-emerald-400 mt-0.5 block">
              {formatCurrency(payslip.gross)}
            </span>
            <span className="text-[10px] text-slate-500">Basic + Allowances</span>
          </div>

          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg">
            <span className="text-[11px] text-slate-400 block font-medium">Total Deductions</span>
            <span className="text-sm font-bold font-mono text-amber-400 mt-0.5 block">
              {formatCurrency(payslip.deductions)}
            </span>
            <span className="text-[10px] text-slate-500">Taxes & Contributions</span>
          </div>

          <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-lg">
            <span className="text-[11px] text-blue-300 block font-medium">Net Disbursable</span>
            <span className="text-base font-bold font-mono text-blue-400 mt-0.5 block">
              {formatCurrency(payslip.net)}
            </span>
            <span className="text-[10px] text-slate-500">Final Take-Home</span>
          </div>
        </div>

        {/* Salary Rule Line Breakdown */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Salary Rule Computation Lines ({lines.length})
          </h4>

          {lines.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-950/30 rounded-lg border border-slate-800/60">
              No computed rule lines attached to this payslip.
            </p>
          ) : (
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Rule Name</th>
                    <th className="py-2.5 px-3 font-mono">Code</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                  {lines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-medium text-white">{line.name}</td>
                      <td className="py-2.5 px-3 font-mono text-blue-400 text-[11px]">{line.code}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] uppercase font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                          {line.category}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-semibold ${
                        line.category === 'Deductions' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {line.category === 'Deductions' ? '-' : ''}{formatCurrency(line.calculatedAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
