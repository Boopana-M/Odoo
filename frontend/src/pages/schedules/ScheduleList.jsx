import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Plus, ArrowRight, Calendar } from 'lucide-react';
import { scheduleApi } from '../../api/scheduleApi';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export function ScheduleList() {
  const navigate = useNavigate();
  const { isHRManager } = useAuth();
  const { error } = useNotification();

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await scheduleApi.getAll();
      setSchedules(res.data || []);
    } catch (err) {
      error(err.message || 'Failed to load working schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-title-area">
          <Clock size={24} color="var(--primary)" />
          <h1 className="page-title">Working Schedules</h1>
        </div>

        <div className="page-actions">
          {isHRManager && (
            <button className="btn btn-primary" onClick={() => navigate('/schedules/new')}>
              <Plus size={16} /> New Schedule
            </button>
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Schedule Name</th>
              <th>Type</th>
              <th>Weekly Hours</th>
              <th>Working Days Pattern</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s._id}>
                <td style={{ fontWeight: 600 }}>{s.name}</td>
                <td>
                  <span className="badge badge-info">{s.type}</span>
                </td>
                <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                  {s.weeklyHours} hrs / week
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {s.weeklyPattern?.map((p, idx) => (
                      <span
                        key={idx}
                        className="badge badge-neutral"
                        style={{ fontSize: '0.7rem' }}
                      >
                        {p?.day ? p.day.slice(0, 3) : 'Day'}: {p?.startTime || '--'}-{p?.endTime || '--'}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/schedules/${s._id}`)}
                  >
                    View Pattern <ArrowRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {schedules.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No working schedules found.</p>
        </div>
      )}
    </div>
  );
}

export default ScheduleList;
