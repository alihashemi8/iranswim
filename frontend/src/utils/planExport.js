/**
 * Utilities for exporting Workout and Diet plans to Microsoft Word (.doc) and PDF
 */

/**
 * Clean text for HTML rendering
 */
const escapeHtml = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br/>');
};

/**
 * Generates an official Microsoft Word (.doc) document from a plan
 */
export const exportPlanToWord = (plan) => {
  if (!plan) return;

  const isDiet = plan.plan_type === 'DIET';
  const planTypeFa = isDiet ? 'برنامه غذایی و رژیم ورزشی' : 'برنامه تمرینی تخصصی شنا';
  const todayFa = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const targetLabel = plan.target_type === 'INDIVIDUAL' && plan.swimmer_name
    ? `شناگر اختصاصی: ${plan.swimmer_name}`
    : plan.group_name
    ? `کلاس / گروه آموزشی: ${plan.group_name}`
    : 'عمومی / بدون انتساب کلاسی';

  let contentHtml = '';

  if (isDiet) {
    contentHtml = `
      <div class="section-title diet">مشخصات و هدف رژیم غذایی</div>
      <table class="meta-table">
        <tr>
          <td style="width: 25%; font-weight: bold; background-color: #f0fdf4;">هدف فیزیولوژیک:</td>
          <td style="width: 75%;">${escapeHtml(plan.diet_goal || 'تغذیه بهینه و ارتقای عملکرد شناگر')}</td>
        </tr>
        ${plan.daily_calories ? `
        <tr>
          <td style="font-weight: bold; background-color: #f0fdf4;">کالری هدف روزانه:</td>
          <td>${plan.daily_calories.toLocaleString('fa-IR')} کیلوکالری</td>
        </tr>` : ''}
      </table>

      <div class="section-title diet">برنامه وعده‌ها و میان‌وعده‌های روزانه</div>
      <table class="meal-table">
        <thead>
          <tr style="background-color: #15803d; color: #ffffff;">
            <th style="padding: 10px; width: 28%; text-align: right; border: 1px solid #16a34a;">وعده غذایی</th>
            <th style="padding: 10px; width: 72%; text-align: right; border: 1px solid #16a34a;">دستور مصرف و مواد غذایی</th>
          </tr>
        </thead>
        <tbody>
          ${plan.breakfast ? `
          <tr>
            <td style="font-weight: bold; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 10px;">صبحانه</td>
            <td style="border: 1px solid #cbd5e1; padding: 10px;">${escapeHtml(plan.breakfast)}</td>
          </tr>` : ''}
          ${plan.morning_snack ? `
          <tr>
            <td style="font-weight: bold; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 10px;">میان‌وعده صبح</td>
            <td style="border: 1px solid #cbd5e1; padding: 10px;">${escapeHtml(plan.morning_snack)}</td>
          </tr>` : ''}
          ${plan.lunch ? `
          <tr>
            <td style="font-weight: bold; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 10px;">ناهار</td>
            <td style="border: 1px solid #cbd5e1; padding: 10px;">${escapeHtml(plan.lunch)}</td>
          </tr>` : ''}
          ${plan.afternoon_snack ? `
          <tr>
            <td style="font-weight: bold; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 10px;">میان‌وعده عصر / قبل از تمرین</td>
            <td style="border: 1px solid #cbd5e1; padding: 10px;">${escapeHtml(plan.afternoon_snack)}</td>
          </tr>` : ''}
          ${plan.dinner ? `
          <tr>
            <td style="font-weight: bold; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 10px;">شام</td>
            <td style="border: 1px solid #cbd5e1; padding: 10px;">${escapeHtml(plan.dinner)}</td>
          </tr>` : ''}
          ${plan.post_workout_snack ? `
          <tr>
            <td style="font-weight: bold; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 10px;">تغذیه بعد از تمرین (ریکاوری)</td>
            <td style="border: 1px solid #cbd5e1; padding: 10px;">${escapeHtml(plan.post_workout_snack)}</td>
          </tr>` : ''}
        </tbody>
      </table>

      ${plan.hydration_guidelines ? `
      <div class="section-title diet">مصرف آب و دستورالعمل هیدراتاسیون (مایعات)</div>
      <div class="section-content diet">${escapeHtml(plan.hydration_guidelines)}</div>` : ''}

      ${plan.supplements ? `
      <div class="section-title diet">مکمل‌ها و ویتامین‌های توصیه شده</div>
      <div class="section-content diet">${escapeHtml(plan.supplements)}</div>` : ''}

      ${plan.dietary_guidelines ? `
      <div class="section-title diet">پرهیزها و نکات کلیدی تغذیه</div>
      <div class="section-content diet">${escapeHtml(plan.dietary_guidelines)}</div>` : ''}
    `;
  } else {
    // Training plan
    contentHtml = `
      <div class="section-title">مشخصات جلسه و هدف آموزشی</div>
      <table class="meta-table">
        ${plan.duration_minutes ? `
        <tr>
          <td style="width: 25%; font-weight: bold; background-color: #f0fdfa;">مدت زمان جلسه:</td>
          <td style="width: 75%;">${plan.duration_minutes} دقیقه</td>
        </tr>` : ''}
        ${plan.target_level_name ? `
        <tr>
          <td style="font-weight: bold; background-color: #f0fdfa;">سطح مهارت هدف:</td>
          <td>${escapeHtml(plan.target_level_name)}</td>
        </tr>` : ''}
        ${plan.focus_skills ? `
        <tr>
          <td style="font-weight: bold; background-color: #f0fdfa;">تمرکز آموزشی و تکنیکی:</td>
          <td>${escapeHtml(plan.focus_skills)}</td>
        </tr>` : ''}
        ${plan.equipment ? `
        <tr>
          <td style="font-weight: bold; background-color: #f0fdfa;">تجهیزات و وسایل مورد نیاز:</td>
          <td>${escapeHtml(plan.equipment)}</td>
        </tr>` : ''}
      </table>

      ${plan.warmup_section ? `
      <div class="section-title">۱. بخش گرم‌کردن و تمرینات کششی در آب (Warm-up)</div>
      <div class="section-content">${escapeHtml(plan.warmup_section)}</div>` : ''}

      ${plan.main_section ? `
      <div class="section-title">۲. بخش اصلی و ست‌های تمرین شنا (Main Set)</div>
      <div class="section-content" style="border-right-width: 6px; font-family: 'Courier New', Tahoma, monospace;">${escapeHtml(plan.main_section)}</div>` : ''}

      ${plan.cooldown_section ? `
      <div class="section-title">۳. بخش سردکردن و ریکاوری (Cool-down)</div>
      <div class="section-content">${escapeHtml(plan.cooldown_section)}</div>` : ''}
    `;
  }

  if (plan.notes) {
    contentHtml += `
      <div class="section-title ${isDiet ? 'diet' : ''}">نکات و توصیه‌های مربی</div>
      <div class="section-content ${isDiet ? 'diet' : ''}">${escapeHtml(plan.notes)}</div>
    `;
  }

  const wordDocumentHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${plan.title}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: A4 portrait;
          margin: 2cm 2cm 2cm 2cm;
          mso-page-orientation: portrait;
        }
        body {
          font-family: 'Vazirmatn', Tahoma, 'B Nazanin', Arial, sans-serif;
          direction: rtl;
          text-align: right;
          color: #0f172a;
          background-color: #ffffff;
          line-height: 1.7;
        }
        .header-box {
          border-bottom: 3px solid ${isDiet ? '#16a34a' : '#0284c7'};
          padding-bottom: 12px;
          margin-bottom: 25px;
        }
        .academy-title {
          font-size: 18pt;
          font-weight: bold;
          color: #0369a1;
          margin: 0;
        }
        .plan-type-badge {
          display: inline-block;
          font-size: 11pt;
          font-weight: bold;
          color: ${isDiet ? '#15803d' : '#0369a1'};
          background-color: ${isDiet ? '#dcfce7' : '#e0f2fe'};
          padding: 3px 10px;
          border-radius: 4px;
          margin-top: 4px;
        }
        .plan-title {
          font-size: 16pt;
          font-weight: bold;
          color: #0f172a;
          margin: 12px 0 6px 0;
        }
        .meta-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 18px;
        }
        .meta-table td {
          padding: 8px 12px;
          border: 1px solid #cbd5e1;
          font-size: 10pt;
        }
        .section-title {
          background-color: #0284c7;
          color: #ffffff;
          padding: 8px 12px;
          font-size: 11.5pt;
          font-weight: bold;
          border-radius: 4px;
          margin-top: 22px;
          margin-bottom: 8px;
        }
        .section-title.diet {
          background-color: #16a34a;
        }
        .section-content {
          background-color: #f8fafc;
          border-right: 4px solid #0284c7;
          padding: 12px 14px;
          font-size: 10.5pt;
          line-height: 1.8;
          margin-bottom: 15px;
          border-radius: 2px;
        }
        .section-content.diet {
          border-right-color: #16a34a;
        }
        .meal-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          margin-bottom: 18px;
        }
        .footer-box {
          margin-top: 45px;
          border-top: 1px solid #cbd5e1;
          padding-top: 15px;
          display: flex;
          justify-content: space-between;
          font-size: 9.5pt;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="header-box">
        <table style="width: 100%; border: none;">
          <tr>
            <td style="border: none; text-align: right;">
              <div class="academy-title">آکادمی و سامانه تخصصی شنا ایران (IranSwim)</div>
              <div class="plan-type-badge">${planTypeFa}</div>
            </td>
            <td style="border: none; text-align: left; vertical-align: top; font-size: 9.5pt; color: #64748b;">
              تاریخ صدور: ${todayFa}<br/>
              کد سند: ${plan.id ? `PLN-${plan.id}` : 'پیش‌نویس'}
            </td>
          </tr>
        </table>
        <h1 class="plan-title">${escapeHtml(plan.title)}</h1>
      </div>

      <table class="meta-table">
        <tr>
          <td style="width: 25%; font-weight: bold; background-color: #f8fafc;">مربی صادرکننده:</td>
          <td style="width: 25%;">${escapeHtml(plan.coach_name || 'کادر فنی آکادمی')}</td>
          <td style="width: 25%; font-weight: bold; background-color: #f8fafc;">مخاطب برنامه:</td>
          <td style="width: 25%;">${escapeHtml(targetLabel)}</td>
        </tr>
      </table>

      ${contentHtml}

      <div class="footer-box">
        <table style="width: 100%; border: none; margin-top: 30px;">
          <tr>
            <td style="border: none; text-align: right; width: 60%; font-size: 9pt; color: #64748b;">
              این سند به صورت رسمی از پرتال آموزشگاه شنای ایران صادر گردیده و اجرای دقیق آن جهت دستیابی به اوج آمادگی جسمانی و تکنیکی الزامی است.
            </td>
            <td style="border: none; text-align: left; width: 40%; font-size: 10pt; font-weight: bold; color: #0f172a;">
              محل تأیید و امضای مربی:<br/><br/>
              ${escapeHtml(plan.coach_name || 'مربی شنا')}
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', wordDocumentHtml], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeTitle = (plan.title || 'برنامه').replace(/[\\/:*?"<>|]/g, '-');
  link.href = url;
  link.download = `${safeTitle}-${plan.plan_type === 'DIET' ? 'غذایی' : 'تمرینی'}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Triggers a print / PDF export window with full layout styling
 */
export const printPlanToPdf = (plan) => {
  if (!plan) return;

  const isDiet = plan.plan_type === 'DIET';
  const planTypeFa = isDiet ? 'برنامه غذایی و رژیم ورزشی' : 'برنامه تمرینی تخصصی شنا';
  const todayFa = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const targetLabel = plan.target_type === 'INDIVIDUAL' && plan.swimmer_name
    ? `شناگر اختصاصی: ${plan.swimmer_name}`
    : plan.group_name
    ? `کلاس / گروه: ${plan.group_name}`
    : 'عمومی / سراسری';

  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) {
    alert('لطفاً به مرورگر اجازه باز کردن پنجره چاپ را بدهید.');
    return;
  }

  let bodyContent = '';

  if (isDiet) {
    bodyContent = `
      <div class="card mb-4">
        <h3 class="section-header diet">هدف و شاخص‌های تغذیه‌ای</h3>
        <div class="grid-2">
          <div><strong>هدف فیزیولوژیک:</strong> ${escapeHtml(plan.diet_goal || 'ارتقای توان و استقامت در آب')}</div>
          ${plan.daily_calories ? `<div><strong>کالری هدف روزانه:</strong> ${plan.daily_calories.toLocaleString('fa-IR')} کیلوکالری</div>` : ''}
        </div>
      </div>

      <div class="card mb-4">
        <h3 class="section-header diet">وعده‌های غذایی</h3>
        <table class="table">
          <thead>
            <tr>
              <th style="width: 28%;">وعده</th>
              <th>دستور مصرف و مواد غذایی</th>
            </tr>
          </thead>
          <tbody>
            ${plan.breakfast ? `<tr><td class="font-bold">صبحانه</td><td>${escapeHtml(plan.breakfast)}</td></tr>` : ''}
            ${plan.morning_snack ? `<tr><td class="font-bold">میان‌وعده صبح</td><td>${escapeHtml(plan.morning_snack)}</td></tr>` : ''}
            ${plan.lunch ? `<tr><td class="font-bold">ناهار</td><td>${escapeHtml(plan.lunch)}</td></tr>` : ''}
            ${plan.afternoon_snack ? `<tr><td class="font-bold">میان‌وعده عصر / قبل تمرین</td><td>${escapeHtml(plan.afternoon_snack)}</td></tr>` : ''}
            ${plan.dinner ? `<tr><td class="font-bold">شام</td><td>${escapeHtml(plan.dinner)}</td></tr>` : ''}
            ${plan.post_workout_snack ? `<tr><td class="font-bold">تغذیه بعد از تمرین (ریکاوری)</td><td>${escapeHtml(plan.post_workout_snack)}</td></tr>` : ''}
          </tbody>
        </table>
      </div>

      ${plan.hydration_guidelines ? `
      <div class="card mb-4">
        <h3 class="section-header diet">مصرف آب و الکترولیت‌ها</h3>
        <p class="whitespace-pre">${escapeHtml(plan.hydration_guidelines)}</p>
      </div>` : ''}

      ${plan.supplements ? `
      <div class="card mb-4">
        <h3 class="section-header diet">مکمل‌ها و ویتامین‌ها</h3>
        <p class="whitespace-pre">${escapeHtml(plan.supplements)}</p>
      </div>` : ''}

      ${plan.dietary_guidelines ? `
      <div class="card mb-4">
        <h3 class="section-header diet">پرهیزها و نکات تغذیه‌ای</h3>
        <p class="whitespace-pre">${escapeHtml(plan.dietary_guidelines)}</p>
      </div>` : ''}
    `;
  } else {
    // Training plan
    bodyContent = `
      <div class="card mb-4">
        <h3 class="section-header">مشخصات جلسه تمرین</h3>
        <div class="grid-2">
          ${plan.duration_minutes ? `<div><strong>مدت زمان:</strong> ${plan.duration_minutes} دقیقه</div>` : ''}
          ${plan.target_level_name ? `<div><strong>سطح مهارت:</strong> ${escapeHtml(plan.target_level_name)}</div>` : ''}
          ${plan.focus_skills ? `<div><strong>تمرکز تکنیکی:</strong> ${escapeHtml(plan.focus_skills)}</div>` : ''}
          ${plan.equipment ? `<div><strong>تجهیزات مورد نیاز:</strong> ${escapeHtml(plan.equipment)}</div>` : ''}
        </div>
      </div>

      ${plan.warmup_section ? `
      <div class="card mb-4">
        <h3 class="section-header">۱. گرم‌کردن و کشش در آب (Warm-up)</h3>
        <p class="whitespace-pre">${escapeHtml(plan.warmup_section)}</p>
      </div>` : ''}

      ${plan.main_section ? `
      <div class="card mb-4">
        <h3 class="section-header">۲. ست‌های تمرین اصلی (Main Set)</h3>
        <pre class="font-mono">${escapeHtml(plan.main_section)}</pre>
      </div>` : ''}

      ${plan.cooldown_section ? `
      <div class="card mb-4">
        <h3 class="section-header">۳. سردکردن و ریکاوری (Cool-down)</h3>
        <p class="whitespace-pre">${escapeHtml(plan.cooldown_section)}</p>
      </div>` : ''}
    `;
  }

  if (plan.notes) {
    bodyContent += `
      <div class="card mb-4">
        <h3 class="section-header ${isDiet ? 'diet' : ''}">توضیحات و نکات مربی</h3>
        <p class="whitespace-pre">${escapeHtml(plan.notes)}</p>
      </div>
    `;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <head>
      <meta charset="utf-8">
      <title>${escapeHtml(plan.title)} - نسخه چاپی / PDF</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 1.5cm;
        }
        * { box-sizing: border-box; }
        body {
          font-family: 'Vazirmatn', Tahoma, sans-serif;
          direction: rtl;
          color: #0f172a;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          background-color: #ffffff;
        }
        .header {
          border-bottom: 2px solid ${isDiet ? '#16a34a' : '#0284c7'};
          padding-bottom: 12px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .title { font-size: 20px; font-weight: bold; margin: 0 0 6px 0; color: #0f172a; }
        .badge {
          display: inline-block;
          padding: 4px 10px;
          background-color: ${isDiet ? '#dcfce7' : '#e0f2fe'};
          color: ${isDiet ? '#15803d' : '#0369a1'};
          border-radius: 6px;
          font-size: 13px;
          font-weight: bold;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 13px;
        }
        .card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 14px;
          margin-bottom: 16px;
          page-break-inside: avoid;
        }
        .section-header {
          background-color: #0284c7;
          color: white;
          padding: 6px 12px;
          font-size: 14px;
          margin: -14px -14px 12px -14px;
          border-radius: 7px 7px 0 0;
        }
        .section-header.diet {
          background-color: #16a34a;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          font-size: 13.5px;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
        }
        .table th {
          background: #f1f5f9;
          padding: 8px;
          border: 1px solid #cbd5e1;
          text-align: right;
        }
        .table td {
          padding: 8px;
          border: 1px solid #cbd5e1;
        }
        .font-bold { font-weight: bold; }
        .whitespace-pre { white-space: pre-wrap; font-size: 13.5px; }
        .font-mono {
          font-family: monospace;
          background: #f8fafc;
          padding: 10px;
          border-radius: 6px;
          white-space: pre-wrap;
          font-size: 13px;
          direction: ltr;
          text-align: left;
        }
        .footer {
          margin-top: 35px;
          padding-top: 15px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #64748b;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px; padding: 12px; background: #e0f2fe; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
        <span>پیش‌نمایش چاپ / ذخیره PDF: لطفاً از پنجره باز شده دکمه «Save as PDF» یا چاپگر خود را انتخاب کنید.</span>
        <button onclick="window.print()" style="padding: 8px 18px; background: #0284c7; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
          چاپ / دریافت PDF
        </button>
      </div>

      <div class="header">
        <div>
          <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;">سامانه آموزشگاه و شناگران ایران (IranSwim)</div>
          <h1 class="title">${escapeHtml(plan.title)}</h1>
          <span class="badge">${planTypeFa}</span>
        </div>
        <div style="text-align: left; font-size: 12px; color: #64748b;">
          <div>تاریخ: ${todayFa}</div>
          <div>مربی: ${escapeHtml(plan.coach_name || 'کادر فنی')}</div>
        </div>
      </div>

      <div class="meta-grid">
        <div><strong>مخاطب:</strong> ${escapeHtml(targetLabel)}</div>
        <div><strong>وضعیت:</strong> ${plan.sent_at ? 'ارسال‌شده به مخاطبان' : 'پیش‌نویس / آماده ارسال'}</div>
      </div>

      ${bodyContent}

      <div class="footer">
        <div>این برنامه توسط مربی رسمی آکادمی تدوین شده و تابع مقررات تمرینی است.</div>
        <div>امضا و تأیید مربی: ${escapeHtml(plan.coach_name || '')}</div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
};
