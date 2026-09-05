import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, Save, Sparkles } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/forms/FormField';
import { Input } from '../../components/forms/Input';
import { Select } from '../../components/forms/Select';
import { SectionError } from '../../components/ui/ErrorState';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const SCHEDULE_TYPES = [
  { value: 'Standard', label: 'Standard' },
  { value: 'Flexible', label: 'Flexible' },
  { value: 'Shift', label: 'Shift' },
  { value: 'Full-Time', label: 'Full-Time' },
  { value: 'Part-Time', label: 'Part-Time' },
];

const DEFAULT_WEEKLY_PATTERN = [
  { day: 'Monday', startTime: '09:00', endTime: '18:00', breakHours: 1 },
  { day: 'Tuesday', startTime: '09:00', endTime: '18:00', breakHours: 1 },
  { day: 'Wednesday', startTime: '09:00', endTime: '18:00', breakHours: 1 },
  { day: 'Thursday', startTime: '09:00', endTime: '18:00', breakHours: 1 },
  { day: 'Friday', startTime: '09:00', endTime: '18:00', breakHours: 1 },
];

function timeToMinutes(timeStr) {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

function calculateDailyHours(startTime, endTime, breakHours = 0) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (end <= start) return 0;
  const duration = (end - start) / 60;
  const net = duration - (Number(breakHours) || 0);
  return Math.max(0, Math.round(net * 100) / 100);
}

/**
 * Working Schedule Create & Edit Modal
 * Supports interactive weekly pattern builder, real-time hours computation, and dark theme.
 */
