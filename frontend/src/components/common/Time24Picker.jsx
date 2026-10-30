import React from 'react';
import { Clock } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

const HOURS_24 = [
  { value: '06', label: '۰۶' },
  { value: '07', label: '۰۷' },
  { value: '08', label: '۰۸' },
  { value: '09', label: '۰۹' },
  { value: '10', label: '۱۰' },
  { value: '11', label: '۱۱' },
  { value: '12', label: '۱۲' },
  { value: '13', label: '۱۳' },
  { value: '14', label: '۱۴' },
  { value: '15', label: '۱۵' },
  { value: '16', label: '۱۶' },
  { value: '17', label: '۱۷' },
  { value: '18', label: '۱۸' },
  { value: '19', label: '۱۹' },
  { value: '20', label: '۲۰' },
  { value: '21', label: '۲۱' },
  { value: '22', label: '۲۲' },
  { value: '23', label: '۲۳' },
  { value: '00', label: '۰۰' },
  { value: '01', label: '۰۱' },
  { value: '02', label: '۰۲' },
  { value: '03', label: '۰۳' },
  { value: '04', label: '۰۴' },
  { value: '05', label: '۰۵' },
];

const MINUTES = [
  { value: '00', label: '۰۰' },
  { value: '15', label: '۱۵' },
  { value: '30', label: '۳۰' },
  { value: '45', label: '۴۵' },
  { value: '05', label: '۰۵' },
  { value: '10', label: '۱۰' },
  { value: '20', label: '۲۰' },
  { value: '25', label: '۲۵' },
  { value: '35', label: '۳۵' },
  { value: '40', label: '۴۰' },
  { value: '50', label: '۵۰' },
  { value: '55', label: '۵۵' },
];

export const Time24Picker = ({
  value = '17:00',
  onChange,
  label,
  className = '',
  disabled = false,
}) => {
  const parts = (value || '17:00').split(':');
  const hour = (parts[0] || '17').padStart(2, '0');
  const minute = (parts[1] || '00').padStart(2, '0');

  const handleHourChange = (newHour) => {
    onChange?.(`${newHour}:${minute}`);
  };

  const handleMinuteChange = (newMinute) => {
    onChange?.(`${hour}:${newMinute}`);
  };

  return (
    <div className={`space-y-1.5 ${className}`} dir="rtl">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>{label}</span>
        </label>
      )}

      <div className="flex items-center gap-2">
        {/* Hour (00 to 23) */}
        <div className="flex-1">
          <CustomSelect
            value={hour}
            onChange={handleHourChange}
            options={HOURS_24}
            placeholder="ساعت"
            disabled={disabled}
          />
        </div>

        <span className="font-bold text-slate-400 dark:text-slate-500 text-sm select-none">:</span>

        {/* Minute (00 to 55) */}
        <div className="w-28 sm:w-32 shrink-0">
          <CustomSelect
            value={minute}
            onChange={handleMinuteChange}
            options={MINUTES}
            placeholder="دقیقه"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};
