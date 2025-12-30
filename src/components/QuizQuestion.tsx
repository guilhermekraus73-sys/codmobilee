import { Question } from '@/data/questions';
import { Check, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizQuestionProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  selectedAnswer: number | null;
  showFeedback: boolean;
  onSelectAnswer: (index: number) => void;
  onConfirm: () => void;
}

const QuizQuestion = ({
  question,
  currentIndex,
  totalQuestions,
  selectedAnswer,
  showFeedback,
  onSelectAnswer,
  onConfirm
}: QuizQuestionProps) => {
  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <div className="min-h-screen flex flex-col px-4 py-8">
      {/* Progress Bar */}
      <div className="max-w-lg mx-auto w-full mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-display text-sm text-muted-foreground">
            Pregunta {currentIndex + 1} de {totalQuestions}
          </span>
          <span className="font-display text-sm text-primary">
            {Math.round(((currentIndex + 1) / totalQuestions) * 100)}%
          </span>
        </div>
        <div className="progress-bar h-2 rounded-full">
          <div 
            className="progress-fill h-full rounded-full"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-lg animate-fade-in" key={question.id}>
          <div className="card-military rounded-xl overflow-hidden">
            {/* Question Image */}
            <div className="relative w-full h-48 overflow-hidden">
              <img 
                src={question.image} 
                alt={`Imagen de la pregunta ${currentIndex + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-cod-dark/90 via-cod-dark/30 to-transparent" />
            </div>

            <div className="p-6">
              {/* Question Text */}
              <h2 className="font-display text-xl md:text-2xl text-cod-text font-semibold mb-6 leading-tight">
                {question.question}
              </h2>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {question.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrectAnswer = index === question.correctAnswer;
                  
                  let optionClass = 'option-card';
                  if (showFeedback) {
                    if (isCorrectAnswer) {
                      optionClass = 'option-card correct';
                    } else if (isSelected && !isCorrectAnswer) {
                      optionClass = 'option-card incorrect';
                    }
                  } else if (isSelected) {
                    optionClass = 'option-card selected';
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => onSelectAnswer(index)}
                      disabled={showFeedback}
                      className={cn(
                        optionClass,
                        'w-full p-4 rounded-lg text-left flex items-center gap-4 group',
                        showFeedback && 'cursor-default'
                      )}
                    >
                      <span className={cn(
                        'w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 font-display font-bold text-sm transition-all',
                        showFeedback && isCorrectAnswer 
                          ? 'border-success bg-success text-success-foreground' 
                          : showFeedback && isSelected && !isCorrectAnswer
                            ? 'border-destructive bg-destructive text-destructive-foreground'
                            : isSelected 
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-muted-foreground group-hover:border-primary/50'
                      )}>
                        {showFeedback && isCorrectAnswer ? (
                          <Check className="w-4 h-4" />
                        ) : showFeedback && isSelected && !isCorrectAnswer ? (
                          <X className="w-4 h-4" />
                        ) : (
                          String.fromCharCode(65 + index)
                        )}
                      </span>
                      <span className="text-cod-text font-medium">{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Feedback Message */}
              {showFeedback && (
                <div className={cn(
                  'p-4 rounded-lg mb-4 animate-scale-in',
                  isCorrect 
                    ? 'bg-success/20 border border-success/50' 
                    : 'bg-destructive/20 border border-destructive/50'
                )}>
                  <p className={cn(
                    'font-display font-semibold text-center',
                    isCorrect ? 'text-success' : 'text-destructive'
                  )}>
                    {isCorrect ? '¡Correcto!' : '¡Incorrecto!'}
                  </p>
                </div>
              )}

              {/* Next Button - only show when not in feedback mode */}
              {!showFeedback && (
                <button
                  onClick={onConfirm}
                  disabled={selectedAnswer === null}
                  className={cn(
                    'btn-tactical w-full py-4 rounded-lg text-lg relative z-10',
                    selectedAnswer === null && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Siguiente Pregunta
                    <ChevronRight className="w-5 h-5" />
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizQuestion;
