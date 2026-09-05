import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sliders,
  Check,
  X,
  Trash2,
  Edit2,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ROLES } from '../utils/navigation';
import {
  getTimeOffTypesApi,
  createTimeOffTypeApi,
  updateTimeOffTypeApi,
  deleteTimeOffTypeApi,
  getTimeOffAllocationsApi,
  createTimeOffAllocationApi,
  approveTimeOffAllocationApi,
  getTimeOffRequestsApi,
  createTimeOffRequestApi,
  approveTimeOffRequestApi,
  refuseTimeOffRequestApi,
} from '../services/timeOff';
import { getEmployeesApi } from '../services/employees';

import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Table } from '../components/tables/Table';
import { TableRow } from '../components/tables/TableRow';
import { TableCell } from '../components/tables/TableCell';
import { EmptyState } from '../components/ui/EmptyState';
import { PageError } from '../components/ui/ErrorState';

import { TimeOffRequestModal } from '../modules/timeoff/TimeOffRequestModal';
import { TimeOffAllocationModal } from '../modules/timeoff/TimeOffAllocationModal';
import { TimeOffTypeModal } from '../modules/timeoff/TimeOffTypeModal';

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
 * PeoplePay360 Time Off Management Page
 * Multi-tab architecture handling Requests, Allocations, and Types with automated balance deduction on approval.
 */
