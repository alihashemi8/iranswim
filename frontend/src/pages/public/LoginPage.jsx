import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Waves, LogIn, KeyRound, Phone, ArrowRight, UserPlus,
  CreditCard, Sparkles, MessageSquare, Timer, CheckCircle2,
  AlertCircle, Eye, EyeOff, ShieldCheck, Trophy, Award, Droplets
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';

export const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'

  // Login Method: 'password' (phone + national_id / password) vs 'otp' (phone + sms code)
  const [loginMethod, setLoginMethod] = useState('password');
  const [showPassword, setShowPassword] = useState(false);

  // Form states: Login with password
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Form states: Login with OTP
  const [otpLoginPhone, setOtpLoginPhone] = useState('');
  const [otpLoginCode, setOtpLoginCode] = useState('');
  const [otpLoginSent, setOtpLoginSent] = useState(false);
  const [otpLoginTimer, setOtpLoginTimer] = useState(0);

  // Form states: Registration with OTP
  const [regPhone, setRegPhone] = useState('');
  const [regOtpCode, setRegOtpCode] = useState('');
  const [regOtpSent, setRegOtpSent] = useState(false);
  const [regOtpTimer, setRegOtpTimer] = useState(0);
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regNationalId, setRegNationalId] = useState('');

  const [error, setError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);

  const { user, login, sendOtp, loginWithOtp, registerWithOtp, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      redirectUser(user);
    }
  }, [user]);

  // Timers countdown
  useEffect(() => {
    let timer;
    if (otpLoginTimer > 0) {
      timer = setInterval(() => setOtpLoginTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpLoginTimer]);

  useEffect(() => {
    let timer;
    if (regOtpTimer > 0) {
      timer = setInterval(() => setRegOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [regOtpTimer]);

  const redirectUser = (userData) => {
    if (userData.role === 'SWIMMER') {
      if (!userData.is_profile_completed) {
        navigate('/swimmer/complete-profile');
      } else {
        navigate('/swimmer');
      }
      return;
    }

    switch (userData.role) {
      case 'SUPERVISOR':
        navigate('/supervisor');
        break;
      case 'ADMIN':
        navigate('/admin');
        break;
      case 'COACH':
        navigate('/coach');
        break;
      default:
        navigate('/');
    }
  };

  // Submit: Login with Password (Phone + National ID)
  const handlePasswordLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleanPhone = loginPhone.trim();
    if (!cleanPhone) {
      setError('شماره تلفن همراه را وارد نمایید.');
      return;
    }
    if (!loginPassword) {
      setError('رمز عبور (کد ملی) را وارد نمایید.');
      return;
    }

    const res = await login(cleanPhone, loginPassword);
    if (res.success) {
      toast.success(`ورود با موفقیت انجام شد. خوش آمدید ${res.user.full_name}!`);
      redirectUser(res.user);
    } else {
      setError(res.error);
      toast.error(res.error || 'ورود ناموفق بود.');
    }
  };

  // Send OTP for Login
  const handleSendLoginOtp = async () => {
    const cleanPhone = otpLoginPhone.trim();
    if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith('09')) {
      setError('شماره تلفن همراه باید ۱۱ رقم بوده و با ۰۹ آغاز شود.');
      toast.error('لطفاً شماره تلفن همراه معتبر وارد نمایید.');
      return;
    }

    setError('');
    setSendingOtp(true);
    const res = await sendOtp(cleanPhone, 'LOGIN');
    setSendingOtp(false);

    if (res.success) {
      setOtpLoginSent(true);
      setOtpLoginTimer(120);
      if (res.data?.code) {
        setOtpLoginCode(res.data.code);
        toast.info(`کد تایید پیامکی ارسال شد: ${res.data.code}`);
      } else {
        toast.success('کد تأیید یکبار مصرف به شماره همراه شما پیامک گردید.');
      }
    } else {
      setError(res.error);
      toast.error(res.error || 'خطا در ارسال پیامک.');
    }
  };

  // Submit: Login with OTP
  const handleOtpLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!otpLoginCode.trim()) {
      setError('لطفاً کد تایید پیامکی را وارد فرمایید.');
      return;
    }

    const res = await loginWithOtp(otpLoginPhone.trim(), otpLoginCode.trim());
    if (res.success) {
      toast.success(`خوش آمدید ${res.user.full_name}! ورود با رمز یکبار مصرف انجام شد.`);
      redirectUser(res.user);
    } else {
      setError(res.error);
      toast.error(res.error || 'کد تایید نامعتبر یا منقضی شده است.');
    }
  };

  // Send OTP for Register
  const handleSendRegisterOtp = async () => {
    const cleanPhone = regPhone.trim();
    if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith('09')) {
      setError('شماره تلفن همراه باید ۱۱ رقم بوده و با ۰۹ آغاز شود.');
      toast.error('شماره همراه نامعتبر است.');
      return;
    }

    setError('');
    setSendingOtp(true);
    const res = await sendOtp(cleanPhone, 'REGISTER');
    setSendingOtp(false);

    if (res.success) {
      setRegOtpSent(true);
      setRegOtpTimer(120);
      if (res.data?.code) {
        setRegOtpCode(res.data.code);
        toast.info(`کد تایید پیامکی ثبت‌نام ارسال شد: ${res.data.code}`);
      } else {
        toast.success('کد تأیید یکبار مصرف به شماره همراه شما ارسال شد.');
      }
    } else {
      setError(res.error);
      toast.error(res.error || 'خطا در ارسال پیامک.');
    }
  };

  // Submit: Register with OTP
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!regOtpSent) {
      setError('لطفاً ابتدا روی دکمه دریافت کد تایید پیامکی کلیک کنید.');
      return;
    }

    if (!regOtpCode.trim()) {
      setError('کد تأیید پیامکی الزامی است.');
      return;
    }

    if (!regFirstName.trim() || !regLastName.trim()) {
      setError('نام و نام خانوادگی الزامی است.');
      return;
    }

    const cleanNationalId = regNationalId.trim();
    if (!cleanNationalId || cleanNationalId.length !== 10 || !/^\d+$/.test(cleanNationalId)) {
      setError('کد ملی باید ۱۰ رقم عددی معتبر باشد.');
      return;
    }

    const res = await registerWithOtp({
      phone: regPhone.trim(),
      code: regOtpCode.trim(),
      first_name: regFirstName.trim(),
      last_name: regLastName.trim(),
      national_id: cleanNationalId,
    });

    if (res.success) {
      toast.success('ثبت‌نام شما با موفقیت انجام شد! در حال هدایت به تکمیل مدارک شناگر...');
      navigate('/swimmer/complete-profile');
    } else {
      setError(res.error);
      toast.error(res.error || 'ثبت‌نام ناموفق بود.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Main Container Card */}
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[2.25rem] border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all">
        
        {/* ============================================================== */}
        {/* RIGHT COLUMN (DESKTOP HERO / BRANDING PANEL)                   */}
        {/* ============================================================== */}
        <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-10 text-white overflow-hidden bg-slate-950">
          {/* Background swimming imagery with rich gradient overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=1200&q=80')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-sky-950/85 to-indigo-950/80 backdrop-blur-[1px]" />

          {/* Top Brand Tag */}
          <div className="relative z-10 space-y-3">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-11 h-11 bg-gradient-to-tr from-sky-500 to-cyan-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-500/30 group-hover:scale-105 transition-transform">
                <Waves className="w-6 h-6" />
              </div>
              <div className="text-right">
                <span className="font-extrabold text-base tracking-tight block">آکادمی شنای ایران</span>
                <span className="text-[10px] text-cyan-200 font-light block">IranSwim Federation Platform</span>
              </div>
            </Link>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[11px] font-semibold text-cyan-200 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              سامانه یکپارچه مربیان و شناگران
            </div>
          </div>

          {/* Center Motivational & Feature highlight */}
          <div className="relative z-10 my-8 space-y-4">
            <h1 className="text-2xl xl:text-3xl font-extrabold tracking-tight leading-snug text-white">
              پرواز در آب با استانداردهای فدراسیون جهانی
            </h1>
            <p className="text-xs xl:text-sm text-slate-300 leading-relaxed font-light">
              پایش تکنیک‌های آب‌نوردی، رزرو هوشمند سانس‌های استخر، سوابق رکوردهای زمان‌گیری و صدور بیمه ورزشی شناگر در پرتال جامع اختصاصی.
            </p>

            {/* Feature Cards Floating */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1">
                <Trophy className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-bold text-white block">رکوردهای زمان‌گیری</span>
                <span className="text-[10px] text-slate-300 block">ثبت میلی‌ثانیه‌ای تایم شنا</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span className="text-xs font-bold text-white block">بیمه و مدارک رسمی</span>
                <span className="text-[10px] text-slate-300 block">کارت سلامت و عضویت</span>
              </div>
            </div>
          </div>

          {/* Bottom Trust Badge */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-cyan-100 font-medium">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              پرتال رسمی استخرهای کشور
            </span>
            <span className="font-mono text-slate-400">نسخه ۲.۴</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* LEFT COLUMN (THE AUTH FORM)                                    */}
        {/* ============================================================== */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">

            {/* Mobile Header (Shown on small screens only) */}
            <div className="lg:hidden text-center pb-2">
              <Link to="/" className="inline-flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-gradient-to-tr from-sky-600 to-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-md">
                  <Waves className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-base text-slate-900 dark:text-white">آکادمی شنای ایران</span>
              </Link>
            </div>

            {/* Header Titles */}
            <div className="space-y-1 text-right">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {mode === 'login' ? 'ورود به حساب کاربری' : 'ثبت‌نام شناگر جدید'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mode === 'login'
                  ? 'نام کاربری: شماره تلفن همراه | رمز عبور: کد ملی شناگر'
                  : 'عضویت سریع با تأیید پیامکی (OTP) و صدور کارت شناگر'}
              </p>
            </div>

            {/* Primary Mode Tabs (ورود / ثبت‌نام) */}
            <div className="p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl flex text-xs font-bold gap-1 border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  mode === 'login'
                    ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>ورود به حساب</span>
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  mode === 'register'
                    ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>ثبت‌نام شناگر (با OTP)</span>
              </button>
            </div>

            {/* Error Message Box */}
            {error && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 rounded-2xl text-xs flex items-center gap-2 font-medium animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* ========================================================== */}
            {/* TAB 1: LOGIN                                               */}
            {/* ========================================================== */}
            {mode === 'login' && (
              <div className="space-y-4">
                {/* Method Switcher: Password vs OTP */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => { setLoginMethod('password'); setError(''); }}
                    className={`py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      loginMethod === 'password'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>ورود با رمز / کد ملی</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginMethod('otp'); setError(''); }}
                    className={`py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      loginMethod === 'otp'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>ورود با کد یکبار مصرف (OTP)</span>
                  </button>
                </div>

                {/* Sub-Form A: Login with Password (Phone + National ID) */}
                {loginMethod === 'password' ? (
                  <form onSubmit={handlePasswordLoginSubmit} className="space-y-4 pt-1">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-right">
                        نام کاربری (شماره تلفن همراه)
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                        <input
                          type="tel"
                          required
                          value={loginPhone}
                          onChange={(e) => setLoginPhone(e.target.value)}
                          placeholder="09123456789"
                          className="w-full text-sm font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pr-10 pl-3 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-left"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          رمز عبور (کد ملی شناگر یا رمز)
                        </label>
                        <button
                          type="button"
                          onClick={() => setLoginMethod('otp')}
                          className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-semibold"
                        >
                          فراموشی رمز؟ ورود با پیامک
                        </button>
                      </div>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="کد ملی یا رمز عبور"
                          className="w-full text-sm font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pr-10 pl-10 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-left"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      loading={loading}
                      className="w-full py-3.5 text-sm font-bold gap-2 mt-2 rounded-2xl shadow-md shadow-sky-500/20 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>ورود به سامانه</span>
                    </Button>
                  </form>
                ) : (
                  /* Sub-Form B: Login with OTP */
                  <form onSubmit={handleOtpLoginSubmit} className="space-y-4 pt-1">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-right">
                        شماره تلفن همراه
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                          <input
                            type="tel"
                            required
                            value={otpLoginPhone}
                            onChange={(e) => setOtpLoginPhone(e.target.value)}
                            placeholder="09123456789"
                            className="w-full text-sm font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pr-10 pl-3 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-left"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={sendingOtp || otpLoginTimer > 0}
                          onClick={handleSendLoginOtp}
                          className="text-xs shrink-0 rounded-2xl px-4 cursor-pointer"
                        >
                          {otpLoginTimer > 0 ? (
                            <span className="font-mono flex items-center gap-1 text-sky-600">
                              <Timer className="w-3.5 h-3.5 animate-pulse" />
                              {otpLoginTimer}s
                            </span>
                          ) : (
                            <span>{otpLoginSent ? 'ارسال مجدد' : 'ارسال کد OTP'}</span>
                          )}
                        </Button>
                      </div>
                    </div>

                    {otpLoginSent && (
                      <div className="space-y-1.5 animate-in fade-in">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block text-right">
                          کد ۶ رقمی پیامک‌شده
                        </label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                          <input
                            type="text"
                            maxLength={6}
                            required
                            value={otpLoginCode}
                            onChange={(e) => setOtpLoginCode(e.target.value)}
                            placeholder="123456"
                            className="w-full text-center tracking-[0.5em] text-lg font-mono font-bold bg-slate-50 dark:bg-slate-800/80 border border-sky-300 dark:border-sky-800 rounded-2xl py-2.5 px-3 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                          />
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      loading={loading}
                      disabled={!otpLoginSent}
                      className="w-full py-3.5 text-sm font-bold gap-2 mt-2 rounded-2xl shadow-md shadow-sky-500/20 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>تأیید و ورود به پرتال</span>
                    </Button>
                  </form>
                )}
              </div>
            )}

            {/* ========================================================== */}
            {/* TAB 2: REGISTER (WITH OTP)                                 */}
            {/* ========================================================== */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 pt-1">
                {/* Step 1: Phone & OTP */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-right">
                    شماره تلفن همراه شناگر (نام کاربری) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="09123456789"
                        className="w-full text-sm font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl py-2.5 pr-10 pl-3 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-left"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={sendingOtp || regOtpTimer > 0}
                      onClick={handleSendRegisterOtp}
                      className="text-xs shrink-0 rounded-2xl px-4 cursor-pointer"
                    >
                      {regOtpTimer > 0 ? (
                        <span className="font-mono flex items-center gap-1 text-sky-600">
                          <Timer className="w-3.5 h-3.5 animate-pulse" />
                          {regOtpTimer} ثانیه
                        </span>
                      ) : (
                        <span>{regOtpSent ? 'ارسال مجدد' : 'دریافت کد تایید'}</span>
                      )}
                    </Button>
                  </div>
                </div>

                {/* OTP Code Input */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 text-right">
                    کد تأیید پیامکی (OTP) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={regOtpCode}
                      onChange={(e) => setRegOtpCode(e.target.value)}
                      placeholder={regOtpSent ? 'کد ۶ رقمی پیامک‌شده' : 'ابتدا شماره را وارد و دریافت کد را بزنید'}
                      disabled={!regOtpSent}
                      className="w-full text-sm font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl py-2.5 pr-10 pl-3 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all disabled:opacity-60 text-left"
                    />
                  </div>
                </div>

                {/* Name & Family */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 text-right">
                      نام <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      placeholder="مثال: بردیا"
                      className="w-full text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl py-2.5 px-3.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-right"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 text-right">
                      نام خانوادگی <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      placeholder="مثال: حسینی"
                      className="w-full text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl py-2.5 px-3.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-right"
                    />
                  </div>
                </div>

                {/* National ID */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      کد ملی شناگر (۱۰ رقمی) <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold">
                      رمز عبور = کد ملی
                    </span>
                  </div>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={regNationalId}
                      onChange={(e) => setRegNationalId(e.target.value)}
                      placeholder="0012345678"
                      className="w-full text-sm font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl py-2.5 pr-10 pl-3 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-left"
                    />
                  </div>
                </div>

                {/* Onboarding hint */}
                <div className="p-3 bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 rounded-2xl text-[11px] text-sky-800 dark:text-sky-300 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-sky-600 mt-0.5" />
                  <span className="leading-relaxed">
                    پس از ثبت‌نام، مستقیماً وارد سامانه شده و به فرم <strong>تکمیل پرونده، مدارک شناسنامه، کارت ملی و نشانی روی نقشه</strong> هدایت خواهید شد.
                  </span>
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  disabled={!regOtpSent}
                  className="w-full py-3.5 text-sm font-bold gap-2 mt-1 rounded-2xl shadow-md shadow-sky-500/20 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>ثبت‌نام و ورود به مرحله تکمیل پرونده</span>
                </Button>
              </form>
            )}

            {/* Back to Home Link */}
            <div className="text-center pt-2">
              <Link
                to="/"
                className="text-xs text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <span>بازگشت به صفحه اصلی آکادمی</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
