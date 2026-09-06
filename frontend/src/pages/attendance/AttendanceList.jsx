import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Clock,
  Plus,
  Filter,
  Search,
  Edit2,
  CheckCircle,
  AlertTriangle,
  Play,
  Square,
  Calendar,
  UserCheck
} from 'lucide-react';
import { attendanceApi } from '../../api/attendanceApi';
import { employeeApi } from '../../api/employeeApi';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export function AttendanceList() {
  const [searchParams] = useSearchParams();
  const { user, isHRManager, isAdmin, isEmployeeOnly } = useAuth();
  const { success, error } = useNotification();

  const employeeFilterParam = searchParams.get('employeeId') || '';

  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedEmp, setSelectedEmp] = useState(isEmployeeOnly ? user?.employeeId : employeeFilterParam);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Employee Self-Service Clock & Status
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsed, setElapsed] = useState('00:00:00');
  const [selfServiceLoading, setSelfServiceLoading] = useState(false);

  // Active attendance record for today (Employee only)
  const [activeTodayAttendance, setActiveTodayAttendance] = useState(null);

  // Create Modal (HR/Admin manual entry)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '',
    checkOut: '',
    status: 'Present'
  });

  // Correction Modal (HR / Admin only)
  const [editingRecord, setEditingRecord] = useState(null);
  const [correctionData, setCorrectionData] = useState({
    date: '',
    checkIn: '',
    checkOut: '',
    status: 'Present',
    correctionReason: ''
  });

  // Keep clock running for live feedback
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute today's active attendance for employee
  useEffect(() => {
    if (isEmployeeOnly && attendances.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayRecords = attendances.filter((att) => {
        const attDate = att.date ? att.date.split('T')[0] : '';
        return attDate === todayStr;
      });
      // Find open check-in or latest today record
      const open = todayRecords.find((r) => !r.checkOut);
      setActiveTodayAttendance(open || todayRecords[0] || null);
    } else if (isEmployeeOnly && attendances.length === 0) {
      setActiveTodayAttendance(null);
    }
  }, [isEmployeeOnly, attendances]);

  // Elapsed timer for active check-in
  useEffect(() => {
    if (isEmployeeOnly && activeTodayAttendance?.checkIn && !activeTodayAttendance.checkOut) {
      const checkInTime = new Date(activeTodayAttendance.checkIn).getTime();
      const updateElapsed = () => {
        const diff = Math.max(0, Date.now() - checkInTime);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setElapsed(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      };
      updateElapsed();
      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsed('00:00:00');
    }
  }, [isEmployeeOnly, activeTodayAttendance]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attRes, empRes] = await Promise.all([
        attendanceApi.getAll({
          employeeId: isEmployeeOnly ? user?.employeeId : selectedEmp,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          status: statusFilter || undefined
        }),
        isEmployeeOnly ? Promise.resolve({ data: [] }) : employeeApi.getAll()
      ]);

      setAttendances(attRes.data || []);
      setEmployees(empRes.data || []);
    } catch (err) {
      error(err.message || 'Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedEmp, startDate, endDate, statusFilter, isEmployeeOnly]);

  // Employee Self-Service: Check In
  const handleEmployeeCheckIn = async () => {
    setSelfServiceLoading(true);
    try {
      await attendanceApi.checkIn();
      success('Checked in successfully!');
      fetchData();
    } catch (err) {
      error(err.message || 'Check-in failed');
    } finally {
      setSelfServiceLoading(false);
    }
  };

  // Employee Self-Service: Check Out
  const handleEmployeeCheckOut = async () => {
    setSelfServiceLoading(true);
    try {
      await attendanceApi.checkOut();
      success('Checked out successfully!');
      fetchData();
    } catch (err) {
      error(err.message || 'Check-out failed');
    } finally {
      setSelfServiceLoading(false);
    }
  };

  // HR/Admin Manual Attendance Creation
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        employeeId: newRecord.employeeId,
        date: newRecord.date,
        checkIn: `${newRecord.date}T${newRecord.checkIn}:00`,
        checkOut: newRecord.checkOut ? `${newRecord.date}T${newRecord.checkOut}:00` : null,
        status: newRecord.status
      };

      await attendanceApi.create(payload);
      success('Attendance record added successfully');
      setIsCreateOpen(false);
      setNewRecord({
        employeeId: '',
        date: new Date().toISOString().split('T')[0],
        checkIn: '',
        checkOut: '',
        status: 'Present'
      });
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to add attendance record');
    }
  };

  // HR/Admin Correction Modal handlers
  const handleOpenCorrection = (att) => {
    setEditingRecord(att);
    const dateStr = att.date ? att.date.split('T')[0] : '';
    const checkInTime = att.checkIn ? new Date(att.checkIn).toTimeString().slice(0, 5) : '09:00';
    const checkOutTime = att.checkOut ? new Date(att.checkOut).toTimeString().slice(0, 5) : '';

    setCorrectionData({
      date: dateStr,
      checkIn: checkInTime,
      checkOut: checkOutTime,
      status: att.status || 'Present',
      correctionReason: att.correctionReason || ''
    });
  };

  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    if (!correctionData.correctionReason) {
      error('Please provide a reason for the manual correction');
      return;
    }

    try {
      const dateStr = correctionData.date || editingRecord.date.split('T')[0];
      const payload = {
        checkIn: `${dateStr}T${correctionData.checkIn}:00`,
        checkOut: correctionData.checkOut ? `${dateStr}T${correctionData.checkOut}:00` : null,
        status: correctionData.status,
        correctionReason: correctionData.correctionReason
      };

      await attendanceApi.update(editingRecord._id, payload);
      success('Attendance corrected successfully');
      setEditingRecord(null);
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to correct attendance record');
    }
  };

  const isCheckedIn = !!(activeTodayAttendance && !activeTodayAttendance.checkOut);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-area">
          <Clock size={24} color="var(--primary)" />
          <div>
            <h1 className="page-title">
              {isEmployeeOnly ? 'My Attendance' : 'Employee Attendance Management'}
            </h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {isEmployeeOnly
                ? 'Check in, check out, and view your personal attendance history.'
                : 'Review, monitor, and adjust employee attendance records across the organization.'}
            </p>
          </div>
        </div>

        {/* HR/Admin Manual Entry Action (Never personal self-service buttons) */}
        {(isHRManager || isAdmin) && (
          <div className="page-actions">
            <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
              <Plus size={16} /> Record Attendance Entry
            </button>
          </div>
        )}
      </div>

      {/* EMPLOYEE ONLY: Prominent Self-Service Check-In / Check-Out Panel */}
      {isEmployeeOnly && (
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            padding: '1.5rem',
            background: isCheckedIn
              ? 'linear-gradient(135deg, rgba(22, 163, 74, 0.1) 0%, rgba(15, 23, 42, 0.6) 100%)'
              : 'linear-gradient(135deg, rgba(113, 75, 103, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%)',
            borderColor: isCheckedIn ? '#16a34a' : 'var(--border)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: isCheckedIn ? 'rgba(22, 163, 74, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isCheckedIn ? '#4ade80' : 'var(--text-muted)'
              }}
            >
              <Clock size={28} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
                {currentTime.toLocaleTimeString()}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: isCheckedIn ? 'rgba(34, 197, 94, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                    color: isCheckedIn ? '#4ade80' : '#94a3b8'
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: isCheckedIn ? '#22c55e' : '#94a3b8'
                    }}
                  />
                  {isCheckedIn ? 'CURRENTLY WORKING' : 'NOT CHECKED IN'}
                </span>
                {isCheckedIn && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    (Check-in: {new Date(activeTodayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {isCheckedIn && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Elapsed Time Today
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4ade80', fontFamily: 'monospace' }}>
                  {elapsed}
                </div>
              </div>
            )}

            {!isCheckedIn ? (
              <button
                type="button"
                className="btn btn-success"
                style={{ padding: '0.65rem 1.75rem', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={handleEmployeeCheckIn}
                disabled={selfServiceLoading}
              >
                <Play size={18} /> Check In
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-danger"
                style={{ padding: '0.65rem 1.75rem', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={handleEmployeeCheckOut}
                disabled={selfServiceLoading}
              >
                <Square size={18} /> Check Out
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-inputs">
          {/* Employee dropdown shown ONLY for management roles */}
          {!isEmployeeOnly && (
            <select
              className="form-control"
              value={selectedEmp}
              onChange={(e) => setSelectedEmp(e.target.value)}
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
            </select>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>From:</span>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>To:</span>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Absent">Absent</option>
            <option value="Overtime">Overtime</option>
            <option value="Missing check-out">Missing Check-out</option>
            <option value="Manual edits">Manual Edits</option>
            <option value="On Leave">On Leave</option>
            <option value="Half Day">Half Day</option>
          </select>
        </div>

        {(startDate || endDate || (!isEmployeeOnly && selectedEmp) || statusFilter) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              if (!isEmployeeOnly) setSelectedEmp('');
              setStartDate('');
              setEndDate('');
              setStatusFilter('');
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Attendance Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {!isEmployeeOnly && <th>Employee</th>}
              <th>Date</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Worked Hours</th>
              <th>Status</th>
              <th>Correction Info</th>
              {(isHRManager || isAdmin) && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {attendances.map((att) => (
              <tr key={att._id}>
                {!isEmployeeOnly && (
                  <td>
                    <div style={{ fontWeight: 600 }}>
                      {att.employeeId?.firstName} {att.employeeId?.lastName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {att.employeeId?.employeeCode}
                    </div>
                  </td>
                )}
                <td style={{ fontWeight: 500 }}>
                  {new Date(att.date).toLocaleDateString()}
                </td>
                <td>
                  {att.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                </td>
                <td>
                  {att.checkOut ? (
                    new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  ) : (
                    <span className="badge badge-warning">Active / Open</span>
                  )}
                </td>
                <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                  {Number(att.workedHours || 0).toFixed(2)} hrs
                </td>
                <td>
                  <StatusBadge status={att.status} />
                </td>
                <td>
                  {att.isCorrected ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--warning-text)' }}>
                      <strong>Edited:</strong> {att.correctionReason}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>Standard</span>
                  )}
                </td>
                {(isHRManager || isAdmin) && (
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenCorrection(att)}
                    >
                      <Edit2 size={14} /> Correct
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {attendances.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No attendance entries found for the selected period.</p>
        </div>
      )}

      {/* Create Attendance Modal (HR/Admin Manual Management Only) */}
      {(isHRManager || isAdmin) && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Record Attendance Entry (Management)"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreate}>
                Submit Attendance
              </button>
            </>
          }
        >
          <form onSubmit={handleCreate} className="form-grid">
            <div className="form-group full-width">
              <label className="form-label required">Employee</label>
              <select
                className="form-control"
                value={newRecord.employeeId}
                onChange={(e) => setNewRecord({ ...newRecord, employeeId: e.target.value })}
                required
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Date</label>
              <input
                type="date"
                className="form-control"
                value={newRecord.date}
                onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Check-In Time</label>
              <input
                type="time"
                className="form-control"
                value={newRecord.checkIn}
                onChange={(e) => setNewRecord({ ...newRecord, checkIn: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Check-Out Time (Optional)</label>
              <input
                type="time"
                className="form-control"
                value={newRecord.checkOut}
                onChange={(e) => setNewRecord({ ...newRecord, checkOut: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Status</label>
              <select
                className="form-control"
                value={newRecord.status}
                onChange={(e) => setNewRecord({ ...newRecord, status: e.target.value })}
                required
              >
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
                <option value="Overtime">Overtime</option>
                <option value="Half Day">Half Day</option>
              </select>
            </div>
          </form>
        </Modal>
      )}

      {/* Correction Modal (HR / Admin only) */}
      {(isHRManager || isAdmin) && (
        <Modal
          isOpen={!!editingRecord}
          onClose={() => setEditingRecord(null)}
          title="Attendance Correction (HR Management)"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setEditingRecord(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveCorrection}>
                Save Correction
              </button>
            </>
          }
        >
          <form onSubmit={handleSaveCorrection} className="form-grid">
            <div className="form-group full-width">
              <label className="form-label">Employee</label>
              <input
                type="text"
                className="form-control"
                value={`${editingRecord?.employeeId?.firstName || ''} ${editingRecord?.employeeId?.lastName || ''}`}
                disabled
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Check In Time</label>
              <input
                type="time"
                className="form-control"
                value={correctionData.checkIn}
                onChange={(e) => setCorrectionData({ ...correctionData, checkIn: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Check Out Time</label>
              <input
                type="time"
                className="form-control"
                value={correctionData.checkOut}
                onChange={(e) => setCorrectionData({ ...correctionData, checkOut: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Status</label>
              <select
                className="form-control"
                value={correctionData.status}
                onChange={(e) => setCorrectionData({ ...correctionData, status: e.target.value })}
                required
              >
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
                <option value="Overtime">Overtime</option>
                <option value="Manual edits">Manual edits</option>
                <option value="On Leave">On Leave</option>
                <option value="Half Day">Half Day</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label className="form-label required">Correction Reason</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Employee forgot to badge out due to offsite client meeting"
                value={correctionData.correctionReason}
                onChange={(e) => setCorrectionData({ ...correctionData, correctionReason: e.target.value })}
                required
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default AttendanceList;
