import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Clock, Lock, Loader2, CreditCard, AlertTriangle } from 'lucide-react';
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
import { usePaymentRateLimiting, isValidEmail } from '@/hooks/usePaymentRateLimiting';

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
    postalCode: '',
  });
  const [detectedCountry, setDetectedCountry] = useState<string>('US');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [stripeReady, setStripeReady] = useState(false);
  const [cooldownTimer, setCooldownTimer] = useState(0);
  const [cardBrand, setCardBrand] = useState<string | null>(null);

  const { 
    canAttemptPayment, 
    recordAttempt, 
    handleRateLimitResponse,
    isBlocked,
    blockReason,
    getCooldownRemaining 
  } = usePaymentRateLimiting();

  const packageData = {
    id: 'cp-800',
    cp: 1200,
    bonus: 1200,
    total: 2400,
    price: '9.90'
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getCooldownRemaining();
      setCooldownTimer(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [getCooldownRemaining]);

  useEffect(() => {
    if (stripe && elements) {
      setStripeReady(true);
    }
  }, [stripe, elements]);

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
            setError(actionError.message || 'Error processing payment');
            return;
          }
        }

        const emailToSave = event.payerEmail || formData.email;
        const nameToSave = event.payerName || formData.fullName;
        sessionStorage.setItem('checkout_price', packageData.price);
        sessionStorage.setItem('checkout_package', packageData.id);
        sessionStorage.setItem('checkout_email', emailToSave);
        sessionStorage.setItem('checkout_name', nameToSave);
        sessionStorage.setItem('checkout_product_name', `${packageData.cp} CP + ${packageData.bonus} Bonus`);
        localStorage.setItem('last_checkout_price', packageData.price);
        localStorage.setItem('last_checkout_email', emailToSave);
        localStorage.setItem('last_checkout_name', nameToSave);
        navigate(`/en/success?payment_intent=${paymentIntent?.id}`);
      } catch (err) {
        event.complete('fail');
        console.error('Payment error:', err);
      }
    });
  }, [stripe, formData.email, navigate]);

  useEffect(() => {
    const detectCountry = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.country_code) {
          setDetectedCountry(data.country_code);
        }
      } catch (error) {
        console.log('Could not detect country, using default');
      }
    };
    detectCountry();
  }, []);

  useEffect(() => {
    initUTMTracking();
    trackPageView('checkout1-en');
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
    
    if (!stripe || !elements) return;

    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    const cardElement = elements.getElement(CardNumberElement);
    if (!cardElement) {
      setError('Error with payment form');
      return;
    }

    const rateCheck = canAttemptPayment();
    if (!rateCheck.allowed) {
      setError(rateCheck.reason || 'Too many attempts. Please wait.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const utmData = getUTMDataForConversion();
      
      const { data, error: fnError } = await supabase.functions.invoke('process-card-payment', {
        body: {
          packageId: packageData.id,
          email: formData.email,
          fullName: formData.fullName,
          postalCode: formData.postalCode,
          country: detectedCountry,
          utmData,
        },
      });

      if (data?.blocked) {
        handleRateLimitResponse(data);
        setError(data.error || 'Rate limit exceeded');
        setIsLoading(false);
        return;
      }

      if (fnError) throw new Error(fnError.message || 'Error creating payment');
      if (!data?.clientSecret) throw new Error(data?.error || 'Could not create payment');

      const cardNumber = elements.getElement(CardNumberElement);
      if (!cardNumber) throw new Error('Error with payment form');

      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardNumber,
          billing_details: {
            name: formData.fullName,
            email: formData.email,
          },
        },
      });

      recordAttempt();

      if (paymentError) throw new Error(paymentError.message);

      if (paymentIntent?.status === 'succeeded') {
        sessionStorage.setItem('checkout_price', packageData.price);
        sessionStorage.setItem('checkout_package', packageData.id);
        sessionStorage.setItem('checkout_email', formData.email);
        sessionStorage.setItem('checkout_name', formData.fullName);
        sessionStorage.setItem('checkout_product_name', `${packageData.cp} CP + ${packageData.bonus} Bonus`);
        localStorage.setItem('last_checkout_price', packageData.price);
        localStorage.setItem('last_checkout_email', formData.email);
        localStorage.setItem('last_checkout_name', formData.fullName);
        navigate(`/en/success?payment_intent=${paymentIntent.id}`);
      }
    } catch (err) {
      console.error('Payment error:', err);
      recordAttempt();
      setError(err instanceof Error ? err.message : 'Error processing payment');
      setIsLoading(false);
    }
  };

  if (!stripeReady) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading payment form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="bg-[#ef4444] py-3 px-4">
        <div className="flex items-center justify-center gap-3">
          <span className="text-white text-3xl font-bold">
            {formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
          </span>
          <div className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium tracking-wider">TODAY ONLY PROMO</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <img src={codmCheckoutBanner} alt="Call of Duty Mobile" className="w-full rounded-lg shadow-lg" />
        </div>
      </div>

      <div className="px-4 pb-8">
        <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg p-6">
          {isBlocked && (
            <div className="mb-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>{blockReason || 'You have exceeded the attempt limit.'}</span>
            </div>
          )}

          {cooldownTimer > 0 && !isBlocked && (
            <div className="mb-4 bg-yellow-100 border border-yellow-300 text-yellow-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>Wait {cooldownTimer} seconds before trying again.</span>
            </div>
          )}

          <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden">
              <img src={cpCoinsGold} alt="CP" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800 text-lg">CP Bonus - Call of Duty Mobile</h2>
              <p className="text-gray-500 text-sm">{packageData.cp} CP + {packageData.bonus} Bonus</p>
              <p className="text-green-500 font-bold text-lg mt-1">Total: ${packageData.price} USD</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Your email address</label>
              <Input
                type="email"
                name="email"
                placeholder="Enter your email to receive the purchase"
                value={formData.email}
                onChange={handleInputChange}
                className="bg-gray-50 border-gray-200 h-12 text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <Input
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleInputChange}
                className="bg-gray-50 border-gray-200 h-12 text-gray-900"
                required
              />
            </div>

            {paymentRequest && !isBlocked && (
              <>
                <div className="pt-2">
                  <PaymentRequestButtonElement 
                    options={{ 
                      paymentRequest,
                      style: { paymentRequestButton: { type: 'default', theme: 'dark', height: '48px' } },
                    }} 
                  />
                </div>
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink mx-4 text-gray-400 text-sm">or pay with card</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>
              </>
            )}

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 text-blue-700 font-semibold">
                <CreditCard className="w-5 h-5" />
                <span>Your card details</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name on card *</label>
                <Input
                  type="text"
                  name="cardName"
                  placeholder="As it appears on the card"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="bg-white border-gray-300 h-12 text-gray-900"
                  required
                  disabled={isBlocked}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Card number *</label>
                <div className="bg-white border-2 border-gray-300 rounded-lg p-3 h-12 flex items-center">
                  <CardNumberElement 
                    options={cardElementStyles} 
                    className="flex-1" 
                    onChange={(event) => setCardBrand(event.brand && event.brand !== 'unknown' ? event.brand : null)}
                  />
                  {cardBrand && (
                    <div className="ml-2 flex-shrink-0">
                      {cardBrand === 'visa' && <img src="https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c4bdb47b03ac81d9945bfe.svg" alt="Visa" className="h-6" />}
                      {cardBrand === 'mastercard' && <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="Mastercard" className="h-6" />}
                      {cardBrand === 'amex' && <img src="https://js.stripe.com/v3/fingerprinted/img/amex-a49b82f46c5cd6a96a6e418a6ca1717c.svg" alt="Amex" className="h-6" />}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiry *</label>
                  <div className="bg-white border-2 border-gray-300 rounded-lg p-3 h-12 flex items-center">
                    <CardExpiryElement options={cardElementStyles} className="w-full" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">CVV *</label>
                  <div className="bg-white border-2 border-gray-300 rounded-lg p-3 h-12 flex items-center">
                    <CardCvcElement options={cardElementStyles} className="w-full" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Postal code *</label>
                <Input
                  type="text"
                  name="postalCode"
                  placeholder="Enter your postal code"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  className="bg-white border-gray-300 h-12 text-gray-900"
                  required
                  disabled={isBlocked}
                />
              </div>

              <p className="text-xs text-gray-500 text-center">Accepts Visa, Mastercard, American Express and more</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm py-2">
              <Lock className="w-4 h-4" />
              <span>100% secure payment with SSL encryption</span>
            </div>

            <Button 
              type="submit"
              disabled={isLoading || !stripe || isBlocked || cooldownTimer > 0}
              className="w-full h-14 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-lg rounded-lg flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" />Processing...</>
              ) : cooldownTimer > 0 ? (
                <><Clock className="w-5 h-5" />Wait {cooldownTimer}s</>
              ) : (
                <><Lock className="w-5 h-5" />PAY ${packageData.price} USD</>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

const Checkout1En = () => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
};

export default Checkout1En;
