import { useQuiz } from '@/hooks/useQuiz';
import QuizIntro from '@/components/QuizIntro';
import QuizQuestion from '@/components/QuizQuestion';
import QuizResult from '@/components/QuizResult';

const Index = () => {
  const {
    quizState,
    progress,
    currentQuestion,
    totalQuestions,
    startQuiz,
    selectAnswer,
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
