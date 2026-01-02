// Utmify UTM Tracking Library

const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id'];
const STORAGE_KEY = 'utmify_params';
const CLICK_IDS = ['fbclid', 'gclid', 'ttclid', 'kwai_click_id', 'xcod'];

interface UTMData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  utm_id?: string;
  fbclid?: string;
  gclid?: string;
  ttclid?: string;
  kwai_click_id?: string;
  xcod?: string;
  landing_page?: string;
  referrer?: string;
  timestamp?: string;
}

// Capture UTM parameters from URL
export const captureUTMParams = (): UTMData => {
  const urlParams = new URLSearchParams(window.location.search);
  const utmData: UTMData = {};

  // Capture UTM parameters
  UTM_PARAMS.forEach(param => {
    const value = urlParams.get(param);
    if (value) {
      utmData[param as keyof UTMData] = value;
    }
  });

  // Capture click IDs (fbclid, gclid, etc.)
  CLICK_IDS.forEach(param => {
    const value = urlParams.get(param);
    if (value) {
      utmData[param as keyof UTMData] = value;
    }
  });

  // Add metadata
  utmData.landing_page = window.location.href;
  utmData.referrer = document.referrer || undefined;
  utmData.timestamp = new Date().toISOString();

  return utmData;
};

// Store UTM data in localStorage and cookies
export const storeUTMData = (data: UTMData): void => {
  if (Object.keys(data).length === 0) return;

  // Check if we already have stored data
  const existingData = getStoredUTMData();
  
  // Only update if we have new UTM params (don't overwrite with empty data)
  const hasNewUTMs = UTM_PARAMS.some(param => data[param as keyof UTMData]);
  const hasNewClickIds = CLICK_IDS.some(param => data[param as keyof UTMData]);
  
  if (hasNewUTMs || hasNewClickIds || !existingData) {
    const dataToStore = { ...existingData, ...data };
    
    // Store in localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
    } catch (e) {
      console.warn('Failed to store UTM data in localStorage:', e);
    }

    // Store in cookies for cross-subdomain tracking
    try {
      const cookieValue = encodeURIComponent(JSON.stringify(dataToStore));
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 days
      document.cookie = `${STORAGE_KEY}=${cookieValue}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
    } catch (e) {
      console.warn('Failed to store UTM data in cookies:', e);
    }
  }
};

// Get stored UTM data
export const getStoredUTMData = (): UTMData | null => {
  // Try localStorage first
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to read UTM data from localStorage:', e);
  }

  // Fallback to cookies
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === STORAGE_KEY && value) {
        return JSON.parse(decodeURIComponent(value));
      }
    }
  } catch (e) {
    console.warn('Failed to read UTM data from cookies:', e);
  }

  return null;
};

// Initialize UTM tracking - call this on app load
export const initUTMTracking = (): void => {
  const utmData = captureUTMParams();
  storeUTMData(utmData);
  console.log('[Utmify] UTM tracking initialized:', utmData);
};

// Get UTM data for sending with conversions
export const getUTMDataForConversion = (): UTMData | null => {
  return getStoredUTMData();
};

// Track page view event
export const trackPageView = (pageName?: string): void => {
  const utmData = getStoredUTMData();
  console.log('[Utmify] PageView:', { page: pageName || window.location.pathname, ...utmData });
  
  // Dispatch event for UTMify pixel
  if (typeof window !== 'undefined' && (window as any).utmify) {
    (window as any).utmify.track('PageView');
  }
};

// Track initiate checkout event
export const trackInitiateCheckout = (value?: number, currency?: string): void => {
  const utmData = getStoredUTMData();
  console.log('[Utmify] InitiateCheckout:', { value, currency, ...utmData });
  
  // Dispatch event for UTMify pixel
  if (typeof window !== 'undefined' && (window as any).utmify) {
    (window as any).utmify.track('InitiateCheckout', { value, currency });
  }
};

// Track purchase event - THIS IS CRITICAL FOR SALES TRACKING
export const trackPurchase = (orderId: string, value: number, currency?: string): void => {
  const utmData = getStoredUTMData();
  console.log('[Utmify] Purchase:', { orderId, value, currency, ...utmData });
  
  if (typeof window !== 'undefined') {
    // CRITICAL: Track to Meta Pixel directly via fbq
    if (typeof (window as any).fbq === 'function') {
      console.log('[Utmify] Dispatching fbq Purchase event...');
      (window as any).fbq('track', 'Purchase', {
        value: value,
        currency: currency || 'USD',
        content_type: 'product',
        content_ids: [orderId],
        order_id: orderId
      });
      console.log('[Utmify] ✅ fbq Purchase event dispatched!');
    } else {
      console.warn('[Utmify] ⚠️ fbq not available yet, retrying in 500ms...');
      // Retry after a short delay if fbq isn't loaded yet
      setTimeout(() => {
        if (typeof (window as any).fbq === 'function') {
          (window as any).fbq('track', 'Purchase', {
            value: value,
            currency: currency || 'USD',
            content_type: 'product',
            content_ids: [orderId],
            order_id: orderId
          });
          console.log('[Utmify] ✅ fbq Purchase event dispatched (delayed)!');
        } else {
          console.error('[Utmify] ❌ fbq still not available after delay');
        }
      }, 500);
    }

    // Method 1: Using utmify global object
    if ((window as any).utmify) {
      (window as any).utmify.track('Purchase', { 
        value, 
        currency: currency || 'USD',
        order_id: orderId 
      });
    }
    
    // Method 2: Dispatch custom event that UTMify pixel listens to
    window.dispatchEvent(new CustomEvent('utmify:purchase', {
      detail: {
        value,
        currency: currency || 'USD',
        order_id: orderId,
        ...utmData
      }
    }));
    
    // Method 3: Direct pixel tracking via dataLayer (if available)
    if ((window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'purchase',
        ecommerce: {
          transaction_id: orderId,
          value: value,
          currency: currency || 'USD'
        }
      });
    }
  }
};

// Track AddToCart event
export const trackAddToCart = (value?: number, currency?: string, productId?: string): void => {
  const utmData = getStoredUTMData();
  console.log('[Utmify] AddToCart:', { value, currency, productId, ...utmData });
  
  if (typeof window !== 'undefined' && (window as any).utmify) {
    (window as any).utmify.track('AddToCart', { value, currency, product_id: productId });
  }
};
