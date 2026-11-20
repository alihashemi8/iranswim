import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, ZoomIn, ZoomOut, RotateCw, Check, Undo2, Move, Crop, RefreshCcw, Upload
} from 'lucide-react';

const CROP_VIEWPORT_SIZE = 300; // Visible interactive box in pixels
const OUTPUT_SIZE = 512;        // High-resolution export size for avatar

export const ImageCropModal = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  onPickAnother,
  title = 'ویرایش و کادربندی تصویر',
  subtitle = 'تصویر را جابجا کنید و با زوم یا چرخش، کادر چهره را تنظیم نمایید.',
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageElement, setImageElement] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef(null);

  // Load image whenever imageSrc changes
  useEffect(() => {
    if (!imageSrc) {
      setImageElement(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageElement(img);
      // Reset state on new image
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Calculate base scale to cover the crop circle
  const getBaseScale = useCallback((img, rot) => {
    if (!img) return 1;
    const isSideways = rot === 90 || rot === 270;
    const effectiveWidth = isSideways ? img.naturalHeight : img.naturalWidth;
    const effectiveHeight = isSideways ? img.naturalWidth : img.naturalHeight;
    return Math.max(CROP_VIEWPORT_SIZE / effectiveWidth, CROP_VIEWPORT_SIZE / effectiveHeight);
  }, []);

  // Draw viewport canvas
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageElement) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseScale = getBaseScale(imageElement, rotation);
    const currentScale = baseScale * zoom;

    ctx.clearRect(0, 0, CROP_VIEWPORT_SIZE, CROP_VIEWPORT_SIZE);

    // Save context state for drawing image
    ctx.save();
    ctx.translate(CROP_VIEWPORT_SIZE / 2 + pan.x, CROP_VIEWPORT_SIZE / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(currentScale, currentScale);
    ctx.drawImage(
      imageElement,
      -imageElement.naturalWidth / 2,
      -imageElement.naturalHeight / 2
    );
    ctx.restore();

    // Draw dark overlay with circular cutout (mask)
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)'; // slate-900 / 65%
    ctx.beginPath();
    ctx.rect(0, 0, CROP_VIEWPORT_SIZE, CROP_VIEWPORT_SIZE);
    ctx.arc(
      CROP_VIEWPORT_SIZE / 2,
      CROP_VIEWPORT_SIZE / 2,
      CROP_VIEWPORT_SIZE / 2 - 8,
      0,
      Math.PI * 2,
      true
    );
    ctx.fill();

    // Draw circular guideline border
    ctx.beginPath();
    ctx.arc(
      CROP_VIEWPORT_SIZE / 2,
      CROP_VIEWPORT_SIZE / 2,
      CROP_VIEWPORT_SIZE / 2 - 8,
      0,
      Math.PI * 2
    );
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#38bdf8'; // sky-400
    ctx.setLineDash([6, 6]);
    ctx.stroke();

    // Draw subtle rule-of-thirds grid inside the circle
    ctx.beginPath();
    const radius = CROP_VIEWPORT_SIZE / 2 - 8;
    const center = CROP_VIEWPORT_SIZE / 2;
    const third = (radius * 2) / 3;

    // Save clip to circle only
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.clip();

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.setLineDash([4, 4]);

    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(center - radius + third, center - radius);
    ctx.lineTo(center - radius + third, center + radius);
    ctx.moveTo(center - radius + third * 2, center - radius);
    ctx.lineTo(center - radius + third * 2, center + radius);

    // Horizontal lines
    ctx.moveTo(center - radius, center - radius + third);
    ctx.lineTo(center + radius, center - radius + third);
    ctx.moveTo(center - radius, center - radius + third * 2);
    ctx.lineTo(center + radius, center - radius + third * 2);
    ctx.stroke();

    ctx.restore(); // end clip
    ctx.restore(); // end mask
  }, [imageElement, zoom, rotation, pan, getBaseScale]);

  // Redraw when parameters change
  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // Mouse / Touch handlers for panning
  const handlePointerDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    });
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom((prev) => Math.min(Math.max(1, prev + delta), 3));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  // Generate cropped output file
  const handleConfirmCrop = async () => {
    if (!imageElement) return;
    setIsProcessing(true);

    try {
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = OUTPUT_SIZE;
      outputCanvas.height = OUTPUT_SIZE;
      const outCtx = outputCanvas.getContext('2d');

      if (!outCtx) {
        throw new Error('Canvas context not available');
      }

      const factor = OUTPUT_SIZE / (CROP_VIEWPORT_SIZE - 16);
      const baseScale = getBaseScale(imageElement, rotation);
      const currentScale = baseScale * zoom * factor;

      // Fill background in case of transparent PNG
      outCtx.fillStyle = '#ffffff';
      outCtx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      outCtx.save();
      outCtx.translate(OUTPUT_SIZE / 2 + pan.x * factor, OUTPUT_SIZE / 2 + pan.y * factor);
      outCtx.rotate((rotation * Math.PI) / 180);
      outCtx.scale(currentScale, currentScale);
      outCtx.drawImage(
        imageElement,
        -imageElement.naturalWidth / 2,
        -imageElement.naturalHeight / 2
      );
      outCtx.restore();

      // Convert to high-quality JPEG blob
      outputCanvas.toBlob(
        (blob) => {
          if (!blob) {
            setIsProcessing(false);
            return;
          }
          const croppedFile = new File([blob], 'avatar_cropped.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          const previewUrl = URL.createObjectURL(blob);
          setIsProcessing(false);
          onCropComplete(croppedFile, previewUrl);
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      console.error('Error generating cropped image:', err);
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">{title}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            title="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="flex flex-col items-center justify-center p-5 bg-slate-100 dark:bg-slate-950/80">
          <div
            className="relative rounded-2xl overflow-hidden shadow-inner border border-slate-300 dark:border-slate-800 cursor-grab active:cursor-grabbing select-none"
            style={{ width: CROP_VIEWPORT_SIZE, height: CROP_VIEWPORT_SIZE }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onWheel={handleWheel}
          >
            <canvas
              ref={canvasRef}
              width={CROP_VIEWPORT_SIZE}
              height={CROP_VIEWPORT_SIZE}
              className="block"
            />
          </div>

          {/* Hint badge */}
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Move className="w-3.5 h-3.5 text-sky-500" />
            <span>تصویر را بکشید (Drag) و با اسلایدر یا غلطک ماوس زوم نمایید.</span>
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="p-5 space-y-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          {/* Zoom Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <ZoomIn className="w-3.5 h-3.5 text-sky-500" />
                بزرگ‌نمایی (زوم)
              </span>
              <span className="text-sky-600 dark:text-sky-400 font-mono">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(1, prev - 0.1))}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="کاهش زوم"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="1"
                max="3"
                step="0.02"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(3, prev + 0.1))}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="افزایش زوم"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Tools: Rotate & Reset */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              type="button"
              onClick={handleRotate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold cursor-pointer transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5 text-sky-500" />
              <span>چرخش ۹۰ درجه</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>تنظیم مجدد</span>
            </button>
          </div>
        </div>

        {/* Modal Footer Buttons */}
        <div className="flex items-center justify-between gap-2.5 px-5 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800">
          <div>
            {onPickAnother && (
              <button
                type="button"
                onClick={onPickAnother}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded-xl cursor-pointer transition-colors"
                title="انتخاب یک فایل عکس جدید از دستگاه"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>انتخاب عکس دیگر</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleConfirmCrop}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-black text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 rounded-xl shadow-md shadow-sky-500/20 cursor-pointer transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <span>در حال آماده‌سازی...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>برش و ذخیره عکس</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
