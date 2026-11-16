import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard, CheckCircle2, Clock, AlertTriangle, ArrowRightLeft,
  FileText, ShieldCheck, Download, ExternalLink, HelpCircle, Copy,
  Upload, Receipt, ZoomIn, Eye, X, Check, XCircle
} from 'lucide-react';
import api from '../../api/client';
import { useSwimmer } from '../../context/SwimmerContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { copyCardToClipboard } from '../../utils/bankCard';
import { getAuthenticatedDocUrl } from '../../utils/media';

const FALLBACK_RECEIPT_IMAGE = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f1f5f9'/%3E%3Cpath d='M160 110h80v70h-80z' fill='%23cbd5e1'/%3E%3Ccircle cx='180' cy='130' r='10' fill='%2394a3b8'/%3E%3Cpath d='M165 170l20-25 15 15 20-30 20 40z' fill='%2394a3b8'/%3E%3Ctext x='50%25' y='215' dominant-baseline='middle' text-anchor='middle' fill='%2364748b' font-family='sans-serif' font-size='15' font-weight='600'%3E%D8%AA%D8%B5%D9%88%DB%8C%D8%B1 %D9%81%DB%8C%D8%B4 %D8%AF%D8%B1 %D8%AF%D8%B3%D8%AA%D8%B1%D8%B3 %D9%86%DB%8C%D8%B3%D8%AA%3C/text%3E%3C/svg%3E";

