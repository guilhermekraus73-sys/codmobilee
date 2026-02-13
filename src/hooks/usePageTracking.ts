import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const getSessionId = (): string => {
  let sid = sessionStorage.getItem('tracking_session_id');
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem('tracking_session_id', sid);
  }
  return sid;
};

export const trackPageView = async (page: string) => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Helper to get UTM from multiple storage locations
    const getUtm = (key: string): string | null => {
      return urlParams.get(key) 
        || localStorage.getItem(`utm_${key}`) 
        || sessionStorage.getItem(`utm_${key}`)
        || null;
    };

    // Also try to read from utmify_params JSON
    let storedUtmify: Record<string, string> = {};
    try {
      const raw = localStorage.getItem('utmify_params');
      if (raw) storedUtmify = JSON.parse(raw);
    } catch {}

    await supabase.from('page_views').insert({
      page,
      referrer: document.referrer || null,
      utm_source: getUtm('utm_source') || storedUtmify.utm_source || storedUtmify.src || null,
      utm_medium: getUtm('utm_medium') || storedUtmify.utm_medium || storedUtmify.sck || null,
      utm_campaign: getUtm('utm_campaign') || storedUtmify.utm_campaign || null,
      user_agent: navigator.userAgent.substring(0, 200),
      session_id: getSessionId(),
    } as any);
  } catch (e) {
    // Silent fail - don't break the app
    console.log('[Tracking] Error:', e);
  }
};

export const usePageTracking = (page: string) => {
  useEffect(() => {
    trackPageView(page);
  }, [page]);
};
