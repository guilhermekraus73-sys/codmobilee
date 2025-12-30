import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Clock, Lock, CreditCard } from 'lucide-react';
import cpCoinsGold from '@/assets/cp-coins-gold.jpg';
import codmCheckoutBanner from '@/assets/codm-checkout-banner.png';

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

  const playerId = localStorage.getItem('playerId') || localStorage.getItem('codm_player_id') || '';

  useEffect(() => {
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

          {/* Player ID Display */}
          {playerId && (
            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">ID del Jugador:</span> {playerId}
              </p>
            </div>
          )}

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

            <Button 
              type="button"
              className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Pay</span>
            </Button>

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
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  name="cardNumber"
                  placeholder="1234 1234 1234 1234"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  className="bg-gray-50 border-gray-200 h-12 pl-10 text-gray-900"
                />
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
