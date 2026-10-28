import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard, CheckCircle2, Clock, AlertTriangle, ArrowRightLeft,
  FileText, ShieldCheck, Download, ExternalLink, HelpCircle
} from 'lucide-react';
import api from '../../api/client';
import { useSwimmer } from '../../context/SwimmerContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';

export const SwimmerFinancePage = () => {
  const { activeSwimmer, activeSwimmerId } = useSwimmer();
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingInstallmentId, setPayingInstallmentId] = useState(null);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const params = activeSwimmerId ? { swimmer_id: activeSwimmerId } : {};
      const [invRes, insRes, payRes] = await Promise.allSettled([
        api.get('/finance/invoices/', { params }),
        api.get('/finance/installments/', { params }),
        api.get('/finance/payments/', { params }),
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
            <span className="p-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400">
              <CreditCard className="w-5 h-5" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              امور مالی، شهریه و اقساط
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            مشاهده صورتحساب‌های رسمی، برنامه سررسید اقساط، رسیدهای بانکی و پرداخت آنلاین
          </p>
        </div>

        <Link
          to="/swimmer/support"
          className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-2xl transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-sky-600" />
          <span>درخواست بررسی مغایرت مالی</span>
        </Link>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block mb-1">شهریه کل دوره‌ها</span>
          <span className="text-base sm:text-xl font-black text-slate-900 dark:text-white font-mono">
            {formatPrice(totalInvoiceAmount)} <span className="text-xs font-normal">تومان</span>
          </span>
        </div>
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 block mb-1">مبلغ تسویه‌شده</span>
          <span className="text-base sm:text-xl font-black text-emerald-600 font-mono">
            {formatPrice(totalPaid)} <span className="text-xs font-normal">تومان</span>
          </span>
        </div>
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 block mb-1">مانده بدهی سررسیددار</span>
          <span className="text-base sm:text-xl font-black text-amber-600 font-mono">
            {formatPrice(totalDebt)} <span className="text-xs font-normal">تومان</span>
          </span>
        </div>
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block mb-1">وضعیت کلی حسابداری</span>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block mt-1">
            {totalDebt === 0 ? (
              <span className="text-emerald-600 flex items-center gap-1 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" /> تسویه کامل
              </span>
            ) : (
              <span className="text-amber-600 flex items-center gap-1 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" /> دارای قسط فعال
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Installments Schedule */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              برنامه زمان‌بندی اقساط شهریه
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              اقساط مشخص‌شده با امکان پرداخت آنلاین امن از طریق درگاه بانکی
            </p>
          </div>
        </div>

        {installments.length > 0 ? (
          <div className="space-y-3">
            {installments.map((inst) => (
              <div
                key={inst.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      قسط به مبلغ {formatPrice(inst.amount)} تومان
                    </span>
                    <Badge variant={inst.status === 'PAID' ? 'success' : 'warning'}>
                      {inst.status_display || (inst.status === 'PAID' ? 'پرداخت‌شده' : 'در انتظار پرداخت')}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    تاریخ سررسید: {inst.due_date}
                  </span>
                </div>

                {inst.status !== 'PAID' ? (
                  <button
                    type="button"
                    disabled={payingInstallmentId === inst.id}
                    onClick={() => handleSimulatePayment(inst)}
                    className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-end sm:self-auto"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{payingInstallmentId === inst.id ? 'در حال اتصال...' : 'پرداخت آنلاین'}</span>
                  </button>
                ) : (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> تسویه شد
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            قسط فعالی برای این دوره ثبت نشده است.
          </div>
        )}
      </div>

      {/* Payment Receipts History */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <FileText className="w-4 h-4 text-emerald-600" />
          تاریخچه تراکنش‌ها و رسیدهای ثبت‌شده
        </h3>

        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                  <th className="py-2.5 px-3">کد رهگیری</th>
                  <th className="py-2.5 px-3">مبلغ پرداختی</th>
                  <th className="py-2.5 px-3">روش پرداخت</th>
                  <th className="py-2.5 px-3">تاریخ و ساعت</th>
                  <th className="py-2.5 px-3">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((p) => (
                  <tr key={p.id} className="text-slate-700 dark:text-slate-300">
                    <td className="py-3 px-3 font-mono font-bold">{p.tracking_number}</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600">
                      {formatPrice(p.amount)} تومان
                    </td>
                    <td className="py-3 px-3">{p.method_display || p.method}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {p.paid_at?.slice(0, 16).replace('T', ' ')}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> قطعی
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            هنوز تراکنش پرداختی برای این شناگر ثبت نشده است.
          </div>
        )}
      </div>
    </div>
  );
};
