export const BANK_BINS = {
  '603799': 'بانک ملی ایران',
  '589210': 'بانک سپه',
  '627648': 'بانک توسعه صادرات',
  '627961': 'بانک صنعت و معدن',
  '603770': 'بانک کشاورزی',
  '628023': 'بانک مسکن',
  '627760': 'پست بانک ایران',
  '502908': 'بانک توسعه تعاون',
  '627412': 'بانک اقتصاد نوین',
  '622106': 'بانک پارسیان',
  '639194': 'بانک پارسیان',
  '627884': 'بانک پارسیان',
  '502229': 'بانک پاسارگاد',
  '639347': 'بانک پاسارگاد',
  '627488': 'بانک کارآفرین',
  '621986': 'بانک سامان / بلوبانک',
  '639346': 'بانک سینا',
  '639607': 'بانک سرمایه',
  '636214': 'بانک آینده',
  '502806': 'بانک شهر',
  '504706': 'بانک شهر',
  '502938': 'بانک دی',
  '603769': 'بانک صادرات ایران',
  '610433': 'بانک ملت',
  '991975': 'بانک ملت',
  '585983': 'بانک تجارت',
  '505785': 'بانک ایران زمین',
  '606373': 'بانک قرض‌الحسنه مهر ایران',
  '639599': 'بانک قوامین',
  '504172': 'بانک قرض‌الحسنه رسالت',
  '505416': 'بانک گردشگری',
};

export const getBankNameFromCard = (cardStr) => {
  if (!cardStr) return null;
  const clean = String(cardStr).replace(/\D/g, '');
  if (clean.length < 6) return null;
  const prefix = clean.slice(0, 6);
  return BANK_BINS[prefix] || 'عضو شبکه شتاب';
};

export const formatCardNumberWithDashes = (val) => {
  if (!val) return '';
  const digits = String(val).replace(/\D/g, '').slice(0, 16);
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(' - ');
};

export const copyCardToClipboard = (card, label = 'شماره کارت', toast = null) => {
  const clean = String(card || '').replace(/\D/g, '');
  if (!clean) {
    if (toast) toast.error('شماره کارتی جهت کپی وجود ندارد.');
    return false;
  }
  if (navigator && navigator.clipboard) {
    navigator.clipboard.writeText(clean);
  }
  if (toast) {
    toast.success(`${label} با موفقیت در حافظه کپی شد (${formatCardNumberWithDashes(clean)})`);
  }
  return true;
};
