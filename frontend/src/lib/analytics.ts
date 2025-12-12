// Analytics hook for future GA4 / Plausible integration
// Currently logs to console for development

export const trackEvent = (name: string, data?: Record<string, any>): void => {
  // Defensive check for window (SSR safety)
  if (typeof window === 'undefined') {
    return;
  }

  // Console log for now (placeholder for future analytics integration)
  console.log('[Analytics]', name, data || '');

  // Future: Add GA4 integration
  // if (window.gtag) {
  //   window.gtag('event', name, data);
  // }

  // Future: Add Plausible integration
  // if (window.plausible) {
  //   window.plausible(name, { props: data });
  // }
};

