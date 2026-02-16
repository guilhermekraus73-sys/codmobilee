import { useEffect } from 'react';

const UTMIFY_PIXEL_ID = "694319ad74dd503618cd6322";

export const useUtmifyStripePixel = () => {
  useEffect(() => {
    // Set pixel ID globally
    (window as any).pixelId = UTMIFY_PIXEL_ID;

    // Add main pixel script
    const pixelScript = document.createElement("script");
    pixelScript.setAttribute("async", "");
    pixelScript.setAttribute("defer", "");
    pixelScript.setAttribute("src", "https://cdn.utmify.com.br/scripts/pixel/pixel.js");
    pixelScript.id = "utmify-pixel-stripe";
    
    if (!document.getElementById("utmify-pixel-stripe")) {
      document.head.appendChild(pixelScript);
    }

    // Add UTMs tracking script
    const utmsScript = document.createElement("script");
    utmsScript.setAttribute("async", "");
    utmsScript.setAttribute("defer", "");
    utmsScript.setAttribute("src", "https://cdn.utmify.com.br/scripts/utms/latest.js");
    utmsScript.setAttribute("data-utmify-prevent-xcod-sck", "");
    utmsScript.setAttribute("data-utmify-prevent-subids", "");
    utmsScript.id = "utmify-utms-stripe";
    
    if (!document.getElementById("utmify-utms-stripe")) {
      document.head.appendChild(utmsScript);
    }
  }, []);
};

// Get UTMify lead ID from localStorage - check ALL possible keys the pixel might use
export const getUtmifyLeadId = (): string => {
  try {
    // Check all possible UTMify storage keys
    const possibleKeys = ['utmify_lead', 'utmify_pixel_data', '_utmify', 'utmify'];
    for (const key of possibleKeys) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed._id) return parsed._id;
          if (parsed.id) return parsed.id;
          if (parsed.lead_id) return parsed.lead_id;
          if (typeof parsed === 'string') return parsed;
        } catch {
          // Might be a plain string
          if (data.length > 5 && data.length < 50) return data;
        }
      }
    }
    
    // Also check cookies for UTMify data
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name && (name.includes('utmify') || name === '_src')) {
        try {
          const decoded = decodeURIComponent(value);
          const parsed = JSON.parse(decoded);
          if (parsed._id) return parsed._id;
        } catch {
          if (value && value.length > 5 && value.length < 50) return value;
        }
      }
    }
  } catch (e) {
    console.log('[UTMify] Error getting lead ID:', e);
  }
  return '';
};

// Scan ALL localStorage keys for UTMify-related data
const scanUtmifyStorage = (): Record<string, string> => {
  const result: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const lk = key.toLowerCase();
      if (lk.includes('utmify') || lk.includes('utm_') || lk === '_src' || lk === '_sck' || lk === 'src' || lk === 'sck') {
        const val = localStorage.getItem(key);
        if (!val) continue;
        try {
          const parsed = JSON.parse(val);
          if (typeof parsed === 'object' && parsed !== null) {
            // Extract known fields from JSON objects
            for (const [pk, pv] of Object.entries(parsed)) {
              if (typeof pv === 'string' && pv.length > 0) {
                result[pk] = pv;
              }
            }
          }
        } catch {
          // Plain string value
          if (val.length > 0 && val.length < 500) {
            result[key] = val;
          }
        }
      }
    }
    console.log('[UTMify] Storage scan found:', Object.keys(result).length, 'entries');
  } catch (e) {
    console.log('[UTMify] Storage scan error:', e);
  }
  return result;
};

// Get UTM parameters from URL, localStorage, UTMify pixel data
export const getUtmParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const storedData = scanUtmifyStorage();
  
  const getParam = (key: string): string => {
    // 1. URL params (highest priority)
    const urlValue = urlParams.get(key);
    if (urlValue) return urlValue;
    
    // 2. localStorage utm_ prefixed
    const localValue = localStorage.getItem(`utm_${key}`);
    if (localValue) return localValue;
    
    // 3. sessionStorage utm_ prefixed
    const sessionValue = sessionStorage.getItem(`utm_${key}`);
    if (sessionValue) return sessionValue;

    // 4. UTMify storage scan
    if (storedData[key]) return storedData[key];
    
    return '';
  };

  const fbclid = getParam('fbclid');
  const gclid = getParam('gclid');
  let utm_source = getParam('utm_source');

  // CRITICAL FALLBACK: infer utm_source from click IDs when missing
  if (!utm_source) {
    if (fbclid) utm_source = 'facebook';
    else if (gclid) utm_source = 'google';
  }

  const params = {
    src: getParam('src') || getUtmifyLeadId(),
    sck: getParam('sck'),
    utm_source,
    utm_medium: getParam('utm_medium'),
    utm_campaign: getParam('utm_campaign'),
    utm_content: getParam('utm_content'),
    utm_term: getParam('utm_term'),
    fbclid,
    gclid,
  };

  console.log('[UTMify] getUtmParams:', params);
  return params;
};

// Store UTM params when user lands on page - MUST be called on every page
export const storeUtmParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const utmKeys = ['src', 'sck', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'ttclid'];
  
  let hasParams = false;
  
  utmKeys.forEach(key => {
    const value = urlParams.get(key);
    if (value) {
      // Store in both localStorage AND sessionStorage for redundancy
      localStorage.setItem(`utm_${key}`, value);
      sessionStorage.setItem(`utm_${key}`, value);
      hasParams = true;
      console.log(`[UTMify] Stored ${key}:`, value);
    }
  });

  if (hasParams) {
    console.log('[UTMify] ✅ UTM parameters captured and stored!');
  }
  
  return hasParams;
};
