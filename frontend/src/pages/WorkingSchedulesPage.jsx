import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ROLES } from '../utils/navigation';
import {
  getWorkingSchedulesApi,
  createWorkingScheduleApi,
  updateWorkingScheduleApi,
  deleteWorkingScheduleApi,
} from '../services/schedules';

import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Table } from '../components/tables/Table';
import { TableRow } from '../components/tables/TableRow';
import { TableCell } from '../components/tables/TableCell';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { PageError, SectionError } from '../components/ui/ErrorState';
import { Modal } from '../components/ui/Modal';
import { ScheduleModal } from '../modules/schedules/ScheduleModal';
import { ScheduleDetailModal } from '../modules/schedules/ScheduleDetailModal';

const SCHEDULE_TYPES = ['All', 'Standard', 'Flexible', 'Shift', 'Full-Time', 'Part-Time'];

/**
 * Summarize weekly pattern into concise human-readable text
 */
function getPatternSummary(weeklyPattern) {
  if (!weeklyPattern || weeklyPattern.length === 0) return 'No pattern configured';
  const dayAbbrs = weeklyPattern.map((p) => p.day.slice(0, 3)).join(', ');
  const first = weeklyPattern[0];
  return `${weeklyPattern.length} days (${dayAbbrs}) · ${first.startTime}-${first.endTime}`;
}

/**
 * PeoplePay360 Working Schedules Management Page
 */
