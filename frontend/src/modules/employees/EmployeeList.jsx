import React from 'react';
import { Users, Plus, Eye, Edit2 } from 'lucide-react';
import { Table } from '../../components/tables/Table';
import { TableRow } from '../../components/tables/TableRow';
import { TableCell } from '../../components/tables/TableCell';
import { StatusCell } from '../../components/tables/StatusCell';
import { ActionCell } from '../../components/tables/ActionCell';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';

/**
 * Reusable Employee Table List View with Tailwind CSS
 */
export function EmployeeList({
  employees = [],
  loading = false,
  error = null,
  onRetry = null,
  onSelectEmployee,
  onCreateEmployee,
  canCreate = false,
  canEdit = false,
  onEditEmployee = null,
}) {
  const tableColumns = [
    { label: 'Code', width: '110px' },
    { label: 'Employee Name' },
    { label: 'Department' },
    { label: 'Job Position' },
    { label: 'Employee Type', width: '130px' },
    { label: 'Status', width: '120px' },
    { label: 'Actions', width: '100px', align: 'right' },
  ];

  return (
    <Table
      columns={tableColumns}
      loading={loading}
      loadingRows={6}
      error={error}
      onRetry={onRetry}
      wrapperClassName="!bg-slate-900 !border-slate-800"
      className="!text-slate-200 [&_thead]:!bg-slate-950/60 [&_thead_th]:!text-slate-400 [&_thead]:!border-slate-800 [&_tbody]:!divide-slate-800/80"
      emptyState={
        <EmptyState
          icon={<Users size={28} />}
          title="No employee records found"
          description="There are currently no employee records matching your query."
          action={
            canCreate && onCreateEmployee ? (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={15} />}
                onClick={onCreateEmployee}
              >
                Add Employee
              </Button>
            ) : null
          }
          className="!bg-transparent !border-transparent !text-slate-300"
        />
      }
      footer={
        employees.length > 0 ? (
          <div className="flex items-center justify-between w-full text-xs text-slate-400">
            <span>
              Showing <strong className="text-slate-200">{employees.length}</strong> total{' '}
              {employees.length === 1 ? 'employee' : 'employees'}
            </span>
            <span className="text-slate-500">PeoplePay360 Central HR Directory</span>
          </div>
        ) : null
      }
    >
      {employees.map((emp) => {
        const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unnamed Employee';
        const departmentName =
          typeof emp.departmentId === 'object' && emp.departmentId?.name
            ? emp.departmentId.name
            : '—';

        return (
          <TableRow
            key={emp._id || emp.id}
            onClick={() => onSelectEmployee && onSelectEmployee(emp)}
            className="hover:!bg-slate-800/60 cursor-pointer !border-slate-800/60 transition-colors"
          >
            {/* Code */}
            <TableCell className="font-mono font-semibold text-blue-400">
              {emp.employeeCode}
            </TableCell>

            {/* Name & Email */}
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium text-white hover:text-blue-400 transition-colors">
                  {fullName}
                </span>
                {emp.email && <span className="text-xs text-slate-400">{emp.email}</span>}
              </div>
            </TableCell>

            {/* Department */}
            <TableCell className="text-slate-300">{departmentName}</TableCell>

            {/* Job Position */}
            <TableCell className="text-slate-300">{emp.jobPosition || '—'}</TableCell>

            {/* Employee Type */}
            <TableCell>
              <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded font-medium">
                {emp.employeeType || 'Full-Time'}
              </span>
            </TableCell>

            {/* Status */}
            <StatusCell status={emp.status || 'Active'} />

            {/* Actions */}
            <ActionCell>
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  title="View Employee Detail"
                  onClick={() => onSelectEmployee && onSelectEmployee(emp)}
                  className="!text-slate-400 hover:!text-white hover:!bg-slate-800"
                >
                  <Eye size={15} />
                </Button>

                {canEdit && onEditEmployee && (
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Edit Employee Record"
                    onClick={() => onEditEmployee(emp)}
                    className="!text-slate-400 hover:!text-blue-400 hover:!bg-slate-800"
                  >
                    <Edit2 size={15} />
                  </Button>
                )}
              </div>
            </ActionCell>
          </TableRow>
        );
      })}
    </Table>
  );
}

export default EmployeeList;
