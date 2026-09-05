import React from 'react';
import { Clock, Calendar, Briefcase } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';

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
 * Detailed View Modal for Working Schedule Breakdown
 */
export function ScheduleDetailModal({ isOpen, onClose, schedule = null }) {
  if (!schedule) return null;

  const pattern = schedule.weeklyPattern || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={schedule.name}
      description="Working schedule details and weekly operating hours."
      size="md"
      className="!bg-slate-900 !border-slate-800 !text-slate-100 [&_h2]:!text-white [&_p]:!text-slate-400 [&_div]:!border-slate-800"
      footer={
        <div className="flex items-center justify-end w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="!border-slate-700 !text-slate-200 hover:!bg-slate-800"
          >
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-5 text-sm">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
              <Briefcase size={14} className="text-blue-400" /> Schedule Type
            </div>
            <StatusBadge status="neutral" label={schedule.type || 'Standard'} />
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
              <Clock size={14} className="text-emerald-400" /> Total Weekly Hours
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {schedule.weeklyHours} <span className="text-xs font-normal text-slate-400">hrs/week</span>
            </div>
          </div>
        </div>

        {/* Weekly Breakdown Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={14} className="text-blue-400" /> Weekly Pattern Schedule
          </h4>

          <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-900 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <div className="col-span-4">Day</div>
              <div className="col-span-3">Hours</div>
              <div className="col-span-2 text-center">Break</div>
              <div className="col-span-3 text-right">Net Hours</div>
            </div>

            <div className="divide-y divide-slate-800">
              {pattern.map((item, idx) => {
                const dailyHours = calculateDailyHours(item.startTime, item.endTime, item.breakHours);
                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center text-xs">
                    <div className="col-span-4 font-medium text-white">{item.day}</div>
                    <div className="col-span-3 text-slate-300 font-mono">
                      {item.startTime} - {item.endTime}
                    </div>
                    <div className="col-span-2 text-center text-slate-400 font-mono">
                      {item.breakHours > 0 ? `${item.breakHours}h` : 'None'}
                    </div>
                    <div className="col-span-3 text-right font-semibold text-blue-400 font-mono">
                      {dailyHours} hrs
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default ScheduleDetailModal;