export function TimeOffPage({ initialEmployeeFilter = null }) {
  const { user, role } = useAuth();

  const isEmployeeRole = role === ROLES.EMPLOYEE;
  const canManage = [ROLES.ADMIN, ROLES.HR_MANAGER].includes(role);

  // Active Tab: 'requests' | 'allocations' | 'types'
  const [activeTab, setActiveTab] = useState('requests');

  // Shared Data States
  const [employees, setEmployees] = useState([]);
  const [timeOffTypes, setTimeOffTypes] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [requests, setRequests] = useState([]);

  // Loading & Global States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(initialEmployeeFilter || '');
  const [statusFilter, setStatusFilter] = useState('all');

  // Request Modal State
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestModalLoading, setRequestModalLoading] = useState(false);
  const [requestModalError, setRequestModalError] = useState(null);

  // Allocation Modal State
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [allocationModalLoading, setAllocationModalLoading] = useState(false);
  const [allocationModalError, setAllocationModalError] = useState(null);

  // Type Modal State
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [selectedTypeForEdit, setSelectedTypeForEdit] = useState(null);
  const [typeModalLoading, setTypeModalLoading] = useState(false);
  const [typeModalError, setTypeModalError] = useState(null);

  // Action loading state (for approve / refuse buttons)
  const [processingActionId, setProcessingActionId] = useState(null);

  // 1. Fetch auxiliary reference data (Employees and Types)
  const fetchAuxiliaryData = useCallback(async () => {
    try {
      const types = await getTimeOffTypesApi();
      setTimeOffTypes(types);

      if (!isEmployeeRole) {
        const emps = await getEmployeesApi();
        setEmployees(emps);
      }
    } catch {
      // Handled in main fetch
    }
  }, [isEmployeeRole]);

  // 2. Fetch main tab data (Requests and Allocations)
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const requestParams = {};
      const allocationParams = {};

      if (selectedEmployeeId) {
        requestParams.employeeId = selectedEmployeeId;
        allocationParams.employeeId = selectedEmployeeId;
      }
      if (statusFilter !== 'all') {
        requestParams.status = statusFilter;
      }

      // Fetch Requests and Allocations concurrently
      const [reqData, allocData, typesData] = await Promise.all([
        getTimeOffRequestsApi(requestParams),
        getTimeOffAllocationsApi(allocationParams),
        getTimeOffTypesApi(),
      ]);

      setRequests(reqData);
      setAllocations(allocData);
      setTimeOffTypes(typesData);
    } catch (err) {
      setError(err.message || 'Failed to load time off data');
    } finally {
      setLoading(false);
    }
  }, [selectedEmployeeId, statusFilter]);

  useEffect(() => {
    fetchAuxiliaryData();
  }, [fetchAuxiliaryData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // -------------------------------------------------------------
  // ACTION HANDLERS
  // -------------------------------------------------------------

  // Submit Leave Request
  const handleCreateRequest = async (formData) => {
    try {
      setRequestModalLoading(true);
      setRequestModalError(null);
      await createTimeOffRequestApi(formData);
      setFeedback({
        type: 'success',
        message: 'Time off request submitted successfully and queued for review.',
      });
      setRequestModalOpen(false);
      await fetchData();
    } catch (err) {
      setRequestModalError(err.message || 'Failed to submit time off request.');
    } finally {
      setRequestModalLoading(false);
    }
  };

  // Approve Request (Backend deducts allocation balance automatically)
  const handleApproveRequest = async (request) => {
    try {
      setProcessingActionId(request._id);
      setFeedback(null);
      await approveTimeOffRequestApi(request._id);
      setFeedback({
        type: 'success',
        message: `Request for ${
          request.employeeId?.firstName || 'employee'
        } approved! Leave balance updated automatically.`,
      });
      // Refresh requests AND allocations to show new taken/remaining balance
      await fetchData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to approve time off request.',
      });
    } finally {
      setProcessingActionId(null);
    }
  };

  // Refuse Request
  const handleRefuseRequest = async (request) => {
    try {
      setProcessingActionId(request._id);
      setFeedback(null);
      await refuseTimeOffRequestApi(request._id);
      setFeedback({
        type: 'success',
        message: 'Request marked as Refused.',
      });
      await fetchData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to refuse time off request.',
      });
    } finally {
      setProcessingActionId(null);
    }
  };

  // Submit New Allocation
  const handleCreateAllocation = async (formData) => {
    try {
      setAllocationModalLoading(true);
      setAllocationModalError(null);
      await createTimeOffAllocationApi(formData);
      setFeedback({
        type: 'success',
        message: 'Time off allocation created successfully.',
      });
      setAllocationModalOpen(false);
      await fetchData();
    } catch (err) {
      setAllocationModalError(err.message || 'Failed to create allocation.');
    } finally {
      setAllocationModalLoading(false);
    }
  };

  // Approve Pending Allocation
  const handleApproveAllocation = async (allocationId) => {
    try {
      setProcessingActionId(allocationId);
      setFeedback(null);
      await approveTimeOffAllocationApi(allocationId);
      setFeedback({
        type: 'success',
        message: 'Allocation approved and balance is now available for requests.',
      });
      await fetchData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to approve allocation.',
      });
    } finally {
      setProcessingActionId(null);
    }
  };

  // Submit Time Off Type (Create or Edit)
  const handleSaveType = async (formData) => {
    try {
      setTypeModalLoading(true);
      setTypeModalError(null);
      if (selectedTypeForEdit) {
        await updateTimeOffTypeApi(selectedTypeForEdit._id, formData);
        setFeedback({
          type: 'success',
          message: 'Time off policy type updated successfully.',
        });
      } else {
        await createTimeOffTypeApi(formData);
        setFeedback({
          type: 'success',
          message: 'New time off policy type registered.',
        });
      }
      setTypeModalOpen(false);
      setSelectedTypeForEdit(null);
      await fetchData();
    } catch (err) {
      setTypeModalError(err.message || 'Failed to save time off type.');
    } finally {
      setTypeModalLoading(false);
    }
  };

  // Delete Time Off Type
  const handleDeleteType = async (typeId) => {
    if (!window.confirm('Are you sure you want to delete this policy type?')) return;
    try {
      setLoading(true);
      await deleteTimeOffTypeApi(typeId);
      setFeedback({
        type: 'success',
        message: 'Time off type removed successfully.',
      });
      await fetchData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to delete time off type.',
      });
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // TABLE COLUMNS
  // -------------------------------------------------------------

  const requestColumns = [
    ...(!isEmployeeRole ? [{ key: 'employee', label: 'Employee' }] : []),
    { key: 'type', label: 'Time Off Type' },
    { key: 'dates', label: 'Date Range' },
    { key: 'duration', label: 'Duration' },
    { key: 'status', label: 'Status' },
    ...(canManage ? [{ key: 'actions', label: 'Actions', className: 'text-right' }] : []),
  ];

  const allocationColumns = [
    ...(!isEmployeeRole ? [{ key: 'employee', label: 'Employee' }] : []),
    { key: 'type', label: 'Time Off Type' },
    { key: 'allocated', label: 'Allocated' },
    { key: 'taken', label: 'Taken' },
    { key: 'remaining', label: 'Remaining' },
    { key: 'validity', label: 'Validity Period' },
    { key: 'approvalStatus', label: 'Status' },
    ...(canManage ? [{ key: 'actions', label: 'Actions', className: 'text-right' }] : []),
  ];

  const typeColumns = [
    { key: 'name', label: 'Policy Name' },
    { key: 'unit', label: 'Unit' },
    { key: 'allocationRequired', label: 'Allocation Required' },
    { key: 'approvalRequired', label: 'Approval Required' },
    { key: 'payrollIntegration', label: 'Payroll Integration' },
    ...(canManage ? [{ key: 'actions', label: 'Actions', className: 'text-right' }] : []),
  ];

  return (
    <div className="space-y-6 text-slate-100">
      {/* Page Header */}
      <PageHeader
        title={isEmployeeRole ? 'My Time Off' : 'Time Off & Leave Management'}
        description={
          isEmployeeRole
            ? 'View your leave balances, submit vacation or sick leave requests, and track approvals.'
            : 'Manage organizational time off requests, allocations, leave balances, and policy types.'
        }
        breadcrumbs={[
          { label: isEmployeeRole ? 'Self-Service' : 'HR Management' },
          { label: 'Time Off' },
        ]}
        primaryAction={
          <div className="flex items-center gap-2">
            {canManage && activeTab === 'types' && (
              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus size={16} />}
                onClick={() => {
                  setSelectedTypeForEdit(null);
                  setTypeModalError(null);
                  setTypeModalOpen(true);
                }}
                className="!bg-blue-600 hover:!bg-blue-500 text-white"
              >
                Create Type
              </Button>
            )}

            {canManage && activeTab === 'allocations' && (
              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus size={16} />}
                onClick={() => {
                  setAllocationModalError(null);
                  setAllocationModalOpen(true);
                }}
                className="!bg-blue-600 hover:!bg-blue-500 text-white"
              >
                New Allocation
              </Button>
            )}

            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={16} />}
              onClick={() => {
                setRequestModalError(null);
                setRequestModalOpen(true);
              }}
              className="!bg-blue-600 hover:!bg-blue-500 text-white"
            >
              Request Time Off
            </Button>
          </div>
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

      {/* Global Page Error */}
      {error && (
        <PageError
          title="Failed to Load Time Off Records"
          message={error}
          onRetry={fetchData}
          className="!bg-slate-900 !border-slate-800 [&_h3]:!text-white [&_p]:!text-slate-400"
        />
      )}

      {/* Leave Balances Summary Cards (Visible for Employee and in Requests tab) */}
      {(isEmployeeRole || selectedEmployeeId) && allocations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs uppercase font-mono tracking-wider text-slate-400 flex items-center gap-2">
            <Calendar size={14} className="text-blue-400" />
            <span>Available Leave Entitlements & Balances</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allocations
              .filter((a) => a.approvalStatus === 'Approved')
              .map((alloc) => {
                const type = alloc.timeOffTypeId || {};
                const typeName = typeof type === 'object' ? type.name : 'Leave';
                const unit = typeof type === 'object' ? type.unit : 'Days';

                return (
                  <div
                    key={alloc._id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-100 text-sm">{typeName}</span>
                      <span className="text-[11px] font-mono text-slate-400">
                        Valid thru {formatDate(alloc.validTo)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800/60">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                          Allocated
                        </span>
                        <span className="font-mono text-sm font-medium text-slate-300">
                          {alloc.allocatedAmount} {unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                          Taken
                        </span>
                        <span className="font-mono text-sm font-medium text-amber-400">
                          {alloc.takenAmount} {unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                          Remaining
                        </span>
                        <span className="font-mono text-base font-bold text-emerald-400">
                          {alloc.remainingAmount} {unit}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'requests'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar size={16} />
          <span>Leave Requests</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300 font-mono">
            {requests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('allocations')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'allocations'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers size={16} />
          <span>Allocations</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300 font-mono">
            {allocations.length}
          </span>
        </button>

        {!isEmployeeRole && (
          <button
            onClick={() => setActiveTab('types')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'types'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders size={16} />
            <span>Policy Types</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300 font-mono">
              {timeOffTypes.length}
            </span>
          </button>
        )}
      </div>

      {/* Filter Toolbar for Requests and Allocations */}
      {!isEmployeeRole && (activeTab === 'requests' || activeTab === 'allocations') && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-64">
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full h-8 px-3 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp._id || emp.id} value={emp._id || emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>

            {activeTab === 'requests' && (
              <div className="w-40">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-8 px-3 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Refused">Refused</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(selectedEmployeeId || statusFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedEmployeeId('');
                  setStatusFilter('all');
                }}
                className="!border-slate-800 !text-slate-400 hover:!bg-slate-800 text-xs"
              >
                Reset
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={12} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchData}
              disabled={loading}
              className="!border-slate-800 !text-slate-300 hover:!bg-slate-800 text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 1. REQUESTS */}
      {activeTab === 'requests' && (
        <>
          {loading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
              <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-blue-500" />
              <p className="text-sm">Loading leave requests from database...</p>
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={<Calendar size={36} className="text-slate-500" />}
              title="No Time Off Requests"
              message={
                isEmployeeRole
                  ? 'You have not submitted any leave requests yet.'
                  : 'No time off requests found for the selected criteria.'
              }
              action={
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus size={15} />}
                  onClick={() => setRequestModalOpen(true)}
                  className="!bg-blue-600 hover:!bg-blue-500 text-white"
                >
                  Submit First Request
                </Button>
              }
            />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <Table columns={requestColumns}>
                {requests.map((req) => {
                  const emp = req.employeeId || {};
                  const empName =
                    typeof emp === 'object' && emp.firstName
                      ? `${emp.firstName} ${emp.lastName}`
                      : 'Employee';
                  const empCode = typeof emp === 'object' ? emp.employeeCode : '—';

                  const type = req.timeOffTypeId || {};
                  const typeName = typeof type === 'object' ? type.name : 'Time Off';
                  const unit = typeof type === 'object' ? type.unit : 'Days';

                  const isPending = req.status === 'Pending';
                  const isProcessing = processingActionId === req._id;

                  return (
                    <TableRow key={req._id} className="hover:bg-slate-800/50 transition-colors border-b border-slate-800/60">
                      {!isEmployeeRole && (
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-500/30">
                              {empName.charAt(0)}
                            </div>
                            <div>
                              <span className="font-medium text-slate-100 block text-sm">{empName}</span>
                              <span className="text-xs text-slate-500 font-mono">{empCode}</span>
                            </div>
                          </div>
                        </TableCell>
                      )}

                      <TableCell className="font-medium text-slate-200 text-sm">
                        {typeName}
                      </TableCell>

                      <TableCell className="text-slate-300 text-sm whitespace-nowrap">
                        {formatDate(req.startDate)} → {formatDate(req.endDate)}
                      </TableCell>

                      <TableCell className="font-mono text-sm font-semibold text-blue-400">
                        {req.duration} {unit}
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={req.status || 'Pending'} />
                      </TableCell>

                      {canManage && (
                        <TableCell className="text-right whitespace-nowrap">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                leftIcon={<Check size={14} />}
                                onClick={() => handleApproveRequest(req)}
                                loading={isProcessing}
                                disabled={isProcessing}
                                className="!bg-emerald-600 hover:!bg-emerald-500 text-white !py-1 !px-2.5 !text-xs font-medium"
                              >
                                Approve
                              </Button>

                              <Button
                                variant="destructive"
                                size="sm"
                                leftIcon={<X size={14} />}
                                onClick={() => handleRefuseRequest(req)}
                                loading={isProcessing}
                                disabled={isProcessing}
                                className="!bg-red-600 hover:!bg-red-500 text-white !py-1 !px-2.5 !text-xs font-medium"
                              >
                                Refuse
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Reviewed</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </Table>
            </div>
          )}
        </>
      )}

      {/* TAB CONTENT: 2. ALLOCATIONS */}
      {activeTab === 'allocations' && (
        <>
          {loading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
              <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-blue-500" />
              <p className="text-sm">Loading allocations from database...</p>
            </div>
          ) : allocations.length === 0 ? (
            <EmptyState
              icon={<Layers size={36} className="text-slate-500" />}
              title="No Leave Allocations"
              message="No allocations have been configured for the selected workforce scope."
              action={
                canManage ? (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus size={15} />}
                    onClick={() => setAllocationModalOpen(true)}
                    className="!bg-blue-600 hover:!bg-blue-500 text-white"
                  >
                    Allocate Leave Entitlement
                  </Button>
                ) : null
              }
            />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <Table columns={allocationColumns}>
                {allocations.map((alloc) => {
                  const emp = alloc.employeeId || {};
                  const empName =
                    typeof emp === 'object' && emp.firstName
                      ? `${emp.firstName} ${emp.lastName}`
                      : 'Employee';
                  const empCode = typeof emp === 'object' ? emp.employeeCode : '—';

                  const type = alloc.timeOffTypeId || {};
                  const typeName = typeof type === 'object' ? type.name : 'Time Off';
                  const unit = typeof type === 'object' ? type.unit : 'Days';

                  const isPending = alloc.approvalStatus === 'Pending';
                  const isProcessing = processingActionId === alloc._id;

                  return (
                    <TableRow key={alloc._id} className="hover:bg-slate-800/50 transition-colors border-b border-slate-800/60">
                      {!isEmployeeRole && (
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-500/30">
                              {empName.charAt(0)}
                            </div>
                            <div>
                              <span className="font-medium text-slate-100 block text-sm">{empName}</span>
                              <span className="text-xs text-slate-500 font-mono">{empCode}</span>
                            </div>
                          </div>
                        </TableCell>
                      )}

                      <TableCell className="font-medium text-slate-200 text-sm">
                        {typeName}
                      </TableCell>

                      <TableCell className="font-mono text-sm text-slate-300">
                        {alloc.allocatedAmount} {unit}
                      </TableCell>

                      <TableCell className="font-mono text-sm text-amber-400 font-medium">
                        {alloc.takenAmount} {unit}
                      </TableCell>

                      <TableCell className="font-mono text-sm font-bold text-emerald-400">
                        {alloc.remainingAmount} {unit}
                      </TableCell>

                      <TableCell className="text-slate-300 text-xs whitespace-nowrap">
                        {formatDate(alloc.validFrom)} → {formatDate(alloc.validTo)}
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={alloc.approvalStatus || 'Pending'} />
                      </TableCell>

                      {canManage && (
                        <TableCell className="text-right whitespace-nowrap">
                          {isPending ? (
                            <Button
                              variant="primary"
                              size="sm"
                              leftIcon={<Check size={14} />}
                              onClick={() => handleApproveAllocation(alloc._id)}
                              loading={isProcessing}
                              disabled={isProcessing}
                              className="!bg-emerald-600 hover:!bg-emerald-500 text-white !py-1 !px-2.5 !text-xs font-medium"
                            >
                              Approve
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Active</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </Table>
            </div>
          )}
        </>
      )}

      {/* TAB CONTENT: 3. POLICY TYPES */}
      {activeTab === 'types' && !isEmployeeRole && (
        <>
          {loading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
              <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-blue-500" />
              <p className="text-sm">Loading policy types...</p>
            </div>
          ) : timeOffTypes.length === 0 ? (
            <EmptyState
              icon={<Sliders size={36} className="text-slate-500" />}
              title="No Policy Types Defined"
              message="Create time off types (e.g. Vacation, Sick Leave) to establish leave policies."
              action={
                canManage ? (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus size={15} />}
                    onClick={() => {
                      setSelectedTypeForEdit(null);
                      setTypeModalOpen(true);
                    }}
                    className="!bg-blue-600 hover:!bg-blue-500 text-white"
                  >
                    Create Policy Type
                  </Button>
                ) : null
              }
            />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <Table columns={typeColumns}>
                {timeOffTypes.map((t) => (
                  <TableRow key={t._id} className="hover:bg-slate-800/50 transition-colors border-b border-slate-800/60">
                    <TableCell className="font-semibold text-slate-100 text-sm">
                      {t.name}
                    </TableCell>

                    <TableCell className="font-mono text-xs text-blue-400 uppercase tracking-wider">
                      {t.unit}
                    </TableCell>

                    <TableCell>
                      {t.allocationRequired ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-950/60 border border-blue-800 text-blue-300">
                          Yes
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">No</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {t.approvalRequired ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-950/60 border border-emerald-800 text-emerald-300">
                          Yes
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">No</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {t.payrollIntegration ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-950/60 border border-purple-800 text-purple-300">
                          Enabled
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">Disabled</span>
                      )}
                    </TableCell>

                    {canManage && (
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedTypeForEdit(t);
                              setTypeModalError(null);
                              setTypeModalOpen(true);
                            }}
                            className="p-1.5 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                            title="Edit Policy"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteType(t._id)}
                            className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                            title="Delete Policy"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </Table>
            </div>
          )}
        </>
      )}

      {/* Leave Request Modal */}
      <TimeOffRequestModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        onSubmit={handleCreateRequest}
        employees={employees}
        timeOffTypes={timeOffTypes}
        isEmployeeRole={isEmployeeRole}
        currentUserEmployeeId={user?.employeeId}
        loading={requestModalLoading}
        apiError={requestModalError}
      />

      {/* Allocation Modal */}
      <TimeOffAllocationModal
        isOpen={allocationModalOpen}
        onClose={() => setAllocationModalOpen(false)}
        onSubmit={handleCreateAllocation}
        employees={employees}
        timeOffTypes={timeOffTypes}
        loading={allocationModalLoading}
        apiError={allocationModalError}
      />

      {/* Time Off Type Modal */}
      <TimeOffTypeModal
        isOpen={typeModalOpen}
        onClose={() => {
          setTypeModalOpen(false);
          setSelectedTypeForEdit(null);
        }}
        onSubmit={handleSaveType}
        initialData={selectedTypeForEdit}
        loading={typeModalLoading}
        apiError={typeModalError}
      />
    </div>
  );
}

export default TimeOffPage;
