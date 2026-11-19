/**
 * IranSwim Analytics & Event Measurement Utility
 * Production-ready infrastructure for Google Analytics 4 (GA4) and Google Search Console (GSC).
 * Note: Real Measurement ID (G-XXXXXXXXXX) must be provided by the business owner.
 */

// Safe dispatcher for Google Analytics 4 custom events
export const trackEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, {
      site: 'IranSwim',
      city: 'Qazvin',
      ...params,
    });
  } else {
    // Development / non-tracked fallback logger
    if (import.meta.env.DEV) {
      console.debug(`[Analytics Event: ${eventName}]`, params);
    }
  }
};

/**
 * Event: User clicks to call admission phone number
 */
export const trackPhoneCallClick = (phoneNumber = '02833650000', source = 'website') => {
  trackEvent('click_phone_call', {
    phone_number: phoneNumber,
    source_location: source,
  });
};

/**
 * Event: User opens course enrollment form or clicks register
 */
export const trackBeginRegistration = (courseName, courseId, price) => {
  trackEvent('begin_registration', {
    course_id: courseId,
    course_name: courseName,
    value: price,
    currency: 'IRR',
  });
};

/**
 * Event: User successfully submits a course enrollment request
 */
export const trackCompleteRegistration = (courseName, courseId, installmentsCount, price) => {
  trackEvent('complete_registration', {
    course_id: courseId,
    course_name: courseName,
    installments_count: installmentsCount,
    value: price,
    currency: 'IRR',
  });
};

/**
 * Event: User interacts with pool details or map
 */
export const trackPoolView = (poolName, poolSlug) => {
  trackEvent('view_pool', {
    pool_name: poolName,
    pool_slug: poolSlug,
  });
};
