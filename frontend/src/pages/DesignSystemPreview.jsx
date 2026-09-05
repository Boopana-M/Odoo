import React, { useState } from 'react';
import {
  Plus,
  Filter,
  Download,
  Trash2,
  Edit2,
  CheckCircle,
  User,
  Mail,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/LoadingState';
import { SectionError, InlineError } from '../components/ui/ErrorState';

import { FormField } from '../components/forms/FormField';
import { Input } from '../components/forms/Input';
import { Select } from '../components/forms/Select';
import { DateInput } from '../components/forms/DateInput';
import { Textarea } from '../components/forms/Textarea';
import { Checkbox } from '../components/forms/Checkbox';
import { Radio } from '../components/forms/Radio';

import { Table } from '../components/tables/Table';
import { TableRow } from '../components/tables/TableRow';
import { TableCell } from '../components/tables/TableCell';
import { StatusCell } from '../components/tables/StatusCell';
import { ActionCell } from '../components/tables/ActionCell';

/**
 * Design System Demo / Preview Page with Tailwind CSS
 * Demonstrates all reusable Phase 1 components with static example data
 */
export function DesignSystemPreview() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(1);
  const [tableState, setTableState] = useState('normal'); // 'normal' | 'loading' | 'empty' | 'error'

  // Sample static table rows for preview
  const sampleTableData = [
    {
      id: 1,
      code: 'EMP-001',
      name: 'Sarah Connor',
      department: 'Engineering',
      role: 'Software Architect',
      status: 'Active',
      startDate: '2024-01-15',
    },
    {
      id: 2,
      code: 'EMP-002',
      name: 'John Doe',
      department: 'Human Resources',
      role: 'HR Specialist',
      status: 'Pending',
      startDate: '2024-03-01',
    },
    {
      id: 3,
      code: 'EMP-003',
      name: 'Jane Smith',
      department: 'Finance',
      role: 'Payroll Accountant',
      status: 'Approved',
      startDate: '2023-11-10',
    },
    {
      id: 4,
      code: 'EMP-004',
      name: 'Michael Brown',
      department: 'Operations',
      role: 'Operations Lead',
      status: 'Inactive',
      startDate: '2022-05-20',
    },
    {
      id: 5,
      code: 'EMP-005',
      name: 'Emily Davis',
      department: 'Marketing',
      role: 'Content Strategist',
      status: 'Draft',
      startDate: '2024-04-12',
    },
  ];

  const tableColumns = [
    { label: 'Code', width: '100px' },
    { label: 'Employee Name' },
    { label: 'Department' },
    { label: 'Job Role' },
    { label: 'Status', width: '120px' },
    { label: 'Start Date', width: '120px' },
    { label: 'Actions', width: '100px', align: 'right' },
  ];

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* 1. Page Header Component */}
      <PageHeader
        title="UI Design System & Component Library"
        description="Foundation design tokens, layout shell, and atomic UI components for PeoplePay360 HR & Payroll."
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Design System' },
          { label: 'Component Catalog' },
        ]}
        secondaryAction={
          <Button
            variant="outline"
            leftIcon={<Filter size={15} />}
            onClick={() => {}}
          >
            Filter Tokens
          </Button>
        }
        primaryAction={
          <Button
            variant="primary"
            leftIcon={<Plus size={15} />}
            onClick={() => setModalOpen(true)}
          >
            Open Modal Demo
          </Button>
        }
      />

      {/* 2. Design Tokens: Colors & Typography */}
      <section className="flex flex-col gap-4">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-lg font-semibold text-slate-900">1. Design Tokens & Palette</h2>
          <p className="text-xs text-slate-500 mt-0.5">Standardized colors, enterprise neutral shades, and semantic status colors.</p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Brand & Neutrals</span>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1 w-[90px]">
              <div className="w-full h-11 rounded-md border border-slate-200 bg-slate-900" />
              <span className="text-[11px] font-medium text-slate-700">Slate 900</span>
              <span className="text-[10px] text-slate-400">#0f172a</span>
            </div>
            <div className="flex flex-col gap-1 w-[90px]">
              <div className="w-full h-11 rounded-md border border-slate-200 bg-slate-800" />
              <span className="text-[11px] font-medium text-slate-700">Slate 800</span>
              <span className="text-[10px] text-slate-400">#1e293b</span>
            </div>
            <div className="flex flex-col gap-1 w-[90px]">
              <div className="w-full h-11 rounded-md border border-slate-200 bg-blue-600" />
              <span className="text-[11px] font-medium text-slate-700">Blue 600</span>
              <span className="text-[10px] text-slate-400">#2563eb</span>
            </div>
            <div className="flex flex-col gap-1 w-[90px]">
              <div className="w-full h-11 rounded-md border border-slate-200 bg-slate-500" />
              <span className="text-[11px] font-medium text-slate-700">Slate 500</span>
              <span className="text-[10px] text-slate-400">#64748b</span>
            </div>
            <div className="flex flex-col gap-1 w-[90px]">
              <div className="w-full h-11 rounded-md border border-slate-200 bg-slate-100" />
              <span className="text-[11px] font-medium text-slate-700">Slate 100</span>
              <span className="text-[10px] text-slate-400">#f1f5f9</span>
            </div>
            <div className="flex flex-col gap-1 w-[90px]">
              <div className="w-full h-11 rounded-md border border-slate-200 bg-white" />
              <span className="text-[11px] font-medium text-slate-700">White</span>
              <span className="text-[10px] text-slate-400">#ffffff</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Semantic Status Badges</span>
          <div className="flex items-center flex-wrap gap-3">
            <StatusBadge status="Active" />
            <StatusBadge status="Inactive" />
            <StatusBadge status="Pending" />
            <StatusBadge status="Approved" />
            <StatusBadge status="Refused" />
            <StatusBadge status="Draft" />
            <StatusBadge status="Paid" />
          </div>
        </div>
      </section>

      {/* 3. Button System */}
      <section className="flex flex-col gap-4">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-lg font-semibold text-slate-900">2. Button System</h2>
          <p className="text-xs text-slate-500 mt-0.5">Primary, secondary, outline, destructive, ghost variants across sm, md, lg sizes and loading states.</p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Button Variants</span>
          <div className="flex items-center flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Button Sizes</span>
          <div className="flex items-center flex-wrap gap-3">
            <Button variant="primary" size="sm">Small (32px)</Button>
            <Button variant="primary" size="md">Medium (38px)</Button>
            <Button variant="primary" size="lg">Large (44px)</Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Button States & Icons</span>
          <div className="flex items-center flex-wrap gap-3">
            <Button variant="primary" leftIcon={<Plus size={15} />}>With Left Icon</Button>
            <Button variant="outline" rightIcon={<Download size={15} />}>With Right Icon</Button>
            <Button variant="primary" loading>Loading State</Button>
            <Button variant="primary" disabled>Disabled State</Button>
            <Button variant="destructive" leftIcon={<Trash2 size={15} />}>Delete Record</Button>
          </div>
        </div>
      </section>

      {/* 4. Form Components */}
      <section className="flex flex-col gap-4">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-lg font-semibold text-slate-900">3. Form Components</h2>
          <p className="text-xs text-slate-500 mt-0.5">Accessible inputs, selects, date pickers, textareas, checkboxes, and radio buttons with validation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card title="Text & Number Inputs" description="Standard inputs with icons, helper text, and error states">
            <FormField label="Full Name" htmlFor="demo-name" required helperText="Enter first and last name.">
              <Input id="demo-name" placeholder="e.g. John Doe" leftIcon={<User size={16} />} />
            </FormField>

            <FormField label="Work Email" htmlFor="demo-email" required>
              <Input id="demo-email" type="email" placeholder="john.doe@company.com" leftIcon={<Mail size={16} />} />
            </FormField>

            <FormField label="Invalid Field Example" htmlFor="demo-error" error="This field is required and cannot be empty.">
              <Input id="demo-error" defaultValue="" error placeholder="Enter value..." />
            </FormField>
          </Card>

          <Card title="Select & Date Pickers" description="Dropdowns and formatted date controls">
            <FormField label="Department" htmlFor="demo-dept" required>
              <Select
                id="demo-dept"
                placeholder="Select a department"
                options={[
                  { value: 'eng', label: 'Engineering' },
                  { value: 'hr', label: 'Human Resources' },
                  { value: 'fin', label: 'Finance & Accounting' },
                  { value: 'ops', label: 'Operations' },
                ]}
              />
            </FormField>

            <FormField label="Effective Date" htmlFor="demo-date" optional helperText="Date when changes take effect">
              <DateInput id="demo-date" />
            </FormField>

            <FormField label="Disabled Select" htmlFor="demo-disabled-select">
              <Select
                id="demo-disabled-select"
                disabled
                defaultValue="hr"
                options={[{ value: 'hr', label: 'Human Resources (Locked)' }]}
              />
            </FormField>
          </Card>

          <Card title="Textarea & Checkboxes / Radios" description="Multi-line comments, switches, and selection groups">
            <FormField label="Notes / Comments" htmlFor="demo-notes" optional>
              <Textarea id="demo-notes" placeholder="Add optional remarks..." rows={3} />
            </FormField>

            <div className="flex flex-col gap-3 mt-2">
              <span className="text-sm font-medium text-slate-900">System Permissions</span>
              <Checkbox id="chk-1" label="Grant HR Administrator Access" description="Allows managing all employee records and schedules" defaultChecked />
              <Checkbox id="chk-2" label="Send automatic notifications" description="Email notifications on approval requests" />
              <Checkbox id="chk-3" label="Restricted Option" disabled description="Disabled option in current role" />
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <span className="text-sm font-medium text-slate-900">Contract Type</span>
              <div className="flex items-center flex-wrap gap-3">
                <Radio id="rad-1" name="contract-type" value="permanent" label="Permanent" defaultChecked />
                <Radio id="rad-2" name="contract-type" value="contract" label="Fixed Term" />
                <Radio id="rad-3" name="contract-type" value="intern" label="Internship" />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 5. Table System */}
      <section className="flex flex-col gap-4">
        <div className="border-b border-slate-200 pb-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">4. Table System</h2>
              <p className="text-xs text-slate-500 mt-0.5">Interactive data table with normal, hover, selected row, loading skeleton, empty, and error states.</p>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              <Button
                size="sm"
                variant={tableState === 'normal' ? 'primary' : 'outline'}
                onClick={() => setTableState('normal')}
              >
                Normal State
              </Button>
              <Button
                size="sm"
                variant={tableState === 'loading' ? 'primary' : 'outline'}
                onClick={() => setTableState('loading')}
              >
                Loading State
              </Button>
              <Button
                size="sm"
                variant={tableState === 'empty' ? 'primary' : 'outline'}
                onClick={() => setTableState('empty')}
              >
                Empty State
              </Button>
              <Button
                size="sm"
                variant={tableState === 'error' ? 'primary' : 'outline'}
                onClick={() => setTableState('error')}
              >
                Error State
              </Button>
            </div>
          </div>
        </div>

        <Table
          columns={tableColumns}
          loading={tableState === 'loading'}
          error={tableState === 'error' ? 'Unable to retrieve employee records from the server.' : null}
          onRetry={() => setTableState('normal')}
          footer={
            <>
              <span>Showing 5 of 5 preview records</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" disabled>Previous</Button>
                <Button size="sm" variant="outline" disabled>Next</Button>
              </div>
            </>
          }
        >
          {tableState === 'empty' ? null : (
            sampleTableData.map((row) => (
              <TableRow
                key={row.id}
                selected={selectedRowId === row.id}
                onClick={() => setSelectedRowId(row.id)}
              >
                <TableCell className="font-semibold text-blue-600">
                  {row.code}
                </TableCell>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.department}</TableCell>
                <TableCell>{row.role}</TableCell>
                <StatusCell status={row.status} />
                <TableCell>{row.startDate}</TableCell>
                <ActionCell>
                  <Button variant="ghost" size="sm" aria-label="Edit item">
                    <Edit2 size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" aria-label="Delete item">
                    <Trash2 size={14} className="text-red-600" />
                  </Button>
                </ActionCell>
              </TableRow>
            ))
          )}
        </Table>
      </section>

      {/* 6. Card Components */}
      <section className="flex flex-col gap-4">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-lg font-semibold text-slate-900">5. Card System</h2>
          <p className="text-xs text-slate-500 mt-0.5">Clean and compact enterprise cards for summary panels, forms, and detail views.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            title="Department Overview"
            description="Engineering & Technical Services"
            action={<StatusBadge status="Active" />}
            footer={
              <>
                <span>12 Active Employees</span>
                <Button size="sm" variant="ghost">View Details</Button>
              </>
            }
          >
            <p className="text-sm text-slate-600">
              Primary software engineering and systems development department for enterprise HR and operations.
            </p>
          </Card>

          <Card
            title="Working Schedule Policy"
            description="Standard 40-hour work week"
            action={<Button size="sm" variant="outline">Edit Policy</Button>}
            footer={<span>Assigned to 48 contracts</span>}
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Working Days:</span>
                <span className="font-medium text-slate-900">Monday – Friday</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Standard Hours:</span>
                <span className="font-medium text-slate-900">09:00 – 17:00</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 7. Loading, Error, & Empty States */}
      <section className="flex flex-col gap-4">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-lg font-semibold text-slate-900">6. States (Loading, Error, & Empty)</h2>
          <p className="text-xs text-slate-500 mt-0.5">Standardized feedback patterns for async network states, loading indicators, and alerts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card title="Section Error Banner" description="Used inside cards or above forms on failure">
            <SectionError
              title="Failed to synchronize record"
              message="The request could not be completed. Check connection parameters."
              onRetry={() => {}}
            />
            <InlineError message="Password must contain at least 8 characters." />
          </Card>

          <Card title="Empty State Component" description="Professional no-data fallback">
            <EmptyState
              title="No time off requests"
              description="There are currently no pending or historical time off requests for this period."
              action={
                <Button size="sm" variant="outline" leftIcon={<Plus size={14} />}>
                  Create Request
                </Button>
              }
            />
          </Card>

          <Card title="Loading Skeletons" description="Placeholder shapes during data fetching">
            <CardSkeleton />
          </Card>
        </div>
      </section>

      {/* Interactive Modal Component Demo */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Record Dialog"
        description="Fill in the required information below to configure the reusable modal component."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => setModalOpen(false)}
              leftIcon={<CheckCircle size={15} />}
            >
              Confirm Action
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FormField label="Record Name" htmlFor="modal-name" required>
            <Input id="modal-name" placeholder="Enter title or name" />
          </FormField>
          <FormField label="Category / Type" htmlFor="modal-cat">
            <Select
              id="modal-cat"
              placeholder="Select category"
              options={[
                { value: '1', label: 'HR Management' },
                { value: '2', label: 'Payroll & Compensation' },
              ]}
            />
          </FormField>
          <FormField label="Description" htmlFor="modal-desc" optional>
            <Textarea id="modal-desc" placeholder="Enter additional details..." rows={3} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}

export default DesignSystemPreview;
