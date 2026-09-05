import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/forms/FormField';
import { FormLabel } from '../../components/forms/FormLabel';
import { FormError } from '../../components/forms/FormError';
import { Input } from '../../components/forms/Input';
import { Select } from '../../components/forms/Select';
import { Checkbox } from '../../components/forms/Checkbox';
import { AlertTriangle, Sliders, Info } from 'lucide-react';

const CATEGORIES = [
  { value: 'Basic', label: 'Basic Salary' },
  { value: 'Allowances', label: 'Allowances' },
  { value: 'Gross', label: 'Gross Salary' },
  { value: 'Deductions', label: 'Deductions' },
  { value: 'Net', label: 'Net Salary' },
];

const COMPUTATION_METHODS = [
  { value: 'Fixed', label: 'Fixed Amount ($)' },
  { value: 'Percentage', label: 'Percentage (%)' },
  { value: 'Formula', label: 'Formula Expression' },
];

/**
 * Salary Rule Create & Edit Modal
 */
export function SalaryRuleModal({
  isOpen,
  onClose,
  rule = null,
  structures = [],
  defaultStructureId = '',
  onSubmit,
  isLoading = false,
  serverError = null,
}) {
  const isEditing = Boolean(rule?._id || rule?.id);

  const [formData, setFormData] = useState({
    salaryStructureId: '',
    name: '',
    code: '',
    category: 'Basic',
    sequence: 50,
    computationMethod: 'Fixed',
    amount: '',
    percentage: '',
    formulaExpression: '',
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (rule) {
      setFormData({
        salaryStructureId:
          typeof rule.salaryStructureId === 'object'
            ? rule.salaryStructureId?._id || rule.salaryStructureId?.id
            : rule.salaryStructureId || defaultStructureId || '',
        name: rule.name || '',
        code: rule.code || '',
        category: rule.category || 'Basic',
        sequence: rule.sequence !== undefined ? rule.sequence : 50,
        computationMethod: rule.computationMethod || 'Fixed',
        amount: rule.amount !== null && rule.amount !== undefined ? String(rule.amount) : '',
        percentage: rule.percentage !== null && rule.percentage !== undefined ? String(rule.percentage) : '',
        formulaExpression: rule.formulaExpression || '',
        isActive: rule.isActive !== undefined ? rule.isActive : true,
      });
    } else {
      setFormData({
        salaryStructureId: defaultStructureId || (structures[0]?._id || structures[0]?.id || ''),
        name: '',
        code: '',
        category: 'Basic',
        sequence: 50,
        computationMethod: 'Fixed',
        amount: '',
        percentage: '',
        formulaExpression: '',
        isActive: true,
      });
    }
    setErrors({});
  }, [rule, defaultStructureId, structures, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.salaryStructureId) {
      errs.salaryStructureId = 'Salary structure is required';
    }
    if (!formData.name.trim()) {
      errs.name = 'Salary rule name is required';
    }
    if (!formData.code.trim()) {
      errs.code = 'Salary rule code is required';
    }
    if (!formData.category) {
      errs.category = 'Category is required';
    }
    if (formData.sequence === '' || isNaN(formData.sequence) || Number(formData.sequence) < 0) {
      errs.sequence = 'Sequence must be a non-negative number';
    }

    if (formData.computationMethod === 'Fixed') {
      if (formData.amount === '' || isNaN(formData.amount) || Number(formData.amount) < 0) {
        errs.amount = 'Amount is required and must be non-negative';
      }
    } else if (formData.computationMethod === 'Percentage') {
      if (formData.percentage === '' || isNaN(formData.percentage) || Number(formData.percentage) < 0) {
        errs.percentage = 'Percentage is required and must be non-negative';
      }
    } else if (formData.computationMethod === 'Formula') {
      if (!formData.formulaExpression.trim()) {
        errs.formulaExpression = 'Formula expression is required';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      salaryStructureId: formData.salaryStructureId,
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      category: formData.category,
      sequence: Number(formData.sequence),
      computationMethod: formData.computationMethod,
      isActive: formData.isActive,
    };

    if (formData.computationMethod === 'Fixed') {
      payload.amount = Number(formData.amount);
      payload.percentage = null;
      payload.formulaExpression = null;
    } else if (formData.computationMethod === 'Percentage') {
      payload.percentage = Number(formData.percentage);
      payload.amount = null;
      payload.formulaExpression = null;
    } else if (formData.computationMethod === 'Formula') {
      payload.formulaExpression = formData.formulaExpression.trim();
      payload.amount = null;
      payload.percentage = null;
    }

    onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Salary Rule' : 'Create Salary Rule'}
      description={
        isEditing
          ? 'Modify salary calculation rule settings and computation method.'
          : 'Define a calculation rule that contributes to gross/net payroll computation.'
      }
      size="lg"
      className="!bg-slate-900 !border-slate-800 !text-slate-200 [&_h2]:!text-white [&_p]:!text-slate-400 [&_div]:!border-slate-800"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="!border-slate-700 !text-slate-300 hover:!bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={isLoading}
            onClick={handleSubmit}
          >
            {isEditing ? 'Save Changes' : 'Create Rule'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-400 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Salary Structure */}
          <FormField>
            <FormLabel required>Salary Structure</FormLabel>
            <Select
              value={formData.salaryStructureId}
              onChange={(e) => handleChange('salaryStructureId', e.target.value)}
              options={structures.map((s) => ({
                value: s._id || s.id,
                label: `${s.name} (${s.code})`,
              }))}
              disabled={isLoading || (isEditing && Boolean(rule))}
              error={Boolean(errors.salaryStructureId)}
              placeholder="Select Salary Structure..."
              className="!bg-slate-950 !border-slate-800 !text-white"
            />
            <FormError message={errors.salaryStructureId} />
          </FormField>

          {/* Rule Category */}
          <FormField>
            <FormLabel required>Category</FormLabel>
            <Select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              options={CATEGORIES}
              disabled={isLoading}
              error={Boolean(errors.category)}
              className="!bg-slate-950 !border-slate-800 !text-white"
            />
            <FormError message={errors.category} />
          </FormField>

          {/* Rule Name */}
          <FormField>
            <FormLabel required>Rule Name</FormLabel>
            <Input
              placeholder="e.g. Basic Salary, Housing Allowance, Tax"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={isLoading}
              error={Boolean(errors.name)}
              className="!bg-slate-950 !border-slate-800 !text-white"
            />
            <FormError message={errors.name} />
          </FormField>

          {/* Rule Code */}
          <FormField>
            <FormLabel required>Rule Code</FormLabel>
            <Input
              placeholder="e.g. BASIC, HRA, TAX_DED"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              disabled={isLoading}
              error={Boolean(errors.code)}
              className="!bg-slate-950 !border-slate-800 !text-white font-mono uppercase"
            />
            <FormError message={errors.code} />
          </FormField>

          {/* Sequence */}
          <FormField>
            <FormLabel required>Execution Sequence</FormLabel>
            <Input
              type="number"
              value={formData.sequence}
              onChange={(e) => handleChange('sequence', e.target.value)}
              min={0}
              step={1}
              disabled={isLoading}
              error={Boolean(errors.sequence)}
              className="!bg-slate-950 !border-slate-800 !text-white"
            />
            <FormError message={errors.sequence} />
            <p className="text-[11px] text-slate-500 mt-1">
              Rules execute in ascending sequence order (e.g. 10 Basic, 20 Allowance, 90 Net).
            </p>
          </FormField>

          {/* Computation Method */}
          <FormField>
            <FormLabel required>Computation Method</FormLabel>
            <Select
              value={formData.computationMethod}
              onChange={(e) => handleChange('computationMethod', e.target.value)}
              options={COMPUTATION_METHODS}
              disabled={isLoading}
              error={Boolean(errors.computationMethod)}
              className="!bg-slate-950 !border-slate-800 !text-white"
            />
            <FormError message={errors.computationMethod} />
          </FormField>
        </div>

        {/* Method-Specific Input Fields */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
          {formData.computationMethod === 'Fixed' && (
            <FormField>
              <FormLabel required>Fixed Amount ($)</FormLabel>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                min={0}
                step={0.01}
                disabled={isLoading}
                error={Boolean(errors.amount)}
                className="!bg-slate-900 !border-slate-800 !text-white font-mono"
              />
              <FormError message={errors.amount} />
            </FormField>
          )}

          {formData.computationMethod === 'Percentage' && (
            <FormField>
              <FormLabel required>Percentage (%)</FormLabel>
              <Input
                type="number"
                placeholder="e.g. 10 for 10%"
                value={formData.percentage}
                onChange={(e) => handleChange('percentage', e.target.value)}
                min={0}
                step={0.01}
                disabled={isLoading}
                error={Boolean(errors.percentage)}
                className="!bg-slate-900 !border-slate-800 !text-white font-mono"
              />
              <FormError message={errors.percentage} />
            </FormField>
          )}

          {formData.computationMethod === 'Formula' && (
            <FormField>
              <FormLabel required>Formula Expression</FormLabel>
              <Input
                placeholder="e.g. BASIC * 0.10 or GROSS - DED"
                value={formData.formulaExpression}
                onChange={(e) => handleChange('formulaExpression', e.target.value)}
                disabled={isLoading}
                error={Boolean(errors.formulaExpression)}
                className="!bg-slate-900 !border-slate-800 !text-white font-mono text-xs"
              />
              <FormError message={errors.formulaExpression} />
              <div className="flex items-start gap-1.5 text-[11px] text-slate-400 mt-1">
                <Info size={13} className="text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Evaluated on backend during payrun computation. Reference previous rule codes (e.g. <code>BASIC</code>, <code>contract.wage</code>).
                </span>
              </div>
            </FormField>
          )}
        </div>

        {/* Active Status Checkbox */}
        <div className="pt-2">
          <Checkbox
            label="Active Salary Rule"
            description="Inactive rules will be skipped during salary calculation."
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            disabled={isLoading}
          />
        </div>
      </form>
    </Modal>
  );
}
