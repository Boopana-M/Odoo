import React, { useState, useEffect } from 'react';
import {
  FileText,
  User,
  Building2,
  Briefcase,
  DollarSign,
  Calendar,
  Save,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/forms/FormField';
import { Input } from '../../components/forms/Input';
import { Select } from '../../components/forms/Select';
import { SectionError } from '../../components/ui/ErrorState';

const CONTRACT_STATUSES = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Active', label: 'Active' },
  { value: 'Closed', label: 'Closed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

/**
 * Format Date to YYYY-MM-DD for date inputs
 */
function toInputDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

/**
 * Contract Create & Edit Modal Component with Tailwind CSS
 */
export function ContractModal({
  isOpen,
  onClose,
  contract = null,
  employees = [],
  departments = [],
  preselectedEmployeeId = null,
  onSubmit,
  isLoading = false,
  serverError = null,
}) {
  const isEditing = Boolean(contract?._id || contract?.id);

  const [formData, setFormData] = useState({
    employeeId: '',
    departmentId: '',
    jobPosition: '',
    wage: '',
    startDate: '',
    endDate: '',
    status: 'Active',
  });

  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (contract) {
      const empId = typeof contract.employeeId === 'object'
        ? contract.employeeId?._id
        : contract.employeeId || '';
      const deptId = typeof contract.departmentId === 'object'
        ? contract.departmentId?._id
        : contract.departmentId || '';

      setFormData({
        employeeId: empId,
        departmentId: deptId,
        jobPosition: contract.jobPosition || '',
        wage: contract.wage !== undefined && contract.wage !== null ? String(contract.wage) : '',
        startDate: toInputDate(contract.startDate),
        endDate: toInputDate(contract.endDate),
        status: contract.status || 'Active',
      });
    } else {
      const defaultEmpId = preselectedEmployeeId || '';
      const matchedEmp = employees.find((e) => (e._id || e.id) === defaultEmpId);
      const defaultDeptId = matchedEmp
        ? (typeof matchedEmp.departmentId === 'object' ? matchedEmp.departmentId?._id : matchedEmp.departmentId) || ''
        : '';
      const defaultJob = matchedEmp?.jobPosition || '';

      setFormData({
        employeeId: defaultEmpId,
        departmentId: defaultDeptId,
        jobPosition: defaultJob,
        wage: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        status: 'Active',
      });
    }
    setValidationErrors({});
  }, [contract, preselectedEmployeeId, employees, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-fill Department and Job Position from Employee when employeeId is selected on creation
      if (field === 'employeeId' && !isEditing && value) {
        const emp = employees.find((e) => (e._id || e.id) === value);
        if (emp) {
          if (!updated.departmentId) {
            updated.departmentId = typeof emp.departmentId === 'object'
              ? emp.departmentId?._id
              : emp.departmentId || '';
          }
          if (!updated.jobPosition) {
            updated.jobPosition = emp.jobPosition || '';
          }
        }
      }

      return updated;
    });

    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errors = {};

    if (!formData.employeeId) {
      errors.employeeId = 'Employee reference is required';
    }
    if (!formData.departmentId) {
      errors.departmentId = 'Department reference is required';
    }
    if (!formData.jobPosition.trim()) {
      errors.jobPosition = 'Job position is required';
    }
    if (formData.wage === '' || isNaN(Number(formData.wage)) || Number(formData.wage) < 0) {
      errors.wage = 'Wage must be a valid non-negative number';
    }
    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }
    if (formData.endDate && formData.startDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        errors.endDate = 'End date cannot be before start date';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      employeeId: formData.employeeId,
      departmentId: formData.departmentId,
      jobPosition: formData.jobPosition.trim(),
      wage: Number(formData.wage),
      startDate: formData.startDate,
      endDate: formData.endDate ? formData.endDate : null,
      status: formData.status,
    };

    if (onSubmit) {
      await onSubmit(payload);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Contract` : 'Create Employment Contract'}
      description={
        isEditing
          ? 'Update contract wage, terms, and period validity.'
          : 'Issue a new employment contract and wage agreement.'
      }
      size="lg"
      className="!bg-slate-900 !border-slate-800 !text-slate-100 [&_h2]:!text-white [&_p]:!text-slate-400 [&_div]:!border-slate-800"
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="!border-slate-700 !text-slate-300 hover:!bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={isLoading}
            leftIcon={<Save size={15} />}
            onClick={handleSubmit}
          >
            {isEditing ? 'Save Changes' : 'Create Contract'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <SectionError
            title="Contract Operation Failed"
            message={typeof serverError === 'string' ? serverError : serverError?.message}
            className="!bg-slate-950 !border-red-900/50 !text-red-300"
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Employee Selection */}
          <FormField
            label="Employee"
            htmlFor="contract-emp"
            required
            error={validationErrors.employeeId}
          >
            <Select
              id="contract-emp"
              value={formData.employeeId}
              onChange={(e) => handleChange('employeeId', e.target.value)}
              error={Boolean(validationErrors.employeeId)}
              className="!bg-slate-950 !border-slate-800 !text-white focus:!border-blue-500"
            >
              <option value="" disabled className="bg-slate-900 text-slate-400">
                Select an employee...
              </option>
              {employees.map((emp) => (
                <option key={emp._id || emp.id} value={emp._id || emp.id} className="bg-slate-900 text-white">
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
            </Select>
          </FormField>

          {/* Department Selection */}
          <FormField
            label="Department"
            htmlFor="contract-dept"
            required
            error={validationErrors.departmentId}
          >
            <Select
              id="contract-dept"
              value={formData.departmentId}
              onChange={(e) => handleChange('departmentId', e.target.value)}
              error={Boolean(validationErrors.departmentId)}
              className="!bg-slate-950 !border-slate-800 !text-white focus:!border-blue-500"
            >
              <option value="" disabled className="bg-slate-900 text-slate-400">
                Select a department...
              </option>
              {departments.map((dept) => (
                <option key={dept._id || dept.id} value={dept._id || dept.id} className="bg-slate-900 text-white">
                  {dept.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Job Position */}
          <FormField
            label="Job Position"
            htmlFor="contract-pos"
            required
            error={validationErrors.jobPosition}
          >
            <Input
              id="contract-pos"
              placeholder="e.g. Lead Software Architect"
              value={formData.jobPosition}
              onChange={(e) => handleChange('jobPosition', e.target.value)}
              error={Boolean(validationErrors.jobPosition)}
              leftIcon={<Briefcase size={15} />}
              className="!bg-slate-950 !border-slate-800 !text-white placeholder:!text-slate-600 focus:!border-blue-500"
            />
          </FormField>

          {/* Wage */}
          <FormField
            label="Base Wage Amount"
            htmlFor="contract-wage"
            required
            error={validationErrors.wage}
            helperText="Monthly gross basic compensation"
          >
            <Input
              id="contract-wage"
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 5000"
              value={formData.wage}
              onChange={(e) => handleChange('wage', e.target.value)}
              error={Boolean(validationErrors.wage)}
              leftIcon={<DollarSign size={15} />}
              className="!bg-slate-950 !border-slate-800 !text-white placeholder:!text-slate-600 focus:!border-blue-500 font-mono"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Start Date */}
          <FormField
            label="Start Date"
            htmlFor="contract-start"
            required
            error={validationErrors.startDate}
          >
            <Input
              id="contract-start"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              error={Boolean(validationErrors.startDate)}
              className="!bg-slate-950 !border-slate-800 !text-white focus:!border-blue-500"
            />
          </FormField>

          {/* End Date */}
          <FormField
            label="End Date"
            htmlFor="contract-end"
            optional
            error={validationErrors.endDate}
            helperText="Leave empty for open-ended"
          >
            <Input
              id="contract-end"
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              error={Boolean(validationErrors.endDate)}
              className="!bg-slate-950 !border-slate-800 !text-white focus:!border-blue-500"
            />
          </FormField>

          {/* Contract Status */}
          <FormField label="Contract Status" htmlFor="contract-status">
            <Select
              id="contract-status"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              options={CONTRACT_STATUSES}
              className="!bg-slate-950 !border-slate-800 !text-white focus:!border-blue-500"
            />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}

export default ContractModal;
