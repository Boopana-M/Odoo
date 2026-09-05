import React, { useState, useEffect } from 'react';
import { Building2, Save } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/forms/FormField';
import { Input } from '../../components/forms/Input';
import { SectionError } from '../../components/ui/ErrorState';

/**
 * Reusable Department Create / Edit Modal Component
 * Styled with Tailwind CSS in JSX adhering to dark enterprise aesthetic.
 */
export function DepartmentModal({
  isOpen,
  onClose,
  department = null,
  onSubmit,
  isLoading = false,
  error = null,
}) {
  const isEditing = Boolean(department?._id || department?.id);
  const [name, setName] = useState('');
  const [fieldError, setFieldError] = useState('');

  useEffect(() => {
    if (department) {
      setName(department.name || '');
    } else {
      setName('');
    }
    setFieldError('');
  }, [department, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setFieldError('Department name is required');
      return;
    }

    setFieldError('');
    onSubmit({ name: trimmed });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Department' : 'Create Department'}
      description={
        isEditing
          ? 'Update the department name below.'
          : 'Add a new department to the organization structure.'
      }
      size="sm"
      className="!bg-slate-900 !border-slate-800 !text-slate-100 [&_h2]:!text-white [&_p]:!text-slate-400 [&_div]:!border-slate-800"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="!text-slate-400 hover:!text-white hover:!bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
            onClick={handleSubmit}
            leftIcon={<Save size={16} />}
            className="!bg-blue-600 hover:!bg-blue-500"
          >
            {isEditing ? 'Save Changes' : 'Create Department'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && (
          <SectionError
            title="Operation Failed"
            message={typeof error === 'string' ? error : error.message}
            className="!bg-red-950/40 !border-red-800/60 !text-red-300"
          />
        )}

        <FormField
          label="Department Name"
          htmlFor="department-name-input"
          required
          error={fieldError}
          className="[&_label]:!text-slate-300"
        >
          <Input
            id="department-name-input"
            name="name"
            placeholder="e.g. Quality Assurance, Marketing, Operations"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldError) setFieldError('');
            }}
            error={Boolean(fieldError)}
            leftIcon={<Building2 size={16} />}
            disabled={isLoading}
            autoFocus
            className="!bg-slate-800/80 !text-white !border-slate-700 focus:!border-blue-500 placeholder:!text-slate-500"
          />
        </FormField>
      </form>
    </Modal>
  );
}

export default DepartmentModal;
