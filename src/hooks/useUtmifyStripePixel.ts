import { useEffect } from 'react';

const UTMIFY_PIXEL_ID = "69541e567c5e5c96cc8e701a";

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

// Get UTMify lead ID from localStorage
export const getUtmifyLeadId = (): string => {
  try {
    const utmifyData = localStorage.getItem('utmify_lead');
    if (utmifyData) {
      const parsed = JSON.parse(utmifyData);
      return parsed._id || '';
    }
    
    const pixelData = localStorage.getItem('utmify_pixel_data');
    if (pixelData) {
      const parsed = JSON.parse(pixelData);
      return parsed._id || '';
    }
  } catch (e) {
    console.log('[UTMify] Error getting lead ID:', e);
  }
  return '';
};

// Get UTM parameters from URL and localStorage
export const getUtmParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  
  const getParam = (key: string): string => {
    // First check URL, then localStorage, then sessionStorage
    const urlValue = urlParams.get(key);
    if (urlValue) return urlValue;
    
    const localValue = localStorage.getItem(`utm_${key}`);
    if (localValue) return localValue;
    
    const sessionValue = sessionStorage.getItem(`utm_${key}`);
    if (sessionValue) return sessionValue;
    
    return '';
  };

  const params = {
    src: getParam('src') || getUtmifyLeadId(),
    sck: getParam('sck'),
    utm_source: getParam('utm_source'),
    utm_medium: getParam('utm_medium'),
    utm_campaign: getParam('utm_campaign'),
    utm_content: getParam('utm_content'),
    utm_term: getParam('utm_term'),
    fbclid: getParam('fbclid'),
    gclid: getParam('gclid'),
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
