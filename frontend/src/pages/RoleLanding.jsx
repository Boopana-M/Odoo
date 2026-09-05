import React, { useState } from 'react';
import { Shield, CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { getRoleSummary } from '../utils/navigation';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { DesignSystemPreview } from './DesignSystemPreview';

/**
 * Role-Based Application Landing & Navigation Placeholder
 * Displays active role permissions and architectural readiness without fake business screens.
 */
export function RoleLanding({ activeNavItem }) {
  const { user } = useAuth();
  const [showDesignSystem, setShowDesignSystem] = useState(false);

  const roleSummary = getRoleSummary(user?.role);

  if (showDesignSystem) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">Design System Preview</h2>
            <p className="text-sm text-slate-400">Phase 1 Foundation Components Reference</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDesignSystem(false)}
            className="!border-slate-700 !text-slate-200 hover:!bg-slate-800"
          >
            Back to Active View
          </Button>
        </div>
        <DesignSystemPreview />
      </div>
    );
  }

  // Format module title from activeNavItem id
  const moduleTitle = activeNavItem
    ? activeNavItem
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'Overview';

  return (
    <div className="space-y-6 text-slate-100">
      {/* Welcome & Role Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
              <Shield size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Welcome, {user?.name || 'User'}
                </h1>
                <StatusBadge status="active" label={user?.role || 'Authenticated'} />
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Authenticated session via Bearer JWT · Role Level:{' '}
                <span className="text-slate-200 font-medium">{roleSummary.level}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Sparkles size={14} />}
              onClick={() => setShowDesignSystem(true)}
              className="!border-slate-700 !text-slate-200 hover:!bg-slate-800"
            >
              Design System
            </Button>
          </div>
        </div>
      </div>

      {/* Active Navigation Context & Role Guard Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Module Status Card */}
        <Card
          title={`${moduleTitle} Module`}
          description="Role-based navigation target"
          className="!bg-slate-900 !border-slate-800 !text-slate-100 [&_h3]:!text-white [&_p]:!text-slate-400 [&_div]:!border-slate-800"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-3">
              <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 space-y-1">
                <p className="font-semibold text-slate-200">
                  Navigation Target: <span className="text-blue-400 font-mono">{activeNavItem}</span>
                </p>
                <p>
                  This navigation item is permitted for your current role (
                  <span className="font-medium text-white">{user?.role}</span>).
                </p>
                <p className="text-slate-400">
                  Business data operations for this module are scheduled for subsequent phases. No fake data or mock APIs are created in Phase 2.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 text-xs text-slate-400">
              <span className="font-medium text-slate-300">Active User ID:</span>{' '}
              <span className="font-mono text-slate-400">{user?._id || user?.id || '—'}</span>
            </div>
          </div>
        </Card>

        {/* Role Permissions Architecture Card */}
        <Card
          title="Role Permissions Architecture"
          description={roleSummary.description}
          className="!bg-slate-900 !border-slate-800 !text-slate-100 [&_h3]:!text-white [&_p]:!text-slate-400 [&_div]:!border-slate-800"
        >
          <ul className="space-y-2.5 text-xs">
            <li className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              <span>
                <strong>HR Access:</strong> Permitted for role-authorized modules
              </span>
            </li>
            <li className="flex items-center gap-2 text-slate-300">
              {roleSummary.hasPayrollAccess ? (
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle size={15} className="text-slate-500 shrink-0" />
              )}
              <span className={roleSummary.hasPayrollAccess ? 'text-slate-200' : 'text-slate-500'}>
                <strong>Payroll Navigation:</strong>{' '}
                {roleSummary.hasPayrollAccess ? 'Prepared for Payroll role' : 'Restricted (No Payroll Access)'}
              </span>
            </li>
            <li className="flex items-center gap-2 text-slate-300">
              {roleSummary.hasAdminAccess ? (
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle size={15} className="text-slate-500 shrink-0" />
              )}
              <span className={roleSummary.hasAdminAccess ? 'text-slate-200' : 'text-slate-500'}>
                <strong>System Administration:</strong>{' '}
                {roleSummary.hasAdminAccess ? 'Full System Privileges' : 'Restricted (Admin Only)'}
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

export default RoleLanding;
