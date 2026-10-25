import React, { useState, useEffect } from 'react';
import { Waves, Calendar, Clock, MapPin, Award, CheckCircle2, ArrowRight, ShieldCheck, UserPlus } from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { Link } from 'react-router-dom';

export const HomePage = () => {
  const [courses, setCourses] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Online request modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [form, setForm] = useState({
    applicant_name: '',
    applicant_phone: '',
    applicant_national_id: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cRes, nRes] = await Promise.all([
          api.get('/education/courses/?status=ACTIVE'),
          api.get('/content/news/'),
        ]);
        setCourses(cRes.data.results || cRes.data);
        setNews(nRes.data.results || nRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEnrollmentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse || !selectedGroup) return;
    try {
      setSubmitting(true);
      await api.post('/education/requests/submit/', {
        applicant_name: form.applicant_name,
        applicant_phone: form.applicant_phone,
        applicant_national_id: form.applicant_national_id,
        notes: form.notes,
        course: selectedCourse.id,
        group: selectedGroup.id,
      });
      setSubmitted(true);
      setForm({ applicant_name: '', applicant_phone: '', applicant_national_id: '', notes: '' });
    } catch (err) {
      alert(err.response?.data?.detail || 'خطا در ارسال درخواست');
    } finally {
      setSubmitting(false);
    }
  };

  const openEnrollmentModal = (course, group) => {
    setSelectedCourse(course);
    setSelectedGroup(group);
    setSubmitted(false);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-slate-50 py-16 sm:py-24 border-b border-slate-200/60 rounded-3xl p-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-100/80 text-sky-800 text-xs font-semibold rounded-full border border-sky-200">
            <Waves className="w-3.5 h-3.5" />
            سامانه یکپارچه آموزش و مدیریت شنای ایران
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            آموزش اصولی، پایش پیشرفت و استانداردهای حرفه‌ای شنا
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            از سطح مقدماتی تا قهرمانی؛ زمان‌بندی منظم کلاس‌ها، سیستم دقیق حضور و غیاب، گزارش مالی شفاف و جدول رده‌بندی لیگ
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/login"
              className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-xl shadow-xs transition-colors text-sm"
            >
              ورود به پنل کاربری
            </Link>
            <a
              href="#courses"
              className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl border border-slate-200 shadow-xs transition-colors text-sm"
            >
              مشاهده دوره‌ها و ثبت‌نام آنلاین
            </a>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">دوره‌های آموزشی فعال</h2>
            <p className="text-sm text-slate-500 mt-1">انتخاب دوره و گروه متناسب با سطح مهارت و زمان‌بندی شما</p>
          </div>
          <span className="text-xs font-mono text-slate-400">{courses.length} دوره فعال</span>
        </div>

        {loading ? (
          <LoadingState message="در حال بارگذاری دوره‌های آموزشی..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="text-base font-bold text-slate-900">{course.name}</h3>
                    <span className="font-bold font-mono text-sm text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
                      {Number(course.base_price).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">{course.description || 'آموزش تخصصی تکنیک‌های شنا'}</p>

                  <div className="text-xs text-slate-600 space-y-1.5 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>طول دوره: {course.sessions_count} جلسه آموزشی</span>
                    </div>
                  </div>

                  {/* Groups in this course */}
                  <div className="mt-4 space-y-3">
                    <span className="text-xs font-semibold text-slate-700 block">گروه‌های اجرایی این دوره:</span>
                    {course.groups?.map((grp) => (
                      <div key={grp.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between gap-2">
                        <div>
                          <span className="font-medium text-xs text-slate-800 block">{grp.name}</span>
                          <span className="text-[11px] text-slate-500">{grp.pool_location}</span>
                        </div>
                        <div className="text-left flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-600">
                            {grp.remaining_capacity > 0 ? `${grp.remaining_capacity} جای خالی` : 'تکمیل ظرفیت'}
                          </span>
                          <Button
                            size="sm"
                            variant={grp.remaining_capacity > 0 ? 'primary' : 'secondary'}
                            disabled={grp.remaining_capacity <= 0}
                            onClick={() => openEnrollmentModal(course, grp)}
                            className="text-xs px-2.5 py-1"
                          >
                            {grp.remaining_capacity > 0 ? 'ثبت‌نام آنلاین' : 'فهرست انتظار'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Online Enrollment Request Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`درخواست ثبت‌نام آنلاین - ${selectedCourse?.name}`}
      >
        {submitted ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">درخواست شما با موفقیت ثبت گردید!</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              مدیریت آموزشگاه درخواست شما را بررسی نموده و پس از تأیید، پیامک و اطلاعات ورود به پرتال برای شما ارسال خواهد شد.
            </p>
            <div className="pt-3">
              <Button onClick={() => setIsModalOpen(false)}>بستن پنجره</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleEnrollmentSubmit} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between">
              <span>گروه انتخابی:</span>
              <span className="font-semibold text-slate-800">{selectedGroup?.name}</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">نام و نام خانوادگی شناگر / متقاضی:</label>
              <input
                type="text"
                required
                value={form.applicant_name}
                onChange={(e) => setForm({ ...form, applicant_name: e.target.value })}
                placeholder="مثال: آرتین رضایی"
                className="w-full text-sm bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">شماره همراه متقاضی:</label>
                <input
                  type="tel"
                  required
                  value={form.applicant_phone}
                  onChange={(e) => setForm({ ...form, applicant_phone: e.target.value })}
                  placeholder="09123456789"
                  className="w-full text-sm bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">کد ملی (اختیاری):</label>
                <input
                  type="text"
                  value={form.applicant_national_id}
                  onChange={(e) => setForm({ ...form, applicant_national_id: e.target.value })}
                  placeholder="0012345678"
                  className="w-full text-sm bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">توضیحات یا سابقه شنا:</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="توضیحاتی در مورد سابقه قبلی یا سن شناگر..."
                className="w-full text-sm bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>انصراف</Button>
              <Button type="submit" loading={submitting}>ارسال نهایی درخواست</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
