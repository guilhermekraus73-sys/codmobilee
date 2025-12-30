import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import codmHeroBanner from '@/assets/codm-hero-banner.png';

const Success = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

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
            <div className="flex justify-between">
              <span className="text-gray-400">Tiempo de entrega</span>
              <span className="text-white">5-15 minutos</span>
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
