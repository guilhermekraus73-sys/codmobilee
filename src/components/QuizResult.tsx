import { Trophy, RefreshCw, Percent, Target, XCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizResultProps {
  score: {
    correct: number;
    total: number;
    percentage: number;
  };
  onRestart: () => void;
}

const QuizResult = ({ score, onRestart }: QuizResultProps) => {
  const isWinner = score.percentage >= 70;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg animate-slide-up">
        <div className="card-military rounded-xl p-8 text-center">
          {/* Icon */}
          <div className={cn(
            'w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6',
            isWinner 
              ? 'bg-primary/20 glow-gold' 
              : 'bg-destructive/20'
          )}>
            {isWinner ? (
              <Trophy className="w-12 h-12 text-primary" />
            ) : (
              <XCircle className="w-12 h-12 text-destructive" />
            )}
          </div>

          {/* Title */}
          <h1 className={cn(
            'font-display text-3xl font-bold mb-2',
            isWinner ? 'text-gradient-gold glow-text' : 'text-destructive'
          )}>
            {isWinner ? '¡Felicidades, Soldado!' : '¡Misión Fallida!'}
          </h1>
          
          <p className="text-muted-foreground mb-6">
            {isWinner 
              ? '¡Has demostrado ser un verdadero experto!' 
              : '¡No te rindas, intenta de nuevo!'}
          </p>

          {/* Score Display */}
          <div className="bg-cod-dark/50 rounded-xl p-6 mb-6 border border-border">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <Target className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="font-display text-2xl font-bold text-cod-text">
                  {score.correct}
                </p>
                <p className="text-xs text-muted-foreground">Correctas</p>
              </div>
              <div className="text-center">
                <Percent className="w-6 h-6 text-secondary mx-auto mb-2" />
                <p className={cn(
                  'font-display text-2xl font-bold',
                  isWinner ? 'text-success' : 'text-destructive'
                )}>
                  {score.percentage}%
                </p>
                <p className="text-xs text-muted-foreground">Aciertos</p>
              </div>
              <div className="text-center">
                <Trophy className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="font-display text-2xl font-bold text-cod-text">
                  {score.total}
                </p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </div>

          {/* Prize Section */}
          {isWinner && (
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 mb-6 animate-pulse-gold">
              <Trophy className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="font-display text-xl font-bold text-primary mb-2">
                ¡Has Desbloqueado!
              </h3>
              <p className="text-3xl font-display font-bold text-gradient-gold mb-2">
                70% OFF
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                en paquetes de CP (COD Points)
              </p>
              <a 
                href="#" 
                className="btn-tactical inline-flex items-center gap-2 px-6 py-3 rounded-lg"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Canjear Premio
                  <ExternalLink className="w-4 h-4" />
                </span>
              </a>
            </div>
          )}

          {/* Restart Button */}
          <button
            onClick={onRestart}
            className={cn(
              'w-full py-4 rounded-lg text-lg font-display font-semibold flex items-center justify-center gap-2 transition-all',
              isWinner 
                ? 'bg-cod-gray border border-border text-cod-text hover:bg-muted' 
                : 'btn-tactical'
            )}
          >
            <RefreshCw className="w-5 h-5" />
            <span className={isWinner ? '' : 'relative z-10'}>Jugar de Nuevo</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResult;
