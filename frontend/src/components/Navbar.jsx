import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  Clock,
  Calendar,
  DollarSign,
  BarChart3,
  Shield,
  LogOut,
  ChevronDown,
  User,
  Layers,
  Settings,
  Briefcase,
  Building,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AttendanceWidget from './AttendanceWidget';
import ChangePasswordModal from './ChangePasswordModal';

export function Navbar() {
  const { user, role, isAdmin, isHRManager, isPayrollUser, isPayrollManager, isEmployeeOnly, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [openMenu, setOpenMenu] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleClass = (roleStr) => {
    switch (roleStr) {
      case 'Admin': return 'role-admin';
      case 'HR Manager': return 'role-hr-manager';
      case 'HR Payroll Manager': return 'role-payroll-manager';
      case 'HR Payroll User': return 'role-payroll-user';
      case 'Employee': return 'role-employee';
      default: return 'role-admin';
    }
  };

  if (!isAuthenticated) return null;

  return (
    <header className="navbar" ref={menuRef}>
      <div className="nav-left">
        <Link to={isEmployeeOnly ? "/employees/me" : "/dashboard"} className="brand-logo">
          <div style={{ background: '#4f46e5', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
            <Layers size={18} color="white" />
          </div>
          <span>PeoplePay360</span>
          <span className="brand-badge">HR & Payroll</span>
        </Link>

        <nav className="nav-links">
          {/* Dashboard / Reports */}
          {(isAdmin || isPayrollUser || isHRManager) && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <BarChart3 size={16} />
              <span>Dashboard</span>
            </NavLink>
          )}

          {/* Employees Module / My Profile */}
          {isEmployeeOnly ? (
            <NavLink
              to="/employees/me"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <User size={16} />
              <span>My Profile</span>
            </NavLink>
          ) : (
            <div className="nav-item">
              <button
                type="button"
                className={`nav-link ${openMenu === 'employees' ? 'active' : ''}`}
                onClick={() => setOpenMenu(openMenu === 'employees' ? null : 'employees')}
              >
                <Users size={16} />
                <span>Employees</span>
                <ChevronDown size={14} />
              </button>

              {openMenu === 'employees' && (
                <div className="dropdown-menu">
                  <Link to="/employees" className="dropdown-item" onClick={() => setOpenMenu(null)}>
                    <Users size={16} /> Employees Directory
                  </Link>
                  {(isAdmin || isHRManager) && (
                    <Link to="/departments" className="dropdown-item" onClick={() => setOpenMenu(null)}>
                      <Building size={16} /> Departments Management
                    </Link>
                  )}
                  {isHRManager && (
                    <>
                      <Link to="/contracts" className="dropdown-item" onClick={() => setOpenMenu(null)}>
                        <FileText size={16} /> Contracts
                      </Link>
                      <Link to="/schedules" className="dropdown-item" onClick={() => setOpenMenu(null)}>
                        <Clock size={16} /> Working Schedules
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Attendance Module */}
          <NavLink
            to="/attendance"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Clock size={16} />
            <span>Attendance</span>
          </NavLink>

          {/* Time Off Module */}
          <div className="nav-item">
            <button
              type="button"
              className={`nav-link ${openMenu === 'timeoff' ? 'active' : ''}`}
              onClick={() => setOpenMenu(openMenu === 'timeoff' ? null : 'timeoff')}
            >
              <Calendar size={16} />
              <span>Time Off</span>
              <ChevronDown size={14} />
            </button>

            {openMenu === 'timeoff' && (
              <div className="dropdown-menu">
                <Link to="/time-off/requests" className="dropdown-item" onClick={() => setOpenMenu(null)}>
                  <Calendar size={16} /> Time Off Requests
                </Link>
                {isHRManager && (
                  <>
                    <Link to="/time-off/allocations" className="dropdown-item" onClick={() => setOpenMenu(null)}>
                      <Layers size={16} /> Allocations & Balances
                    </Link>
                    <Link to="/time-off/types" className="dropdown-item" onClick={() => setOpenMenu(null)}>
                      <Settings size={16} /> Time Off Types
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Payroll Module (HR Payroll User / HR Payroll Manager / Admin or Employee viewing own payslips) */}
          {isEmployeeOnly ? (
            <NavLink
              to="/payroll/payslips"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <DollarSign size={16} />
              <span>My Payslips</span>
            </NavLink>
          ) : isPayrollUser ? (
            <div className="nav-item">
              <button
                type="button"
                className={`nav-link ${openMenu === 'payroll' ? 'active' : ''}`}
                onClick={() => setOpenMenu(openMenu === 'payroll' ? null : 'payroll')}
              >
                <DollarSign size={16} />
                <span>Payroll</span>
                <ChevronDown size={14} />
              </button>

              {openMenu === 'payroll' && (
                <div className="dropdown-menu">
                  <Link to="/payroll/payruns" className="dropdown-item" onClick={() => setOpenMenu(null)}>
                    <Briefcase size={16} /> Payruns & Batches
                  </Link>
                  <Link to="/payroll/payslips" className="dropdown-item" onClick={() => setOpenMenu(null)}>
                    <FileText size={16} /> Payslips
                  </Link>
                  <div style={{ height: 1, background: 'var(--border)', margin: '0.25rem 0' }} />
                  <Link to="/payroll/structures" className="dropdown-item" onClick={() => setOpenMenu(null)}>
                    <Layers size={16} /> Salary Structures
                  </Link>
                  <Link to="/payroll/rules" className="dropdown-item" onClick={() => setOpenMenu(null)}>
                    <Settings size={16} /> Salary Rules
                  </Link>
                </div>
              )}
            </div>
          ) : null}

          {/* Admin User Management */}
          {isAdmin && (
            <NavLink
              to="/users"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Shield size={16} />
              <span>Users</span>
            </NavLink>
          )}
        </nav>
      </div>

      <div className="nav-right">
        {/* Attendance Check-in Widget */}
        <AttendanceWidget />

        {/* User Profile Pill & Actions */}
        <div className="user-profile">
          <div className="user-info">
            <span className="user-name">{user?.name || 'User'}</span>
            <span className={`user-role-badge ${getRoleClass(role)}`}>{role}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.35rem 0.5rem', color: '#e2e8f0', borderColor: 'rgba(255,255,255,0.2)', background: 'transparent' }}
            title="Change Password"
          >
            <KeyRound size={15} />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.35rem 0.6rem', color: '#e2e8f0', borderColor: 'rgba(255,255,255,0.2)', background: 'transparent' }}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Self-Service Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </header>
  );
}

export default Navbar;
