import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Info, ShieldCheck } from 'lucide-react';
import codmBanner from '@/assets/codm-banner.png';
import codmIcon from '@/assets/codm-icon.png';
import codmHeroBanner from '@/assets/codm-hero-banner.png';

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
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="bg-[#111] border-b border-gray-800 py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <span className="text-white font-bold text-sm tracking-wide">CALL OF DUTY</span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400 text-sm">WEB STORE</span>
        </div>
      </header>

      <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-6">
        {/* Hero Banner COD Mobile */}
        <div className="relative rounded-lg overflow-hidden mb-8">
          <img 
            src={codmHeroBanner} 
            alt="Call of Duty Mobile" 
            className="w-full h-auto object-cover"
          />
        </div>

        {/* Game Selection */}
        <div className="mb-4">
          <p className="text-gray-400 text-sm mb-3 italic">Selección de Juego</p>
          <div className="inline-flex items-center gap-2 bg-[#1a1a1a] border border-primary rounded-full px-4 py-2">
            <img src={codmIcon} alt="COD Mobile" className="w-6 h-6 rounded" />
            <span className="text-white font-medium text-sm">Call of Duty Mobile</span>
          </div>
        </div>

        {/* COD Mobile Banner with icon overlay */}
        <div className="relative rounded-xl overflow-hidden mb-6">
          <img 
            src={codmBanner} 
            alt="Call of Duty Mobile - Garena" 
            className="w-full h-24 sm:h-28 object-cover object-center"
          />
        </div>

        {/* ID Form */}
        <div className="mb-6">
          <h2 className="text-white font-bold text-lg mb-4 tracking-wide">TU CUENTA COD:M</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <Input
                type="text"
                placeholder="Tu ID de jugador de COD:M"
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                className="bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500 rounded-lg h-14 text-base"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-lg text-base"
              disabled={!playerId.trim()}
            >
              Iniciar
            </Button>
          </form>
        </div>

        {/* Info Card with CP icon */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 flex items-start gap-4">
          <div className="w-14 h-14 flex-shrink-0">
            <div className="w-full h-full rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">CP</span>
            </div>
          </div>
          <div>
            <p className="text-gray-300 text-sm">
              ¡Inicia sesión con tu ID para ver las recargas disponibles y canjear tu bono!
            </p>
            <p className="text-primary text-sm font-semibold mt-1">
              ¡Recarga de aniversario desbloqueada con hasta un 70% de descuento + 20% de bonificación!
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#111] border-t border-gray-800 py-4 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-500 text-xs mb-2">© Activision. Todos los derechos reservados.</p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Preguntas frecuentes</a>
            <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Términos y condiciones</a>
            <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Política de privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Identificar;
