import React from 'react';
import { Users, Plus } from 'lucide-react';
import { EmployeeCard } from './EmployeeCard';
import { CardSkeleton } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { SectionError } from '../../components/ui/ErrorState';
import { Button } from '../../components/ui/Button';

/**
 * Reusable Employee Kanban View with Tailwind CSS
 */
export function EmployeeKanban({
  employees = [],
  loading = false,
  error = null,
  onRetry = null,
  onSelectEmployee,
  onCreateEmployee,
  canCreate = false,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <CardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <SectionError
        title="Failed to load employee kanban"
        message={typeof error === 'string' ? error : error?.message}
        onRetry={onRetry}
        className="!bg-slate-900 !border-red-900/50 !text-red-300"
      />
    );
  }

  if (!employees || employees.length === 0) {
    return (
      <EmptyState
        icon={<Users size={28} />}
        title="No employees found"
        description="No employee records match the active search or filters."
        action={
          canCreate && onCreateEmployee ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={onCreateEmployee}
            >
              Add New Employee
            </Button>
          ) : null
        }
        className="!bg-slate-900 !border-slate-800 !text-slate-200"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {employees.map((employee) => (
        <EmployeeCard
          key={employee._id || employee.id}
          employee={employee}
          onClick={onSelectEmployee}
        />
      ))}
    </div>
  );
}

export default EmployeeKanban;
