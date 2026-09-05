import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/forms/FormField';
import { FormLabel } from '../../components/forms/FormLabel';
import { FormError } from '../../components/forms/FormError';
import { Input } from '../../components/forms/Input';
import { Checkbox } from '../../components/forms/Checkbox';
import { AlertTriangle, Layers } from 'lucide-react';

/**
 * Salary Structure Create & Edit Modal
 */
export function SalaryStructureModal({
  isOpen,
  onClose,
  structure = null,
  onSubmit,
  isLoading = false,
  serverError = null,
}) {
  const isEditing = Boolean(structure?._id || structure?.id);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (structure) {
      setFormData({
        name: structure.name || '',
        code: structure.code || '',
        isActive: structure.isActive !== undefined ? structure.isActive : true,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        isActive: true,
      });
    }
    setErrors({});
  }, [structure, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Salary structure name is required';
    }
    if (!formData.code.trim()) {
      errs.code = 'Salary structure code is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      isActive: formData.isActive,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Salary Structure' : 'Create Salary Structure'}
      description={
        isEditing
          ? 'Update the salary structure details and active configuration.'
          : 'Define a new salary structure to organize salary rules for payroll computations.'
      }
      size="md"
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
            {isEditing ? 'Save Changes' : 'Create Structure'}
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

        {/* Structure Name */}
        <FormField>
          <FormLabel required>Structure Name</FormLabel>
          <Input
            placeholder="e.g. Standard Full-Time Structure"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            disabled={isLoading}
            error={Boolean(errors.name)}
            className="!bg-slate-950 !border-slate-800 !text-white"
          />
          <FormError message={errors.name} />
        </FormField>

        {/* Structure Code */}
        <FormField>
          <FormLabel required>Structure Code</FormLabel>
          <Input
            placeholder="e.g. STR_FT_STANDARD"
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
            disabled={isLoading}
            error={Boolean(errors.code)}
            className="!bg-slate-950 !border-slate-800 !text-white font-mono uppercase"
          />
          <FormError message={errors.code} />
          <p className="text-[11px] text-slate-500 mt-1">
            Unique identifier code for formula and payrun reference.
          </p>
        </FormField>

        {/* Active Status Checkbox */}
        <div className="pt-2">
          <Checkbox
            label="Active Structure"
            description="Active structures can be assigned to contracts and payrun cycles."
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            disabled={isLoading}
          />
        </div>
      </form>
    </Modal>
  );
}
