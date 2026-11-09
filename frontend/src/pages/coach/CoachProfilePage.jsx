import React, { useState, useEffect } from 'react';
import {
  UserCheck, Shield, Key, Bell, CheckCircle2,
  Lock, Phone, BookOpen, AlertCircle, Save, Calendar, CreditCard,
  FileText, Award, Download, Plus, Clock, Star, X
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { useToast } from '../../context/ToastContext';
import { validatePassword, PasswordRequirementsList } from '../../utils/passwordValidator';

export const CoachProfilePage = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PROFILE'); // PROFILE, CONTRACTS, PAYROLL, LEAVES, EVALUATIONS

  // Tab Data States
  const [contracts, setContracts] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [evaluations, setEvaluations] = useState([]);

  // Form states
  const [specialties, setSpecialties] = useState('');
  const [bio, setBio] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [address, setAddress] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  // Submit Leave Request Modal State (Coach self-service)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'CASUAL',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    hours_requested: 0,
    reason: '',
  });
  const [leaveFile, setLeaveFile] = useState(null);
  const [submittingLeave, setSubmittingLeave] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/coaches/dashboard-overview/');
      const c = res.data.coach || {};
      setProfile(c);
      setSpecialties(c.specialties || '');
      setBio(c.bio || '');

      if (c.id) {
        // Fetch coach's own records in parallel
        const [contractsRes, payrollsRes, leavesRes, evalsRes, fullCoachRes] = await Promise.all([
          api.get(`/coaches/${c.id}/contracts/`).catch(() => ({ data: [] })),
          api.get(`/coaches/${c.id}/payrolls/`).catch(() => ({ data: [] })),
          api.get(`/coaches/${c.id}/leave-requests/`).catch(() => ({ data: [] })),
          api.get(`/coaches/${c.id}/evaluations/`).catch(() => ({ data: [] })),
          api.get(`/coaches/${c.id}/`).catch(() => ({ data: {} })),
        ]);

        setContracts(contractsRes.data || []);
        setPayrolls(payrollsRes.data || []);
        setLeaves(leavesRes.data || []);
        setEvaluations(evalsRes.data || []);

        if (fullCoachRes.data) {
          setEmergencyName(fullCoachRes.data.emergency_contact_name || '');
          setEmergencyPhone(fullCoachRes.data.emergency_contact_phone || '');
          setAddress(fullCoachRes.data.address || '');
        }
      }
    } catch (err) {
      console.error('Error fetching coach profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      if (profile?.id) {
        await api.patch(`/coaches/${profile.id}/`, {
          specialties,
          bio,
          emergency_contact_name: emergencyName,
          emergency_contact_phone: emergencyPhone,
          address,
        });
        toast.success('مشخصات فردی با موفقیت به‌روزرسانی شد.');
      }
    } catch (err) {
      console.error(err);
      toast.error('خطا در به‌روزرسانی اطلاعات مربی');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      toast.error(validation.firstError || 'رمز عبور با معیارهای امنیتی مطابقت ندارد.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('تکرار کلمه عبور جدید مطابقت ندارد.');
      return;
    }

    try {
      setChangingPass(true);
      await api.post('/auth/change-password/', {
        old_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('کلمه عبور با موفقیت تغییر یافت.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در تغییر کلمه عبور');
    } finally {
      setChangingPass(false);
    }
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.start_date || !leaveForm.end_date || !leaveForm.reason.trim()) {
      toast.error('تاریخ شروع، پایان و دلیل مرخصی الزامی است.');
      return;
    }

    try {
      setSubmittingLeave(true);
      const formData = new FormData();
      formData.append('leave_type', leaveForm.leave_type);
      formData.append('start_date', leaveForm.start_date);
      formData.append('end_date', leaveForm.end_date);
      formData.append('hours_requested', leaveForm.hours_requested);
      formData.append('reason', leaveForm.reason.trim());
      if (leaveFile) formData.append('document', leaveFile);

      await api.post(`/coaches/${profile.id}/leave-requests/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('درخواست مرخصی با موفقیت برای مدیریت ارسال گردید.');
      setIsLeaveModalOpen(false);
      setLeaveForm({
        leave_type: 'CASUAL',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        hours_requested: 0,
        reason: '',
      });
      setLeaveFile(null);
      fetchProfile();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت درخواست مرخصی');
    } finally {
      setSubmittingLeave(false);
    }
  };

  const formatPrice = (v) => Number(v || 0).toLocaleString('en-US');

  if (loading) {
    return <LoadingState type="dashboard" message="در حال دریافت اطلاعات پرونده مربی..." />;
  }

  const coachTabs = [
    { id: 'PROFILE', label: 'مشخصات و امنیت حساب', icon: UserCheck },
    { id: 'CONTRACTS', label: 'احکام و قراردادهای من', icon: FileText, count: contracts.length },
    { id: 'PAYROLL', label: 'فیش‌های حقوق و واریزی‌ها', icon: CreditCard, count: payrolls.length },
    { id: 'LEAVES', label: 'درخواست‌های مرخصی من', icon: Calendar, count: leaves.filter((l) => l.status === 'PENDING').length },
    { id: 'EVALUATIONS', label: 'سوابق ارزیابی عملکرد', icon: Award, count: evaluations.length },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <UserCheck className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600" />
          پروفایل، قراردادها و امور مالی مربی
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1 font-medium">
          مشاهده احکام کاری، فیش‌های حقوقی مصوب، ثبت مرخصی و تنظیمات حساب کاربری
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col sm:flex-row items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-3xl shadow-md shrink-0">
          {profile?.full_name?.charAt(0) || user?.first_name?.charAt(0) || 'م'}
        </div>
        <div className="space-y-1.5 text-center sm:text-right flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">
              {profile?.full_name || user?.phone}
            </h2>
            <Badge variant="success" className="text-xs sm:text-sm px-3 py-1 font-bold">مربی رسمی آکادمی</Badge>
            {profile?.personnel_id && (
              <span className="font-mono text-xs sm:text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg">
                کد پرسنلی: {profile.personnel_id}
              </span>
            )}
          </div>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 flex items-center justify-center sm:justify-start gap-1.5 font-mono font-medium">
            <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {user?.phone}
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-x-auto">
        {coachTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full font-mono text-slate-800 dark:text-slate-200 font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Profile & Security */}
      {activeTab === 'PROFILE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Professional Details Form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              مشخصات فردی و تماس
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-sm sm:text-base">
              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1.5 text-sm sm:text-base">
                  تخصص‌های ورزشی شنا:
                </label>
                <input
                  type="text"
                  placeholder="مثال: کرال سینه، شنای پروانه"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white text-sm sm:text-base font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1.5 text-sm sm:text-base">
                  نام مخاطب اضطراری:
                </label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white text-sm sm:text-base font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1.5 text-sm sm:text-base">
                  تلفن تماس اضطراری:
                </label>
                <input
                  type="text"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white font-mono text-sm sm:text-base font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1.5 text-sm sm:text-base">
                  آدرس محل سکونت:
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white text-sm sm:text-base font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1.5 text-sm sm:text-base">
                  بیوگرافی و رزومه رسمی:
                </label>
                <textarea
                  rows="3"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white leading-relaxed text-sm sm:text-base font-medium"
                />
              </div>

              <Button
                type="submit"
                loading={savingProfile}
                className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 gap-2 text-sm sm:text-base"
              >
                <Save className="w-5 h-5" />
                ذخیره تغییرات مشخصات
              </Button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Lock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              تغییر کلمه عبور
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4 text-sm sm:text-base">
              <PasswordRequirementsList password={newPassword} showAlways={true} />

              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1.5 text-sm sm:text-base">
                  کلمه عبور فعلی:
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white font-mono text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1.5 text-sm sm:text-base">
                  کلمه عبور جدید:
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="حداقل ۸ نویسه..."
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white font-mono text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1.5 text-sm sm:text-base">
                  تکرار کلمه عبور جدید:
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-slate-900 dark:text-white font-mono text-sm sm:text-base"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="outline"
                loading={changingPass}
                className="w-full justify-center font-bold py-2.5 text-sm sm:text-base"
              >
                به‌روزرسانی کلمه عبور
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Contracts */}
      {activeTab === 'CONTRACTS' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <FileText className="w-5 h-5 text-emerald-600" />
            احکام و قراردادهای همکاری منعقدشده
          </h3>

          {contracts.length === 0 ? (
            <p className="text-slate-400 text-sm sm:text-base text-center py-8">قراردادی ثبت نشده است.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm sm:text-base">
              {contracts.map((c) => (
                <div key={c.id} className="py-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold font-mono text-base sm:text-lg text-emerald-700 dark:text-emerald-400">
                        {c.contract_number}
                      </span>
                      <Badge variant={c.status === 'ACTIVE' ? 'success' : 'neutral'} className="text-xs sm:text-sm font-bold">
                        {c.status_display}
                      </Badge>
                    </div>

                    {c.document_url && (
                      <a
                        href={c.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm text-sky-600 hover:text-sky-700 font-bold inline-flex items-center gap-1.5"
                      >
                        <Download className="w-4 h-4" />
                        <span>دانلود قرارداد</span>
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                    <div>نوع: <strong className="text-slate-900 dark:text-slate-100 font-bold">{c.contract_type_display}</strong></div>
                    <div>مدل: <strong className="text-slate-900 dark:text-slate-100 font-bold">{c.employment_type_display}</strong></div>
                    <div>شروع: <strong className="font-mono text-slate-900 dark:text-slate-100 font-bold">{new Date(c.start_date).toLocaleDateString('fa-IR')}</strong></div>
                    <div>پایان: <strong className="font-mono text-slate-900 dark:text-slate-100 font-bold">{new Date(c.end_date).toLocaleDateString('fa-IR')}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Payroll */}
      {activeTab === 'PAYROLL' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            فیش‌های حقوقی و تاریخچه واریزها
          </h3>

          {payrolls.length === 0 ? (
            <p className="text-slate-400 text-sm sm:text-base text-center py-8">فیش حقوقی صادر نشده است.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="py-3 px-3.5">دوره</th>
                    <th className="py-3 px-3.5">ساعات تدریس</th>
                    <th className="py-3 px-3.5">جلسات</th>
                    <th className="py-3 px-3.5">خالص پرداختی</th>
                    <th className="py-3 px-3.5">واریزشده</th>
                    <th className="py-3 px-3.5">مانده</th>
                    <th className="py-3 px-3.5">وضعیت تسویه</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payrolls.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white text-sm sm:text-base">{p.period_label}</td>
                      <td className="py-3 px-3.5 font-mono text-sm sm:text-base">{p.teaching_hours} ساعت</td>
                      <td className="py-3 px-3.5 font-mono text-sm sm:text-base">{p.completed_sessions_count} جلسه</td>
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900 dark:text-white text-sm sm:text-base">{formatPrice(p.net_payable_amount)} ت</td>
                      <td className="py-3 px-3.5 font-mono text-emerald-600 font-bold text-sm sm:text-base">{formatPrice(p.total_paid)} ت</td>
                      <td className="py-3 px-3.5 font-mono text-rose-600 font-bold text-sm sm:text-base">{formatPrice(p.remaining_balance)} ت</td>
                      <td className="py-3 px-3.5">
                        <Badge variant={p.payment_status === 'PAID' ? 'success' : 'warning'} className="text-xs sm:text-sm font-bold">
                          {p.payment_status_display}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Leaves */}
      {activeTab === 'LEAVES' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              درخواست‌های مرخصی مربی
            </h3>

            <Button
              size="sm"
              onClick={() => setIsLeaveModalOpen(true)}
              className="gap-1.5 text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Plus className="w-4 h-4" />
              <span>ارسال تقاضای مرخصی</span>
            </Button>
          </div>

          {leaves.length === 0 ? (
            <p className="text-slate-400 text-sm sm:text-base text-center py-8">درخواست مرخصی ثبت نشده است.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="py-3 px-3.5">نوع مرخصی</th>
                    <th className="py-3 px-3.5">از تاریخ</th>
                    <th className="py-3 px-3.5">تا تاریخ</th>
                    <th className="py-3 px-3.5">علت</th>
                    <th className="py-3 px-3.5">وضعیت بررسی</th>
                    <th className="py-3 px-3.5">یادداشت مدیریت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {leaves.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">{l.leave_type_display}</td>
                      <td className="py-3 px-3.5 font-mono text-sm sm:text-base">{new Date(l.start_date).toLocaleDateString('fa-IR')}</td>
                      <td className="py-3 px-3.5 font-mono text-sm sm:text-base">{new Date(l.end_date).toLocaleDateString('fa-IR')}</td>
                      <td className="py-3 px-3.5 text-sm sm:text-base text-slate-800 dark:text-slate-200">{l.reason}</td>
                      <td className="py-3 px-3.5">
                        <Badge variant={l.status === 'APPROVED' ? 'success' : l.status === 'PENDING' ? 'warning' : 'error'} className="text-xs sm:text-sm font-bold">
                          {l.status_display}
                        </Badge>
                      </td>
                      <td className="py-3 px-3.5 text-sm sm:text-base text-slate-500 dark:text-slate-400">{l.admin_notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Evaluations */}
      {activeTab === 'EVALUATIONS' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Award className="w-5 h-5 text-amber-500" />
            سوابق ارزیابی عملکرد و بازخوردهای آموزشی
          </h3>

          {evaluations.length === 0 ? (
            <p className="text-slate-400 text-sm sm:text-base text-center py-8">ارزیابی ثبت‌شده‌ای موجود نیست.</p>
          ) : (
            <div className="space-y-4 text-sm sm:text-base">
              {evaluations.map((ev) => (
                <div key={ev.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 dark:text-white text-base sm:text-lg">{ev.period_label}</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-3 py-1 rounded-full text-sm sm:text-base">
                      ★ نمره: {ev.overall_score} از ۵
                    </span>
                  </div>

                  {ev.general_feedback && (
                    <p className="text-slate-700 dark:text-slate-200 leading-relaxed bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 text-sm sm:text-base">
                      بازخورد ارزیاب: {ev.general_feedback}
                    </p>
                  )}

                  {ev.recommendations && (
                    <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-medium">
                      توصیه‌های بهبود: {ev.recommendations}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Submit Leave */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="ارسال تقاضای مرخصی به مدیریت"
      >
        <form onSubmit={handleSubmitLeave} className="space-y-4 text-sm sm:text-base">
          <div>
            <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1.5 text-sm sm:text-base">
              نوع مرخصی <span className="text-rose-500">*</span>
            </label>
            <select
              value={leaveForm.leave_type}
              onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
              className="w-full text-sm sm:text-base p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="CASUAL">مرخصی استحقاقی / روزانه</option>
              <option value="SICK">مرخصی استعلاجی (پزشکی)</option>
              <option value="HOURLY">مرخصی ساعتی</option>
              <option value="EMERGENCY">مرخصی اضطراری</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1.5 text-sm sm:text-base">
                از تاریخ <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={leaveForm.start_date}
                onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                className="w-full text-sm sm:text-base p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1.5 text-sm sm:text-base">
                تا تاریخ <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={leaveForm.end_date}
                onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                className="w-full text-sm sm:text-base p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1.5 text-sm sm:text-base">
              علت مرخصی <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              className="w-full text-sm sm:text-base p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-200 font-medium mb-1.5 text-sm sm:text-base">
              پیوست گواهی یا مدارک (اختیاری)
            </label>
            <input
              type="file"
              onChange={(e) => setLeaveFile(e.target.files[0])}
              accept="image/*,.pdf"
              className="w-full text-sm p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsLeaveModalOpen(false)} className="text-sm font-bold">
              انصراف
            </Button>
            <Button type="submit" disabled={submittingLeave} className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold">
              {submittingLeave ? 'در حال ارسال...' : 'ارسال درخواست'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
