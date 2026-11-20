import React, { useState, useRef, useEffect } from 'react';
import { Camera, Trash2, Loader2, User, UploadCloud, Crop } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getMediaUrl } from '../../utils/media';
import { ImageCropModal } from './ImageCropModal';

const roleGradients = {
  ADMIN: 'from-sky-600 to-cyan-500',
  COACH: 'from-emerald-600 to-teal-500',
  SUPERVISOR: 'from-amber-600 to-orange-500',
  SWIMMER: 'from-blue-600 via-sky-600 to-teal-500',
};

const sizeClasses = {
  sm: 'w-16 h-16 text-lg',
  md: 'w-24 h-24 text-2xl',
  lg: 'w-32 h-32 text-3xl',
  xl: 'w-40 h-40 text-4xl',
};

export const AvatarUpload = ({
  currentAvatar,
  displayName = 'کاربر',
  role = 'SWIMMER',
  size = 'lg',
  canDelete = true,
  autoUpload = true,
  onAvatarChange,
  label = 'تصویر پروفایل',
  subtitle = 'فقط یک عکس مجاز است (قابلیت زوم، کراپ و چرخش قبل از ذخیره)',
  className = '',
}) => {
  const { user, updateUserData } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [avatarUrl, setAvatarUrl] = useState(() => getMediaUrl(currentAvatar || user?.avatar) || null);
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Crop modal state
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);

  useEffect(() => {
    const nextAvatar = currentAvatar !== undefined ? currentAvatar : user?.avatar;
    const normalized = getMediaUrl(nextAvatar) || null;
    setAvatarUrl(normalized);
    setImgError(false);
  }, [currentAvatar, user?.avatar]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected if needed
    e.target.value = '';

    // Validate size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error('حجم فایل انتخاب‌شده بیش از ۵ مگابایت است.');
      return;
    }

    // Validate type (MIME or extension fallback)
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/pjpeg', 'image/x-png'];
    const hasValidExt = /\.(jpe?g|png|webp|jfif|gif)$/i.test(file.name || '');
    if (!validMimes.includes(file.type) && !hasValidExt) {
      toast.error('لطفاً یک فایل تصویری با فرمت JPG، PNG یا WebP انتخاب فرمایید.');
      return;
    }

    // Open image cropper modal with file preview
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedFile, previewUrl) => {
    setIsCropModalOpen(false);
    setCropImageSrc(null);

    if (autoUpload) {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('avatar', croppedFile);

        const res = await api.post('/auth/me/avatar/', formData);

        const rawUrl = res.data.avatar || (res.data.user && res.data.user.avatar);
        const newUrl = getMediaUrl(rawUrl);

        setAvatarUrl(newUrl);
        setImgError(false);

        if (updateUserData) {
          updateUserData({ avatar: newUrl });
        }
        if (onAvatarChange) {
          onAvatarChange(newUrl, croppedFile);
        }
        toast.success('تصویر پروفایل با موفقیت برش، تنظیم و ذخیره گردید.');
      } catch (err) {
        console.error('Avatar upload error:', err);
        const data = err.response?.data;
        let detail = 'خطا در بارگذاری تصویر پروفایل';
        if (typeof data === 'string') {
          detail = data;
        } else if (data?.detail) {
          detail = typeof data.detail === 'string' ? data.detail : (Array.isArray(data.detail) ? data.detail[0] : JSON.stringify(data.detail));
        } else if (Array.isArray(data) && data.length > 0) {
          detail = typeof data[0] === 'string' ? data[0] : JSON.stringify(data[0]);
        } else if (data?.avatar) {
          detail = Array.isArray(data.avatar) ? data.avatar[0] : (typeof data.avatar === 'string' ? data.avatar : JSON.stringify(data.avatar));
        } else if (data && typeof data === 'object') {
          const firstVal = Object.values(data)[0];
          detail = Array.isArray(firstVal) ? firstVal[0] : (typeof firstVal === 'string' ? firstVal : JSON.stringify(firstVal));
        }
        toast.error(typeof detail === 'string' ? detail : 'خطا در ذخیره تصویر پروفایل');
      } finally {
        setLoading(false);
      }
    } else {
      // Local preview mode
      setAvatarUrl(previewUrl);
      setImgError(false);
      if (onAvatarChange) {
        onAvatarChange(previewUrl, croppedFile);
      }
    }
  };

  const handleCloseCropModal = () => {
    setIsCropModalOpen(false);
    setCropImageSrc(null);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!avatarUrl) return;

    if (autoUpload) {
      setLoading(true);
      try {
        await api.delete('/auth/me/avatar/');
        setAvatarUrl(null);
        setImgError(false);
        if (updateUserData) {
          updateUserData({ avatar: null });
        }
        if (onAvatarChange) {
          onAvatarChange(null, null);
        }
        toast.success('تصویر پروفایل با موفقیت حذف شد.');
      } catch (err) {
        console.error(err);
        toast.error('خطا در حذف تصویر پروفایل');
      } finally {
        setLoading(false);
      }
    } else {
      setAvatarUrl(null);
      setImgError(false);
      if (onAvatarChange) {
        onAvatarChange(null, null);
      }
    }
  };

  const handleImageError = () => {
    // If the image URL is absolute with a host like 127.0.0.1:8080, try relative
    if (avatarUrl && (avatarUrl.includes('8080') || avatarUrl.includes('8000'))) {
      const normalized = getMediaUrl(avatarUrl);
      if (normalized && normalized !== avatarUrl) {
        setAvatarUrl(normalized);
        return;
      }
    }
    setImgError(true);
  };

  const initialLetter = displayName ? displayName.trim().charAt(0) : '?';
  const gradientClass = roleGradients[role] || roleGradients.SWIMMER;
  const sizeClass = sizeClasses[size] || sizeClasses.lg;

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-4 ${className}`}>
      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/jfif,.jpg,.jpeg,.png,.webp,.jfif,.gif"
        multiple={false}
        onChange={handleFileSelect}
        className="hidden"
        aria-label="بارگذاری تصویر پروفایل"
      />

      {/* Image Crop & Edit Modal */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        imageSrc={cropImageSrc}
        onClose={handleCloseCropModal}
        onCropComplete={handleCropComplete}
      />

      {/* Avatar Container with Hover Controls */}
      <div className="relative group shrink-0">
        <div
          onClick={() => !loading && fileInputRef.current?.click()}
          className={`${sizeClass} rounded-2xl overflow-hidden shadow-md ring-4 ring-white dark:ring-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer relative transition-transform duration-200 group-hover:scale-102 flex items-center justify-center`}
          title="کلیک برای تغییر عکس و کادربندی"
        >
          {avatarUrl && !imgError ? (
            <img
              src={avatarUrl}
              alt={displayName}
              onError={handleImageError}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-tr ${gradientClass} text-white font-black flex items-center justify-center select-none`}>
              {initialLetter}
            </div>
          )}

          {/* Hover overlay with Camera & Crop Icon */}
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2">
            <Camera className="w-6 h-6 mb-1 drop-shadow-md" />
            <span className="text-[11px] font-bold text-center drop-shadow-md">
              {avatarUrl ? 'تغییر و کراپ' : 'افزودن و کراپ'}
            </span>
          </div>

          {/* Loading spinner overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xs flex items-center justify-center z-10">
              <Loader2 className="w-7 h-7 text-sky-600 animate-spin" />
            </div>
          )}
        </div>

        {/* Quick Delete Badge Button */}
        {canDelete && avatarUrl && !loading && (
          <button
            type="button"
            onClick={handleDelete}
            className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 cursor-pointer transition-transform hover:scale-110"
            title="حذف تصویر پروفایل"
            aria-label="حذف تصویر پروفایل"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Action Texts and Buttons */}
      <div className="flex flex-col items-center sm:items-start text-center sm:text-right space-y-1.5">
        {label && (
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{label}</h4>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
              فقط یک عکس
            </span>
          </div>
        )}
        {subtitle && (
          <p className="text-xs text-slate-400 dark:text-slate-400 max-w-xs leading-relaxed">
            {subtitle}
          </p>
        )}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/70 border border-sky-200/80 dark:border-sky-800 cursor-pointer transition-colors"
          >
            <Crop className="w-3.5 h-3.5" />
            <span>{avatarUrl ? 'تغییر و کراپ عکس' : 'انتخاب عکس'}</span>
          </button>

          {avatarUrl && (
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setCropImageSrc(avatarUrl);
                setIsCropModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-750 dark:text-slate-250 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
              title="تغییر کادربندی، چرخش یا زوم عکس فعلی"
            >
              <Crop className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>کادربندی مجدد</span>
            </button>
          )}

          {canDelete && avatarUrl && (
            <button
              type="button"
              disabled={loading}
              onClick={handleDelete}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
