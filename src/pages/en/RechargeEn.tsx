import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useXcodUrl } from '@/hooks/useXcodParam';
import { Button } from '@/components/ui/button';
import { Check, CreditCard, Loader2 } from 'lucide-react';
import codmBanner from '@/assets/codm-banner.png';
import codmIcon from '@/assets/codm-icon.png';
import codmHeroBanner from '@/assets/codm-hero-banner.png';
import cpCoinsStack from '@/assets/cp-coins-new.png';
import paymentNequi from '@/assets/payment-nequi.png';
import paymentYape from '@/assets/payment-yape.png';
import paymentMercadopago from '@/assets/payment-mercadopago.png';
import paymentEfecty from '@/assets/payment-efecty.svg';
import paymentBancolombia from '@/assets/payment-bancolombia.png';
import paymentPaypal from '@/assets/payment-paypal.png';
import paymentPse from '@/assets/payment-pse.png';
import codmCheckoutBanner from '@/assets/codm-checkout-banner.png';
import cpCoinsGold from '@/assets/cp-coins-gold.jpg';
import { initUTMTracking, trackPageView } from '@/lib/utmify';
import { useImagePreloader, preloadNextPageImages } from '@/hooks/useImagePreloader';

// All images for this page
const pageImages = [
  codmBanner,
  codmIcon,
  codmHeroBanner,
  cpCoinsStack,
  paymentNequi,
  paymentYape,
  paymentMercadopago,
  paymentEfecty,
  paymentBancolombia,
  paymentPaypal,
  paymentPse,
];

// Next page images (checkout)
const checkoutImages = [
  codmCheckoutBanner,
  cpCoinsGold,
];

interface CpPackage {
  id: number;
  cp: number;
  bonus: number;
  price: number;
  highlight?: boolean;
}

const cpPackages: CpPackage[] = [
  { id: 1, cp: 800, bonus: 600, price: 9.00 },
  { id: 2, cp: 1600, bonus: 1200, price: 15.90 },
  { id: 3, cp: 4000, bonus: 1500, price: 19.90, highlight: true },
];

interface PaymentMethod {
  id: string;
  name: string;
  logo?: string;
  brands?: string[];
}

const paymentMethods: PaymentMethod[] = [
  { id: 'card', name: 'Credit / Debit', brands: ['ELO', 'VISA', 'MC', 'AMEX'] },
  { id: 'paypal', name: 'PayPal', logo: paymentPaypal },
];

