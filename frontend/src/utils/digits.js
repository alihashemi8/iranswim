/**
 * Convert Persian and Arabic numbers to standard English digits (0-9).
 * E.g. '۰۱۲۳۴۵۶۷۸۹' -> '0123456789'
 *      '٠١٢٣٤٥٦٧٨٩' -> '0123456789'
 */
export const toEnglishDigits = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
};

export default toEnglishDigits;
