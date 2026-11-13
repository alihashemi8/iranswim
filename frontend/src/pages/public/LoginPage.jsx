import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Waves, LogIn, KeyRound, Phone, ArrowRight, ArrowLeft, UserPlus,
  CreditCard, Sparkles, MessageSquare, Timer, CheckCircle2,
  AlertCircle, Eye, EyeOff, ShieldCheck, Calendar, Award, Droplets,
  Edit3, RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { AquaticPoolBackground } from '../../components/landing/AquaticPoolBackground';
import './LoginPage.css';

export const toEnglishDigits = (str) => {
  if (!str) return '';
  return str
    .toString()
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧۸۹'.indexOf(d));
};

export const LoginPage = ({ defaultMode }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlMode = searchParams.get('mode');
  const savedMode = sessionStorage.getItem('iranswim_auth_mode');
  const initialMode = defaultMode || urlMode || savedMode || 'login';
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    sessionStorage.setItem('iranswim_auth_mode', newMode);
    setSearchParams({ mode: newMode }, { replace: true });
  };

  useEffect(() => {
    if (defaultMode) {
      setMode(defaultMode);
      sessionStorage.setItem('iranswim_auth_mode', defaultMode);
    } else {
      const qMode = searchParams.get('mode');
      if (qMode === 'register' || qMode === 'login') {
        setMode(qMode);
        sessionStorage.setItem('iranswim_auth_mode', qMode);
      }
    }
  }, [defaultMode, searchParams]);

  // Login Method: 'password' (phone + national_id / password) vs 'otp' (phone + sms code)
  const [loginMethod, setLoginMethod] = useState(() => {
    return sessionStorage.getItem('iranswim_login_method') || 'password';
  });
  const [showPassword, setShowPassword] = useState(false);

  // Form states: Login with password
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Form states: Login with OTP
  const [otpLoginPhone, setOtpLoginPhone] = useState(() => {
    return sessionStorage.getItem('iranswim_otp_login_phone') || '';
  });
  const [otpLoginCode, setOtpLoginCode] = useState('');
  const [otpLoginSent, setOtpLoginSent] = useState(() => {
    return sessionStorage.getItem('iranswim_otp_login_sent') === 'true';
  });
  const [otpLoginTimer, setOtpLoginTimer] = useState(() => {
    const expiresAt = Number(sessionStorage.getItem('iranswim_otp_login_expires_at') || 0);
    if (expiresAt > Date.now()) {
      return Math.floor((expiresAt - Date.now()) / 1000);
    }
    return 0;
  });

  // Form states: Registration with OTP (Mobile + 5-digit SMS Code only)
  const [regPhone, setRegPhone] = useState(() => {
    return sessionStorage.getItem('iranswim_reg_phone') || '';
  });
  const [regOtpCode, setRegOtpCode] = useState(() => {
    return sessionStorage.getItem('iranswim_reg_otp_code') || '';
  });
  const [regOtpSent, setRegOtpSent] = useState(() => {
    return sessionStorage.getItem('iranswim_reg_otp_sent') === 'true';
  });
  const [regOtpTimer, setRegOtpTimer] = useState(() => {
    const expiresAt = Number(sessionStorage.getItem('iranswim_reg_otp_expires_at') || 0);
    if (expiresAt > Date.now()) {
      return Math.floor((expiresAt - Date.now()) / 1000);
    }
    return 0;
  });

  const otpInputRefs = useRef([]);
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
        navigate('/swimmer/profile');
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
    const cleanPhone = toEnglishDigits(loginPhone).trim();
    const cleanPassword = toEnglishDigits(loginPassword).trim();

    if (!cleanPhone) {
      setError('شماره تلفن همراه را وارد نمایید.');
      return;
    }
    if (!cleanPassword) {
      setError('رمز عبور (کد ملی) را وارد نمایید.');
      return;
    }

    const res = await login(cleanPhone, cleanPassword);
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
    const cleanPhone = toEnglishDigits(otpLoginPhone).trim();
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
      const secs = 120;
      setOtpLoginTimer(secs);
      sessionStorage.setItem('iranswim_otp_login_phone', cleanPhone);
      sessionStorage.setItem('iranswim_otp_login_sent', 'true');
      sessionStorage.setItem('iranswim_otp_login_expires_at', String(Date.now() + secs * 1000));

      if (res.data?.code) {
        setOtpLoginCode(String(res.data.code));
        toast.info(`کد تایید پیامکی ۵ رقمی: ${res.data.code}`);
      } else {
        toast.success('کد تأیید ۵ رقمی به شماره همراه شما پیامک گردید.');
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
    const cleanPhone = toEnglishDigits(otpLoginPhone).trim();
    const cleanCode = toEnglishDigits(otpLoginCode).trim();

    if (!cleanCode || cleanCode.length !== 5) {
      setError('لطفاً کد تأیید ۵ رقمی پیامک‌شده را وارد فرمایید.');
      return;
    }

    const res = await loginWithOtp(cleanPhone, cleanCode);
    if (res.success) {
      sessionStorage.removeItem('iranswim_otp_login_phone');
      sessionStorage.removeItem('iranswim_otp_login_sent');
      sessionStorage.removeItem('iranswim_otp_login_expires_at');
      toast.success(`خوش آمدید ${res.user.full_name}! ورود با رمز یکبار مصرف انجام شد.`);
      redirectUser(res.user);
    } else {
      setError(res.error);
      toast.error(res.error || 'کد تایید نامعتبر یا منقضی شده است.');
    }
  };

  // Phone input change with persistence
  const handlePhoneChange = (val) => {
    setRegPhone(val);
    sessionStorage.setItem('iranswim_reg_phone', val);
  };

  // Edit phone number (back to phone input step)
  const handleEditPhone = () => {
    setRegOtpSent(false);
    setRegOtpCode('');
    setRegOtpTimer(0);
    sessionStorage.removeItem('iranswim_reg_otp_sent');
    sessionStorage.removeItem('iranswim_reg_otp_code');
    sessionStorage.removeItem('iranswim_reg_otp_expires_at');
  };

  // Handle 5-box OTP digit input
  const handleOtpDigitChange = (index, value) => {
    const cleaned = toEnglishDigits(value).replace(/[^0-9]/g, '');
    let codeArr = regOtpCode.padEnd(5, ' ').split('').slice(0, 5);

    if (cleaned.length > 0) {
      if (cleaned.length > 1) {
        // Multi-digit paste or typing
        const pasteDigits = cleaned.slice(0, 5);
        setRegOtpCode(pasteDigits);
        sessionStorage.setItem('iranswim_reg_otp_code', pasteDigits);
        const nextIdx = Math.min(pasteDigits.length, 4);
        otpInputRefs.current[nextIdx]?.focus();
        return;
      }
      codeArr[index] = cleaned[cleaned.length - 1];
      const newCode = codeArr.join('').trimEnd();
      setRegOtpCode(newCode);
      sessionStorage.setItem('iranswim_reg_otp_code', newCode);
      if (index < 4) {
        otpInputRefs.current[index + 1]?.focus();
      }
    } else {
      codeArr[index] = ' ';
      const newCode = codeArr.join('').trimEnd();
      setRegOtpCode(newCode);
      sessionStorage.setItem('iranswim_reg_otp_code', newCode);
    }
  };

  const handleOtpDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!regOtpCode[index] && index > 0) {
        e.preventDefault();
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowRight' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index < 4) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const cleaned = toEnglishDigits(pasted).replace(/[^0-9]/g, '').slice(0, 5);
    if (cleaned) {
      setRegOtpCode(cleaned);
      sessionStorage.setItem('iranswim_reg_otp_code', cleaned);
      const nextIdx = Math.min(cleaned.length, 4);
      otpInputRefs.current[nextIdx]?.focus();
    }
  };

  // Send OTP for Register
  const handleSendRegisterOtp = async () => {
    const cleanPhone = toEnglishDigits(regPhone).trim();
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
      const secs = 120;
      setRegOtpTimer(secs);
      const expiresAt = Date.now() + secs * 1000;
      sessionStorage.setItem('iranswim_reg_phone', cleanPhone);
      sessionStorage.setItem('iranswim_reg_otp_sent', 'true');
      sessionStorage.setItem('iranswim_reg_otp_expires_at', String(expiresAt));

      if (res.data?.code) {
        const codeStr = String(res.data.code);
        setRegOtpCode(codeStr);
        sessionStorage.setItem('iranswim_reg_otp_code', codeStr);
        toast.info(`کد تایید پیامکی ۵ رقمی: ${codeStr}`);
      } else {
        toast.success('کد تأیید ۵ رقمی به شماره همراه شما ارسال شد.');
      }
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } else {
      setError(res.error);
      toast.error(res.error || 'خطا در ارسال پیامک.');
    }
  };

  // Submit: Register with OTP (Mobile + 5-digit Code)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanPhone = toEnglishDigits(regPhone).trim();
    const cleanCode = toEnglishDigits(regOtpCode).trim();

    if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith('09')) {
      setError('شماره تلفن همراه باید ۱۱ رقم بوده و با ۰۹ آغاز شود.');
      toast.error('شماره همراه نامعتبر است.');
      return;
    }

    if (!regOtpSent) {
      handleSendRegisterOtp();
      return;
    }

    if (!cleanCode || cleanCode.length !== 5) {
      setError('لطفاً کد تأیید ۵ رقمی پیامک‌شده را کامل وارد کنید.');
      return;
    }

    const res = await registerWithOtp({
      phone: cleanPhone,
      code: cleanCode,
    });

    if (res.success) {
      sessionStorage.removeItem('iranswim_reg_phone');
      sessionStorage.removeItem('iranswim_reg_otp_sent');
      sessionStorage.removeItem('iranswim_reg_otp_code');
      sessionStorage.removeItem('iranswim_reg_otp_expires_at');
      toast.success('ورود با موفقیت انجام شد! در حال هدایت به بخش پروفایل...');
      navigate('/swimmer/profile');
    } else {
      setError(res.error);
      toast.error(res.error || 'کد تایید نامعتبر است.');
    }
  };

  return (
    <div className="auth-page-wrapper">
      {/* Fullscreen Pool Background from Landing Hero (without the swimmer child) */}
      <div className="auth-pool-background" aria-hidden="true" />
      <AquaticPoolBackground />

      {/* Main Container Card */}
      <div className="auth-panel grid grid-cols-1 lg:grid-cols-12 transition-all">
        
        {/* ============================================================== */}
        {/* RIGHT COLUMN (DESKTOP HERO / BRANDING PANEL)                   */}
        {/* ============================================================== */}
        <div className="auth-panel__intro hidden lg:flex lg:col-span-5 relative flex-col justify-between p-10 overflow-hidden">
          <div className="auth-panel__veil" />

          {/* Top Brand Tag */}
          <div className="relative z-10 space-y-3">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-11 h-11 bg-gradient-to-tr from-[#087EA4] to-[#16B8B0] rounded-2xl flex items-center justify-center text-white shadow-md shadow-cyan-500/25 group-hover:scale-105 transition-transform">
                <Waves className="w-6 h-6" />
              </div>
              <div className="text-right">
                <span className="font-black text-base text-[#083b5c] tracking-tight block">آکادمی شنای ایران</span>
                <span className="text-[11px] text-[#0a667f] font-bold block">سامانه مدیریت آموزش و پرونده شناگران</span>
              </div>
            </Link>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[11px] font-bold text-[#065b6e] border border-teal-200/90 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              پرتال اختصاصی اعضای آموزشگاه
            </div>
          </div>

          {/* Center Content */}
          <div className="relative z-10 my-8 space-y-5">
            <div>
              <h1 className="text-2xl xl:text-3xl font-black tracking-tight leading-snug text-[#083b5c]">
                مدیریت کلاس‌ها و پیشرفت مهارتی شناگر
              </h1>
              <p className="text-xs xl:text-sm text-[#1e485e] leading-relaxed font-semibold mt-2">
                مشاهده آنلاین وضعیت ثبت‌نام، جلسات باقی‌مانده استخر، ارزیابی مربی و مدارک بیمه ورزشی در یک پرتال متمرکز.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-teal-100/90 shadow-[0_4px_16px_rgba(8,59,92,0.06)] hover:shadow-md transition-all">
                <div className="w-9 h-9 rounded-xl bg-sky-100/90 text-sky-700 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-[#083b5c] block">برنامه سانس‌ها و جلسات</span>
                  <span className="text-[11px] text-slate-600 font-semibold block mt-0.5">اطلاع از روزها، ساعت حضور و سهمیه باقیمانده</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-teal-100/90 shadow-[0_4px_16px_rgba(8,59,92,0.06)] hover:shadow-md transition-all">
                <div className="w-9 h-9 rounded-xl bg-emerald-100/90 text-emerald-700 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-[#083b5c] block">ارزیابی فنی و سطح‌بندی</span>
                  <span className="text-[11px] text-slate-600 font-semibold block mt-0.5">مشاهده بازخورد مربی و مهارت‌های پاس‌شده</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-teal-100/90 shadow-[0_4px_16px_rgba(8,59,92,0.06)] hover:shadow-md transition-all">
                <div className="w-9 h-9 rounded-xl bg-teal-100/90 text-teal-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-[#083b5c] block">پرونده آنلاین و بیمه ورزشی</span>
                  <span className="text-[11px] text-slate-600 font-semibold block mt-0.5">ثبت مدارک هویتی، آدرس و کارت سلامت</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Badge */}
          <div className="relative z-10 pt-4 border-t border-teal-200/70 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-teal-900 font-bold">
              <Droplets className="w-3.5 h-3.5 text-teal-600" />
              آموزش شنا از مبتدی تا قهرمانی
            </span>
            <span className="text-slate-600 font-medium">پشتیبانی آموزشگاه</span>
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
                  : 'عضویت و ورود سریع با شماره همراه و کد تأیید پیامکی (OTP)'}
              </p>
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
                          کد ۵ رقمی پیامک‌شده
                        </label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                          <input
                            type="text"
                            maxLength={5}
                            required
                            value={otpLoginCode}
                            onChange={(e) => setOtpLoginCode(e.target.value)}
                            placeholder="12345"
                            className="w-full text-center tracking-[0.6em] text-lg font-mono font-bold bg-slate-50 dark:bg-slate-800/80 border border-sky-300 dark:border-sky-800 rounded-2xl py-2.5 px-3 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                          />
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      loading={loading}
                      disabled={!otpLoginSent || otpLoginCode.length !== 5}
                      className="w-full py-3.5 text-sm font-bold gap-2 mt-2 rounded-2xl shadow-md shadow-sky-500/20 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>تأیید و ورود به پرتال</span>
                    </Button>
                  </form>
                )}

                {/* Switch to Register link under the login form */}
                <div className="pt-3 text-center border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    هنوز حساب کاربری ندارید؟{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer transition-colors"
                    >
                      ثبت‌نام شناگر جدید
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* TAB 2: REGISTER (WITH 5-DIGIT OTP)                         */}
            {/* ========================================================== */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4 pt-1">
                {!regOtpSent ? (
                  /* State 1: Enter Phone Number + Send Button Directly Below */
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-right">
                        شماره تلفن همراه شناگر <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                        <input
                          type="tel"
                          required
                          autoFocus
                          value={regPhone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          placeholder="09123456789"
                          className="w-full text-sm font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pr-10 pl-3 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-left"
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      loading={sendingOtp}
                      disabled={sendingOtp || !regPhone.trim()}
                      onClick={handleSendRegisterOtp}
                      className="w-full py-3.5 text-sm font-bold gap-2 rounded-2xl shadow-md shadow-sky-500/20 cursor-pointer"
                    >
                      <span>دریافت کد تأیید (پیامک)</span>
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  /* State 2: Enter 5-Digit OTP Code with Edit Phone & Countdown */
                  <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                    {/* Active Phone Display & Edit Button */}
                    <div className="flex items-center justify-between p-3 bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 rounded-2xl text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">ارسال کد به:</span>
                        <span className="font-mono font-bold text-sky-700 dark:text-sky-300 tracking-wider dir-ltr text-left">{regPhone}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleEditPhone}
                        className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>ویرایش شماره</span>
                      </button>
                    </div>

                    {/* 5-Box Segmented OTP Input */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block text-center">
                        کد تأیید ۵ رقمی پیامک‌شده را وارد کنید <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <div className="flex items-center justify-center gap-2 sm:gap-3 dir-ltr" dir="ltr">
                        {[0, 1, 2, 3, 4].map((index) => {
                          const digit = regOtpCode[index] || '';
                          return (
                            <input
                              key={index}
                              ref={(el) => (otpInputRefs.current[index] = el)}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                              onKeyDown={(e) => handleOtpDigitKeyDown(index, e)}
                              onPaste={handleOtpPaste}
                              className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-black rounded-2xl border transition-all outline-none ${
                                digit
                                  ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 text-sky-900 dark:text-sky-100 ring-2 ring-sky-500/20 shadow-xs'
                                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-sky-500/20'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Countdown Timer / Resend Button */}
                    <div className="flex items-center justify-center text-xs">
                      {regOtpTimer > 0 ? (
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                          <Timer className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
                          <span>ارسال مجدد کد تا</span>
                          <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                            {Math.floor(regOtpTimer / 60)}:{(regOtpTimer % 60).toString().padStart(2, '0')}
                          </span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendRegisterOtp}
                          disabled={sendingOtp}
                          className="text-sky-600 dark:text-sky-400 font-bold hover:underline flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>ارسال مجدد کد پیامکی</span>
                        </button>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      loading={loading}
                      disabled={regOtpCode.length !== 5}
                      className="w-full py-3.5 text-sm font-bold gap-2 rounded-2xl shadow-md shadow-sky-500/20 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>تأیید و ورود به پنل شناگر</span>
                    </Button>
                  </div>
                )}

                {/* Switch to Login link under the register form */}
                <div className="pt-3 text-center border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    قبلاً در سامانه عضو شده‌اید؟{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer transition-colors"
                    >
                      ورود به حساب کاربری
                    </button>
                  </p>
                </div>
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
