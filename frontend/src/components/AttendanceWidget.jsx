import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Square } from 'lucide-react';
import { attendanceApi } from '../api/attendanceApi';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export function AttendanceWidget() {
  const { user, isAuthenticated } = useAuth();
  const { success, error } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [activeAttendance, setActiveAttendance] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsed, setElapsed] = useState('00:00:00');
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch status using the reliable endpoint or fallback
  const fetchTodayStatus = async () => {
    if (!isAuthenticated || user?.role !== 'Employee') return;
    try {
      const res = await attendanceApi.getStatus();
      if (res?.data?.data?.isCheckedIn && res?.data?.data?.attendance) {
        setActiveAttendance(res.data.data.attendance);
      } else if (res?.data?.isCheckedIn && res?.data?.attendance) {
        setActiveAttendance(res.data.attendance);
      } else {
        setActiveAttendance(null);
      }
    } catch (err) {
      console.warn('Could not fetch current attendance status:', err);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
  }, [isAuthenticated, user]);

  // Listen for global attendance changes
  useEffect(() => {
    const onAttendanceChanged = () => {
      fetchTodayStatus();
    };
    window.addEventListener('attendance-changed', onAttendanceChanged);
    return () => window.removeEventListener('attendance-changed', onAttendanceChanged);
  }, [isAuthenticated, user]);

  // Calculate elapsed time if checked in
  useEffect(() => {
    if (activeAttendance && activeAttendance.checkIn && !activeAttendance.checkOut) {
      const checkInTime = new Date(activeAttendance.checkIn).getTime();
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
  }, [activeAttendance]);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.checkIn();
      const newAtt = res.data?.data || res.data;
      setActiveAttendance(newAtt);
      success('Checked in successfully!');
      setIsOpen(false);
      window.dispatchEvent(new Event('attendance-changed'));
    } catch (err) {
      error(err.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      await attendanceApi.checkOut();
      setActiveAttendance(null);
      setElapsed('00:00:00');
      success('Checked out successfully!');
      setIsOpen(false);
      window.dispatchEvent(new Event('attendance-changed'));
    } catch (err) {
      error(err.message || 'Check-out failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'Employee') return null;

  const isCheckedIn = !!(activeAttendance && !activeAttendance.checkOut);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="nav-link"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: isCheckedIn ? 'rgba(22, 163, 74, 0.2)' : 'rgba(255, 255, 255, 0.08)',
          borderColor: isCheckedIn ? '#16a34a' : 'transparent',
          color: isCheckedIn ? '#4ade80' : '#cbd5e1',
          padding: '0.4rem 0.75rem',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer'
        }}
        title="Quick Attendance"
      >
        <Clock size={16} />
        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
          {isCheckedIn ? elapsed : 'Check In'}
        </span>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: isCheckedIn ? '#4ade80' : '#94a3b8'
          }}
        />
      </button>

      {isOpen && (
        <div
          className="dropdown-menu"
          style={{
            right: 0,
            left: 'auto',
            width: 260,
            padding: '1.25rem',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>
            {currentTime.toLocaleTimeString()}
          </div>

          <div
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: isCheckedIn ? 'var(--success-bg)' : 'var(--bg-subtle)',
              marginBottom: '1rem'
            }}
          >
            <div style={{ fontSize: '0.75rem', color: isCheckedIn ? 'var(--success-text)' : 'var(--text-muted)', fontWeight: 600 }}>
              STATUS: {isCheckedIn ? 'WORKING' : 'NOT CHECKED IN'}
            </div>
            {isCheckedIn && (
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success-text)', marginTop: '0.25rem' }}>
                {elapsed}
              </div>
            )}
          </div>

          {!isCheckedIn ? (
            <button
              type="button"
              className="btn btn-success"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              onClick={handleCheckIn}
              disabled={loading || !user?.employeeId}
            >
              <Play size={16} /> Check In
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-danger"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              onClick={handleCheckOut}
              disabled={loading}
            >
              <Square size={16} /> Check Out
            </button>
          )}

          {!user?.employeeId && (
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              (No linked employee profile for this account)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default AttendanceWidget;
