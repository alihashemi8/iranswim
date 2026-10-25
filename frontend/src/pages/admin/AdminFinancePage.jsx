import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, DollarSign, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { StatsCard } from '../../components/common/StatsCard';

export const AdminFinancePage = () => {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Record payment modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payForm, setPayForm] = useState({
    amount: '',
    method: 'POS',
    transaction_ref: '',
    notes: '',
  });
  const [paying, setPaying] = useState(false);

  const fetchFinance = async () => {
    try {
      setLoading(true);
      const [invRes, sumRes] = await Promise.all([
        api.get('/finance/invoices/'),
        api.get('/finance/summary/'),
      ]);
      setInvoices(invRes.data.results || invRes.data);
      setSummary(sumRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      setPaying(true);
      await api.post('/finance/payments/record/', {
        swimmer_id: selectedInvoice.swimmer,
        invoice_id: selectedInvoice.id,
        amount: payForm.amount,
        method: payForm.method,
        transaction_ref: payForm.transaction_ref,
        notes: payForm.notes,
        idempotency_key: `adm-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      });
      setIsPayModalOpen(false);
      setPayForm({ amount: '', method: 'POS', transaction_ref: '', notes: '' });
      fetchFinance();
    } catch (err) {
      alert(err.response?.data?.detail || 'خطا در ثبت پرداخت');
    } finally {
      setPaying(false);
    }
  };

  const statusBadges = {
    PAID: { label: 'تسویه کامل', variant: 'success' },
    PARTIALLY_PAID: { label: 'بخشی پرداخت‌شده', variant: 'warning' },
    ISSUED: { label: 'پرداخت‌نشده', variant: 'danger' },
    CANCELLED: { label: 'باطل‌شده', variant: 'neutral' },
  };

  const formatPrice = (val) => Number(val || 0).toLocaleString('fa-IR');

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-sky-600" />
            امور مالی، صورتحساب‌ها و اقساط آموزشگاه
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ثبت تراکنش‌های قطعی، تخصیص اقساط، کنترل مانده بدهی و حسابداری دقیق شناگران
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="کل صورتحساب‌های صادرشده"
          value={`${formatPrice(summary?.total_invoiced)} تومان`}
          subtitle="مبلغ کل دوره‌های ثبت‌شده"
          icon={FileText}
          color="sky"
        />
        <StatsCard
          title="کل مبالغ وصول‌شده"
          value={`${formatPrice(summary?.total_paid)} تومان`}
          subtitle="تراکنش‌های قطعی بانکی و پوز"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatsCard
          title="مانده مطالبات آموزشگاه"
          value={`${formatPrice(summary?.receivables)} تومان`}
          subtitle="بدهی شناگران"
          icon={AlertCircle}
          color={(summary?.receivables || 0) > 0 ? 'amber' : 'emerald'}
        />
        <StatsCard
          title="اقساط سررسید گذشته"
          value={`${summary?.overdue_installments_count ?? 0} قسط`}
          subtitle="نیازمند پیگیری مالی"
          icon={CreditCard}
          color={(summary?.overdue_installments_count || 0) > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Invoices Table */}
      {loading ? (
        <LoadingState message="در حال بارگذاری صورتحساب‌ها..." />
      ) : invoices.length === 0 ? (
        <EmptyState title="هیچ صورتحسابی یافت نشد" description="هنوز فاکتوری برای شناگران صادر نشده است." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200/80">
                <tr>
                  <th className="px-4 py-3.5">شماره فاکتور</th>
                  <th className="px-4 py-3.5">نام شناگر</th>
                  <th className="px-4 py-3.5">مبلغ کل فاکتور</th>
                  <th className="px-4 py-3.5">مبلغ پرداختی</th>
                  <th className="px-4 py-3.5">مانده بدهی</th>
                  <th className="px-4 py-3.5">سررسید نهایی</th>
                  <th className="px-4 py-3.5">وضعیت</th>
                  <th className="px-4 py-3.5 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const meta = statusBadges[inv.status] || { label: inv.status, variant: 'neutral' };
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-800">
                        {inv.invoice_number}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-900">{inv.swimmer_name}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-800">
                        {formatPrice(inv.total_amount)} تومان
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-emerald-600 font-semibold">
                        {formatPrice(inv.total_paid)} تومان
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-rose-600 font-semibold">
                        {formatPrice(inv.remaining_balance)} تومان
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 font-mono">
                        {inv.due_date}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {Number(inv.remaining_balance) > 0 ? (
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setPayForm({ ...payForm, amount: inv.remaining_balance });
                              setIsPayModalOpen(true);
                            }}
                            className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium text-xs rounded-lg border border-emerald-200 transition-colors"
                          >
                            ثبت پرداخت
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-medium">تسویه کامل ✓</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Recording Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={`ثبت پرداخت برای فاکتور ${selectedInvoice?.invoice_number} (${selectedInvoice?.swimmer_name})`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between">
            <span className="text-slate-500">مانده بدهی این فاکتور:</span>
            <span className="font-bold text-rose-600 font-mono">
              {formatPrice(selectedInvoice?.remaining_balance)} تومان
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">مبلغ پرداختی (تومان):</label>
            <input
              type="number"
              required
              value={payForm.amount}
              onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
              className="w-full text-sm bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">روش پرداخت:</label>
              <select
                value={payForm.method}
                onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
                className="w-full text-sm bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="POS">دستگاه پوز کارتخوان حضوری</option>
                <option value="CARD_TRANSFER">کارت به کارت / شبا</option>
                <option value="CASH">نقدی</option>
                <option value="ONLINE_GATEWAY">درگاه آنلاین</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">شماره پیگیری / مرجع بانکی:</label>
              <input
                type="text"
                value={payForm.transaction_ref}
                onChange={(e) => setPayForm({ ...payForm, transaction_ref: e.target.value })}
                placeholder="POS-98432"
                className="w-full text-sm bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">توضیحات و یادداشت تراکنش:</label>
            <input
              type="text"
              value={payForm.notes}
              onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
              placeholder="تسویه قسط اول شهریه..."
              className="w-full text-sm bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setIsPayModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" loading={paying}>
              ثبت قطعی پرداخت
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
