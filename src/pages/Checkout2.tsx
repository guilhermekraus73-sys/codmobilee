import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Clock, Lock, Loader2, CreditCard } from 'lucide-react';
import cpCoinsGold from '@/assets/cp-coins-gold.jpg';
import codmCheckoutBanner from '@/assets/codm-checkout-banner.png';
import { initUTMTracking, trackPageView, trackInitiateCheckout, getUTMDataForConversion } from '@/lib/utmify';
import { supabase } from '@/integrations/supabase/client';
import { loadStripe, PaymentRequest } from '@stripe/stripe-js';
import { 
  Elements, 
  CardNumberElement, 
  CardExpiryElement, 
  CardCvcElement, 
  PaymentRequestButtonElement,
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const cardElementStyles = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      '::placeholder': {
        color: '#9ca3af',
      },
      fontFamily: 'system-ui, sans-serif',
    },
    invalid: {
      color: '#ef4444',
    },
  },
};

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  
  const [timeLeft, setTimeLeft] = useState({ minutes: 9, seconds: 59 });
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [stripeReady, setStripeReady] = useState(false);

  const packageData = {
    id: 'cp-1600',
    cp: 1600,
    bonus: 1200,
    total: 2800,
    price: '15.90'
  };

  // Mark Stripe as ready when both stripe and elements are loaded
  useEffect(() => {
    if (stripe && elements) {
      console.log('[Checkout2] Stripe and Elements loaded successfully');
      setStripeReady(true);
    }
  }, [stripe, elements]);

  // Setup Payment Request (Apple Pay / Google Pay)
  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: `${packageData.cp} CP + ${packageData.bonus} Bonus`,
        amount: Math.round(parseFloat(packageData.price) * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr);
      }
    });

    pr.on('paymentmethod', async (event) => {
      try {
        const utmData = getUTMDataForConversion();
        
        const { data, error: fnError } = await supabase.functions.invoke('create-payment-intent', {
          body: {
            packageId: packageData.id,
            email: event.payerEmail || formData.email,
            utmData,
          },
        });

        if (fnError || !data?.clientSecret) {
          event.complete('fail');
          return;
        }

        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          data.clientSecret,
          { payment_method: event.paymentMethod.id },
          { handleActions: false }
        );

        if (confirmError) {
          event.complete('fail');
          return;
        }

        event.complete('success');

        if (paymentIntent?.status === 'requires_action') {
          const { error: actionError } = await stripe.confirmCardPayment(data.clientSecret);
          if (actionError) {
            setError(actionError.message || 'Error al procesar el pago');
            return;
          }
        }

        sessionStorage.setItem('checkout_price', packageData.price);
        sessionStorage.setItem('checkout_package', packageData.id);
        navigate(`/success?session_id=${paymentIntent?.id}`);
      } catch (err) {
        event.complete('fail');
        console.error('Payment error:', err);
      }
    });
  }, [stripe, formData.email, navigate]);

  useEffect(() => {
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const utmData = getUTMDataForConversion();
      
      const { data, error: fnError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          packageId: packageData.id,
          email: formData.email,
          utmData,
        },
      });

      if (fnError) throw fnError;
      if (!data?.clientSecret) throw new Error('No se pudo crear el pago');

      const cardNumber = elements.getElement(CardNumberElement);
      if (!cardNumber) throw new Error('Error con el formulario de pago');

      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardNumber,
          billing_details: {
            name: formData.fullName,
            email: formData.email,
          },
        },
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        sessionStorage.setItem('checkout_price', packageData.price);
        sessionStorage.setItem('checkout_package', packageData.id);
        navigate(`/success?session_id=${paymentIntent.id}`);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Error al procesar el pago');
      setIsLoading(false);
    }
  };

  // Show loading while Stripe initializes
  if (!stripeReady) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Cargando formulario de pago...</p>
        </div>
      </div>
    );
  }

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
                Total: ${packageData.price} USD
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

            {/* Apple Pay / Google Pay Button */}
            {paymentRequest && (
              <>
                <div className="pt-2">
                  <PaymentRequestButtonElement 
                    options={{ 
                      paymentRequest,
                      style: {
                        paymentRequestButton: {
                          type: 'default',
                          theme: 'dark',
                          height: '48px',
                        },
                      },
                    }} 
                  />
                </div>
                
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink mx-4 text-gray-400 text-sm">o pagar con tarjeta</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>
              </>
            )}

            {/* Card Payment Section - Highlighted */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 text-blue-700 font-semibold">
                <CreditCard className="w-5 h-5" />
                <span>Datos de tu tarjeta</span>
              </div>

              {/* Card Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre en la tarjeta *
                </label>
                <Input
                  type="text"
                  name="cardName"
                  placeholder="Como aparece en la tarjeta"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="bg-white border-gray-300 h-12 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Card Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Número de tarjeta *
                </label>
                <div className="bg-white border-2 border-gray-300 rounded-lg p-3 h-12 flex items-center focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                  <CardNumberElement options={cardElementStyles} className="w-full" />
                </div>
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Vencimiento *
                  </label>
                  <div className="bg-white border-2 border-gray-300 rounded-lg p-3 h-12 flex items-center focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                    <CardExpiryElement options={cardElementStyles} className="w-full" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    CVV *
                  </label>
                  <div className="bg-white border-2 border-gray-300 rounded-lg p-3 h-12 flex items-center focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                    <CardCvcElement options={cardElementStyles} className="w-full" />
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Acepta Visa, Mastercard, American Express y más
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm py-2">
              <Lock className="w-4 h-4" />
              <span>Pago 100% seguro con encriptación SSL</span>
            </div>

            <Button 
              type="submit"
              disabled={isLoading || !stripe}
              className="w-full h-14 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-lg rounded-lg flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  PAGAR ${packageData.price} USD
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

const Checkout2 = () => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
};

export default Checkout2;
