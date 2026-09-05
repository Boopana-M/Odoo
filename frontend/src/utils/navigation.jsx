import React from 'react';
import {
  User,
  Users,
  Calendar,
  FileText,
  Clock,
  Briefcase,
  DollarSign,
  FileSpreadsheet,
  Layers,
  Sliders,
  Shield,
  Key,
  Settings,
  LayoutGrid,
} from 'lucide-react';

/**
 * Valid System Roles matching backend contract
 */
export const ROLES = {
  EMPLOYEE: 'Employee',
  HR_MANAGER: 'HR Manager',
  HR_PAYROLL_USER: 'HR Payroll User',
  HR_PAYROLL_MANAGER: 'HR Payroll Manager',
  ADMIN: 'Admin',
};

/**
 * Returns role-aware navigation sections for Sidebar based on authenticated user's role
 * @param {string} role - Authenticated user role
 * @returns {Array} Array of navigation sections
 */
export function getNavigationForRole(role) {
  // 1. EMPLOYEE ROLE NAVIGATION
  // Allowed: Own profile, own attendance, own time off.
  // Restricted: No payroll, contracts admin, schedule admin, or system administration.
  if (role === ROLES.EMPLOYEE) {
    return [
      {
        title: 'Employee Self-Service',
        items: [
          {
            id: 'employee-profile',
            label: 'My Profile',
            icon: <User size={18} />,
          },
          {
            id: 'attendance',
            label: 'My Attendance',
            icon: <Clock size={18} />,
          },
          {
            id: 'time-off',
            label: 'My Time Off',
            icon: <Calendar size={18} />,
          },
        ],
      },
    ];
  }

  // Common HR Modules for HR Manager and roles inheriting it
  const hrSections = {
    title: 'HR Management',
    items: [
      {
        id: 'employees',
        label: 'Employees',
        icon: <Users size={18} />,
      },
      {
        id: 'attendance',
        label: 'Attendance',
        icon: <Clock size={18} />,
      },
      {
        id: 'contracts',
        label: 'Contracts',
        icon: <FileText size={18} />,
      },
      {
        id: 'schedules',
        label: 'Working Schedules',
        icon: <Briefcase size={18} />,
      },
      {
        id: 'time-off',
        label: 'Time Off',
        icon: <Calendar size={18} />,
      },
    ],
  };

  // 2. HR MANAGER ROLE NAVIGATION
  // Allowed: HR Modules (Employees, Attendance, Contracts, Working Schedules, Time Off)
  // Restricted: STRICTLY NO PAYROLL ACCESS
  if (role === ROLES.HR_MANAGER) {
    return [hrSections];
  }

  // 3. HR PAYROLL USER ROLE NAVIGATION
  // Inherits HR Manager + Payruns, Payslips, Salary Structures, Salary Rules
  // Permission info: Salary Structures (Read-only), Salary Rules (Read-only)
  if (role === ROLES.HR_PAYROLL_USER) {
    return [
      hrSections,
      {
        title: 'Payroll Management',
        items: [
          {
            id: 'payruns',
            label: 'Payruns',
            icon: <DollarSign size={18} />,
          },
          {
            id: 'payslips',
            label: 'Payslips',
            icon: <FileSpreadsheet size={18} />,
          },
          {
            id: 'salary-structures',
            label: 'Salary Structures',
            icon: <Layers size={18} />,
            badge: (
              <span className="text-[10px] uppercase font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                Read
              </span>
            ),
          },
          {
            id: 'salary-rules',
            label: 'Salary Rules',
            icon: <Sliders size={18} />,
            badge: (
              <span className="text-[10px] uppercase font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                Read
              </span>
            ),
          },
        ],
      },
    ];
  }

  // 4. HR PAYROLL MANAGER ROLE NAVIGATION
  // Inherits HR Payroll User + Full CRUD on all payroll modules
  if (role === ROLES.HR_PAYROLL_MANAGER) {
    return [
      hrSections,
      {
        title: 'Payroll Management',
        items: [
          {
            id: 'payruns',
            label: 'Payruns',
            icon: <DollarSign size={18} />,
          },
          {
            id: 'payslips',
            label: 'Payslips',
            icon: <FileSpreadsheet size={18} />,
          },
          {
            id: 'salary-structures',
            label: 'Salary Structures',
            icon: <Layers size={18} />,
          },
          {
            id: 'salary-rules',
            label: 'Salary Rules',
            icon: <Sliders size={18} />,
          },
        ],
      },
    ];
  }

  // 5. ADMIN ROLE NAVIGATION
  // Full system access: All HR modules, all Payroll modules, and Administration
  if (role === ROLES.ADMIN) {
    return [
      hrSections,
      {
        title: 'Payroll Management',
        items: [
          {
            id: 'payruns',
            label: 'Payruns',
            icon: <DollarSign size={18} />,
          },
          {
            id: 'payslips',
            label: 'Payslips',
            icon: <FileSpreadsheet size={18} />,
          },
          {
            id: 'salary-structures',
            label: 'Salary Structures',
            icon: <Layers size={18} />,
          },
          {
            id: 'salary-rules',
            label: 'Salary Rules',
            icon: <Sliders size={18} />,
          },
        ],
      },
      {
        title: 'Administration',
        items: [
          {
            id: 'user-management',
            label: 'User Management',
            icon: <Shield size={18} />,
          },
          {
            id: 'role-assignment',
            label: 'Role Assignment',
            icon: <Key size={18} />,
          },
          {
            id: 'system-admin',
            label: 'System Administration',
            icon: <Settings size={18} />,
          },
        ],
      },
    ];
  }

  // Default fallback if role is unknown or not set
  return [
    {
      title: 'Navigation',
      items: [
        {
          id: 'overview',
          label: 'Overview',
          icon: <LayoutGrid size={18} />,
        },
      ],
    },
  ];
}

