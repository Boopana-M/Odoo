import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  DollarSign,
  Calendar,
  Clock,
  Briefcase,
  Layers,
  ChevronRight,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { payslipApi } from '../api/payslipApi';
import { timeOffApi } from '../api/timeOffApi';
import { payrunApi } from '../api/payrunApi';

export function NotificationBell() {
  const { user, isEmployeeOnly, isPayrollUser, isHRManager } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchLiveActivities = async () => {
    try {
      const items = [];

      // 1. Fetch recent payslips for employee or system
      try {
        const payslipRes = await payslipApi.getAll();
        const recentPayslips = (payslipRes.data || []).slice(0, 3);
        recentPayslips.forEach((p) => {
          const empName = `${p.employeeId?.firstName || ''} ${p.employeeId?.lastName || ''}`.trim() || 'Staff';
          items.push({
            id: `payslip-${p._id}`,
            icon: DollarSign,
            color: 'var(--success-text)',
            bgColor: 'rgba(22, 163, 74, 0.15)',
            title: isEmployeeOnly ? 'Your Payslip is Ready' : `Payslip Published (${empName})`,
            description: `Net: ₹${Number(p.net || 0).toLocaleString()} • Status: ${p.status}`,
            time: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Recent',
            link: isEmployeeOnly ? '/payroll/payslips' : `/payroll/payslips/${p._id}`
          });
        });
      } catch {
        // Silent fallback
      }

      // 2. Fetch time off requests
      try {
        const timeOffRes = await timeOffApi.getRequests();
        const recentLeaves = (timeOffRes.data || []).slice(0, 3);
        recentLeaves.forEach((l) => {
          const empName = `${l.employeeId?.firstName || ''} ${l.employeeId?.lastName || ''}`.trim() || 'Staff';
          items.push({
            id: `leave-${l._id}`,
            icon: Calendar,
            color: 'var(--info-text)',
            bgColor: 'rgba(2, 132, 199, 0.15)',
            title: isEmployeeOnly ? `Time Off: ${l.timeOffTypeId?.name || 'Leave'}` : `Leave Request: ${empName}`,
            description: `${l.duration || 1} day(s) • Status: ${l.status}`,
            time: l.startDate ? new Date(l.startDate).toLocaleDateString() : 'Recent',
            link: '/time-off/requests'
          });
        });
      } catch {
        // Silent fallback
      }

      // 3. If Payroll User / Admin, fetch recent Payruns
      if (isPayrollUser) {
        try {
          const payrunRes = await payrunApi.getAll();
          const recentRuns = (payrunRes.data || []).slice(0, 2);
          recentRuns.forEach((pr) => {
            items.push({
              id: `payrun-${pr._id}`,
              icon: Briefcase,
              color: 'var(--primary)',
              bgColor: 'rgba(113, 75, 103, 0.15)',
              title: `Payrun: ${pr.name}`,
              description: `Workflow: ${pr.status} • Period: ${new Date(pr.periodStart).toLocaleDateString()}`,
              time: pr.createdAt ? new Date(pr.createdAt).toLocaleDateString() : 'Recent',
              link: `/payroll/payruns/${pr._id}`
            });
          });
        } catch {
          // Silent fallback
        }
      }

      setNotifications(items);
      setUnreadCount(items.length > 0 ? items.length : 0);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchLiveActivities();
    const interval = setInterval(fetchLiveActivities, 30000); // Polling every 30s for live connectivity
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        style={{
          padding: '0.4rem 0.6rem',
          color: '#e2e8f0',
          borderColor: 'rgba(255,255,255,0.2)',
          background: 'transparent',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={() => setIsOpen(!isOpen)}
        title="Live System Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 800,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #714B67'
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '340px',
            maxWidth: '90vw',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1050,
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-subtle)'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Bell size={14} color="var(--primary)" /> Live System Updates
            </div>
            <button
              type="button"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              onClick={() => setIsOpen(false)}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                No active notifications
              </div>
            ) : (
              notifications.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setIsOpen(false);
                      navigate(item.link);
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div
                      style={{
                        padding: '0.4rem',
                        borderRadius: '6px',
                        background: item.bgColor,
                        color: item.color,
                        flexShrink: 0,
                        marginTop: '2px'
                      }}
                    >
                      <IconComponent size={14} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--text-main)' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.description}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>
                        {item.time}
                      </div>
                    </div>
                    <ChevronRight size={14} color="var(--text-muted)" style={{ marginTop: '0.35rem' }} />
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
