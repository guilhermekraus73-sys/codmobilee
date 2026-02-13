import { useEffect } from 'react';
import { useQuiz } from '@/hooks/useQuiz';
import QuizIntro from '@/components/QuizIntro';
import QuizQuestion from '@/components/QuizQuestion';
import QuizResult from '@/components/QuizResult';
import { initUTMTracking, trackPageView } from '@/lib/utmify';
import { useXcodParam } from '@/hooks/useXcodParam';
import { usePageTracking } from '@/hooks/usePageTracking';

const Index = () => {
  // Capture xcod parameter from URL
  const xcod = useXcodParam();

  usePageTracking('quiz');

  // Initialize UTM tracking on page load
  useEffect(() => {
    initUTMTracking();
    trackPageView('quiz');
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
  } = useQuiz();

  return (
    <main className="min-h-screen">
      {quizState === 'intro' && (
        <QuizIntro onStart={startQuiz} />
      )}

      {quizState === 'playing' && (
        <QuizQuestion
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
        <QuizResult
          score={calculateScore()}
          onRestart={restartQuiz}
        />
      )}
    </main>
  );
};

export default Index;
