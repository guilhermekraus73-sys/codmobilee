import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Clock, Lock } from 'lucide-react';
import cpCoinsGold from '@/assets/cp-coins-gold.jpg';
import codmCheckoutBanner from '@/assets/codm-checkout-banner.png';
import PaymentButton from '@/components/PaymentButton';
import { initUTMTracking, trackPageView, trackInitiateCheckout } from '@/lib/utmify';

const getCardBrand = (cardNumber: string) => {
  const cleanedNumber = cardNumber.replace(/\s/g, '');
  
  if (/^4/.test(cleanedNumber)) return 'visa';
  if (/^5[1-5]/.test(cleanedNumber) || /^2[2-7]/.test(cleanedNumber)) return 'mastercard';
  if (/^3[47]/.test(cleanedNumber)) return 'amex';
  if (/^6(?:011|5)/.test(cleanedNumber)) return 'discover';
  if (/^(?:2131|1800|35)/.test(cleanedNumber)) return 'jcb';
  if (/^3(?:0[0-5]|[68])/.test(cleanedNumber)) return 'diners';
  if (/^62/.test(cleanedNumber)) return 'unionpay';
  if (/^50|^5[6-9]|^6[0-9]/.test(cleanedNumber)) return 'elo';
  
  return null;
};

const CardBrandIcon = ({ brand }: { brand: string | null }) => {
  if (!brand) return null;
  
  const brands: Record<string, { color: string; label: string }> = {
    visa: { color: '#1A1F71', label: 'VISA' },
    mastercard: { color: '#EB001B', label: 'MC' },
    amex: { color: '#006FCF', label: 'AMEX' },
    discover: { color: '#FF6600', label: 'DISC' },
    jcb: { color: '#0E4C96', label: 'JCB' },
    diners: { color: '#004A97', label: 'DINERS' },
    unionpay: { color: '#E21836', label: 'UP' },
    elo: { color: '#FFCB05', label: 'ELO' },
  };
  
  const brandInfo = brands[brand];
  if (!brandInfo) return null;
  
  return (
    <span 
      className="text-xs font-bold px-2 py-1 rounded"
      style={{ backgroundColor: brandInfo.color, color: brand === 'elo' ? '#000' : '#fff' }}
    >
      {brandInfo.label}
    </span>
  );
};

const Checkout2 = () => {
  const [timeLeft, setTimeLeft] = useState({ minutes: 9, seconds: 59 });
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  const packageData = {
    cp: 1600,
    bonus: 1200,
    total: 2800,
    price: '15.90'
  };

  const cardBrand = getCardBrand(formData.cardNumber);

  useEffect(() => {
    // Initialize UTM tracking and track checkout
    initUTMTracking();
    trackPageView('checkout2');
    trackInitiateCheckout(parseFloat(packageData.price), 'USD');
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cardNumber') {
      const cleaned = value.replace(/\D/g, '').slice(0, 16);
      const formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim();
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else if (name === 'expiry') {
      const cleaned = value.replace(/\D/g, '').slice(0, 4);
      const formatted = cleaned.length > 2 ? `${cleaned.slice(0, 2)}/${cleaned.slice(2)}` : cleaned;
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else if (name === 'cvv') {
      const cleaned = value.replace(/\D/g, '').slice(0, 4);
      setFormData(prev => ({ ...prev, [name]: cleaned }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const stripePaymentLink = 'https://buy.stripe.com/5kQ8wOag10lq48m9ExfQI05';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.open(stripePaymentLink, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Countdown Timer Header */}
      <div className="bg-[#ef4444] py-3 px-4">
        <div className="flex items-center justify-center gap-3">
          <span className="text-white text-3xl font-bold">
            {formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
          </span>
          <div className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium tracking-wider">PROMOCIÓN SOLO HOY</span>
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <img 
            src={codmCheckoutBanner} 
            alt="Call of Duty Mobile" 
            className="w-full rounded-lg shadow-lg"
          />
        </div>
      </div>

      {/* Checkout Card */}
      <div className="px-4 pb-8">
        <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg p-6">
          {/* Product Summary */}
          <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden">
              <img src={cpCoinsGold} alt="CP" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800 text-lg">
                Bono de CP - Call of Duty Mobile
              </h2>
              <p className="text-gray-500 text-sm">
                {packageData.cp} CP + {packageData.bonus} Bonus
              </p>
              <p className="text-green-500 font-bold text-lg mt-1">
                Total: $ {packageData.price} USD
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tu correo electrónico
              </label>
              <Input
                type="email"
                name="email"
                placeholder="Ingresa tu correo para recibir la compra"
                value={formData.email}
                onChange={handleInputChange}
                className="bg-gray-50 border-gray-200 h-12 text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre completo
              </label>
              <Input
                type="text"
                name="fullName"
                placeholder="Ingresa tu nombre completo"
                value={formData.fullName}
                onChange={handleInputChange}
                className="bg-gray-50 border-gray-200 h-12 text-gray-900"
                required
              />
            </div>

            <PaymentButton />

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">o pagar con tarjeta</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre en la tarjeta
              </label>
              <Input
                type="text"
                name="cardName"
                placeholder="Como aparece en la tarjeta"
                value={formData.cardName}
                onChange={handleInputChange}
                className="bg-gray-50 border-gray-200 h-12 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Número de tarjeta
              </label>
              <div className="relative">
                <Input
                  type="text"
                  name="cardNumber"
                  placeholder="1234 1234 1234 1234"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  className="bg-gray-50 border-gray-200 h-12 pr-16 text-gray-900"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CardBrandIcon brand={cardBrand} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Vencimiento
                </label>
                <Input
                  type="text"
                  name="expiry"
                  placeholder="MM/AA"
                  value={formData.expiry}
                  onChange={handleInputChange}
                  className="bg-gray-50 border-gray-200 h-12 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  CVV
                </label>
                <Input
                  type="text"
                  name="cvv"
                  placeholder="CVC"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  className="bg-gray-50 border-gray-200 h-12 text-gray-900"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
              <Lock className="w-4 h-4" />
              <span>Pago 100% seguro con encriptación SSL</span>
            </div>

            <Button 
              type="submit"
              className="w-full h-14 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-lg rounded-lg flex items-center justify-center gap-2"
            >
              <Lock className="w-5 h-5" />
              PAGAR ${packageData.price} USD
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout2;