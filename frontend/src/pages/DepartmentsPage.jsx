import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ROLES } from '../utils/navigation';
import {
  getDepartmentsApi,
  createDepartmentApi,
  updateDepartmentApi,
  deleteDepartmentApi,
} from '../services/departments';

import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Table } from '../components/tables/Table';
import { TableRow } from '../components/tables/TableRow';
import { TableCell } from '../components/tables/TableCell';
import { EmptyState } from '../components/ui/EmptyState';
import { PageError, SectionError } from '../components/ui/ErrorState';
import { Modal } from '../components/ui/Modal';
import { DepartmentModal } from '../modules/departments/DepartmentModal';

/**
 * Format ISO date string into readable format
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
 * PeoplePay360 Departments Management Page
 * Supports Role-authorized CRUD operations, real backend APIs, and dark-mode styling.
 */
export function DepartmentsPage() {
  const { token, role } = useAuth();

  // Backend restricts POST, PUT, DELETE to Admin and HR Manager
  const canManage = [ROLES.ADMIN, ROLES.HR_MANAGER].includes(role);

  // Data states
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Delete confirmation states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Feedback notifications
  const [feedback, setFeedback] = useState(null);

  const fetchDepartments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const data = await getDepartmentsApi(token);
      setDepartments(data);
    } catch (err) {
      setError(err.message || 'Failed to load departments from server.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Clear feedback banner after 5 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Filter departments by search
  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  // Open Create Modal
  const handleOpenCreate = () => {
    setSelectedDept(null);
    setModalError(null);
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (dept) => {
    setSelectedDept(dept);
    setModalError(null);
    setModalOpen(true);
  };

  // Submit Create or Edit
  const handleSaveDepartment = async ({ name }) => {
    setModalLoading(true);
    setModalError(null);

    try {
      if (selectedDept) {
        await updateDepartmentApi(token, selectedDept._id, { name });
        setFeedback({ type: 'success', message: `Department '${name}' updated successfully.` });
      } else {
        await createDepartmentApi(token, { name });
        setFeedback({ type: 'success', message: `Department '${name}' created successfully.` });
      }

      setModalOpen(false);
      await fetchDepartments();
    } catch (err) {
      setModalError(err.message || 'Failed to save department.');
    } finally {
      setModalLoading(false);
    }
  };

  // Open Delete Confirm
  const handleOpenDelete = (dept) => {
    setDeptToDelete(dept);
    setDeleteError(null);
    setDeleteConfirmOpen(true);
  };

  // Execute Delete
  const handleConfirmDelete = async () => {
    if (!deptToDelete) return;
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await deleteDepartmentApi(token, deptToDelete._id);
      setFeedback({
        type: 'success',
        message: `Department '${deptToDelete.name}' deleted successfully.`,
      });
      setDeleteConfirmOpen(false);
      setDeptToDelete(null);
      await fetchDepartments();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete department.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Table column headers
  const columns = [
    { key: 'name', label: 'Department Name' },
    { key: 'createdAt', label: 'Created Date' },
    { key: 'updatedAt', label: 'Last Updated' },
    ...(canManage ? [{ key: 'actions', label: 'Actions', className: 'text-right' }] : []),
  ];

  return (
    <div className="space-y-6 text-slate-100">
      {/* Page Header */}
      <PageHeader
        title="Departments"
        description="Manage organizational departments and divisions"
        breadcrumbs={[{ label: 'HR Management' }, { label: 'Departments' }]}
        primaryAction={
          canManage && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={16} />}
              onClick={handleOpenCreate}
              className="!bg-blue-600 hover:!bg-blue-500 text-white"
            >
              Create Department
            </Button>
          )
        }
      />

      {/* Success Feedback Banner */}
      {feedback && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-sm animate-in fade-in">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Global Page Error */}
      {error && (
        <PageError
          title="Failed to Load Departments"
          message={error}
          onRetry={fetchDepartments}
          className="!bg-slate-900 !border-slate-800 [&_h3]:!text-white [&_p]:!text-slate-400"
        />
      )}

      {/* Search & Refresh Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-md bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
          onClick={fetchDepartments}
          disabled={loading}
          className="!border-slate-800 !text-slate-300 hover:!bg-slate-800 self-end sm:self-auto"
        >
          Refresh
        </Button>
      </div>

      {/* Departments Table */}
      <Table
        columns={columns}
        loading={loading}
        wrapperClassName="!bg-slate-900 !border-slate-800"
        className="[&_tbody]:!bg-slate-900 [&_tbody]:!divide-slate-800 [&_th]:!bg-slate-950 [&_th]:!text-slate-300 [&_th]:!border-slate-800 [&_td]:!text-slate-200 [&_td]:!border-slate-800"
        emptyState={
          <EmptyState
            icon={<Building2 size={24} />}
            title="No departments found"
            description={
              searchQuery
                ? `No departments matching '${searchQuery}'.`
                : 'No departments have been configured yet.'
            }
            action={
              canManage && !searchQuery ? (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus size={14} />}
                  onClick={handleOpenCreate}
                  className="!bg-blue-600 hover:!bg-blue-500 text-white mt-2"
                >
                  Create First Department
                </Button>
              ) : null
            }
          />
        }
      >
        {filteredDepartments.map((dept) => (
          <TableRow key={dept._id} className="hover:!bg-slate-800/50 transition-colors">
            <TableCell className="font-medium text-white flex items-center gap-2">
              <Building2 size={16} className="text-blue-400 shrink-0" />
              <span>{dept.name}</span>
            </TableCell>
            <TableCell className="text-slate-400">{formatDate(dept.createdAt)}</TableCell>
            <TableCell className="text-slate-400">{formatDate(dept.updatedAt)}</TableCell>
            {canManage && (
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(dept)}
                    title="Edit department"
                    className="!p-1.5 !text-slate-400 hover:!text-white hover:!bg-slate-800"
                  >
                    <Edit2 size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDelete(dept)}
                    title="Delete department"
                    className="!p-1.5 !text-slate-400 hover:!text-red-400 hover:!bg-slate-800"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </Table>

      {/* Create / Edit Department Modal */}
      <DepartmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        department={selectedDept}
        onSubmit={handleSaveDepartment}
        isLoading={modalLoading}
        error={modalError}
      />

      {/* Delete Confirmation Dialog */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteConfirmOpen(false);
            setDeptToDelete(null);
            setDeleteError(null);
          }
        }}
        title="Delete Department"
        description="Please confirm deletion of this department."
        size="sm"
        className="!bg-slate-900 !border-slate-800 !text-slate-100 [&_h2]:!text-white [&_p]:!text-slate-400 [&_div]:!border-slate-800"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setDeptToDelete(null);
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
              title="Cannot Delete Department"
              message={deleteError}
              className="!bg-red-950/40 !border-red-800/60 !text-red-300"
            />
          )}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white">{deptToDelete?.name}</strong>? This action cannot be
              undone.
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default DepartmentsPage;
