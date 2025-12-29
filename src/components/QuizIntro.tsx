import { Trophy, Target, Crosshair, Shield } from 'lucide-react';
import codmHero from '@/assets/codm-hero.jpg';

interface QuizIntroProps {
  onStart: () => void;
}

const QuizIntro = ({ onStart }: QuizIntroProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="relative w-full h-64 md:h-80 overflow-hidden">
        <img 
          src={codmHero} 
          alt="Call of Duty Mobile" 
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 -mt-16 relative z-10">
        <div className="w-full max-w-lg animate-slide-up">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-gradient-gold glow-text mb-2">
              Quiz COD Mobile
            </h1>
            <p className="text-cod-text text-lg">
              Teste seus conhecimentos e ganhe prêmios!
            </p>
          </div>

          {/* Card */}
          <div className="card-military rounded-xl p-6 space-y-6">
            {/* Prize Section */}
            <div className="bg-cod-dark/50 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="font-display text-primary font-semibold">
                  Prêmio Incrível
                </span>
              </div>
              <p className="text-cod-text text-sm">
                Acerte 70% ou mais das perguntas e desbloqueie até{' '}
                <span className="text-primary font-bold">70% OFF</span> em pacotes de CP.
              </p>
            </div>

            {/* Rules Section */}
            <div className="bg-cod-dark/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <Target className="w-5 h-5 text-secondary" />
                <span className="font-display text-cod-text font-semibold">
                  Regras do Quiz
                </span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Crosshair className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>10 perguntas sobre Call of Duty Mobile</span>
                </li>
                <li className="flex items-start gap-2">
                  <Crosshair className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Escolha uma resposta para cada pergunta</span>
                </li>
                <li className="flex items-start gap-2">
                  <Crosshair className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Confirme sua resposta para avançar</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Necessário pelo menos 7 respostas corretas (70%) para ganhar</span>
                </li>
              </ul>
            </div>

            {/* Start Button */}
            <button
              onClick={onStart}
              className="btn-tactical w-full py-4 rounded-lg text-lg relative z-10 animate-pulse-gold"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Começar Quiz
                <Crosshair className="w-5 h-5" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizIntro;