export function ScheduleModal({
  isOpen,
  onClose,
  schedule = null,
  onSubmit,
  isLoading = false,
  error = null,
}) {
  const isEditing = Boolean(schedule?._id || schedule?.id);

  const [name, setName] = useState('');
  const [type, setType] = useState('Standard');
  const [weeklyPattern, setWeeklyPattern] = useState([]);
  const [validationError, setValidationError] = useState('');

  // Initialize or reset form on open/schedule change
  useEffect(() => {
    if (schedule) {
      setName(schedule.name || '');
      setType(schedule.type || 'Standard');
      setWeeklyPattern(
        schedule.weeklyPattern && schedule.weeklyPattern.length > 0
          ? schedule.weeklyPattern.map((p) => ({
              day: p.day,
              startTime: p.startTime,
              endTime: p.endTime,
              breakHours: p.breakHours ?? 0,
            }))
          : DEFAULT_WEEKLY_PATTERN
      );
    } else {
      setName('');
      setType('Standard');
      setWeeklyPattern(DEFAULT_WEEKLY_PATTERN);
    }
    setValidationError('');
  }, [schedule, isOpen]);

  // Calculate total weekly hours in real-time
  const totalWeeklyHours = weeklyPattern.reduce((sum, item) => {
    return sum + calculateDailyHours(item.startTime, item.endTime, item.breakHours);
  }, 0);

  // Apply quick preset
  const applyPreset = (presetType) => {
    if (presetType === 'standard40') {
      setType('Standard');
      setWeeklyPattern([
        { day: 'Monday', startTime: '09:00', endTime: '18:00', breakHours: 1 },
        { day: 'Tuesday', startTime: '09:00', endTime: '18:00', breakHours: 1 },
        { day: 'Wednesday', startTime: '09:00', endTime: '18:00', breakHours: 1 },
        { day: 'Thursday', startTime: '09:00', endTime: '18:00', breakHours: 1 },
        { day: 'Friday', startTime: '09:00', endTime: '18:00', breakHours: 1 },
      ]);
    } else if (presetType === 'flexible35') {
      setType('Flexible');
      setWeeklyPattern([
        { day: 'Monday', startTime: '09:00', endTime: '17:00', breakHours: 1 },
        { day: 'Tuesday', startTime: '09:00', endTime: '17:00', breakHours: 1 },
        { day: 'Wednesday', startTime: '09:00', endTime: '17:00', breakHours: 1 },
        { day: 'Thursday', startTime: '09:00', endTime: '17:00', breakHours: 1 },
        { day: 'Friday', startTime: '09:00', endTime: '17:00', breakHours: 1 },
      ]);
    } else if (presetType === 'partTime20') {
      setType('Part-Time');
      setWeeklyPattern([
        { day: 'Monday', startTime: '09:00', endTime: '13:00', breakHours: 0 },
        { day: 'Wednesday', startTime: '09:00', endTime: '13:00', breakHours: 0 },
        { day: 'Friday', startTime: '09:00', endTime: '13:00', breakHours: 0 },
        { day: 'Saturday', startTime: '09:00', endTime: '17:00', breakHours: 0 },
      ]);
    }
  };

  const handleUpdateDay = (index, field, value) => {
    setWeeklyPattern((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setValidationError('');
  };

  const handleRemoveDay = (index) => {
    setWeeklyPattern((prev) => prev.filter((_, i) => i !== index));
    setValidationError('');
  };

  const handleAddDay = () => {
    const existingDays = new Set(weeklyPattern.map((p) => p.day));
    const availableDay = DAYS_OF_WEEK.find((d) => !existingDays.has(d)) || 'Monday';

    setWeeklyPattern((prev) => [
      ...prev,
      { day: availableDay, startTime: '09:00', endTime: '17:00', breakHours: 1 },
    ]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('Schedule name is required');
      return;
    }

    if (weeklyPattern.length === 0) {
      setValidationError('Weekly pattern must contain at least one day');
      return;
    }

    // Validate duplicate days
    const seen = new Set();
    for (const entry of weeklyPattern) {
      if (seen.has(entry.day)) {
        setValidationError(`Duplicate entry for day '${entry.day}' is not allowed`);
        return;
      }
      seen.add(entry.day);

      const start = timeToMinutes(entry.startTime);
      const end = timeToMinutes(entry.endTime);

      if (end <= start) {
        setValidationError(`End time must be after start time for ${entry.day}`);
        return;
      }

      const durationHours = (end - start) / 60;
      const breakNum = Number(entry.breakHours) || 0;

      if (breakNum < 0) {
        setValidationError(`Break hours cannot be negative for ${entry.day}`);
        return;
      }

      if (breakNum >= durationHours) {
        setValidationError(
          `Break hours (${breakNum}h) must be less than working duration (${durationHours}h) for ${entry.day}`
        );
        return;
      }
    }

    onSubmit({
      name: trimmedName,
      type,
      weeklyPattern: weeklyPattern.map((p) => ({
        day: p.day,
        startTime: p.startTime,
        endTime: p.endTime,
        breakHours: Number(p.breakHours) || 0,
      })),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Working Schedule' : 'Create Working Schedule'}
      description={
        isEditing
          ? 'Modify schedule parameters and daily pattern breakdown.'
          : 'Define working schedule and weekly operating hours.'
      }
      size="lg"
      className="!bg-slate-900 !border-slate-800 !text-slate-100 [&_h2]:!text-white [&_p]:!text-slate-400 [&_div]:!border-slate-800"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock size={14} className="text-blue-400" />
            <span>
              Calculated Total:{' '}
              <strong className="text-white font-mono">{totalWeeklyHours.toFixed(1)} hrs/week</strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="!text-slate-400 hover:!text-white hover:!bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={isLoading}
              onClick={handleSubmit}
              leftIcon={<Save size={16} />}
              className="!bg-blue-600 hover:!bg-blue-500"
            >
              {isEditing ? 'Save Changes' : 'Create Schedule'}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {(error || validationError) && (
          <SectionError
            title="Validation Error"
            message={validationError || (typeof error === 'string' ? error : error.message)}
            className="!bg-red-950/40 !border-red-800/60 !text-red-300"
          />
        )}

        {/* Basic Schedule Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Schedule Name"
            htmlFor="schedule-name-input"
            required
            className="[&_label]:!text-slate-300"
          >
            <Input
              id="schedule-name-input"
              name="name"
              placeholder="e.g. Standard 40 Hours"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="!bg-slate-800/80 !text-white !border-slate-700 focus:!border-blue-500 placeholder:!text-slate-500"
            />
          </FormField>

          <FormField
            label="Schedule Type"
            htmlFor="schedule-type-select"
            required
            className="[&_label]:!text-slate-300"
          >
            <Select
              id="schedule-type-select"
              name="type"
              options={SCHEDULE_TYPES}
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={isLoading}
              className="!bg-slate-800/80 !text-white !border-slate-700 focus:!border-blue-500"
            />
          </FormField>
        </div>

        {/* Presets Toolbar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Sparkles size={13} className="text-amber-400" /> Presets:
          </span>
          <button
            type="button"
            onClick={() => applyPreset('standard40')}
            className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            Standard 40h (Mon-Fri 9-6, 1h break)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('flexible35')}
            className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            Flexible 35h (Mon-Fri 9-5, 1h break)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('partTime20')}
            className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            Part-Time 20h
          </button>
        </div>

        {/* Weekly Pattern Table Editor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">Daily Pattern Configuration</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={handleAddDay}
              disabled={weeklyPattern.length >= 7 || isLoading}
              className="!border-slate-700 !text-slate-200 hover:!bg-slate-800 text-xs"
            >
              Add Day
            </Button>
          </div>

          <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/50">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-900 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <div className="col-span-3">Day</div>
              <div className="col-span-2">Start Time</div>
              <div className="col-span-2">End Time</div>
              <div className="col-span-2">Break (hrs)</div>
              <div className="col-span-2 text-right">Net Hours</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            <div className="divide-y divide-slate-800/80 max-h-64 overflow-y-auto">
              {weeklyPattern.map((item, idx) => {
                const dayNetHours = calculateDailyHours(item.startTime, item.endTime, item.breakHours);
                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-slate-900/40">
                    <div className="col-span-3">
                      <select
                        value={item.day}
                        onChange={(e) => handleUpdateDay(idx, 'day', e.target.value)}
                        className="w-full h-8 px-2 text-xs rounded bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {DAYS_OF_WEEK.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <input
                        type="time"
                        value={item.startTime}
                        onChange={(e) => handleUpdateDay(idx, 'startTime', e.target.value)}
                        required
                        className="w-full h-8 px-2 text-xs rounded bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="time"
                        value={item.endTime}
                        onChange={(e) => handleUpdateDay(idx, 'endTime', e.target.value)}
                        required
                        className="w-full h-8 px-2 text-xs rounded bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="col-span-2 flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={item.breakHours}
                        onChange={(e) => handleUpdateDay(idx, 'breakHours', e.target.value)}
                        className="w-full h-8 px-2 text-xs rounded bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    </div>

                    <div className="col-span-2 text-right font-mono text-xs font-semibold text-blue-400">
                      {dayNetHours} hrs
                    </div>

                    <div className="col-span-1 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveDay(idx)}
                        disabled={weeklyPattern.length <= 1}
                        title="Remove day"
                        className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default ScheduleModal;