const RechargeEn = () => {
  const navigate = useNavigate();
  const { buildUrl } = useXcodUrl();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const { isLoading, isReady } = useImagePreloader(pageImages, true);

  // Preload checkout images when ready
  if (isReady) {
    preloadNextPageImages(checkoutImages);
  }

  useEffect(() => {
    // Initialize UTM tracking
    initUTMTracking();
    trackPageView('recharge-en');
    
    const storedId = localStorage.getItem('codm_player_id');
    if (!storedId) {
      navigate('/en/identify');
    } else {
      setPlayerId(storedId);
    }
  }, [navigate]);

  const selectedPkg = selectedPackage ? cpPackages.find(p => p.id === selectedPackage) : null;

  const handleContinue = () => {
    if (selectedPackage && selectedPayment) {
      navigate(buildUrl(`/en/checkout${selectedPackage}`));
    }
  };

  if (!playerId || isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="bg-[#111] border-b border-gray-800 py-3 px-4">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <span className="text-white font-bold text-sm tracking-wide">CALL OF DUTY</span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400 text-sm">WEB STORE</span>
        </div>
      </header>

      <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-6">
        {/* Hero Banner */}
        <div className="relative rounded-xl overflow-hidden mb-6">
          <img 
            src={codmHeroBanner} 
            alt="Call of Duty Mobile" 
            className="w-full h-auto object-cover"
          />
        </div>

        {/* Game Selection */}
        <p className="text-gray-400 text-sm mb-3 italic">Game Selection</p>
        <div className="inline-flex items-center gap-2 bg-[#1a1a1a] border border-primary rounded-full px-4 py-2 mb-4">
          <img src={codmIcon} alt="COD Mobile" className="w-6 h-6 rounded" />
          <span className="text-white font-medium text-sm">Call of Duty Mobile</span>
        </div>

        {/* Game Banner */}
        <div className="relative rounded-xl overflow-hidden mb-6">
          <img 
            src={codmBanner} 
            alt="Call of Duty Mobile - Garena" 
            className="w-full h-auto object-cover"
          />
        </div>

        {/* Section 1 - Account */}
        <div className="bg-[#141414] border border-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">1</span>
            </div>
            <h2 className="text-white font-semibold text-lg">Account</h2>
          </div>

          <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-white font-medium">Player identified</p>
              <p className="text-primary text-sm">70% discount unlocked</p>
            </div>
          </div>
        </div>

        {/* Section 2 - Top-up Value */}
        <div className="bg-[#141414] border border-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">2</span>
            </div>
            <h2 className="text-white font-semibold text-lg">Top-up Value</h2>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {cpPackages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                className={`relative rounded-xl p-2 sm:p-4 text-center transition-all ${
                  selectedPackage === pkg.id
                    ? 'bg-primary/20 border-2 border-primary'
                    : pkg.highlight
                    ? 'bg-gradient-to-b from-amber-900/40 to-[#1a1a1a] border border-amber-600/50 hover:border-amber-500'
                    : 'bg-[#1a1a1a] border border-gray-700 hover:border-gray-500'
                }`}
              >
                {/* Small badge at top */}
                <div className="bg-red-600 text-white text-[8px] sm:text-[10px] font-bold px-1 sm:px-2 py-0.5 rounded inline-block mb-1 sm:mb-2">
                  +100% WEB BONUS
                </div>
                
                <p className="text-white font-bold text-sm sm:text-lg mb-1 sm:mb-2">{pkg.cp.toLocaleString()} CP</p>
                
                <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">{pkg.cp} CP</p>
                <p className="text-yellow-400 font-semibold text-xs sm:text-sm mb-1 sm:mb-2">
                  +{pkg.bonus.toLocaleString()} BONUS
                </p>
                <p className="text-green-400 text-[9px] sm:text-xs font-medium">
                  Total: {(pkg.cp + pkg.bonus).toLocaleString()} CP
                </p>

                <div className="w-10 h-10 sm:w-16 sm:h-16 mx-auto mb-1 sm:mb-3">
                  <img src={cpCoinsStack} alt="CP Coins" className="w-full h-full object-contain" />
                </div>

                <p className="text-primary font-bold text-sm sm:text-xl">US$ {pkg.price.toFixed(2)}</p>
                <p className="text-red-400 text-[10px] sm:text-xs">Ends: 21d 3h 17m</p>
              </button>
            ))}
          </div>

          <p className="text-gray-400 text-xs mt-4 text-center">
            Your credits will be added to your game account as soon as we receive payment confirmation.
          </p>
          <p className="text-primary text-xs mt-2 text-center font-medium">
            The top-up amount will be automatically converted to your local currency!
          </p>
        </div>

        {/* Section 3 - Payment Method */}
        <div className="bg-[#141414] border border-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">3</span>
            </div>
            <h2 className="text-white font-semibold text-lg">Payment Method</h2>
          </div>

          <div className="flex justify-center gap-4">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedPayment(method.id)}
                className={`relative rounded-xl p-4 text-center transition-all ${
                  selectedPayment === method.id
                    ? 'bg-primary/20 border-2 border-primary'
                    : 'bg-[#1a1a1a] border border-gray-700 hover:border-gray-500'
                }`}
              >
                {/* PROMO badge */}
                <div className="absolute -top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">
                  PROMO
                </div>

                {method.id === 'card' ? (
                  <>
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-white text-sm font-medium mb-2">{method.name}</p>
                    <div className="flex items-center justify-center gap-2">
                      {/* Visa */}
                      <svg className="h-6 w-auto" viewBox="0 0 48 16" fill="none">
                        <rect width="48" height="16" rx="2" fill="#1A1F71"/>
                        <path d="M19.5 12.5L21.5 3.5H24L22 12.5H19.5Z" fill="white"/>
                        <path d="M30.5 3.7C30 3.5 29.2 3.3 28.2 3.3C25.7 3.3 24 4.5 24 6.2C24 7.5 25.2 8.2 26.1 8.6C27 9 27.3 9.3 27.3 9.7C27.3 10.3 26.6 10.6 26 10.6C25.1 10.6 24.6 10.5 23.8 10.1L23.5 10L23.2 11.8C23.8 12.1 24.8 12.3 25.9 12.3C28.6 12.3 30.2 11.1 30.2 9.3C30.2 8.3 29.6 7.5 28.3 6.9C27.5 6.5 27 6.2 27 5.8C27 5.4 27.4 5 28.2 5C28.9 5 29.5 5.1 29.9 5.3L30.1 5.4L30.5 3.7Z" fill="white"/>
                        <path d="M34.5 3.5C34 3.5 33.6 3.7 33.4 4.2L29.5 12.5H32.2L32.7 11H36L36.3 12.5H38.7L36.6 3.5H34.5ZM33.4 9.2C33.6 8.6 34.5 6.2 34.5 6.2C34.5 6.2 34.7 5.6 34.8 5.2L35 6.1C35 6.1 35.6 8.7 35.7 9.2H33.4Z" fill="white"/>
                        <path d="M17.5 3.5L15 9.5L14.7 8.1C14.2 6.5 12.7 4.8 11 3.9L13.3 12.5H16L20 3.5H17.5Z" fill="white"/>
                        <path d="M12.5 3.5H8.5L8.5 3.7C11.7 4.5 13.8 6.5 14.5 8.8L13.7 4.3C13.6 3.8 13.1 3.5 12.5 3.5Z" fill="#F9A51A"/>
                      </svg>
                      {/* Mastercard */}
                      <svg className="h-6 w-auto" viewBox="0 0 48 16" fill="none">
                        <rect width="48" height="16" rx="2" fill="#000"/>
                        <circle cx="19" cy="8" r="5" fill="#EB001B"/>
                        <circle cx="29" cy="8" r="5" fill="#F79E1B"/>
                        <path d="M24 4.5C25.3 5.5 26 6.7 26 8C26 9.3 25.3 10.5 24 11.5C22.7 10.5 22 9.3 22 8C22 6.7 22.7 5.5 24 4.5Z" fill="#FF5F00"/>
                      </svg>
                      {/* Amex */}
                      <svg className="h-6 w-auto" viewBox="0 0 48 16" fill="none">
                        <rect width="48" height="16" rx="2" fill="#006FCF"/>
                        <path d="M8 11L10.5 5H12.5L15 11H13L12.5 9.8H10.5L10 11H8ZM11 8.5H12L11.5 6.5L11 8.5Z" fill="white"/>
                        <path d="M15.5 11V5H18.5L19.5 8.5L20.5 5H23.5V11H21.5V7L20 11H19L17.5 7V11H15.5Z" fill="white"/>
                        <path d="M24.5 11V5H29.5V6.5H26.5V7.3H29.3V8.7H26.5V9.5H29.5V11H24.5Z" fill="white"/>
                        <path d="M30.5 11L33 8L30.5 5H33L34.5 7L36 5H38.5L36 8L38.5 11H36L34.5 9L33 11H30.5Z" fill="white"/>
                      </svg>
                    </div>
                  </>
                ) : (
                  <>
                    <img 
                      src={method.logo} 
                      alt={method.name} 
                      className="h-12 mx-auto mb-2 object-contain"
                    />
                    <p className="text-white text-sm font-medium">{method.name}</p>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Total Summary */}
        {selectedPkg && (
          <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
            <p className="text-center text-gray-700">
              Total: <span className="text-primary font-bold">US$ {selectedPkg.price.toFixed(2)}</span> for <span className="font-bold text-gray-900">{(selectedPkg.cp + selectedPkg.bonus).toLocaleString()} CP</span>
            </p>
          </div>
        )}

        {/* Continue Button */}
        <Button 
          onClick={handleContinue}
          disabled={!selectedPackage || !selectedPayment}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-xl text-base"
        >
          Continue
        </Button>
      </div>

      {/* Footer */}
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

export default RechargeEn;
