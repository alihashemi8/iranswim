import React, { useState, useEffect } from 'react';
import {
  History, Clock, UserCheck, FileText, CreditCard, DollarSign,
  Award, Calendar, ClipboardCheck, AlertCircle, Filter
} from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { LoadingState } from '../../../components/common/LoadingState';
import api from '../../../api/client';

const EVENT_FILTERS = [
  { id: '', label: 'همه رویدادها' },
  { id: 'STATUS_CHANGED', label: 'تغییر وضعیت' },
  { id: 'CONTRACT_CREATED', label: 'قراردادها' },
  { id: 'PAYROLL_GENERATED', label: 'حقوق و دستمزد' },
  { id: 'PAYMENT_REGISTERED', label: 'پرداخت‌ها' },
  { id: 'LEAVE_REQUESTED', label: 'مرخصی‌ها' },
  { id: 'ATTENDANCE_CORRECTED', label: 'اصلاحات حضور' },
  { id: 'EVALUATION_RECORDED', label: 'ارزیابی‌ها' },
  { id: 'ADMIN_NOTE_ADDED', label: 'مکاتبات اداری' },
];

export const CoachTimelineTab = ({ coach }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedFilter) params.event_type = selectedFilter;
      const res = await api.get(`/coaches/${coach.id}/activity-timeline/`, { params });
      setLogs(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [coach.id, selectedFilter]);

  const getEventIcon = (type) => {
    switch (type) {
      case 'PROFILE_CREATED':
      case 'PROFILE_UPDATED':
      case 'STATUS_CHANGED':
        return <UserCheck className="w-4 h-4 text-sky-600" />;
      case 'CONTRACT_CREATED':
      case 'CONTRACT_RENEWED':
        return <FileText className="w-4 h-4 text-indigo-600" />;
      case 'PAYROLL_GENERATED':
      case 'PAYROLL_APPROVED':
        return <CreditCard className="w-4 h-4 text-teal-600" />;
      case 'PAYMENT_REGISTERED':
      case 'PAYMENT_REVERSED':
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'LEAVE_REQUESTED':
      case 'LEAVE_APPROVED':
      case 'LEAVE_REJECTED':
        return <Calendar className="w-4 h-4 text-amber-600" />;
      case 'ATTENDANCE_CORRECTED':
        return <ClipboardCheck className="w-4 h-4 text-rose-600" />;
      case 'EVALUATION_RECORDED':
        return <Award className="w-4 h-4 text-purple-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Chips */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-sky-600" />
            تاریخچه زمانی جامع فعالیت‌ها و رویدادهای مربی
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            ثبت بلادرنگ تمامی تغییرات قرارداد، پرداختی‌ها، ارزیابی‌ها، مرخصی‌ها و تصمیمات اداری
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {EVENT_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedFilter === f.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      {loading ? (
        <LoadingState type="cards" count={3} message="در حال دریافت تایم‌لاین رویدادها..." />
      ) : logs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center text-slate-400 text-xs">
          هیچ رویدادی در این دسته‌بندی یافت نشد.
        </div>
      ) : (
        <div className="relative border-r border-slate-200 dark:border-slate-800 mr-4 space-y-6">
          {logs.map((log) => (
            <div key={log.id} className="relative pr-6 text-xs">
              {/* Dot Icon on timeline line */}
              <div className="absolute -right-3 top-1 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-xs">
                {getEventIcon(log.event_type)}
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {log.event_type_display}
                    </span>
                    <Badge variant="neutral">
                      {log.event_type}
                    </Badge>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(log.created_at).toLocaleString('fa-IR')}
                  </span>
                </div>

                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {log.description}
                </p>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
                  <span>اقدام‌کننده: <strong className="text-slate-600 dark:text-slate-300">{log.actor_name || 'سیستم خودکار'}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
