import { useEffect } from 'react';
import { useQuizEn } from '@/hooks/useQuizEn';
import QuizIntroEn from '@/components/en/QuizIntroEn';
import QuizQuestionEn from '@/components/en/QuizQuestionEn';
import QuizResultEn from '@/components/en/QuizResultEn';
import { initUTMTracking, trackPageView } from '@/lib/utmify';
import { useXcodParam } from '@/hooks/useXcodParam';

const QuizEn = () => {
  // Capture xcod parameter from URL
  const xcod = useXcodParam();

  // Initialize UTM tracking on page load
  useEffect(() => {
    initUTMTracking();
    trackPageView('quiz-en');
  }, []);
  
  const {
    quizState,
    progress,
    currentQuestion,
    totalQuestions,
    startQuiz,
    selectAnswer,
    confirmAnswer,
    calculateScore,
    restartQuiz
  } = useQuizEn();

  return (
    <main className="min-h-screen">
      {quizState === 'intro' && (
        <QuizIntroEn onStart={startQuiz} />
      )}

      {quizState === 'playing' && (
        <QuizQuestionEn
          question={currentQuestion}
          currentIndex={progress.currentQuestionIndex}
          totalQuestions={totalQuestions}
          selectedAnswer={progress.selectedAnswer}
          showFeedback={progress.showFeedback}
          onSelectAnswer={selectAnswer}
          onConfirm={confirmAnswer}
        />
      )}

      {quizState === 'result' && (
        <QuizResultEn
          score={calculateScore()}
          onRestart={restartQuiz}
        />
      )}
    </main>
  );
};

export default QuizEn;
