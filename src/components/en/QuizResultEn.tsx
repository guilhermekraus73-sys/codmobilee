import { Trophy, RefreshCw, Percent, Target, XCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useXcodUrl } from '@/hooks/useXcodParam';

interface QuizResultProps {
  score: {
    correct: number;
    total: number;
    percentage: number;
  };
  onRestart: () => void;
}

const QuizResultEn = ({ score, onRestart }: QuizResultProps) => {
  const { buildUrl } = useXcodUrl();
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
            {isWinner ? 'Congratulations, Soldier!' : 'Mission Failed!'}
          </h1>
          
          <p className="text-muted-foreground mb-6">
            {isWinner 
              ? "You've proven to be a true expert!" 
              : "Don't give up, try again!"}
          </p>

          {/* Score Display */}
          <div className="bg-cod-dark/50 rounded-xl p-6 mb-6 border border-border">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <Target className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="font-display text-2xl font-bold text-cod-text">
                  {score.correct}
                </p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div className="text-center">
                <Percent className="w-6 h-6 text-secondary mx-auto mb-2" />
                <p className={cn(
                  'font-display text-2xl font-bold',
                  isWinner ? 'text-success' : 'text-destructive'
                )}>
                  {score.percentage}%
                </p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
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
              <p className="text-sm text-cod-text leading-relaxed mb-4">
                Congratulations on scoring over 70% on the quiz! This proves you're truly a super Call of Duty Mobile player, so we've unlocked our best-selling CP packages with <span className="text-primary font-bold">70% discount</span>. Get over <span className="text-primary font-bold">5000 CP</span> almost for free now!
              </p>
              <Link 
                to={buildUrl('/en/identify')} 
                className="btn-tactical inline-flex items-center gap-2 px-6 py-3 rounded-lg"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Claim Prize
                  <ExternalLink className="w-4 h-4" />
                </span>
              </Link>
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
            <span className={isWinner ? '' : 'relative z-10'}>Play Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResultEn;
