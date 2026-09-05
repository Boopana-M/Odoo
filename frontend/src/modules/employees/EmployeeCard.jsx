import React from 'react';
import { Mail, Building2, UserCircle, Briefcase } from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';

/**
 * Reusable EmployeeCard Component for Kanban & Grid views with Tailwind CSS
 */
export function EmployeeCard({ employee, onClick }) {
  if (!employee) return null;

  const initials = `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase() || 'E';
  const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Unnamed Employee';
  const departmentName = typeof employee.departmentId === 'object' && employee.departmentId?.name
    ? employee.departmentId.name
    : 'No Department';
  const managerName = typeof employee.managerId === 'object' && employee.managerId?.firstName
    ? `${employee.managerId.firstName} ${employee.managerId.lastName || ''}`.trim()
    : null;

  return (
    <div
      onClick={() => onClick && onClick(employee)}
      className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 rounded-xl p-5 shadow-sm transition-all duration-150 cursor-pointer flex flex-col justify-between gap-4 group"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick && onClick(employee);
        }
      }}
    >
      {/* Card Header: Avatar, Name, Code, and Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
              {fullName}
            </h3>
            <span className="text-xs font-mono text-slate-400">{employee.employeeCode}</span>
          </div>
        </div>
        <StatusBadge status={employee.status || 'Active'} />
      </div>

      {/* Card Details: Job position, department, email */}
      <div className="space-y-1.5 text-xs text-slate-400 pt-1 border-t border-slate-800/80">
        <div className="flex items-center gap-2 text-slate-300">
          <Briefcase size={14} className="text-slate-500 shrink-0" />
          <span className="truncate font-medium">{employee.jobPosition || 'Job Position Unassigned'}</span>
        </div>

        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-slate-500 shrink-0" />
          <span className="truncate">{departmentName}</span>
        </div>

        {employee.email && (
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-slate-500 shrink-0" />
            <span className="truncate">{employee.email}</span>
          </div>
        )}

        {managerName && (
          <div className="flex items-center gap-2">
            <UserCircle size={14} className="text-slate-500 shrink-0" />
            <span className="truncate">Reports to: {managerName}</span>
          </div>
        )}
      </div>

      {/* Card Footer: Employee Type Badge */}
      <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500 border-t border-slate-800/60">
        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium">
          {employee.employeeType || 'Full-Time'}
        </span>
        <span className="text-slate-500">View profile →</span>
      </div>
    </div>
  );
}

export default EmployeeCard;
