import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/forms/FormField';
import { FormLabel } from '../../components/forms/FormLabel';
import { FormError } from '../../components/forms/FormError';
import { Input } from '../../components/forms/Input';
import { Select } from '../../components/forms/Select';
import { DateInput } from '../../components/forms/DateInput';
import { getEligibleEmployeesApi } from '../../services/payruns';
import {
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Users,
} from 'lucide-react';

/**
 * Payrun Creation Wizard (2-Step Flow)
 * Step 1: Name, Salary Structure, Period Start, Period End.
 * Step 2: Fetch and review eligible employees from /api/payruns/eligible-employees, select employees, click "Create Payrun".
 */
export function PayrunWizardModal({
  isOpen,
  onClose,
  token,
  structures = [],
  onSubmit,
  isLoading = false,
  serverError = null,
}) {
  const [step, setStep] = useState(1);

  // Form Step 1 data
  const [name, setName] = useState('');
  const [salaryStructureId, setSalaryStructureId] = useState('');
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  });

  const [step1Errors, setStep1Errors] = useState({});

  // Step 2 data
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [eligibleError, setEligibleError] = useState(null);
  const [eligibleList, setEligibleList] = useState([]);
  const [ineligibleList, setIneligibleList] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);

  // Reset wizard on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      const defaultStruct = structures.find((s) => s.isActive)?._id || structures[0]?._id || '';
      setSalaryStructureId(defaultStruct);
      setName(`Payrun - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`);
      setStep1Errors({});
      setEligibleList([]);
      setIneligibleList([]);
      setSelectedEmployeeIds([]);
      setEligibleError(null);
    }
  }, [isOpen, structures]);

  const validateStep1 = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Payrun name is required';
    if (!salaryStructureId) errs.salaryStructureId = 'Salary structure is required';
    if (!periodStart) errs.periodStart = 'Period start date is required';
    if (!periodEnd) errs.periodEnd = 'Period end date is required';
    if (periodStart && periodEnd && new Date(periodEnd) < new Date(periodStart)) {
      errs.periodEnd = 'Period end date cannot precede start date';
    }
    setStep1Errors(errs);
    return Object.keys(errs).length === 0;
  };

  /**
   * Transition from Step 1 to Step 2
   */
  const handleProceedToStep2 = async (e) => {
    e?.preventDefault();
    if (!validateStep1()) return;

    setLoadingEligible(true);
    setEligibleError(null);

    try {
      const data = await getEligibleEmployeesApi(token, {
        salaryStructureId,
        periodStart,
        periodEnd,
      });

      const eligible = data.eligibleEmployees || [];
      const ineligible = data.ineligibleEmployees || [];

      setEligibleList(eligible);
      setIneligibleList(ineligible);
      // Pre-select all eligible employees by default
      setSelectedEmployeeIds(eligible.map((emp) => emp._id || emp.id));
      setStep(2);
    } catch (err) {
      setEligibleError(err.message || 'Failed to check employee eligibility for this period.');
    } finally {
      setLoadingEligible(false);
    }
  };

  /**
   * Toggle individual employee selection
   */
  const handleToggleEmployee = (empId) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  /**
   * Select All / Deselect All eligible employees
   */
  const handleToggleAll = (checked) => {
    if (checked) {
      setSelectedEmployeeIds(eligibleList.map((emp) => emp._id || emp.id));
    } else {
      setSelectedEmployeeIds([]);
    }
  };

  /**
   * Final creation submission (Step 2)
   */
  const handleCreatePayrun = () => {
    if (selectedEmployeeIds.length === 0) {
      setEligibleError('At least one eligible employee must be selected for the payrun');
      return;
    }

    onSubmit({
      name: name.trim(),
      salaryStructureId,
      periodStart,
      periodEnd,
      employeeIds: selectedEmployeeIds,
    });
  };

  const selectedStructureObj = structures.find(
    (s) => (s._id || s.id) === salaryStructureId
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 1 ? 'New Payrun — Step 1: Cycle Details' : 'New Payrun — Step 2: Employee Selection'}
      description={
        step === 1
          ? 'Set the payroll cycle name, salary structure, and date range.'
          : `Review ${eligibleList.length} eligible employee(s) and confirm inclusion in this payrun.`
      }
      size={step === 1 ? 'md' : 'lg'}
      className="!bg-slate-900 !border-slate-800 !text-slate-200 [&_h2]:!text-white [&_p]:!text-slate-400 [&_div]:!border-slate-800"
      footer={
        <>
          {step === 1 ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isLoading || loadingEligible}
                className="!border-slate-700 !text-slate-300 hover:!bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                loading={loadingEligible}
                rightIcon={<ArrowRight size={15} />}
                onClick={handleProceedToStep2}
              >
                Continue to Selection
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<ArrowLeft size={15} />}
                onClick={() => setStep(1)}
                disabled={isLoading}
                className="!border-slate-700 !text-slate-300 hover:!bg-slate-800"
              >
                Back to Details
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                loading={isLoading}
                disabled={selectedEmployeeIds.length === 0}
                onClick={handleCreatePayrun}
              >
                Create Payrun ({selectedEmployeeIds.length})
              </Button>
            </>
          )}
        </>
      }
    >
      {/* Server / API Errors */}
      {(serverError || eligibleError) && (
        <div className="mb-4 p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
          <span>{serverError || eligibleError}</span>
        </div>
      )}

      {/* STEP 1: CYCLE CONFIGURATION */}
      {step === 1 && (
        <form onSubmit={handleProceedToStep2} className="space-y-4">
          {/* Payrun Name */}
          <FormField>
            <FormLabel required>Payrun Name</FormLabel>
            <Input
              placeholder="e.g. October 2026 Monthly Payroll"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (step1Errors.name) setStep1Errors((prev) => ({ ...prev, name: null }));
              }}
              error={Boolean(step1Errors.name)}
              className="!bg-slate-950 !border-slate-800 !text-white"
            />
            <FormError message={step1Errors.name} />
          </FormField>

          {/* Salary Structure */}
          <FormField>
            <FormLabel required>Salary Structure</FormLabel>
            <Select
              value={salaryStructureId}
              onChange={(e) => {
                setSalaryStructureId(e.target.value);
                if (step1Errors.salaryStructureId) {
                  setStep1Errors((prev) => ({ ...prev, salaryStructureId: null }));
                }
              }}
              options={structures.map((s) => ({
                value: s._id || s.id,
                label: `${s.name} (${s.code})${!s.isActive ? ' — [Inactive]' : ''}`,
              }))}
              error={Boolean(step1Errors.salaryStructureId)}
              placeholder="Select Salary Structure..."
              className="!bg-slate-950 !border-slate-800 !text-white"
            />
            <FormError message={step1Errors.salaryStructureId} />
          </FormField>

          {/* Period Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField>
              <FormLabel required>Period Start</FormLabel>
              <DateInput
                value={periodStart}
                onChange={(val) => {
                  setPeriodStart(val);
                  if (step1Errors.periodStart) setStep1Errors((prev) => ({ ...prev, periodStart: null }));
                }}
                error={Boolean(step1Errors.periodStart)}
                className="!bg-slate-950 !border-slate-800 !text-white"
              />
              <FormError message={step1Errors.periodStart} />
            </FormField>

            <FormField>
              <FormLabel required>Period End</FormLabel>
              <DateInput
                value={periodEnd}
                onChange={(val) => {
                  setPeriodEnd(val);
                  if (step1Errors.periodEnd) setStep1Errors((prev) => ({ ...prev, periodEnd: null }));
                }}
                error={Boolean(step1Errors.periodEnd)}
                className="!bg-slate-950 !border-slate-800 !text-white"
              />
              <FormError message={step1Errors.periodEnd} />
            </FormField>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">Next Step:</p>
            <p>
              The system will query active employment contracts covering this period and present eligible personnel for your review.
            </p>
          </div>
        </form>
      )}

      {/* STEP 2: EMPLOYEE SELECTION & WARNING INSPECTION */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Header Summary */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400">Structure: </span>
              <strong className="text-white">{selectedStructureObj?.name || 'Standard'}</strong>
              <span className="text-slate-500 mx-2">|</span>
              <span className="text-slate-400">Period: </span>
              <strong className="text-white">{periodStart} → {periodEnd}</strong>
            </div>
            <div className="font-mono text-blue-400 font-semibold">
              {selectedEmployeeIds.length} of {eligibleList.length} selected
            </div>
          </div>

          {/* Select All Toggle Bar */}
          {eligibleList.length > 0 && (
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 px-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                <input
                  type="checkbox"
                  checked={
                    eligibleList.length > 0 &&
                    selectedEmployeeIds.length === eligibleList.length
                  }
                  onChange={(e) => handleToggleAll(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                />
                <span>Select All Eligible Employees ({eligibleList.length})</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Click checkboxes to include/exclude
              </span>
            </div>
          )}

          {/* Eligible Employees List */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {eligibleList.length === 0 ? (
              <div className="p-6 bg-slate-950/40 border border-slate-800/80 rounded-xl text-center">
                <Users size={28} className="mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-300">No Eligible Employees Found</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  No active employee contracts match the selected period ({periodStart} to {periodEnd}). Please verify contract start/end dates in Contracts.
                </p>
              </div>
            ) : (
              eligibleList.map((emp) => {
                const empId = emp._id || emp.id;
                const isSelected = selectedEmployeeIds.includes(empId);
                const hasWarnings = emp.warnings && emp.warnings.length > 0;

                return (
                  <div
                    key={empId}
                    onClick={() => handleToggleEmployee(empId)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-950/20 border-blue-500/40 hover:border-blue-500/60'
                        : 'bg-slate-950/40 border-slate-800/60 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by container onClick
                        className="w-4 h-4 mt-1 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {emp.firstName} {emp.lastName}
                          </span>
                          <span className="text-xs font-mono text-blue-400">({emp.employeeCode})</span>
                          <span className="text-xs text-slate-400">· {emp.jobPosition}</span>
                        </div>

                        <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                          <span>Dept: {emp.department?.name || '—'}</span>
                          {emp.contract?.wage !== undefined && (
                            <span>
                              Wage: <strong className="text-emerald-400 font-mono">${emp.contract.wage.toLocaleString()}</strong>
                            </span>
                          )}
                        </div>

                        {/* Warnings display */}
                        {hasWarnings && (
                          <div className="mt-2 space-y-1">
                            {emp.warnings.map((w, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1.5 text-[11px] text-amber-400/90 font-medium"
                              >
                                <AlertCircle size={12} className="shrink-0" />
                                <span>{w}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <span className="text-[10px] uppercase font-bold bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                          Included
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold bg-slate-800 text-slate-500 px-2 py-0.5 rounded">
                          Excluded
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Ineligible Employees accordion/list (if any) */}
          {ineligibleList.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80">
              <p className="text-xs text-slate-500 font-medium mb-2">
                Ineligible Employees ({ineligibleList.length}) — Skipped due to missing active contract:
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto text-xs text-slate-400">
                {ineligibleList.map((emp) => (
                  <div
                    key={emp._id || emp.id}
                    className="p-2 bg-slate-950/20 border border-slate-800/40 rounded flex items-center justify-between"
                  >
                    <span>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </span>
                    <span className="text-[11px] text-amber-500/80">
                      {emp.warnings?.[0] || 'No active contract'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
