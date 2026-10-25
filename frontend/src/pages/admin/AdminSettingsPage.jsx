import React, { useState } from 'react';
import {
  Sliders, Building2, Clock, CreditCard, ShieldAlert,
  Save, CheckCircle2, Globe, Sparkles
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';

export const AdminSettingsPage = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('ACADEMY'); // ACADEMY, CLASS, FINANCE, SYSTEM

  // Settings State
  const [settings, setSettings] = useState({
    // Academy Info
    academyName: 'آموزشگاه تخصصی شنای ایران (IranSwim)',
    phone: '۰۲۱-۸۸۲۲۳۳۴۴',
    supportMobile: '۰۹۰۴۵۹۱۱۱۴۴',
    address: 'تهران، خیابان آزادی، مجتمع ورزش‌های آبی ایران',
    email: 'info@iranswim.com',
    poolName: 'استخر بین‌المللی آزادی (لاین‌های ۲ تا ۵)',
    
    // Class Defaults
    defaultSessionDurationMinutes: 75,
    defaultGroupCapacity: 15,
    cancellationNoticeHours: 12,
    allowMakeupSessions: true,
    maxMakeupPerCourse: 2,

    // Finance & Tariffs
    currency: 'تومان (TOMAN)',
    taxPercent: 0,
    installmentCountDefault: 2,
    overdueGraceDays: 3,
    allowCashPayments: true,

    // System
    timezone: 'Asia/Tehran (+03:30)',
    calendarSystem: 'گاه‌شمار هجری خورشیدی (Jalali)',
    language: 'فارسی (Persian / RTL)',
  });

  const [saving, setSaving] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('تنظیمات آموزشگاه با موفقیت ذخیره گردید.');
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-600" />
            تنظیمات پایه و پیکربندی آموزشگاه شنا
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            مشخصات آموزشگاه، قوانین برگزاری جلسات، استانداردهای مالی و تقویم سامانه
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700 text-xs w-fit">
        {[
          { key: 'ACADEMY', label: 'اطلاعات آموزشگاه و استخر', icon: Building2 },
          { key: 'CLASS', label: 'قوانین کلاس‌ها و ظرفیت', icon: Clock },
          { key: 'FINANCE', label: 'سیاست‌های مالی و تعرفه', icon: CreditCard },
          { key: 'SYSTEM', label: 'تنظیمات زبان و تقویم', icon: Globe },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs transition-colors">
        <form onSubmit={handleSave} className="space-y-6">
          {activeTab === 'ACADEMY' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                مشخصات عمومی و تماس آکادمی
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نام رسمی آموزشگاه
                  </label>
                  <input
                    type="text"
                    value={settings.academyName}
                    onChange={(e) => setSettings({ ...settings, academyName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نام استخر و مجموعه اصلی
                  </label>
                  <input
                    type="text"
                    value={settings.poolName}
                    onChange={(e) => setSettings({ ...settings, poolName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    شماره تماس ثابت
                  </label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    شماره همراه پشتیبانی / امور شناگران
                  </label>
                  <input
                    type="text"
                    value={settings.supportMobile}
                    onChange={(e) => setSettings({ ...settings, supportMobile: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نشانی کامل مجموعه آبی
                </label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'CLASS' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                استانداردها و قوانین کلاس‌های شنا
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    مدت‌زمان پیش‌فرض هر سانس آموزشی (دقیقه)
                  </label>
                  <input
                    type="number"
                    value={settings.defaultSessionDurationMinutes}
                    onChange={(e) => setSettings({ ...settings, defaultSessionDurationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ظرفیت استاندارد هر گروه / لاین (نفر)
                  </label>
                  <input
                    type="number"
                    value={settings.defaultGroupCapacity}
                    onChange={(e) => setSettings({ ...settings, defaultGroupCapacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    حداقل زمان اطلاع‌رسانی لغو یا غیبت موجه (ساعت)
                  </label>
                  <input
                    type="number"
                    value={settings.cancellationNoticeHours}
                    onChange={(e) => setSettings({ ...settings, cancellationNoticeHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    سقف جلسات جبرانی مجاز در هر دوره
                  </label>
                  <input
                    type="number"
                    value={settings.maxMakeupPerCourse}
                    onChange={(e) => setSettings({ ...settings, maxMakeupPerCourse: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'FINANCE' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                سیاست‌های مالی، تقسیط و حسابداری
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    واحد پول مرجع سامانه
                  </label>
                  <input
                    type="text"
                    disabled
                    value={settings.currency}
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    تعداد اقساط پیش‌فرض شهریه
                  </label>
                  <input
                    type="number"
                    value={settings.installmentCountDefault}
                    onChange={(e) => setSettings({ ...settings, installmentCountDefault: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    مهلت ارفاق سررسید قسط قبل از علامت‌گذاری بدهکار (روز)
                  </label>
                  <input
                    type="number"
                    value={settings.overdueGraceDays}
                    onChange={(e) => setSettings({ ...settings, overdueGraceDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'SYSTEM' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                تنظیمات منطقه زمانی و تقویم
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    منطقه زمانی سرور و پنل
                  </label>
                  <input
                    type="text"
                    disabled
                    value={settings.timezone}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    سیستم تقویم و زبان
                  </label>
                  <input
                    type="text"
                    disabled
                    value={settings.calendarSystem}
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="submit" disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              <span>{saving ? 'در حال ذخیره‌سازی...' : 'ذخیره تنظیمات'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
