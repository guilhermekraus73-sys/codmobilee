import { Trophy, Target, Crosshair, Shield, Loader2 } from 'lucide-react';
import { useEffect, useState, memo } from 'react';
import codmHero from '@/assets/codm-hero.jpg';
import codmBanner from '@/assets/codm-banner.png';
import codmIcon from '@/assets/codm-icon.png';
import codmHeroBanner from '@/assets/codm-hero-banner.png';
import cpCoin from '@/assets/cp-coin.png';
import { codmQuestions } from '@/data/questions';
import { useImagePreloader, preloadNextPageImages } from '@/hooks/useImagePreloader';

interface QuizIntroProps {
  onStart: () => void;
}

// All quiz images to preload
const quizImages = codmQuestions.map(q => q.image);

// Next page images (Identificar)
const nextPageImages = [
  codmBanner,
  codmIcon,
  codmHeroBanner,
  cpCoin,
];

const QuizIntro = memo(({ onStart }: QuizIntroProps) => {
  const { isLoading, isReady } = useImagePreloader([codmHero, ...quizImages], true);

  // Preload next page images when quiz images are ready
  useEffect(() => {
    if (isReady) {
      preloadNextPageImages(nextPageImages);
    }
  }, [isReady]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Cargando quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="relative w-full h-64 md:h-80 overflow-hidden">
        <img 
          src={codmHero} 
          alt="Call of Duty Mobile" 
          className="w-full h-full object-cover object-top"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 -mt-16 relative z-10">
        <div className="w-full max-w-lg animate-slide-up">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-gradient-gold glow-text mb-2">
              Encuesta COD Mobile
            </h1>
            <p className="text-cod-text text-lg">
              ¡Pon a prueba tus conocimientos y gana premios!
            </p>
          </div>

          {/* Card */}
          <div className="card-military rounded-xl p-6 space-y-6">
            {/* Prize Section */}
            <div className="bg-cod-dark/50 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="font-display text-primary font-semibold">
                  Premio Increíble
                </span>
              </div>
              <p className="text-cod-text text-sm">
                Acierta 70% o más de las preguntas y desbloquea hasta{' '}
                <span className="text-primary font-bold">70% OFF</span> en paquetes de CP.
              </p>
            </div>

            {/* Rules Section */}
            <div className="bg-cod-dark/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <Target className="w-5 h-5 text-secondary" />
                <span className="font-display text-cod-text font-semibold">
                  Reglas del Quiz
                </span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Crosshair className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>10 preguntas sobre Call of Duty Mobile</span>
                </li>
                <li className="flex items-start gap-2">
                  <Crosshair className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Elige una respuesta para cada pregunta</span>
                </li>
                <li className="flex items-start gap-2">
                  <Crosshair className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Pulsa siguiente para confirmar y avanzar</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Necesitas al menos 7 respuestas correctas (70%) para ganar</span>
                </li>
              </ul>
            </div>

            {/* Start Button */}
            <button
              onClick={onStart}
              className="btn-tactical w-full py-4 rounded-lg text-lg relative z-10 animate-pulse-gold"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Comenzar Quiz
                <Crosshair className="w-5 h-5" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

QuizIntro.displayName = 'QuizIntro';

export default QuizIntro;
