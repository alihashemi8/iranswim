import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award, CheckCircle2, Clock, XCircle, AlertCircle,
  PlusCircle, Users, ChevronLeft, ShieldCheck, Search
} from 'lucide-react';
import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';

export const CoachExamsPage = () => {
  const [proposals, setProposals] = useState([]);
  const [swimmers, setSwimmers] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Proposal Form
  const [showModal, setShowModal] = useState(false);
  const [selectedSwimmerId, setSelectedSwimmerId] = useState('');
  const [currentLevelId, setCurrentLevelId] = useState('');
  const [proposedLevelId, setProposedLevelId] = useState('');
  const [coachNotes, setCoachNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [propRes, enrRes, lvlRes] = await Promise.all([
        api.get('/assessments/promotions/'),
        api.get('/education/enrollments/'),
        api.get('/education/levels/'),
      ]);

      setProposals(propRes.data.results || propRes.data || []);

      const enrList = enrRes.data.results || enrRes.data || [];
      const uniqueSwimmersMap = {};
      enrList.forEach((e) => {
        if (!uniqueSwimmersMap[e.swimmer]) {
          uniqueSwimmersMap[e.swimmer] = {
            id: e.swimmer,
            name: e.swimmer_name,
            group_name: e.group_name,
          };
        }
      });
      const swimmerArr = Object.values(uniqueSwimmersMap);
      setSwimmers(swimmerArr);
      if (swimmerArr.length > 0) {
        setSelectedSwimmerId(swimmerArr[0].id);
      }

      const lvlList = lvlRes.data || [];
      setLevels(lvlList);
      if (lvlList.length >= 2) {
        setCurrentLevelId(lvlList[0].id);
        setProposedLevelId(lvlList[1].id);
      }
    } catch (err) {
      console.error('Error fetching exams and proposals:', err);
      toast.error('خطا در دریافت اطلاعات آزمون‌ها و سطح‌بندی');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSwimmerId || !proposedLevelId || !coachNotes) {
      toast.error('لطفاً تمام فیلدهای الزامی را تکمیل کنید.');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/assessments/promotions/', {
        swimmer: Number(selectedSwimmerId),
        current_level: Number(currentLevelId || levels[0]?.id),
        proposed_level: Number(proposedLevelId),
        coach_notes: coachNotes,
      });
      toast.success('پیشنهاد ارتقای سطح برای تأیید مدیر آموزشگاه ارسال شد.');
      setShowModal(false);
      setCoachNotes('');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت پیشنهاد ارتقا');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState type="table" message="در حال دریافت آزمون‌ها و پیشنهادهای سطح‌بندی..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Award className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" />
            آزمون‌ها و سطح‌بندی شناگران
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            سنجش رسمی پایان دوره، ارزیابی سرفصل‌های مصوب و ارائه پیشنهاد ارتقای سطح
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowModal(true)}
          className="gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm sm:text-base px-4 py-2.5"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          ثبت پیشنهاد ارتقای سطح
        </Button>
      </div>

      {/* Access Boundary Alert */}
      <div className="bg-purple-50/70 dark:bg-purple-950/20 rounded-2xl border border-purple-200 dark:border-purple-900/60 p-4.5 flex items-start gap-3.5">
        <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="text-sm text-purple-900 dark:text-purple-200 leading-relaxed">
          <span className="font-bold">مرز دسترسی و گردش کار آموزشی:</span> مربی می‌تواند آزمون عملی را برگزار نموده، شواهد تسلط را ثبت و پیشنهاد ارتقای سطح دهد. با این حال، تغییر نهایی سطح و صدور گواهی رسمی آموزشگاه مطابق خط‌مشی‌ها پس از بررسی مدیر یا مسئول آموزش نهایی می‌شود.
        </div>
      </div>

      {/* Proposals List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            تاریخچه پیشنهادهای ارتقای سطح ارسالی ({proposals.length} مورد)
          </h2>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {proposals.length > 0 ? (
            proposals.map((prop) => (
              <div
                key={prop.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-base text-slate-900 dark:text-white">
                      {prop.swimmer_name}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-500">
                      از <span className="font-semibold text-slate-700 dark:text-slate-300">{prop.current_level_name}</span> به{' '}
                      <span className="font-bold text-purple-600">{prop.proposed_level_name}</span>
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    <span className="font-bold text-slate-500">شرح شواهد مربی:</span> {prop.coach_notes}
                  </p>

                  {prop.reviewer_notes && (
                    <p className="text-sm text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 p-2.5 rounded-lg leading-relaxed">
                      <span className="font-bold">نظر مدیر آموزشگاه:</span> {prop.reviewer_notes}
                    </p>
                  )}

                  <span className="text-xs text-slate-400 block font-mono font-medium">
                    تاریخ ثبت: {new Date(prop.created_at).toLocaleDateString('fa-IR')}
                  </span>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold ${
                      prop.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : prop.status === 'REJECTED'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {prop.status === 'APPROVED' && <CheckCircle2 className="w-4 h-4" />}
                    {prop.status === 'REJECTED' && <XCircle className="w-4 h-4" />}
                    {prop.status === 'PENDING' && <Clock className="w-4 h-4" />}
                    {prop.status_display}
                  </span>

                  <Link
                    to={`/coach/progress/${prop.swimmer}`}
                    className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-purple-600 flex items-center gap-1 transition-colors"
                  >
                    پرونده شناگر
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">
              تاکنون هیچ پیشنهاد ارتقایی ثبت نکرده‌اید. با کلیک روی دکمه بالا می‌توانید شاگردان آماده را برای ارتقا معرفی کنید.
            </div>
          )}
        </div>
      </div>

      {/* New Proposal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              ثبت پیشنهاد ارتقای سطح شناگر
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">انتخاب شناگر:</label>
                <select
                  value={selectedSwimmerId}
                  onChange={(e) => setSelectedSwimmerId(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-800 dark:text-slate-200 text-sm font-medium"
                >
                  {swimmers.map((sw) => (
                    <option key={sw.id} value={sw.id}>
                      {sw.name} ({sw.group_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">سطح فعلی:</label>
                  <select
                    value={currentLevelId}
                    onChange={(e) => setCurrentLevelId(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-800 dark:text-slate-200 text-sm font-medium"
                  >
                    {levels.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>
                        {lvl.name} (سطح {lvl.order})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">سطح پیشنهادی جدید:</label>
                  <select
                    value={proposedLevelId}
                    onChange={(e) => setProposedLevelId(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-800 dark:text-slate-200 text-sm font-medium"
                  >
                    {levels.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>
                        {lvl.name} (سطح {lvl.order})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">شرح عملکرد و شواهد قبولی در آزمون:</label>
                <textarea
                  rows="4"
                  placeholder="ذکر مهارت‌های کسب‌شده، رکوردهای زمانی یا تسلط بر تکنیک‌های لازم..."
                  value={coachNotes}
                  onChange={(e) => setCoachNotes(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-800 dark:text-slate-200 text-sm leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="text-sm font-medium"
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={submitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm"
                >
                  ارسال پیشنهاد
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
