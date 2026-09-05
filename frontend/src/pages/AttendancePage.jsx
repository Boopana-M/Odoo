import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  LogOut,
  Calendar,
  Filter,
  User,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ROLES } from '../utils/navigation';
import {
  getAttendancesApi,
  createAttendanceApi,
  updateAttendanceApi,
  deleteAttendanceApi,
} from '../services/attendance';
import { getEmployeesApi } from '../services/employees';

import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Table } from '../components/tables/Table';
import { TableRow } from '../components/tables/TableRow';
import { TableCell } from '../components/tables/TableCell';
import { EmptyState } from '../components/ui/EmptyState';
import { PageError, SectionError } from '../components/ui/ErrorState';
import { Modal } from '../components/ui/Modal';
import { AttendanceModal } from '../modules/attendance/AttendanceModal';
import { AttendanceDetailModal } from '../modules/attendance/AttendanceDetailModal';

/**
 * Format ISO date string into readable Date
 */
function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Format ISO timestamp into readable Time
 */
function formatTime(dateString) {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
}

/**
 * PeoplePay360 Attendance Management Page
 * Supports Check-In / Check-Out, authorized manual corrections, filters, and role-based views.
 */
export function AttendancePage({ initialEmployeeFilter = null }) {
  const { user, role } = useAuth();

  const isEmployeeRole = role === ROLES.EMPLOYEE;
  // Backend restricts PUT and DELETE to Admin and HR Manager
  const canManage = [ROLES.ADMIN, ROLES.HR_MANAGER].includes(role);

  // Data states
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(initialEmployeeFilter || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [attendanceToDelete, setAttendanceToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Check-In Widget state for Employee
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch employees for dropdown filtering and selection
  const fetchEmployees = useCallback(async () => {
    if (isEmployeeRole) return;
    try {
      const data = await getEmployeesApi();
      setEmployees(data);
    } catch {
      // Non-critical if fails
    }
  }, [isEmployeeRole]);

  // Fetch attendance list based on current filters
  const fetchAttendances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (selectedEmployeeId) params.employeeId = selectedEmployeeId;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (startDateFilter) params.startDate = startDateFilter;
      if (endDateFilter) params.endDate = endDateFilter;

      const data = await getAttendancesApi(params);
      setAttendances(data);
    } catch (err) {
      setError(err.message || 'Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  }, [selectedEmployeeId, statusFilter, startDateFilter, endDateFilter]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchAttendances();
  }, [fetchAttendances]);

  // Detect today's attendance for authenticated employee
  const todayDateStr = new Date().toISOString().split('T')[0];
  const activeTodayRecord = attendances.find((a) => {
    const recordDate = a.date ? a.date.split('T')[0] : '';
    const recordCheckIn = a.checkIn ? a.checkIn.split('T')[0] : '';
    return (recordDate === todayDateStr || recordCheckIn === todayDateStr) && !a.checkOut;
  });

  const completedTodayRecord = attendances.find((a) => {
    const recordDate = a.date ? a.date.split('T')[0] : '';
    const recordCheckIn = a.checkIn ? a.checkIn.split('T')[0] : '';
    return (recordDate === todayDateStr || recordCheckIn === todayDateStr) && a.checkOut;
  });

  // Handle Quick Check-In
  const handleQuickCheckIn = async () => {
    try {
      setActionLoading(true);
      setFeedback(null);
      const now = new Date().toISOString();
      const payload = {
        employeeId: user?.employeeId,
        date: new Date().toISOString(),
        checkIn: now,
        status: 'Present',
      };
      await createAttendanceApi(payload);
      setFeedback({ type: 'success', message: 'Checked in successfully! Have a productive day.' });
      await fetchAttendances();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to record check-in.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Quick Check-Out
  const handleQuickCheckOut = async () => {
    if (!activeTodayRecord) return;
    try {
      setActionLoading(true);
      setFeedback(null);
      const now = new Date().toISOString();
      await updateAttendanceApi(activeTodayRecord._id, {
        checkOut: now,
      });
      setFeedback({ type: 'success', message: 'Checked out successfully! Worked hours recorded.' });
      await fetchAttendances();
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err.message?.includes('Access forbidden') || err.message?.includes('403')
            ? 'Attendance Check-Out closure requires HR Manager or Admin authorization per backend security rules.'
            : err.message || 'Failed to record check-out.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalInitialData(null);
    setModalError(null);
    setModalOpen(true);
  };

  // Open Edit / Correction Modal
  const handleOpenEdit = (attendance) => {
    setModalInitialData(attendance);
    setModalError(null);
    setModalOpen(true);
  };

  // Open Detail Modal
  const handleOpenDetail = (attendance) => {
    setSelectedAttendance(attendance);
    setDetailModalOpen(true);
  };

  // Handle Form Submission (Create or Edit)
  const handleModalSubmit = async (formData) => {
    try {
      setModalLoading(true);
      setModalError(null);

      if (modalInitialData) {
        await updateAttendanceApi(modalInitialData._id, formData);
        setFeedback({
          type: 'success',
          message: 'Attendance record updated and correction audit log recorded.',
        });
      } else {
        await createAttendanceApi(formData);
        setFeedback({
          type: 'success',
          message: 'Attendance record created successfully.',
        });
      }

      setModalOpen(false);
      await fetchAttendances();
    } catch (err) {
      setModalError(err.message || 'Failed to save attendance record.');
    } finally {
      setModalLoading(false);
    }
  };

  // Open Delete Dialog
  const handleOpenDelete = (attendance) => {
    setAttendanceToDelete(attendance);
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!attendanceToDelete) return;
    try {
      setDeleteLoading(true);
      setDeleteError(null);

      await deleteAttendanceApi(attendanceToDelete._id);
      setFeedback({
        type: 'success',
        message: 'Attendance record deleted successfully.',
      });
      setDeleteModalOpen(false);
      setAttendanceToDelete(null);
      await fetchAttendances();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete attendance record.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Columns definition
  const columns = [
    { key: 'employee', label: 'Employee' },
    { key: 'date', label: 'Date' },
    { key: 'checkIn', label: 'Check In' },
    { key: 'checkOut', label: 'Check Out' },
    { key: 'workedHours', label: 'Worked Hours' },
    { key: 'status', label: 'Status' },
    { key: 'isCorrected', label: 'Audit / Correction' },
    { key: 'actions', label: 'Actions', className: 'text-right' },
  ];

  return (
    <div className="space-y-6 text-slate-100">
      {/* Page Header */}
      <PageHeader
        title={isEmployeeRole ? 'My Attendance' : 'Attendance Management'}
        description={
          isEmployeeRole
            ? 'Track your daily check-in, check-out, and total recorded working hours.'
            : 'Monitor workforce attendance, daily timestamps, worked hours, and authorized corrections.'
        }
        breadcrumbs={[
          { label: isEmployeeRole ? 'Self-Service' : 'HR Management' },
          { label: 'Attendance' },
        ]}
        primaryAction={
          canManage && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={16} />}
              onClick={handleOpenCreate}
              className="!bg-blue-600 hover:!bg-blue-500 text-white"
            >
              Record Attendance
            </Button>
          )
        }
      />

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg border text-sm animate-in fade-in ${
            feedback.type === 'error'
              ? 'bg-red-950/40 border-red-800 text-red-300'
              : 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertTriangle size={18} className="shrink-0 text-red-400" />
          ) : (
            <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Employee Quick Check-In / Check-Out Widget */}
      {isEmployeeRole && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
                Today's Attendance Status
              </span>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white">
                  {activeTodayRecord
                    ? 'Active Session in Progress'
                    : completedTodayRecord
                    ? 'Shift Completed Today'
                    : 'Not Checked In Today'}
                </h2>
                {activeTodayRecord ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 border border-emerald-700 text-emerald-400 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Checked In
                  </span>
                ) : completedTodayRecord ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/80 border border-blue-700 text-blue-400">
                    Completed ({completedTodayRecord.workedHours || 0} hrs)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-400">
                    Off-Duty
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {activeTodayRecord
                  ? `Checked in at ${formatTime(activeTodayRecord.checkIn)}. Don't forget to check out when leaving.`
                  : completedTodayRecord
                  ? `Shift recorded from ${formatTime(completedTodayRecord.checkIn)} to ${formatTime(completedTodayRecord.checkOut)}.`
                  : 'Start your workday by recording your check-in timestamp.'}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {!activeTodayRecord ? (
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<LogIn size={16} />}
                  onClick={handleQuickCheckIn}
                  loading={actionLoading}
                  disabled={Boolean(completedTodayRecord)}
                  className="!bg-emerald-600 hover:!bg-emerald-500 text-white font-medium"
                >
                  {completedTodayRecord ? 'Completed for Today' : 'Check In Now'}
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  size="md"
                  leftIcon={<LogOut size={16} />}
                  onClick={handleQuickCheckOut}
                  loading={actionLoading}
                  className="!bg-amber-600 hover:!bg-amber-500 text-white font-medium"
                >
                  Check Out
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Page Error */}
      {error && (
        <PageError
          title="Failed to Load Attendance Records"
          message={error}
          onRetry={fetchAttendances}
          className="!bg-slate-900 !border-slate-800 [&_h3]:!text-white [&_p]:!text-slate-400"
        />
      )}

      {/* Filters Toolbar */}
      {!isEmployeeRole && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Filter size={14} className="text-blue-400" />
            <span>Attendance Filter Criteria</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Employee Filter */}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Filter by Employee</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp._id || emp.id} value={emp._id || emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
                <option value="Overtime">Overtime</option>
                <option value="Missing check-out">Missing check-out</option>
                <option value="Manual edits">Manual edits</option>
                <option value="On Leave">On Leave</option>
                <option value="Half Day">Half Day</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">From Date</label>
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">To Date</label>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/60">
            {(selectedEmployeeId || statusFilter !== 'all' || startDateFilter || endDateFilter) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedEmployeeId('');
                  setStatusFilter('all');
                  setStartDateFilter('');
                  setEndDateFilter('');
                }}
                className="!border-slate-800 !text-slate-400 hover:!bg-slate-800 text-xs"
              >
                Reset Filters
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchAttendances}
              disabled={loading}
              className="!border-slate-800 !text-slate-300 hover:!bg-slate-800 text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>
      )}

      {/* Main Attendance Table */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-blue-500" />
          <p className="text-sm">Loading attendance logs from server...</p>
        </div>
      ) : attendances.length === 0 ? (
        <EmptyState
          icon={<Clock size={36} className="text-slate-500" />}
          title="No Attendance Records Found"
          message={
            isEmployeeRole
              ? 'You have not recorded any attendance entries yet. Use the Check In button above to start your shift.'
              : 'No attendance logs matched your filter parameters. Try clearing your filters or record an attendance entry.'
          }
          action={
            canManage ? (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={15} />}
                onClick={handleOpenCreate}
                className="!bg-blue-600 hover:!bg-blue-500 text-white"
              >
                Record First Attendance
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <Table columns={columns}>
            {attendances.map((item) => {
              const emp = item.employeeId || {};
              const empName =
                typeof emp === 'object' && emp.firstName
                  ? `${emp.firstName} ${emp.lastName}`
                  : 'Employee';
              const empCode = typeof emp === 'object' ? emp.employeeCode : '—';
              const job = typeof emp === 'object' ? emp.jobPosition : null;

              return (
                <TableRow key={item._id} className="hover:bg-slate-800/50 transition-colors border-b border-slate-800/60">
                  {/* Employee */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-500/30">
                        {empName.charAt(0)}
                      </div>
                      <div>
                        <span className="font-medium text-slate-100 block text-sm">{empName}</span>
                        <span className="text-xs text-slate-500 font-mono">
                          {empCode} {job ? `· ${job}` : ''}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Date */}
                  <TableCell className="text-slate-300 text-sm whitespace-nowrap">
                    {formatDate(item.date || item.checkIn)}
                  </TableCell>

                  {/* Check In */}
                  <TableCell className="font-mono text-sm text-emerald-400 font-medium whitespace-nowrap">
                    {formatTime(item.checkIn)}
                  </TableCell>

                  {/* Check Out */}
                  <TableCell className="font-mono text-sm whitespace-nowrap">
                    {item.checkOut ? (
                      <span className="text-amber-400 font-medium">{formatTime(item.checkOut)}</span>
                    ) : (
                      <span className="text-slate-500 italic">In progress</span>
                    )}
                  </TableCell>

                  {/* Worked Hours */}
                  <TableCell className="font-mono text-sm font-semibold text-blue-400">
                    {item.workedHours !== undefined ? `${Number(item.workedHours).toFixed(2)} hrs` : '0.00 hrs'}
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell>
                    <StatusBadge status={item.status || 'Present'} />
                  </TableCell>

                  {/* Correction / Audit info */}
                  <TableCell>
                    {item.isCorrected ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/60 border border-amber-800 text-amber-300 cursor-help"
                        title={item.correctionReason || 'Manual correction applied'}
                      >
                        Corrected
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenDetail(item)}
                        className="p-1.5 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                        title="View Complete Details"
                      >
                        <Eye size={15} />
                      </button>

                      {canManage && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                            title="Edit / Apply Correction"
                          >
                            <Edit2 size={15} />
                          </button>

                          <button
                            onClick={() => handleOpenDelete(item)}
                            className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </Table>
        </div>
      )}

      {/* Attendance Modal (Create / Correction) */}
      <AttendanceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={modalInitialData}
        employees={employees}
        isEmployeeRole={isEmployeeRole}
        currentUserEmployeeId={user?.employeeId}
        loading={modalLoading}
        apiError={modalError}
      />

      {/* Attendance Detail Modal */}
      <AttendanceDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        attendance={selectedAttendance}
        onEdit={handleOpenEdit}
        canEdit={canManage}
      />

      {/* Delete Confirmation Dialog */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Record Deletion"
        size="sm"
      >
        <div className="space-y-4 text-slate-100">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-950/40 border border-red-900/60 text-red-300 text-sm">
            <AlertTriangle size={20} className="shrink-0 text-red-400" />
            <span>
              Are you sure you want to permanently delete this attendance record? This action cannot be undone.
            </span>
          </div>

          {deleteError && (
            <SectionError
              title="Deletion Failed"
              message={deleteError}
              className="!bg-red-950/40 !border-red-800"
            />
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              variant="outline"
              size="md"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleteLoading}
              className="!border-slate-700 !text-slate-300 hover:!bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="md"
              loading={deleteLoading}
              onClick={handleConfirmDelete}
              className="!bg-red-600 hover:!bg-red-500 text-white"
            >
              Delete Record
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AttendancePage;