export const SwimmerFinancePage = () => {
  const { activeSwimmer, activeSwimmerId } = useSwimmer();
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingInstallmentId, setPayingInstallmentId] = useState(null);

  // Download raw original file
  const handleDownloadFile = async (url, fallbackFilename = 'receipt-original.jpg') => {
    if (!url) {
      toast.error('آدرس فایل معتبر نیست');
      return;
    }
    try {
      toast.info('در حال دانلود فایل اصلی...');
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fallbackFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('فایل اصلی با موفقیت دریافت و ذخیره شد');
    } catch {
      const link = document.createElement('a');
      link.href = url;
      link.download = fallbackFilename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Upload Receipt Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    course_id: '',
    amount_claimed: '',
    tracking_number: '',
    payer_card_number: '',
    notes: '',
    file: null,
    previewUrl: null,
    submitting: false,
  });

  // Preview Receipt Modal State
  const [previewReceiptDoc, setPreviewReceiptDoc] = useState(null);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const params = activeSwimmerId ? { swimmer_id: activeSwimmerId } : {};
      const [invRes, insRes, payRes, recRes] = await Promise.allSettled([
        api.get('/finance/invoices/', { params }),
        api.get('/finance/installments/', { params }),
        api.get('/finance/payments/', { params }),
        api.get('/finance/receipts/', { params }),
      ]);

      if (invRes.status === 'fulfilled') {
        const d = invRes.value.data;
        setInvoices(Array.isArray(d) ? d : d.results || []);
      }
      if (insRes.status === 'fulfilled') {
        const d = insRes.value.data;
        setInstallments(Array.isArray(d) ? d : d.results || []);
      }
      if (payRes.status === 'fulfilled') {
        const d = payRes.value.data;
        setPayments(Array.isArray(d) ? d : d.results || []);
      }
      if (recRes.status === 'fulfilled') {
        const d = recRes.value.data;
        setReceipts(Array.isArray(d) ? d : d.results || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, [activeSwimmerId]);

  const handleSimulatePayment = async (installment) => {
    try {
      setPayingInstallmentId(installment.id);
      // In production, this redirects to online payment gateway (Zarinpal, Sadad, etc.)
      // We simulate successful gateway callback by paying the installment:
      toast.info('در حال اتصال به درگاه شاپرک/بانک...');
      setTimeout(async () => {
        try {
          await api.post('/finance/payments/record/', {
            swimmer_id: activeSwimmerId || activeSwimmer?.id,
            amount: installment.amount,
            tracking_number: `GW-${Math.floor(100000 + Math.random() * 900000)}`,
            method: 'ONLINE',
            notes: `پرداخت آنلاین قسط شماره ${installment.id} توسط ولی شناگر`,
          });
          toast.success('پرداخت آنلاین با موفقیت انجام شد و رسید صادر گردید.');
          await fetchFinanceData();
        } catch {
          toast.error('خطا در فرآیند ثبت پرداخت.');
        } finally {
          setPayingInstallmentId(null);
        }
      }, 1000);
    } catch {
      setPayingInstallmentId(null);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 10 * 1024 * 1024) {
        toast.error('حداکثر حجم مجاز فایل ۱۰ مگابایت است.');
        return;
      }
      setUploadForm((prev) => ({
        ...prev,
        file: f,
        previewUrl: URL.createObjectURL(f),
      }));
    }
  };

  const handleUploadReceiptSubmit = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) {
      toast.error('لطفاً تصویر یا فایل فیش واریز را انتخاب نمایید.');
      return;
    }
    if (!uploadForm.tracking_number.trim()) {
      toast.error('وارد کردن شماره پیگیری یا شماره ارجاع بانکی الزامی است.');
      return;
    }

    try {
      setUploadForm((prev) => ({ ...prev, submitting: true }));
      const formData = new FormData();
      const targetSwimmerId = activeSwimmerId || activeSwimmer?.id;
      if (targetSwimmerId) {
        formData.append('swimmer_id', targetSwimmerId);
      }
      if (uploadForm.course_id) {
        formData.append('enrollment_id', uploadForm.course_id);
      }
      formData.append('receipt_image', uploadForm.file);
      formData.append('tracking_number', uploadForm.tracking_number.trim());
      if (uploadForm.amount_claimed) {
        formData.append('amount_claimed', uploadForm.amount_claimed);
      }
      if (uploadForm.payer_card_number) {
        formData.append('payer_card_number', uploadForm.payer_card_number.trim());
      }
      if (uploadForm.notes) {
        formData.append('notes', uploadForm.notes.trim());
      }

      await api.post('/finance/receipts/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('فیش واریزی با موفقیت بارگذاری شد و پس از بررسی مدیریت، از شهریه شما کسر می‌گردد.');
      setIsUploadModalOpen(false);
      setUploadForm({
        course_id: '',
        amount_claimed: '',
        tracking_number: '',
        payer_card_number: '',
        notes: '',
        file: null,
        previewUrl: null,
        submitting: false,
      });
      fetchFinanceData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در بارگذاری فیش واریزی');
      setUploadForm((prev) => ({ ...prev, submitting: false }));
    }
  };

  if (loading) {
    return <LoadingState type="table" message="در حال محاسبه حسابداری و اقساط شناگر..." />;
  }

  const formatPrice = (val) => Number(val || 0).toLocaleString('fa-IR');

  const totalInvoiceAmount = invoices.reduce((acc, curr) => acc + Number(curr.final_amount || 0), 0);
  const totalPaid = invoices.reduce((acc, curr) => acc + Number(curr.paid_amount || 0), 0);
  const totalDebt = invoices.reduce((acc, curr) => acc + Number(curr.remaining_balance || 0), 0);

  // Next due installment
  const pendingInstallments = installments.filter((i) => i.status !== 'PAID');
  const nextInstallment = pendingInstallments.length > 0 ? pendingInstallments[0] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60">
              <CreditCard className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              امور مالی، شهریه و اقساط
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            مشاهده صورتحساب‌های رسمی، برنامه سررسید اقساط، رسیدهای بانکی و پرداخت آنلاین
          </p>
        </div>

        <Link
          to="/swimmer/support"
          className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors flex items-center gap-2 cursor-pointer"
        >
          <HelpCircle className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
          <span>درخواست بررسی مغایرت مالی</span>
        </Link>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs sm:text-sm font-bold text-slate-500 block mb-1.5">شهریه کل دوره‌ها</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono block">
            {formatPrice(totalInvoiceAmount)} <span className="text-xs sm:text-sm font-normal text-slate-500">تومان</span>
          </span>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs sm:text-sm font-bold text-emerald-600 block mb-1.5">مبلغ تسویه‌شده</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 font-mono block">
            {formatPrice(totalPaid)} <span className="text-xs sm:text-sm font-normal text-slate-500">تومان</span>
          </span>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className={`text-xs sm:text-sm font-bold block mb-1.5 ${totalDebt > 0 ? 'text-orange-600' : 'text-slate-500'}`}>
            مانده بدهی سررسیددار
          </span>
          <span className={`text-xl sm:text-2xl font-black font-mono block ${totalDebt > 0 ? 'text-orange-600' : 'text-slate-700 dark:text-slate-300'}`}>
            {formatPrice(totalDebt)} <span className="text-xs sm:text-sm font-normal text-slate-500">تومان</span>
          </span>
        </div>
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs sm:text-sm font-bold text-slate-500 block mb-1.5">وضعیت کلی حسابداری</span>
          <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 block mt-1">
            {totalDebt === 0 ? (
              <span className="text-emerald-600 flex items-center gap-1.5 font-bold text-sm">
                <CheckCircle2 className="w-4.5 h-4.5" /> تسویه کامل دوره
              </span>
            ) : (
              <span className="text-orange-600 flex items-center gap-1.5 font-bold text-sm">
                <AlertTriangle className="w-4.5 h-4.5" /> دارای قسط سررسیدشده
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Card-to-Card Payment Details for Swimmer */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white border border-sky-800/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-600/80 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CreditCard className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <span className="text-xs font-bold text-sky-200 block">
              شماره کارت بانکی آموزشگاه (جهت واریز و کارت‌به‌کارت اقساط)
            </span>
            <span className="text-sm sm:text-base font-mono font-black tracking-wider text-emerald-300 block mt-0.5" dir="ltr">
              ۶۰۳۷ - ۹۹۷۵ - ۱۲۳۴ - ۵۶۷۸
            </span>
            <span className="text-[11px] text-slate-300 block">
              بانک ملی ایران · به نام علی هاشمی (مدیریت مدرسه شنا)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => copyCardToClipboard('6037997512345678', 'شماره کارت آموزشگاه', toast)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>کپی شماره کارت</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const defaultCourse = invoices.find((inv) => Number(inv.remaining_balance) > 0)?.enrollment || invoices[0]?.enrollment || '';
              setUploadForm((prev) => ({ ...prev, course_id: defaultCourse }));
              setIsUploadModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>بارگذاری فیش و رسید واریزی</span>
          </button>
        </div>
      </div>

      {/* Installments Schedule */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-sky-600" />
              برنامه زمان‌بندی اقساط شهریه
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              اقساط مشخص‌شده با امکان پرداخت آنلاین امن از طریق درگاه بانکی
            </p>
          </div>
        </div>

        {installments.length > 0 ? (
          <div className="space-y-3">
            {installments.map((inst) => (
              <div
                key={inst.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
                      قسط به مبلغ {formatPrice(inst.amount)} تومان
                    </span>
                    <Badge variant={inst.status === 'PAID' ? 'success' : 'warning'}>
                      {inst.status_display || (inst.status === 'PAID' ? 'پرداخت‌شده' : 'در انتظار پرداخت')}
                    </Badge>
                  </div>
                  <span className="text-xs sm:text-sm text-slate-500 font-mono">
                    تاریخ سررسید: {inst.due_date}
                  </span>
                </div>

                {inst.status !== 'PAID' ? (
                  <button
                    type="button"
                    disabled={payingInstallmentId === inst.id}
                    onClick={() => handleSimulatePayment(inst)}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 self-end sm:self-auto"
                  >
                    <CreditCard className="w-4.5 h-4.5" />
                    <span>{payingInstallmentId === inst.id ? 'در حال اتصال...' : 'پرداخت آنلاین'}</span>
                  </button>
                ) : (
                  <span className="text-sm text-emerald-600 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4.5 h-4.5" /> تسویه شد
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-slate-400">
            قسط فعالی برای این دوره ثبت نشده است.
          </div>
        )}
      </div>

      {/* Payment Receipts History */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <FileText className="w-4.5 h-4.5 text-emerald-600" />
          تاریخچه تراکنش‌ها و رسیدهای ثبت‌شده
        </h3>

        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold text-sm">
                  <th className="py-3 px-3">کد رهگیری</th>
                  <th className="py-3 px-3">مبلغ پرداختی</th>
                  <th className="py-3 px-3">روش پرداخت</th>
                  <th className="py-3 px-3">تاریخ و ساعت</th>
                  <th className="py-3 px-3">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((p) => (
                  <tr key={p.id} className="text-slate-700 dark:text-slate-300">
                    <td className="py-3.5 px-3 font-mono font-bold text-sm sm:text-base">{p.tracking_number}</td>
                    <td className="py-3.5 px-3 font-mono font-black text-emerald-600 text-sm sm:text-base">
                      {formatPrice(p.amount)} تومان
                    </td>
                    <td className="py-3.5 px-3 text-sm font-medium">{p.method_display || p.method}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-500 text-xs sm:text-sm">
                      {p.paid_at?.slice(0, 16).replace('T', ' ')}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="text-emerald-600 font-bold flex items-center gap-1.5 text-xs sm:text-sm">
                        <CheckCircle2 className="w-4 h-4" /> قطعی
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-slate-400">
            هنوز تراکنش پرداختی برای این شناگر ثبت نشده است.
          </div>
        )}
      </div>

      {/* Uploaded Card-to-Card Receipts Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-4.5 h-4.5 text-amber-600" />
              سوابق فیش‌ها و رسیدهای ارسالی کارت‌به‌کارت
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              پیگیری رسیدهای واریزی شما و وضعیت تأیید یا کسر آن‌ها از شهریه دوره توسط مدیریت
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const defaultCourse = invoices.find((inv) => Number(inv.remaining_balance) > 0)?.enrollment || invoices[0]?.enrollment || '';
              setUploadForm((prev) => ({ ...prev, course_id: defaultCourse }));
              setIsUploadModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>ارسال رسید واریز جدید</span>
          </button>
        </div>

        {receipts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {receipts.map((rec) => (
              <div
                key={rec.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between gap-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {rec.course_name || 'شهریه دوره شنا'}
                    </h4>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      شماره پیگیری: <strong className="font-mono text-slate-700 dark:text-slate-300">{rec.tracking_number || '—'}</strong>
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      تاریخ ارسال: {rec.created_at ? new Date(rec.created_at).toLocaleDateString('fa-IR') : '—'}
                    </span>
                  </div>

                  {rec.status === 'APPROVED' ? (
                    <span className="shrink-0 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> تأییدشده
                    </span>
                  ) : rec.status === 'REJECTED' ? (
                    <span className="shrink-0 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" /> رد شده
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" /> در انتظار بررسی
                    </span>
                  )}
                </div>

                {/* Amount details */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                  {rec.status === 'APPROVED' ? (
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>مبلغ تأییدشده و کسرشده از بدهی:</span>
                      <span className="font-mono text-sm font-black">
                        {formatPrice(rec.approved_amount)} تومان
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span>مبلغ واریزی اعلامی:</span>
                      <span className="font-mono font-bold">
                        {rec.amount_claimed > 0 ? `${formatPrice(rec.amount_claimed)} تومان` : 'ذکر نشده'}
                      </span>
                    </div>
                  )}

                  {rec.status === 'REJECTED' && rec.rejection_reason && (
                    <div className="pt-1.5 border-t border-rose-100 dark:border-rose-900/60 text-rose-600 dark:text-rose-400">
                      <span className="font-bold block">دلیل عدم تأیید:</span>
                      <span className="text-[11px]">{rec.rejection_reason}</span>
                    </div>
                  )}
                </div>

                {/* Thumbnail and view/download buttons */}
                <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                  {rec.receipt_image && (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewReceiptDoc({
                            title: `رسید ارسالی برای ${rec.course_name}`,
                            url: getAuthenticatedDocUrl(rec.receipt_image),
                            filename: `receipt_${rec.id}.jpg`,
                          })
                        }
                        className="text-xs sm:text-sm font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        <span>مشاهده تصویر رسید</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadFile(getAuthenticatedDocUrl(rec.receipt_image), `receipt_${rec.id}.jpg`)
                        }
                        className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>دانلود فایل اصلی</span>
                      </button>
                    </div>
                  )}
                  {rec.status === 'REJECTED' && (
                    <button
                      type="button"
                      onClick={() => {
                        setUploadForm((prev) => ({
                          ...prev,
                          course_id: rec.enrollment || '',
                          tracking_number: '',
                        }));
                        setIsUploadModalOpen(true);
                      }}
                      className="text-xs sm:text-sm font-bold text-amber-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>ارسال فیش اصلاحی</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-slate-400">
            هنوز هیچ فیش یا رسید واریزی برای این شناگر ارسال نشده است. پس از واریز کارت‌به‌کارت شهریه، می‌توانید تصویر فیش را ثبت فرمایید.
          </div>
        )}
      </div>

      {/* Modal: Upload Card-to-Card Receipt */}
      {isUploadModalOpen && (
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title="بارگذاری فیش و رسید واریز کارت‌به‌کارت شهریه"
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleUploadReceiptSubmit} className="space-y-4 text-right" dir="rtl">
            {/* Card Information Banner */}
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-900/60 text-sky-900 dark:text-sky-200 space-y-1 text-xs">
              <span className="font-bold block">شماره کارت آموزشگاه جهت واریز:</span>
              <div className="flex items-center justify-between font-mono font-black text-sm text-sky-700 dark:text-sky-300" dir="ltr">
                <span>۶۰۳۷ - ۹۹۷۵ - ۱۲۳۴ - ۵۶۷۸</span>
                <button
                  type="button"
                  onClick={() => copyCardToClipboard('6037997512345678', 'شماره کارت آموزشگاه', toast)}
                  className="text-xs font-bold text-sky-600 hover:text-sky-800 dark:text-sky-400 flex items-center gap-1 cursor-pointer font-sans"
                >
                  <Copy className="w-3 h-3" /> کپی
                </button>
              </div>
              <span className="text-[11px] text-slate-500 block">بانک ملی ایران · به نام علی هاشمی</span>
            </div>

            {/* Course / Invoice Selector */}
            {invoices.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  انتخاب دوره / صورتحساب مربوطه:
                </label>
                <select
                  value={uploadForm.course_id}
                  onChange={(e) => setUploadForm({ ...uploadForm, course_id: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">دوره پیش‌فرض فعال شناگر</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.enrollment || ''}>
                      {inv.items?.[0]?.description || `صورتحساب ${inv.invoice_number}`} (مانده بدهی: {formatPrice(inv.remaining_balance)} تومان)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* File Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                تصویر یا فایل رسید واریزی (عکس یا PDF) <span className="text-rose-500">*</span>
              </label>
              <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 hover:border-sky-500 transition-colors">
                {uploadForm.previewUrl ? (
                  <div className="relative w-full h-40 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border">
                    <img
                      src={uploadForm.previewUrl}
                      alt="پیش‌نمایش فیش"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setUploadForm({ ...uploadForm, file: null, previewUrl: null })}
                      className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-xs cursor-pointer shadow-xs"
                      title="حذف و انتخاب مجدد"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      برای انتخاب تصویر فیش یا اسکرین‌شات رسید، اینجا کلیک کنید
                    </span>
                    <span className="text-[11px] text-slate-400">JPG, PNG یا PDF (حداکثر ۱۰ مگابایت)</span>
                    <input
                      type="file"
                      required
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Tracking Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                شماره پیگیری / شماره مرجع بانکی فیش <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={uploadForm.tracking_number}
                onChange={(e) => setUploadForm({ ...uploadForm, tracking_number: e.target.value })}
                placeholder="مثلاً: 123456789 یا کد پیگیری آپ، همراه بانک و..."
                className="w-full p-2.5 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Claimed Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  مبلغ واریزی (تومان):
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={uploadForm.amount_claimed}
                  onChange={(e) => setUploadForm({ ...uploadForm, amount_claimed: e.target.value })}
                  placeholder="مثال: 1500000"
                  className="w-full p-2.5 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  ۴ رقم آخر کارت واریزکننده:
                </label>
                <input
                  type="text"
                  maxLength="16"
                  value={uploadForm.payer_card_number}
                  onChange={(e) => setUploadForm({ ...uploadForm, payer_card_number: e.target.value })}
                  placeholder="مثال: 4567"
                  className="w-full p-2.5 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                توضیحات تکمیلی (اختیاری):
              </label>
              <input
                type="text"
                value={uploadForm.notes}
                onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                placeholder="توضیحاتی مانند نام واریزکننده یا بابت قسط خاص..."
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsUploadModalOpen(false)}
                disabled={uploadForm.submitting}
              >
                انصراف
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={uploadForm.submitting || !uploadForm.file || !uploadForm.tracking_number.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-bold"
              >
                <Check className="w-4 h-4" />
                <span>{uploadForm.submitting ? 'در حال ارسال فیش...' : 'ثبت و ارسال رسید پرداخت'}</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Receipt Image Preview */}
      {previewReceiptDoc && (
        <Modal
          isOpen={Boolean(previewReceiptDoc)}
          onClose={() => setPreviewReceiptDoc(null)}
          title={previewReceiptDoc.title || 'پیش‌نمایش رسید واریزی'}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-100 dark:bg-slate-950 rounded-2xl p-3 border border-slate-200 dark:border-slate-800">
              <img
                src={previewReceiptDoc.url}
                alt={previewReceiptDoc.title}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-md"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_RECEIPT_IMAGE;
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-3 pt-2.5 flex-wrap">
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    handleDownloadFile(
                      previewReceiptDoc.url,
                      previewReceiptDoc.filename || `${previewReceiptDoc.title || 'receipt'}.jpg`
                    )
                  }
                  className="gap-2 text-sm font-bold bg-sky-600 hover:bg-sky-700 text-white cursor-pointer shadow-xs py-2 px-3.5"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود فایل اصلی با کیفیت بالا</span>
                </Button>
                <a
                  href={previewReceiptDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-sky-600 dark:text-sky-400 font-bold hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>مشاهده در برگه جدید</span>
                </a>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setPreviewReceiptDoc(null)} className="text-sm font-semibold px-4">
                بستن
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
