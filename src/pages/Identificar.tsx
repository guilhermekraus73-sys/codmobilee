import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Info, ShieldCheck } from 'lucide-react';
import codmBanner from '@/assets/codm-banner.png';
import codmIcon from '@/assets/codm-icon.png';

const Identificar = () => {
  const [playerId, setPlayerId] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerId.trim()) {
      localStorage.setItem('codm_player_id', playerId);
      navigate('/quiz');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-3 px-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <img src={codmIcon} alt="COD Mobile" className="w-10 h-10 rounded-lg" />
          <div>
            <p className="text-gray-800 font-semibold text-sm">Canal Oficial de</p>
            <p className="text-gray-500 text-xs">Recarga COD Mobile</p>
          </div>
        </div>
      </header>

      <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-6">
        {/* Promotional Banner */}
        <div className="relative rounded-2xl overflow-hidden mb-6 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-4">
          <div className="text-center">
            <p className="text-white font-bold text-lg sm:text-xl drop-shadow-lg">
              ¡CONOCE LAS OFERTAS COD MOBILE!
            </p>
            <p className="text-white/90 text-sm mt-1">Hasta 70% de descuento en CP</p>
          </div>
        </div>

        {/* Game Selection */}
        <div className="mb-4">
          <p className="text-gray-600 text-sm mb-3 italic">Selección de Juego</p>
          <div className="inline-flex items-center gap-2 bg-white border-2 border-orange-400 rounded-full px-4 py-2 shadow-sm">
            <img src={codmIcon} alt="COD Mobile" className="w-6 h-6 rounded" />
            <span className="text-gray-800 font-medium text-sm">Call of Duty Mobile</span>
          </div>
        </div>

        {/* COD Mobile Banner with icon overlay */}
        <div className="relative rounded-2xl overflow-hidden mb-6">
          <img 
            src={codmBanner} 
            alt="Call of Duty Mobile - Garena" 
            className="w-full h-24 sm:h-28 object-cover object-center"
          />
          {/* Icon overlay on left */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <img 
              src={codmIcon} 
              alt="COD Mobile Icon" 
              className="w-16 h-16 rounded-xl shadow-lg border-2 border-white/30"
            />
          </div>
          {/* Text overlay */}
          <div className="absolute left-24 top-1/2 -translate-y-1/2">
            <p className="text-white font-bold text-lg drop-shadow-lg">Call of Duty: Mobile - Garena</p>
            <div className="flex items-center gap-1.5 mt-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 w-fit">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              <span className="text-white text-xs font-medium">100% Secure Payment</span>
            </div>
          </div>
        </div>

        {/* ID Form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">1</span>
            </div>
            <h2 className="text-gray-800 font-semibold text-lg">Ingresar</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-700 text-sm font-medium">ID de jugador</label>
                <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <Input
                type="text"
                placeholder="Introduce el ID del jugador."
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                className="bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400 rounded-xl h-12"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-6 rounded-xl text-base"
              disabled={!playerId.trim()}
            >
              Iniciar
            </Button>
          </form>
        </div>

        {/* Info Card with CP icon */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mt-4 flex items-start gap-4 shadow-sm">
          <div className="w-14 h-14 flex-shrink-0">
            <div className="w-full h-full rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div>
            <p className="text-gray-700 text-sm">
              ¡Inicia sesión con tu ID para ver las recargas disponibles y canjear tu bono!
            </p>
            <p className="text-orange-500 text-sm font-semibold mt-1">
              ¡Recarga de aniversario desbloqueada con hasta un 70% de descuento + 20% de bonificación!
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-500 text-xs mb-2">© Activision. Todos los derechos reservados.</p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">Preguntas frecuentes</a>
            <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">Términos y condiciones</a>
            <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">Política de privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Identificar;