export function WorkingSchedulesPage() {
  const { token, role } = useAuth();

  // Backend restricts POST, PUT, DELETE to Admin and HR Manager
  const canManage = [ROLES.ADMIN, ROLES.HR_MANAGER].includes(role);

  // Data states
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Detail View modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [scheduleToView, setScheduleToView] = useState(null);

  // Delete Confirmation modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Feedback notifications
  const [feedback, setFeedback] = useState(null);

  const fetchSchedules = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const data = await getWorkingSchedulesApi(token);
      setSchedules(data);
    } catch (err) {
      setError(err.message || 'Failed to load working schedules.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Filter schedules by search and type
  const filteredSchedules = schedules.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    const matchesType = typeFilter === 'All' || s.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Open Create
  const handleOpenCreate = () => {
    setSelectedSchedule(null);
    setModalError(null);
    setEditModalOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (sched) => {
    setSelectedSchedule(sched);
    setModalError(null);
    setEditModalOpen(true);
  };

  // Open View Details
  const handleOpenDetail = (sched) => {
    setScheduleToView(sched);
    setDetailModalOpen(true);
  };

  // Save (Create or Edit)
  const handleSaveSchedule = async (scheduleData) => {
    setModalLoading(true);
    setModalError(null);

    try {
      if (selectedSchedule) {
        await updateWorkingScheduleApi(token, selectedSchedule._id, scheduleData);
        setFeedback({
          type: 'success',
          message: `Working schedule '${scheduleData.name}' updated successfully.`,
        });
      } else {
        await createWorkingScheduleApi(token, scheduleData);
        setFeedback({
          type: 'success',
          message: `Working schedule '${scheduleData.name}' created successfully.`,
        });
      }

      setEditModalOpen(false);
      await fetchSchedules();
    } catch (err) {
      setModalError(err.message || 'Failed to save working schedule.');
    } finally {
      setModalLoading(false);
    }
  };

  // Open Delete Confirm
  const handleOpenDelete = (sched) => {
    setScheduleToDelete(sched);
    setDeleteError(null);
    setDeleteConfirmOpen(true);
  };

  // Execute Delete
  const handleConfirmDelete = async () => {
    if (!scheduleToDelete) return;
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await deleteWorkingScheduleApi(token, scheduleToDelete._id);
      setFeedback({
        type: 'success',
        message: `Working schedule '${scheduleToDelete.name}' deleted successfully.`,
      });
      setDeleteConfirmOpen(false);
      setScheduleToDelete(null);
      await fetchSchedules();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete working schedule.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Columns definition
  const columns = [
    { key: 'name', label: 'Schedule Name' },
    { key: 'type', label: 'Type' },
    { key: 'weeklyHours', label: 'Weekly Hours' },
    { key: 'weeklyPattern', label: 'Weekly Pattern Summary' },
    { key: 'actions', label: 'Actions', className: 'text-right' },
  ];

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <PageHeader
        title="Working Schedules"
        description="Configure standard working hours, daily patterns, and operating schedules"
        breadcrumbs={[{ label: 'HR Management' }, { label: 'Working Schedules' }]}
        primaryAction={
          canManage && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={16} />}
              onClick={handleOpenCreate}
              className="!bg-blue-600 hover:!bg-blue-500 text-white"
            >
              Create Schedule
            </Button>
          )
        }
      />

      {/* Success Notification Banner */}
      {feedback && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-sm animate-in fade-in">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <PageError
          title="Failed to Load Working Schedules"
          message={error}
          onRetry={fetchSchedules}
          className="!bg-slate-900 !border-slate-800 [&_h3]:!text-white [&_p]:!text-slate-400"
        />
      )}

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search schedules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-md bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-40 h-9 px-3 rounded-md bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SCHEDULE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === 'All' ? 'All Types' : t}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
          onClick={fetchSchedules}
          disabled={loading}
          className="!border-slate-800 !text-slate-300 hover:!bg-slate-800 self-end sm:self-auto"
        >
          Refresh
        </Button>
      </div>

      {/* Schedules Table */}
      <Table
        columns={columns}
        loading={loading}
        wrapperClassName="!bg-slate-900 !border-slate-800"
        className="[&_tbody]:!bg-slate-900 [&_tbody]:!divide-slate-800 [&_th]:!bg-slate-950 [&_th]:!text-slate-300 [&_th]:!border-slate-800 [&_td]:!text-slate-200 [&_td]:!border-slate-800"
        emptyState={
          <EmptyState
            icon={<Briefcase size={24} />}
            title="No working schedules found"
            description={
              searchQuery || typeFilter !== 'All'
                ? 'No schedules match your filter criteria.'
                : 'No working schedules configured yet.'
            }
            action={
              canManage && !searchQuery && typeFilter === 'All' ? (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus size={14} />}
                  onClick={handleOpenCreate}
                  className="!bg-blue-600 hover:!bg-blue-500 text-white mt-2"
                >
                  Create First Schedule
                </Button>
              ) : null
            }
          />
        }
      >
        {filteredSchedules.map((sched) => (
          <TableRow key={sched._id} className="hover:!bg-slate-800/50 transition-colors">
            <TableCell className="font-medium text-white flex items-center gap-2">
              <Clock size={16} className="text-blue-400 shrink-0" />
              <span>{sched.name}</span>
            </TableCell>
            <TableCell>
              <StatusBadge status="neutral" label={sched.type || 'Standard'} />
            </TableCell>
            <TableCell className="font-mono text-white">
              <span className="font-semibold text-emerald-400">{sched.weeklyHours}</span> hrs/wk
            </TableCell>
            <TableCell className="text-slate-400 text-xs">
              {getPatternSummary(sched.weeklyPattern)}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenDetail(sched)}
                  title="View schedule details"
                  className="!p-1.5 !text-slate-400 hover:!text-white hover:!bg-slate-800"
                >
                  <Eye size={14} />
                </Button>
                {canManage && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(sched)}
                      title="Edit schedule"
                      className="!p-1.5 !text-slate-400 hover:!text-white hover:!bg-slate-800"
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDelete(sched)}
                      title="Delete schedule"
                      className="!p-1.5 !text-slate-400 hover:!text-red-400 hover:!bg-slate-800"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </Table>

      {/* Create / Edit Schedule Modal */}
      <ScheduleModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        schedule={selectedSchedule}
        onSubmit={handleSaveSchedule}
        isLoading={modalLoading}
        error={modalError}
      />

      {/* View Details Modal */}
      <ScheduleDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setScheduleToView(null);
        }}
        schedule={scheduleToView}
      />

      {/* Delete Confirmation Dialog */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteConfirmOpen(false);
            setScheduleToDelete(null);
            setDeleteError(null);
          }
        }}
        title="Delete Working Schedule"
        description="Please confirm deletion of this working schedule."
        size="sm"
        className="!bg-slate-900 !border-slate-800 !text-slate-100 [&_h2]:!text-white [&_p]:!text-slate-400 [&_div]:!border-slate-800"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setScheduleToDelete(null);
                setDeleteError(null);
              }}
              disabled={deleteLoading}
              className="!text-slate-400 hover:!text-white hover:!bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              loading={deleteLoading}
              disabled={deleteLoading}
              onClick={handleConfirmDelete}
              leftIcon={<Trash2 size={16} />}
              className="!bg-red-600 hover:!bg-red-500"
            >
              Confirm Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {deleteError && (
            <SectionError
              title="Cannot Delete Working Schedule"
              message={deleteError}
              className="!bg-red-950/40 !border-red-800/60 !text-red-300"
            />
          )}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white">{scheduleToDelete?.name}</strong>? This action cannot
              be undone.
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default WorkingSchedulesPage;
