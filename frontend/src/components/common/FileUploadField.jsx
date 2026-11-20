import React, { useState, useRef, useEffect } from 'react';
import {
  Upload, FileText, CheckCircle2, AlertCircle, Loader2,
  Trash2, Eye, RefreshCw, FileCheck, Image as ImageIcon,
  Check, ArrowUpRight, Edit3
} from 'lucide-react';

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const FileUploadField = ({
  file = null,
  previewUrl = null,
  fileName = '',
  onFileSelect,
  onFileRemove,
  accept = '.pdf,image/*',
  maxSizeMB = 8,
  label = '',
  required = false,
  error = '',
  hint = '',
  onLoadingChange,
  id = 'file-upload',
  className = '',
}) => {
  const inputRef = useRef(null);
  const [status, setStatus] = useState(file || previewUrl ? 'loaded' : 'idle'); // 'idle' | 'loading' | 'loaded' | 'error'
  const [progress, setProgress] = useState(file || previewUrl ? 100 : 0);
  const [errorMessage, setErrorMessage] = useState(error || '');

  useEffect(() => {
    setErrorMessage(error || '');
  }, [error]);

  useEffect(() => {
    if (file || previewUrl) {
      setStatus('loaded');
      setProgress(100);
    } else {
      setStatus('idle');
      setProgress(0);
    }
  }, [file, previewUrl]);

  const handleSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Reset input so re-selecting same file triggers event
    e.target.value = '';

    // Validate size
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setErrorMessage(`حجم فایل انتخابی بیش از ${maxSizeMB} مگابایت است.`);
      setStatus('error');
      return;
    }

    setErrorMessage('');
    setStatus('loading');
    setProgress(15);
    onLoadingChange?.(true);

    // Simulate realistic reading & processing with progress animation
    const reader = new FileReader();

    let currentP = 15;
    const interval = setInterval(() => {
      currentP = Math.min(90, currentP + 25);
      setProgress(currentP);
    }, 90);

    reader.onload = (loadEvt) => {
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setStatus('loaded');
        onLoadingChange?.(false);
        const dataUrl = loadEvt.target.result;
        onFileSelect?.(selectedFile, dataUrl);
      }, 250);
    };

    reader.onerror = () => {
      clearInterval(interval);
      setStatus('error');
      setErrorMessage('خطا در خواندن فایل. لطفاً مجدداً تلاش فرمایید.');
      onLoadingChange?.(false);
    };

    reader.readAsDataURL(selectedFile);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setStatus('idle');
    setProgress(0);
    setErrorMessage('');
    onFileRemove?.();
    if (inputRef.current) inputRef.current.value = '';
  };

  const displayFileName = file?.name || fileName || (previewUrl ? 'فایل بارگذاری شده' : '');
  const displayFileSize = file?.size ? formatFileSize(file.size) : '';
  const isImage = file?.type?.startsWith('image/') || (typeof previewUrl === 'string' && /\.(jpg|jpeg|png|webp|jfif|gif)($|\?)/i.test(previewUrl));

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Hidden Native Input */}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={handleSelect}
        className="hidden"
      />

      {/* Label Header */}
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label htmlFor={id} className="block text-sm sm:text-[15px] font-bold text-slate-700 dark:text-slate-300">
            {label} {required && <span className="text-rose-500 font-bold">*</span>}
          </label>
          {status === 'loaded' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full animate-in fade-in duration-300">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>فایل آماده است</span>
            </span>
          )}
        </div>
      )}

      {/* Upload Zone Card */}
      <div
        onClick={() => status !== 'loading' && inputRef.current?.click()}
        className={`relative rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
          errorMessage
            ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20'
            : status === 'loaded'
            ? 'border-emerald-500 dark:border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 shadow-xs'
            : status === 'loading'
            ? 'border-sky-400 dark:border-sky-600 bg-sky-50/30 dark:bg-sky-950/20 shadow-xs'
            : 'border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60'
        }`}
      >
        {/* State 1: IDLE */}
        {status === 'idle' && (
          <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 truncate">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="truncate">
                <span className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                  انتخاب و بارگذاری فایل...
                </span>
                <span className="block text-[11px] text-slate-400 dark:text-slate-400 truncate mt-0.5">
                  {hint || `فرمت‌های مجاز (${accept}) تا سقف ${maxSizeMB} مگابایت`}
                </span>
              </div>
            </div>
            <span className="shrink-0 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs transition-colors">
              انتخاب فایل
            </span>
          </div>
        )}

        {/* State 2: LOADING / ANIMATING */}
        {status === 'loading' && (
          <div className="p-3.5 sm:p-4 space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-bold text-sky-700 dark:text-sky-300">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-sky-600 dark:text-sky-400 shrink-0" />
                <span>در حال بارگذاری و پردازش فایل...</span>
              </div>
              <span className="font-mono">{progress}%</span>
            </div>

            {/* Smooth Animated Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 rounded-full transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* State 3: LOADED / SUCCESS */}
        {status === 'loaded' && (
          <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5 sm:gap-3 truncate">
              {/* File / Image Icon */}
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-300 dark:border-emerald-800 relative">
                {isImage ? (
                  <ImageIcon className="w-5 h-5" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xs">
                  <Check className="w-2.5 h-2.5" />
                </span>
              </div>

              {/* File Info */}
              <div className="truncate">
                <span className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                  {displayFileName}
                </span>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {displayFileSize && <span className="font-mono">{displayFileSize}</span>}
                  {displayFileSize && <span>•</span>}
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    بارگذاری شد
                  </span>
                </div>
              </div>
            </div>

            {/* Actions: View / Edit / Delete */}
            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="مشاهده پیش‌نمایش فایل"
                >
                  <Eye className="w-4 h-4" />
                </a>
              )}

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="p-2 rounded-xl text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors cursor-pointer"
                title="تغییر فایل"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleRemove}
                className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="حذف فایل"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* State 4: ERROR */}
        {status === 'error' && (
          <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5 text-rose-700 dark:text-rose-300 truncate">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <span className="text-xs sm:text-sm font-bold truncate">
                {errorMessage || 'خطا در بارگذاری فایل'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shrink-0 cursor-pointer"
            >
              تلاش مجدد
            </button>
          </div>
        )}
      </div>

      {/* Field Error Text below if present */}
      {errorMessage && status !== 'error' && (
        <span className="text-xs sm:text-sm text-rose-500 dark:text-rose-400 font-semibold mt-1 block">
          {errorMessage}
        </span>
      )}
    </div>
  );
};

export default FileUploadField;
