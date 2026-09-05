import React, { useState } from 'react';
import {
  Save,
  ArrowLeft,
  User,
  Mail,
  Building2,
  Briefcase,
  Clock,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FormField } from '../../components/forms/FormField';
import { Input } from '../../components/forms/Input';
import { Select } from '../../components/forms/Select';
import { SectionError } from '../../components/ui/ErrorState';

const EMPLOYEE_TYPES = [
  { value: 'Full-Time', label: 'Full-Time' },
  { value: 'Part-Time', label: 'Part-Time' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Intern', label: 'Intern' },
  { value: 'Temporary', label: 'Temporary' },
];

const EMPLOYEE_STATUSES = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'On Leave', label: 'On Leave' },
  { value: 'Terminated', label: 'Terminated' },
];

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

/**
 * Reusable Employee Create / Edit Form Component with Tailwind CSS
 */
export function EmployeeForm({
  initialData = null,
  departments = [],
  schedules = [],
  managers = [],
  onSubmit,
  onCancel,
  isLoading = false,
  error = null,
}) {
  const isEditing = Boolean(initialData?._id || initialData?.id);

  // Form State
  const [formData, setFormData] = useState({
    employeeCode: initialData?.employeeCode || '',
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    departmentId: typeof initialData?.departmentId === 'object'
      ? initialData?.departmentId?._id
      : initialData?.departmentId || '',
    managerId: typeof initialData?.managerId === 'object'
      ? initialData?.managerId?._id
      : initialData?.managerId || '',
    scheduleId: typeof initialData?.scheduleId === 'object'
      ? initialData?.scheduleId?._id
      : initialData?.scheduleId || '',
    jobPosition: initialData?.jobPosition || '',
    employeeType: initialData?.employeeType || 'Full-Time',
    status: initialData?.status || 'Active',
    bankDetails: {
      bankName: initialData?.bankDetails?.bankName || '',
      accountNumber: initialData?.bankDetails?.accountNumber || '',
      accountHolderName: initialData?.bankDetails?.accountHolderName || '',
      routingNumber: initialData?.bankDetails?.routingNumber || '',
      swiftCode: initialData?.bankDetails?.swiftCode || '',
      iban: initialData?.bankDetails?.iban || '',
    },
  });

  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear validation error when user types
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleBankChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [field]: value,
      },
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.employeeCode.trim()) {
      errors.employeeCode = 'Employee code is required';
    }
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.departmentId) {
      errors.departmentId = 'Department is required';
    }
    if (!formData.jobPosition.trim()) {
      errors.jobPosition = 'Job position is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = {
      employeeCode: formData.employeeCode.trim().toUpperCase(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      departmentId: formData.departmentId,
      jobPosition: formData.jobPosition.trim(),
      employeeType: formData.employeeType,
      status: formData.status,
      managerId: formData.managerId || null,
      scheduleId: formData.scheduleId || null,
      bankDetails: {
        bankName: formData.bankDetails.bankName.trim() || undefined,
        accountNumber: formData.bankDetails.accountNumber.trim() || undefined,
        accountHolderName: formData.bankDetails.accountHolderName.trim() || undefined,
        routingNumber: formData.bankDetails.routingNumber.trim() || undefined,
        swiftCode: formData.bankDetails.swiftCode.trim() || undefined,
        iban: formData.bankDetails.iban.trim() || undefined,
      },
    };

    if (onSubmit) {
      await onSubmit(payload);
    }
  };

  // Filter out self from manager candidates if editing
  const availableManagers = managers.filter(
    (m) => (m._id || m.id) !== (initialData?._id || initialData?.id)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-slate-100">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {onCancel && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft size={16} />}
              onClick={onCancel}
              className="!border-slate-800 !bg-slate-900 !text-slate-300 hover:!bg-slate-800"
            >
              Cancel
            </Button>
          )}
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isEditing ? `Edit Employee: ${initialData.employeeCode}` : 'Create New Employee'}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isLoading}
              className="!text-slate-400 hover:!text-white hover:!bg-slate-800"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isLoading}
            leftIcon={<Save size={15} />}
          >
            {isEditing ? 'Save Changes' : 'Create Employee'}
          </Button>
        </div>
      </div>

      {/* Global Server Error Alert */}
      {error && (
        <SectionError
          title="Submission Failed"
          message={typeof error === 'string' ? error : error?.message}
          className="!bg-slate-900 !border-red-900/50 !text-red-300"
        />
      )}

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Identity Information */}
        <Card
          title="1. Identity Information"
          description="Personal employee record identifiers"
          className="!bg-slate-900 !border-slate-800 !text-slate-100 [&_h3]:!text-white [&_p]:!text-slate-400 [&_div]:!border-slate-800"
        >
          <div className="space-y-3">
            <FormField
              label="Employee Code"
              htmlFor="emp-code"
              required
              error={validationErrors.employeeCode}
              helperText="Unique uppercase identifier, e.g. EMP-001"
            >
              <Input
                id="emp-code"
                placeholder="e.g. EMP-101"
                value={formData.employeeCode}
                onChange={(e) => handleChange('employeeCode', e.target.value.toUpperCase())}
                error={Boolean(validationErrors.employeeCode)}
                className="!bg-slate-950 !border-slate-800 !text-white placeholder:!text-slate-600 focus:!border-blue-500"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                label="First Name"
                htmlFor="emp-firstName"
                required
                error={validationErrors.firstName}
              >
                <Input
                  id="emp-firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  error={Boolean(validationErrors.firstName)}
                  leftIcon={<User size={15} />}
                  className="!bg-slate-950 !border-slate-800 !text-white placeholder:!text-slate-600 focus:!border-blue-500"
                />
              </FormField>

              <FormField
                label="Last Name"
                htmlFor="emp-lastName"
                required
                error={validationErrors.lastName}
              >
                <Input
                  id="emp-lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  error={Boolean(validationErrors.lastName)}
                  className="!bg-slate-950 !border-slate-800 !text-white placeholder:!text-slate-600 focus:!border-blue-500"
                />
              </FormField>
            </div>

            <FormField
              label="Work Email"
              htmlFor="emp-email"
              required
              error={validationErrors.email}
            >
              <Input
                id="emp-email"
                type="email"
                placeholder="employee@company.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={Boolean(validationErrors.email)}
                leftIcon={<Mail size={15} />}
                className="!bg-slate-950 !border-slate-800 !text-white placeholder:!text-slate-600 focus:!border-blue-500"
              />
            </FormField>
          </div>
        </Card>

        {/* 2. Work & Organization Information */}
        <Card
          title="2. Work Information"
          description="Organizational placement, schedule, and job status"
          className="!bg-slate-900 !border-slate-800 !text-slate-100 [&_h3]:!text-white [&_p]:!text-slate-400 [&_div]:!border-slate-800"
        >
          <div className="space-y-3">
            <FormField
              label="Department"
              htmlFor="emp-department"
              required
              error={validationErrors.departmentId}
            >
              <Select
                id="emp-department"
                placeholder="Select Department"
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

            <FormField
              label="Job Position"
              htmlFor="emp-position"
              required
              error={validationErrors.jobPosition}
            >
              <Input
                id="emp-position"
                placeholder="e.g. Senior Software Engineer"
                value={formData.jobPosition}
                onChange={(e) => handleChange('jobPosition', e.target.value)}
                error={Boolean(validationErrors.jobPosition)}
                leftIcon={<Briefcase size={15} />}
                className="!bg-slate-950 !border-slate-800 !text-white placeholder:!text-slate-600 focus:!border-blue-500"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Employee Type" htmlFor="emp-type">
                <Select
                  id="emp-type"
                  value={formData.employeeType}
                  onChange={(e) => handleChange('employeeType', e.target.value)}
                  options={EMPLOYEE_TYPES}
                  className="!bg-slate-950 !border-slate-800 !text-white focus:!border-blue-500"
                />
              </FormField>

              <FormField label="Status" htmlFor="emp-status">
                <Select
                  id="emp-status"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  options={EMPLOYEE_STATUSES}
                  className="!bg-slate-950 !border-slate-800 !text-white focus:!border-blue-500"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Reporting Manager" htmlFor="emp-manager" optional>
                <Select
                  id="emp-manager"
                  placeholder="None (Top Level)"
                  value={formData.managerId}
                  onChange={(e) => handleChange('managerId', e.target.value)}
                  className="!bg-slate-950 !border-slate-800 !text-white focus:!border-blue-500"
                >
                  <option value="" className="bg-slate-900 text-slate-400">
                    None (Top Level)
                  </option>
                  {availableManagers.map((mgr) => (
                    <option key={mgr._id || mgr.id} value={mgr._id || mgr.id} className="bg-slate-900 text-white">
                      {mgr.firstName} {mgr.lastName} ({mgr.employeeCode})
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Working Schedule" htmlFor="emp-schedule" optional>
                <Select
                  id="emp-schedule"
                  placeholder="Standard Schedule"
                  value={formData.scheduleId}
                  onChange={(e) => handleChange('scheduleId', e.target.value)}
                  className="!bg-slate-950 !border-slate-800 !text-white focus:!border-blue-500"
                >
                  <option value="" className="bg-slate-900 text-slate-400">
                    Standard Schedule (Default)
                  </option>
                  {schedules.map((sch) => (
                    <option key={sch._id || sch.id} value={sch._id || sch.id} className="bg-slate-900 text-white">
                      {sch.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Bank Information */}
      <Card
        title="3. Bank & Payment Information"
        description="Banking and routing credentials for payroll direct deposits (Optional)"
        className="!bg-slate-900 !border-slate-800 !text-slate-100 [&_h3]:!text-white [&_p]:!text-slate-400 [&_div]:!border-slate-800"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField label="Bank Name" htmlFor="bank-name" optional>
            <Input
              id="bank-name"
              placeholder="e.g. Chase Bank"
              value={formData.bankDetails.bankName}
              onChange={(e) => handleBankChange('bankName', e.target.value)}
              leftIcon={<CreditCard size={15} />}
              className="!bg-slate-950 !border-slate-800 !text-white placeholder:!text-slate-600 focus:!border-blue-500"
            />
          </FormField>

          <FormField label="Account Holder Name" htmlFor="bank-holder" optional>
            <Input
              id="bank-holder"
              placeholder="e.g. John Doe"
              value={formData.bankDetails.accountHolderName}
              onChange={(e) => handleBankChange('accountHolderName', e.target.value)}
              className="!bg-slate-950 !border-slate-800 !text-white placeholder:!text-slate-600 focus:!border-blue-500"
            />
          </FormField>

          <FormField label="Account Number" htmlFor="bank-acc" optional>
            <Input
              id="bank-acc"
              placeholder="e.g. 1234567890"
              value={formData.bankDetails.accountNumber}
              onChange={(e) => handleBankChange('accountNumber', e.target.value)}
              className="!bg-slate-950 !border-slate-800 !text-white placeholder:!text-slate-600 focus:!border-blue-500"
            />
          </FormField>

          <FormField label="Routing Number" htmlFor="bank-routing" optional>
            <Input
              id="bank-routing"
              placeholder="e.g. 021000021"
              value={formData.bankDetails.routingNumber}
              onChange={(e) => handleBankChange('routingNumber', e.target.value)}
              className="!bg-slate-950 !border-slate-800 !text-white placeholder:!text-slate-600 focus:!border-blue-500"
            />
          </FormField>

          <FormField label="SWIFT / BIC" htmlFor="bank-swift" optional>
            <Input
              id="bank-swift"
              placeholder="e.g. CHASUS33"
              value={formData.bankDetails.swiftCode}
              onChange={(e) => handleBankChange('swiftCode', e.target.value)}
              className="!bg-slate-950 !border-slate-800 !text-white placeholder:!text-slate-600 focus:!border-blue-500"
            />
          </FormField>

          <FormField label="IBAN" htmlFor="bank-iban" optional>
            <Input
              id="bank-iban"
              placeholder="e.g. US33CHAS..."
              value={formData.bankDetails.iban}
              onChange={(e) => handleBankChange('iban', e.target.value)}
              className="!bg-slate-950 !border-slate-800 !text-white placeholder:!text-slate-600 focus:!border-blue-500"
            />
          </FormField>
        </div>
      </Card>
    </form>
  );
}

export default EmployeeForm;
