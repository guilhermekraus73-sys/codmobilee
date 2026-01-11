import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, Home, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import codmHeroBanner from '@/assets/codm-hero-banner.png';
import { trackPurchase, getStoredUTMData } from '@/lib/utmify';

const SuccessEn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sessionId = searchParams.get('session_id');
  const paymentIntentId = searchParams.get('payment_intent');

  useEffect(() => {
    const trackPurchaseEvent = async () => {
      try {
        const price = sessionStorage.getItem('checkout_price') || localStorage.getItem('last_checkout_price');
        const email = sessionStorage.getItem('checkout_email') || localStorage.getItem('last_checkout_email');
        const name = sessionStorage.getItem('checkout_name') || localStorage.getItem('last_checkout_name');
        const packageId = sessionStorage.getItem('checkout_package');
        const productName = sessionStorage.getItem('checkout_product_name');
        
        if (price) {
          trackPurchase(parseFloat(price), 'USD', paymentIntentId || sessionId || '');
        }
        
        const utmData = getStoredUTMData();
        if (price && (sessionId || paymentIntentId)) {
          const trackingData = {
            transactionId: paymentIntentId || sessionId,
            value: parseFloat(price),
            currency: 'USD',
            email: email,
            name: name,
            packageId: packageId,
            productName: productName,
            utmData: utmData,
          };
          console.log('[SuccessEn] Tracking purchase:', trackingData);
        }
      } catch (error) {
        console.error('[SuccessEn] Error tracking purchase:', error);
      }
    };

    trackPurchaseEvent();
  }, [sessionId, paymentIntentId]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <header className="bg-[#111] border-b border-gray-800 py-3 px-4">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <span className="text-white font-bold text-sm tracking-wide">CALL OF DUTY</span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400 text-sm">WEB STORE</span>
        </div>
      </header>

      <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-b from-green-500/20 to-transparent rounded-3xl p-8 mb-8 text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <Check className="w-10 h-10 text-white" strokeWidth={3} />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
          <p className="text-gray-400 text-lg">Your CP have been added to your account</p>
        </div>

        <div className="bg-[#141414] border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-white font-semibold text-lg mb-4">Order Confirmation</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-400">Status</span>
              <span className="text-green-500 font-semibold">Completed</span>
            </div>
            
            {(paymentIntentId || sessionId) && (
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-400">Transaction ID</span>
                <span className="text-white font-mono text-sm">{(paymentIntentId || sessionId)?.slice(-12)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Product</span>
              <span className="text-white">CP Bonus Package</span>
            </div>
          </div>
        </div>

        <div className="relative rounded-xl overflow-hidden mb-8">
          <img 
            src={codmHeroBanner} 
            alt="Call of Duty Mobile" 
            className="w-full h-auto object-cover"
          />
        </div>

        <Button 
          onClick={() => navigate('/en')}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-xl text-base flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </Button>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm mb-2">Need help?</p>
          <a 
            href="#" 
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Contact Support</span>
          </a>
        </div>
      </div>

      <footer className="bg-[#111] border-t border-gray-800 py-4 px-4 mt-auto">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-500 text-xs mb-2">© Activision. All rights reserved.</p>
          <div className="flex items-center justify-center gap-4 text-xs flex-wrap">
            <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">FAQ</a>
            <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Terms and Conditions</a>
            <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SuccessEn;
