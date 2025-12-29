import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, CreditCard } from 'lucide-react';
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
  { id: 'card', name: 'Crédito / Débito', brands: ['ELO', 'VISA', 'MC', 'AMEX'] },
  { id: 'nequi', name: 'NEQUI', logo: paymentNequi },
  { id: 'yape', name: 'Yape', logo: paymentYape },
  { id: 'mercadopago', name: 'MercadoPago', logo: paymentMercadopago },
  { id: 'efecty', name: 'Efecty Bancolombia', logo: paymentEfecty },
  { id: 'paypal', name: 'PayPal', logo: paymentPaypal },
  { id: 'pse', name: 'PSE', logo: paymentPse },
];

const Recharge = () => {
  const navigate = useNavigate();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem('codm_player_id');
    if (!storedId) {
      navigate('/identificar');
    } else {
      setPlayerId(storedId);
    }
  }, [navigate]);

  const handleContinue = () => {
    if (selectedPackage) {
      // Handle payment logic here
      console.log('Selected package:', selectedPackage);
    }
  };

  if (!playerId) return null;

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
        <p className="text-gray-400 text-sm mb-3 italic">Selección de Juego</p>
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

        {/* Section 1 - Cuenta */}
        <div className="bg-[#141414] border border-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">1</span>
            </div>
            <h2 className="text-white font-semibold text-lg">Cuenta</h2>
          </div>

          <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-white font-medium">Jugador identificado</p>
              <p className="text-primary text-sm">Desbloqueado 70% de descuento</p>
            </div>
          </div>
        </div>

        {/* Section 2 - Valor de Recarga */}
        <div className="bg-[#141414] border border-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">2</span>
            </div>
            <h2 className="text-white font-semibold text-lg">Valor de Recarga</h2>
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
                    ? 'bg-gradient-to-b from-amber-900/40 to-[#1a1a1a] border border-amber-600/50'
                    : 'bg-[#1a1a1a] border border-gray-700 hover:border-gray-500'
                }`}
              >
                {/* Small badge at top */}
                <div className="bg-red-600 text-white text-[8px] sm:text-[10px] font-bold px-1 sm:px-2 py-0.5 rounded inline-block mb-1 sm:mb-2">
                  +100% WEB BONUS
                </div>
                
                <p className="text-white font-bold text-sm sm:text-lg mb-0.5 sm:mb-1">{pkg.cp.toLocaleString()} CP</p>
                <p className="text-gray-400 text-[10px] sm:text-xs mb-1 sm:mb-2">Límite: 1</p>
                
                <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">{pkg.cp} CP</p>
                <p className="text-yellow-400 font-semibold text-xs sm:text-sm mb-1 sm:mb-2">
                  +{pkg.bonus.toLocaleString()} BÔNUS
                </p>
                <p className="text-green-400 text-[9px] sm:text-xs font-medium">
                  Total: {(pkg.cp + pkg.bonus).toLocaleString()} CP
                </p>

                <div className="w-10 h-10 sm:w-16 sm:h-16 mx-auto mb-1 sm:mb-3">
                  <img src={cpCoinsStack} alt="CP Coins" className="w-full h-full object-contain" />
                </div>

                <p className="text-primary font-bold text-sm sm:text-xl">US$ {pkg.price.toFixed(2)}</p>
                <p className="text-red-400 text-[10px] sm:text-xs">Finaliza: 21d 3h 17m</p>
              </button>
            ))}
          </div>

          <p className="text-gray-400 text-xs mt-4 text-center">
            Tus créditos se acreditarán a tu cuenta de juego tan pronto como recibamos la confirmación del pago.
          </p>
          <p className="text-primary text-xs mt-2 text-center font-medium">
            ¡El importe de la recarga se convertirá automáticamente a tu moneda local!
          </p>
        </div>

        {/* Section 3 - Método de pago */}
        <div className="bg-[#141414] border border-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">3</span>
            </div>
            <h2 className="text-white font-semibold text-lg">Método de pago</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                    <p className="text-white text-sm font-medium">{method.name}</p>
                    <div className="flex items-center justify-center gap-1 mt-1 flex-wrap">
                      {method.brands?.map((brand) => (
                        <span key={brand} className="text-[10px] text-gray-400 bg-gray-800 px-1 rounded">
                          {brand}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <img 
                      src={method.logo} 
                      alt={method.name} 
                      className="h-10 mx-auto mb-2 object-contain"
                    />
                    <p className="text-white text-sm font-medium">{method.name}</p>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <Button 
          onClick={handleContinue}
          disabled={!selectedPackage || !selectedPayment}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-xl text-base"
        >
          Continuar
        </Button>
      </div>

      {/* Footer */}
      <footer className="bg-[#111] border-t border-gray-800 py-4 px-4 mt-auto">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-500 text-xs mb-2">© Activision. Todos los derechos reservados.</p>
          <div className="flex items-center justify-center gap-4 text-xs flex-wrap">
            <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Preguntas frecuentes</a>
            <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Términos y condiciones</a>
            <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Política de privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Recharge;
