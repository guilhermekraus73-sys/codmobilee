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
    
    await supabase.from('page_views').insert({
      page,
      referrer: document.referrer || null,
      utm_source: urlParams.get('utm_source') || localStorage.getItem('utm_utm_source') || null,
      utm_medium: urlParams.get('utm_medium') || localStorage.getItem('utm_utm_medium') || null,
      utm_campaign: urlParams.get('utm_campaign') || localStorage.getItem('utm_utm_campaign') || null,
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
