import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Info, Shield } from 'lucide-react';
import codmBanner from '@/assets/codm-banner.png';

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-lg">CP</span>
          </div>
          <div>
            <p className="text-foreground font-semibold text-sm">Canal Oficial de</p>
            <p className="text-muted-foreground text-xs">Recarga COD Mobile</p>
          </div>
        </div>
      </header>

      {/* Game Selection */}
      <div className="w-full max-w-4xl mx-auto px-4 mt-6">
        <p className="text-muted-foreground text-sm mb-3">Selección de Juego</p>
        <div className="inline-flex items-center gap-2 bg-card border border-primary rounded-full px-4 py-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-xs">CP</span>
          </div>
          <span className="text-foreground font-medium text-sm">Call of Duty Mobile</span>
        </div>
      </div>

      {/* COD Mobile Banner - Similar to reference */}
      <div className="w-full max-w-4xl mx-auto px-4 mt-4">
        <div className="relative rounded-xl overflow-hidden">
          <img 
            src={codmBanner} 
            alt="Call of Duty Mobile - Garena" 
            className="w-full h-24 sm:h-28 object-cover object-center"
          />
        </div>
      </div>

      {/* ID Form */}
      <div className="w-full max-w-4xl mx-auto px-4 mt-6 flex-1">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">1</span>
            </div>
            <h2 className="text-foreground font-semibold text-lg">Ingresar</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-foreground text-sm font-medium">ID de jugador</label>
                <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <Input
                type="text"
                placeholder="Introduce el ID del jugador."
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
              disabled={!playerId.trim()}
            >
              Iniciar
            </Button>
          </form>
        </div>

        {/* Info Card with CP icon */}
        <div className="bg-card border border-border rounded-xl p-4 mt-4 flex items-start gap-4">
          <div className="w-14 h-14 flex-shrink-0">
            <div className="w-full h-full rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">CP</span>
            </div>
          </div>
          <div>
            <p className="text-foreground text-sm">
              ¡Inicia sesión con tu ID para ver las recargas disponibles y canjear tu bono!
            </p>
            <p className="text-accent text-sm font-medium mt-1">
              ¡Recarga especial desbloqueada con hasta un 70% de descuento + 20% de bonificación!
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-card/50 border-t border-border py-4 px-4 mt-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground text-xs mb-2">© Activision. Todos los derechos reservados.</p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Preguntas frecuentes</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Términos y condiciones</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Política de privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Identificar;
