import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft, Plus, Trash2, Save, X } from 'lucide-react';
import { scheduleApi } from '../../api/scheduleApi';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function ScheduleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isHRManager } = useAuth();
  const { success, error } = useNotification();

  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Standard',
    weeklyPattern: [
      { day: 'Monday', startTime: '09:00', endTime: '18:00', breakHours: 1 },
      { day: 'Tuesday', startTime: '09:00', endTime: '18:00', breakHours: 1 },
      { day: 'Wednesday', startTime: '09:00', endTime: '18:00', breakHours: 1 },
      { day: 'Thursday', startTime: '09:00', endTime: '18:00', breakHours: 1 },
      { day: 'Friday', startTime: '09:00', endTime: '18:00', breakHours: 1 }
    ]
  });

  useEffect(() => {
    if (!isNew) {
      const fetchSchedule = async () => {
        try {
          const res = await scheduleApi.getById(id);
          const s = res.data;
          setFormData({
            name: s.name,
            type: s.type,
            weeklyPattern: s.weeklyPattern || []
          });
        } catch (err) {
          error(err.message || 'Failed to load schedule');
        } finally {
          setLoading(false);
        }
      };
      fetchSchedule();
    }
  }, [id, isNew]);

  // Calculate total weekly hours on the fly
  const calculateTotalWeeklyHours = () => {
    return formData.weeklyPattern.reduce((sum, item) => {
      if (!item.startTime || !item.endTime) return sum;
      const [startH, startM] = item.startTime.split(':').map(Number);
      const [endH, endM] = item.endTime.split(':').map(Number);
      const duration = (endH + endM / 60) - (startH + startM / 60) - (Number(item.breakHours) || 0);
      return sum + Math.max(0, duration);
    }, 0);
  };

  const handleAddDay = () => {
    const existingDays = formData.weeklyPattern.map((p) => p.day);
    const nextDay = DAYS_OF_WEEK.find((d) => !existingDays.includes(d)) || 'Monday';
    setFormData({
      ...formData,
      weeklyPattern: [
        ...formData.weeklyPattern,
        { day: nextDay, startTime: '09:00', endTime: '17:00', breakHours: 1 }
      ]
    });
  };

  const handleRemoveDay = (index) => {
    const updated = [...formData.weeklyPattern];
    updated.splice(index, 1);
    setFormData({ ...formData, weeklyPattern: updated });
  };

  const handlePatternChange = (index, field, value) => {
    const updated = [...formData.weeklyPattern];
    updated[index][field] = value;
    setFormData({ ...formData, weeklyPattern: updated });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      error('Schedule name is required');
      return;
    }
    if (formData.weeklyPattern.length === 0) {
      error('Please add at least one day to the weekly pattern');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        weeklyPattern: formData.weeklyPattern.map((p) => ({
          day: p.day,
          startTime: p.startTime,
          endTime: p.endTime,
          breakHours: Number(p.breakHours) || 0
        }))
      };

      if (isNew) {
        await scheduleApi.create(payload);
        success('Working schedule created successfully');
      } else {
        await scheduleApi.update(id, payload);
        success('Working schedule updated successfully');
      }
      navigate('/schedules');
    } catch (err) {
      error(err.message || 'Failed to save working schedule');
    }
  };

  if (loading) {
    return <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>Loading schedule...</div>;
  }

  const calculatedHours = calculateTotalWeeklyHours();

  return (
    <div>
      <div className="page-header">
        <div className="page-title-area">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/schedules')}
          >
            <ArrowLeft size={16} /> Back to Schedules
          </button>
          <h1 className="page-title">{isNew ? 'New Working Schedule' : formData.name}</h1>
        </div>

        {isHRManager && (
          <div className="page-actions">
            <button className="btn btn-primary" onClick={handleSave}>
              <Save size={16} /> Save Schedule
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
          <div>
            <h3 className="card-title">Schedule Information</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Configure daily shift times and break hours.
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Weekly Working Hours</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
              {calculatedHours.toFixed(1)} hrs / week
            </div>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-grid" style={{ marginBottom: '2rem' }}>
            <div className="form-group">
              <label className="form-label required">Schedule Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Standard 40 Hours"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isHRManager}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Schedule Type</label>
              <select
                className="form-control"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                disabled={!isHRManager}
                required
              >
                <option value="Standard">Standard</option>
                <option value="Flexible">Flexible</option>
                <option value="Shift">Shift</option>
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Weekly Working Pattern
            </h4>
            {isHRManager && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddDay}
              >
                <Plus size={14} /> Add Day
              </button>
            )}
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Day of Week</th>
                  <th>Start Time (HH:mm)</th>
                  <th>End Time (HH:mm)</th>
                  <th>Break Hours</th>
                  <th>Net Daily Hours</th>
                  {isHRManager && <th style={{ textAlign: 'right' }}>Remove</th>}
                </tr>
              </thead>
              <tbody>
                {formData.weeklyPattern.map((p, idx) => {
                  const [startH, startM] = (p.startTime || '00:00').split(':').map(Number);
                  const [endH, endM] = (p.endTime || '00:00').split(':').map(Number);
                  const dailyNet = Math.max(0, (endH + endM / 60) - (startH + startM / 60) - (Number(p.breakHours) || 0));

                  return (
                    <tr key={idx}>
                      <td style={{ width: 180 }}>
                        <select
                          className="form-control"
                          value={p.day}
                          onChange={(e) => handlePatternChange(idx, 'day', e.target.value)}
                          disabled={!isHRManager}
                        >
                          {DAYS_OF_WEEK.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <input
                          type="time"
                          className="form-control"
                          value={p.startTime}
                          onChange={(e) => handlePatternChange(idx, 'startTime', e.target.value)}
                          disabled={!isHRManager}
                          required
                        />
                      </td>

                      <td>
                        <input
                          type="time"
                          className="form-control"
                          value={p.endTime}
                          onChange={(e) => handlePatternChange(idx, 'endTime', e.target.value)}
                          disabled={!isHRManager}
                          required
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          className="form-control"
                          style={{ width: 100 }}
                          value={p.breakHours}
                          onChange={(e) => handlePatternChange(idx, 'breakHours', e.target.value)}
                          disabled={!isHRManager}
                        />
                      </td>

                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                        {dailyNet.toFixed(1)} hrs
                      </td>

                      {isHRManager && (
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemoveDay(idx)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ScheduleDetail;
