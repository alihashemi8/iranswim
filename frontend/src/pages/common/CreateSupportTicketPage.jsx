import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Headphones, Send, ShieldCheck, AlertTriangle, Paperclip,
  CheckCircle2, AlertCircle, X, FileText,
  Sparkles, User, Info, ChevronDown, Check,
  Server, Bug, Key, CreditCard, Calendar, FileCheck, HelpCircle
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSwimmer } from '../../context/SwimmerContext';
import { useToast } from '../../context/ToastContext';
import { BackButton } from '../../components/common/BackButton';

const CATEGORY_CHOICES = [
  { value: 'TECHNICAL', label: 'مشکلات فنی و سامانه', icon: Server, desc: 'خطای سرور، اختلال در بارگذاری صفحات یا دیتابیس' },
  { value: 'BUG', label: 'گزارش باگ یا خطا', icon: Bug, desc: 'اشکال در عملکرد دکمه‌ها، محاسبات، فرم‌ها یا رخداد خطا' },
  { value: 'ACCOUNT', label: 'حساب کاربری و دسترسی', icon: Key, desc: 'ورود، بازیابی رمز عبور، سطوح دسترسی یا اطلاعات کاربر' },
  { value: 'FEATURE', label: 'پیشنهاد قابلیت جدید', icon: Sparkles, desc: 'پیشنهاد امکانات جدید، ارتقای فرآیندها یا بهبود ظاهر سامانه' },
  { value: 'FINANCE', label: 'امور مالی و پرداخت', icon: CreditCard, desc: 'تراکنش ناموفق، مغایرت شهریه، صورت‌حساب یا پرداخت‌ها' },
  { value: 'SCHEDULE', label: 'برنامه و زمان‌بندی', icon: Calendar, desc: 'تداخل زمان سانس‌ها، جابه‌جایی کلاس‌ها یا شیفت مربیان' },
  { value: 'DOCUMENTS', label: 'مدارک و پرونده ورزشی', icon: FileCheck, desc: 'بارگذاری مدارک پزشکی، بیمه، تاییدیه یا ثبت‌نام' },
  { value: 'OTHER', label: 'سایر موضوعات', icon: HelpCircle, desc: 'سایر پرسش‌ها و مکاتبات عمومی با ناظر فنی' },
];

const PRIORITY_CHOICES = [
  { value: 'LOW', label: 'عادی', dot: 'bg-slate-400', activeStyle: 'border-slate-400 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 ring-2 ring-slate-400/20' },
  { value: 'MEDIUM', label: 'متوسط', dot: 'bg-sky-500', activeStyle: 'border-sky-500 dark:border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 ring-2 ring-sky-500/25' },
  { value: 'HIGH', label: 'فوری', dot: 'bg-amber-500', activeStyle: 'border-amber-500 dark:border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 ring-2 ring-amber-500/25' },
  { value: 'URGENT', label: 'بحرانی', dot: 'bg-rose-500', activeStyle: 'border-rose-500 dark:border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 ring-2 ring-rose-500/25' },
];

