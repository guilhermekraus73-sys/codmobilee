import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import codmHeroBanner from '@/assets/codm-hero-banner.png';
import { trackPurchase, getStoredUTMData } from '@/lib/utmify';
import { supabase } from '@/integrations/supabase/client';
import { getUtmParams } from '@/hooks/useUtmifyStripePixel';

const Success = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const paymentIntentId = searchParams.get('payment_intent');
  const [showConfetti, setShowConfetti] = useState(true);
  const [purchaseTracked, setPurchaseTracked] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState<'pending' | 'success' | 'error'>('pending');

  useEffect(() => {
    const trackPurchaseToUtmify = async () => {
      // Get the order ID - prefer payment_intent, fallback to session_id
      const orderId = paymentIntentId || sessionId;
      if (!orderId || purchaseTracked) {
        console.log('[UTMify] Skipping - no orderId or already tracked:', { orderId, purchaseTracked });
        return;
      }

      // Get package info from sessionStorage with fallbacks
      let packagePrice = sessionStorage.getItem('checkout_price');
      let customerEmail = sessionStorage.getItem('checkout_email');
      let customerName = sessionStorage.getItem('checkout_name');
      const packageId = sessionStorage.getItem('checkout_package');
      const packageName = sessionStorage.getItem('checkout_product_name');
      
      // Get UTM data from both sources
      const utmData = getStoredUTMData();
      const trackingParams = getUtmParams(); // New UTMify format

      // If sessionStorage is empty, try to get from localStorage
      if (!packagePrice) {
        packagePrice = localStorage.getItem('last_checkout_price');
      }
      if (!customerEmail) {
        customerEmail = localStorage.getItem('last_checkout_email');
      }
      if (!customerName) {
        customerName = localStorage.getItem('last_checkout_name');
      }

      // If still no price, determine from package mapping
      if (!packagePrice) {
        const priceMap: Record<string, string> = {
          'cp-800': '9.00',
          'cp-1600': '15.90',
          'cp-4000': '19.90',
          'cp-test': '1.00',
        };
        packagePrice = packageId ? priceMap[packageId] || '9.00' : '9.00';
      }

      console.log('[UTMify] ========================================');
      console.log('[UTMify] PRIMARY TRACKING FROM CHECKOUT SUCCESS');
      console.log('[UTMify] ========================================');
      console.log('[UTMify] Order ID:', orderId);
      console.log('[UTMify] Price:', packagePrice, 'USD');
      console.log('[UTMify] Email:', customerEmail || 'not provided');
      console.log('[UTMify] Name:', customerName || 'not provided');
      console.log('[UTMify] Package:', packageId || 'unknown');
      console.log('[UTMify] Product Name:', packageName || 'COD Mobile CP');
      console.log('[UTMify] Tracking Params:', JSON.stringify(trackingParams));
      console.log('[UTMify] UTM Data:', JSON.stringify(utmData));

      // MÉTODO 1: Track via client-side (pixel) - may be blocked by ad blockers
      try {
        trackPurchase(orderId, parseFloat(packagePrice), 'USD');
        console.log('[UTMify] ✅ Client-side pixel tracking dispatched');
      } catch (e) {
        console.error('[UTMify] ❌ Client-side pixel error:', e);
      }

      // Track via server-side (edge function) - PRIMARY method with NEW FORMAT
      console.log('[UTMify] Sending to track-purchase edge function (PRIMARY)...');
      
      // Merge tracking params from multiple sources
      const mergedTrackingParams = {
        src: trackingParams.src || null,
        sck: trackingParams.sck || null,
        utm_source: trackingParams.utm_source || utmData?.utm_source || null,
        utm_medium: trackingParams.utm_medium || utmData?.utm_medium || null,
        utm_campaign: trackingParams.utm_campaign || utmData?.utm_campaign || null,
        utm_content: trackingParams.utm_content || utmData?.utm_content || null,
        utm_term: trackingParams.utm_term || utmData?.utm_term || null,
        // IMPORTANTE: incluir fbclid e gclid para atribuição Meta/Google
        fbclid: trackingParams.fbclid || utmData?.fbclid || localStorage.getItem('utm_fbclid') || sessionStorage.getItem('utm_fbclid') || null,
        gclid: trackingParams.gclid || utmData?.gclid || localStorage.getItem('utm_gclid') || sessionStorage.getItem('utm_gclid') || null,
        ttclid: utmData?.ttclid || localStorage.getItem('utm_ttclid') || sessionStorage.getItem('utm_ttclid') || null,
      };

      console.log('[UTMify] Merged tracking params:', JSON.stringify(mergedTrackingParams));

      const trackingPayload = {
        orderId,
        value: parseFloat(packagePrice),
        currency: 'USD',
        email: customerEmail || '',
        name: customerName || 'Cliente',
        productName: packageName || 'COD Mobile CP',
        trackingParams: mergedTrackingParams,
        source: 'checkout_success'
      };

      let trackingSuccess = false;

      // Primeira tentativa
      try {
        const { data, error } = await supabase.functions.invoke('track-purchase', {
          body: trackingPayload
        });

        if (error) {
          console.error('[UTMify] ❌ First attempt failed:', error);
        } else if (data?.success) {
          console.log('[UTMify] ✅ TRACKING SUCCESS (1st attempt):', data);
          trackingSuccess = true;
          setTrackingStatus('success');
        } else {
          console.warn('[UTMify] ⚠️ Response received but success unclear:', data);
        }
      } catch (err) {
        console.error('[UTMify] ❌ First attempt exception:', err);
      }

      // Segunda tentativa se a primeira falhar
      if (!trackingSuccess) {
        console.log('[UTMify] Retrying in 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        try {
          const { data, error } = await supabase.functions.invoke('track-purchase', {
            body: trackingPayload
          });

          if (error) {
            console.error('[UTMify] ❌ Second attempt failed:', error);
          } else if (data?.success) {
            console.log('[UTMify] ✅ TRACKING SUCCESS (2nd attempt):', data);
            trackingSuccess = true;
            setTrackingStatus('success');
          }
        } catch (err) {
          console.error('[UTMify] ❌ Second attempt exception:', err);
        }
      }

      // Terceira tentativa se as duas primeiras falharem
      if (!trackingSuccess) {
        console.log('[UTMify] Final retry in 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        try {
          const { data, error } = await supabase.functions.invoke('track-purchase', {
            body: trackingPayload
          });

          if (!error && data?.success) {
            console.log('[UTMify] ✅ TRACKING SUCCESS (3rd attempt):', data);
            setTrackingStatus('success');
          } else {
            console.error('[UTMify] ❌ All attempts failed');
            setTrackingStatus('error');
          }
        } catch (err) {
          console.error('[UTMify] ❌ Final attempt exception:', err);
          setTrackingStatus('error');
        }
      }

      setPurchaseTracked(true);
      console.log('[UTMify] ========================================');
      console.log('[UTMify] CHECKOUT TRACKING COMPLETE');
      console.log('[UTMify] ========================================');
    };

    trackPurchaseToUtmify();

    // Hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, [sessionId, paymentIntentId, purchaseTracked]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] flex flex-col">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: ['#ff6b35', '#ffd700', '#00ff88', '#00bfff', '#ff00ff'][
                    Math.floor(Math.random() * 5)
                  ],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <header className="bg-[#111] border-b border-gray-800 py-3 px-4">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <span className="text-white font-bold text-sm tracking-wide">CALL OF DUTY</span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400 text-sm">WEB STORE</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Success Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-10 h-10 text-white" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
          ¡Pago Exitoso!
        </h1>
        <p className="text-gray-400 text-center text-lg mb-8 max-w-md">
          Tu compra ha sido procesada correctamente. Los CP serán acreditados a tu cuenta en breve.
        </p>

        {/* Order Details Card */}
        <div className="bg-[#141414] border border-gray-800 rounded-xl p-6 w-full max-w-md mb-8">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
            <Mail className="w-5 h-5 text-primary" />
            <div>
              <p className="text-gray-400 text-sm">Confirmación enviada a</p>
              <p className="text-white">tu correo electrónico</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Estado</span>
              <span className="text-green-500 font-semibold">Completado</span>
            </div>
            {sessionId && (
              <div className="flex justify-between">
                <span className="text-gray-400">ID de transacción</span>
                <span className="text-white text-xs font-mono">{sessionId.slice(0, 20)}...</span>
              </div>
            )}
          </div>
        </div>

        {/* Banner */}
        <div className="w-full max-w-md rounded-xl overflow-hidden mb-8">
          <img 
            src={codmHeroBanner} 
            alt="Call of Duty Mobile" 
            className="w-full h-auto object-cover"
          />
        </div>

        {/* Action Button */}
        <Button 
          onClick={() => navigate('/')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 px-8 rounded-xl text-base flex items-center gap-2"
        >
          Volver al inicio
          <ArrowRight className="w-5 h-5" />
        </Button>

        {/* Support Info */}
        <p className="text-gray-500 text-sm mt-8 text-center">
          ¿Tienes alguna pregunta? Contáctanos en soporte@codmobile.com
        </p>
      </div>
    </div>
  );
};

export default Success;