/**
 * Returns metadata and permission description for a specific role
 * @param {string} role
 */
export function getRoleSummary(role) {
  switch (role) {
    case ROLES.EMPLOYEE:
      return {
        title: 'Employee',
        level: 'Self-Service',
        description: 'Access restricted to own profile, personal attendance logging, and personal time-off requests.',
        hasPayrollAccess: false,
        hasAdminAccess: false,
      };
    case ROLES.HR_MANAGER:
      return {
        title: 'HR Manager',
        level: 'Human Resources Lead',
        description: 'Full management over Employees, Attendance, Contracts, Working Schedules, and Time Off. Strictly no payroll access.',
        hasPayrollAccess: false,
        hasAdminAccess: false,
      };
    case ROLES.HR_PAYROLL_USER:
      return {
        title: 'HR Payroll User',
        level: 'HR & Payroll Specialist',
        description: 'Inherits HR Manager modules plus Payruns/Payslips (Create/Read/Update) and read-only access to Salary Structures & Rules.',
        hasPayrollAccess: true,
        hasAdminAccess: false,
      };
    case ROLES.HR_PAYROLL_MANAGER:
      return {
        title: 'HR Payroll Manager',
        level: 'Payroll Administration',
        description: 'Inherits HR Manager modules plus full CRUD access to Payruns, Payslips, Salary Structures, and Salary Rules.',
        hasPayrollAccess: true,
        hasAdminAccess: false,
      };
    case ROLES.ADMIN:
      return {
        title: 'System Admin',
        level: 'Full System Access',
        description: 'Complete unrestricted access across all HR modules, Payroll operations, User Management, and System Administration.',
        hasPayrollAccess: true,
        hasAdminAccess: true,
      };
    default:
      return {
        title: role || 'Unknown Role',
        level: 'Standard Access',
        description: 'Standard role access permissions.',
        hasPayrollAccess: false,
        hasAdminAccess: false,
      };
  }
}