export const CreateSupportTicketPage = ({ role = 'ADMIN' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const swimmerContext = useSwimmer() || {};
  const { activeSwimmer, activeSwimmerId, childrenList } = swimmerContext;
  const toast = useToast();

  const userRole = role || user?.role || 'ADMIN';
  const basePath = (userRole === 'FEMALE_ADMIN' || location.pathname.startsWith('/female-admin'))
    ? '/female-admin/support'
    : userRole === 'ADMIN'
    ? '/admin/support'
    : userRole === 'COACH'
    ? '/coach/support'
    : '/swimmer/support';

  // Form State
  const [formData, setFormData] = useState({
    subject: '',
    category: 'TECHNICAL',
    priority: 'MEDIUM',
    description: '',
    swimmerId: activeSwimmerId || activeSwimmer?.id || '',
  });
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Custom Dropdown State
  const [categoryOpen, setCategoryOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setCategoryOpen(false);
      }
    };
    if (categoryOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [categoryOpen]);

  const selectedCategory = CATEGORY_CHOICES.find((c) => c.value === formData.category) || CATEGORY_CHOICES[0];
  const CategoryIcon = selectedCategory.icon;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 15MB
    if (file.size > 15 * 1024 * 1024) {
      toast.error('حجم فایل انتخابی نباید بیش از ۱۵ مگابایت باشد.');
      return;
    }

    setAttachment(file);

    // If image, create preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setAttachmentPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview(null);
    }
  };

  const handleRemoveFile = () => {
    setAttachment(null);
    setAttachmentPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subject.trim()) {
      toast.error('لطفاً عنوان تیکت را وارد نمایید.');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('لطفاً شرح کامل مشکل یا درخواست را بنویسید.');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('subject', formData.subject.trim());
      data.append('category', formData.category);
      data.append('priority', formData.priority);
      data.append('description', formData.description.trim());

      if (userRole === 'SWIMMER' && formData.swimmerId) {
        data.append('swimmer', formData.swimmerId);
      }

      if (attachment) {
        data.append('attachment', attachment);
      }

      await api.post('/content/tickets/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('تیکت شما با موفقیت برای ناظر فنی سامانه ارسال گردید.');
      navigate(basePath);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت تیکت پشتیبانی.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-2.5 sm:px-4 md:px-6 py-3 sm:py-6 space-y-3.5 sm:space-y-5" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <BackButton to={basePath} label="بازگشت" forceTo={true} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="p-1.5 sm:p-2 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 shrink-0">
                <Headphones className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <h1 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate">
                ارسال تیکت به ناظر فنی سامانه
              </h1>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              گزارش مشکلات فنی، باگ‌های عملکردی و پیگیری امور سیستمی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>گیرنده: ناظر فنی سامانه</span>
        </div>
      </div>

      {/* Info Notice Box */}
      <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 text-sky-900 dark:text-sky-200 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed min-w-0">
          <span className="font-bold block text-xs sm:text-sm text-sky-950 dark:text-sky-100">
            راهنمای ثبت تیکت پشتیبانی فنی:
          </span>
          <p className="text-[11px] sm:text-xs text-sky-800/90 dark:text-sky-300">
            تیکت شما مستقیماً در میزکار ناظر فنی ثبت می‌شود. لطفاً برای تسریع در عیب‌یابی، شرح دقیق مشکل یا اسکرین‌شات از خطا را پیوست فرمایید.
          </p>
        </div>
      </div>

      {/* Main Ticket Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 sm:space-y-5"
      >
        {/* Category & Priority Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Custom Category Dropdown */}
          <div className="space-y-1.5" ref={dropdownRef}>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              دسته‌بندی موضوع تیکت <span className="text-rose-500">*</span>
            </label>

            {/* Custom Dropdown Trigger */}
            <div className="relative w-full">
              <button
                type="button"
                onClick={() => setCategoryOpen(!categoryOpen)}
                className={`w-full px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl sm:rounded-2xl border transition-all flex items-center justify-between gap-2 cursor-pointer outline-none ${
                  categoryOpen
                    ? 'border-sky-500 bg-white dark:bg-slate-800 ring-2 ring-sky-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-6 h-6 rounded-lg bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <CategoryIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-slate-800 dark:text-white truncate">
                    {selectedCategory.label}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                    categoryOpen ? 'rotate-180 text-sky-600' : ''
                  }`}
                />
              </button>

              {/* Dropdown Options Popup (Guaranteed No Horizontal Overflow) */}
              {categoryOpen && (
                <div
                  className="absolute z-50 left-0 right-0 w-full max-w-full top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/90 rounded-2xl shadow-xl overflow-hidden py-1.5 animate-in fade-in-50 zoom-in-95"
                  role="listbox"
                >
                  <div className="max-h-56 overflow-y-auto p-1.5 space-y-1 divide-y-0 scrollbar-thin">
                    {CATEGORY_CHOICES.map((c) => {
                      const isSelected = formData.category === c.value;
                      const IconComponent = c.icon;
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, category: c.value });
                            setCategoryOpen(false);
                          }}
                          className={`w-full text-right px-3 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-sky-500 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              <IconComponent className="w-3.5 h-3.5" />
                            </div>
                            <span className="truncate whitespace-nowrap">{c.label}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Category Explanation Note */}
            <div className="flex items-center gap-1.5 text-[11px] text-sky-700 dark:text-sky-300 bg-sky-50/60 dark:bg-sky-950/40 px-2.5 py-1.5 rounded-xl border border-sky-100 dark:border-sky-900/40">
              <Info className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span className="truncate">{selectedCategory.desc}</span>
            </div>
          </div>

          {/* Priority Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              سطح فوریت و اولویت <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {PRIORITY_CHOICES.map((p) => {
                const isSelected = formData.priority === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p.value })}
                    className={`py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold border transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? p.activeStyle
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.dot}`} />
                    <span className="truncate">{p.label}</span>
                    {p.value === 'URGENT' && <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0 hidden sm:inline" />}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400">
              اولویت پیش‌فرض «متوسط» است. «بحرانی» مختص قطعی سامانه یا امور اضطراری است.
            </p>
          </div>
        </div>

        {/* If Swimmer role with multiple children */}
        {userRole === 'SWIMMER' && childrenList && childrenList.length > 0 && (
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              شناگر مرتبط با درخواست (اختیاری)
            </label>
            <div className="relative">
              <select
                value={formData.swimmerId}
                onChange={(e) => setFormData({ ...formData, swimmerId: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              >
                <option value="">عمومی / حساب کاربری خودم</option>
                {childrenList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.national_id || 'شناگر'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Subject */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              عنوان تیکت <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              {formData.subject.length}/150
            </span>
          </div>
          <input
            type="text"
            maxLength={150}
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="موضوع خلاصه تیکت (مثال: عدم ذخیره اطلاعات حضور و غیاب)"
            className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
            شرح کامل مشکل یا درخواست <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={5}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="لطفاً شرح دقیق مشکل، پیغامی که دریافت کردید و مراحل تکرار آن را با جزئیات بنویسید..."
            className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800 transition-all leading-relaxed font-normal"
            required
          />
        </div>

        {/* Attachment Upload Box */}
        <div className="space-y-1.5">
          <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
            پیوست تصویر خطا، لاگ یا فایل مدرک (اختیاری)
          </label>

          {!attachment ? (
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 text-center bg-slate-50/40 dark:bg-slate-800/30 transition-colors">
              <input
                type="file"
                id="ticket-page-file-input"
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx,.zip,.txt"
                className="hidden"
              />
              <label
                htmlFor="ticket-page-file-input"
                className="cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 flex items-center justify-center shrink-0">
                  <Paperclip className="w-4 h-4" />
                </div>
                <div className="text-center sm:text-right">
                  <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                    کلیک برای انتخاب اسکرین‌شات یا فایل پیوست
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    فرمت‌های عکس (PNG, JPG)، اسناد (PDF, Word) و ZIP تا ۱۵ مگابایت
                  </div>
                </div>
              </label>
            </div>
          ) : (
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                {attachmentPreview ? (
                  <img
                    src={attachmentPreview}
                    alt="پیش‌نمایش تصویر پیوست"
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate max-w-[150px] sm:max-w-xs">
                    {attachment.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {(attachment.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveFile}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 transition-all cursor-pointer shrink-0 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">حذف فایل</span>
                <span className="sm:hidden">حذف</span>
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons (Mobile First responsive) */}
        <div className="pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => navigate(basePath)}
            className="w-full sm:w-auto px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl sm:rounded-2xl transition-all cursor-pointer text-center"
          >
            انصراف و بازگشت
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-7 py-2.5 sm:py-3 text-xs sm:text-sm font-black text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.98] rounded-xl sm:rounded-2xl transition-all shadow-md shadow-sky-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'در حال ارسال تیکت...' : 'ارسال قطعی تیکت به ناظر فنی'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
