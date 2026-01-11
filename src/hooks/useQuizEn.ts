import { useState, useCallback } from 'react';
import { Question, codmQuestionsEn } from '@/data/questions-en';

export type QuizState = 'intro' | 'playing' | 'result';

export interface QuizProgress {
  currentQuestionIndex: number;
  selectedAnswer: number | null;
  answers: (number | null)[];
  showFeedback: boolean;
}

export const useQuizEn = () => {
  const [quizState, setQuizState] = useState<QuizState>('intro');
  const [progress, setProgress] = useState<QuizProgress>({
    currentQuestionIndex: 0,
    selectedAnswer: null,
    answers: new Array(codmQuestionsEn.length).fill(null),
    showFeedback: false
  });

  const currentQuestion: Question = codmQuestionsEn[progress.currentQuestionIndex];

  const startQuiz = useCallback(() => {
    setQuizState('playing');
    setProgress({
      currentQuestionIndex: 0,
      selectedAnswer: null,
      answers: new Array(codmQuestionsEn.length).fill(null),
      showFeedback: false
    });
  }, []);

  const selectAnswer = useCallback((answerIndex: number) => {
    if (progress.showFeedback) return;
    setProgress(prev => ({
      ...prev,
      selectedAnswer: answerIndex
    }));
  }, [progress.showFeedback]);

  const confirmAnswer = useCallback(() => {
    if (progress.selectedAnswer === null || progress.showFeedback) return;
    
    const isLastQuestion = progress.currentQuestionIndex === codmQuestionsEn.length - 1;
    
    // Save answer and show feedback
    setProgress(prev => {
      const newAnswers = [...prev.answers];
      newAnswers[prev.currentQuestionIndex] = prev.selectedAnswer;
      return {
        ...prev,
        answers: newAnswers,
        showFeedback: true
      };
    });

    // Auto advance after delay - optimized for speed
    setTimeout(() => {
      if (isLastQuestion) {
        setQuizState('result');
      } else {
        setProgress(prev => ({
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex + 1,
          selectedAnswer: null,
          showFeedback: false
        }));
      }
    }, 800);
  }, [progress.selectedAnswer, progress.showFeedback, progress.currentQuestionIndex]);

  const calculateScore = useCallback(() => {
    let correct = 0;
    progress.answers.forEach((answer, index) => {
      if (answer === codmQuestionsEn[index].correctAnswer) {
        correct++;
      }
    });
    return {
      correct,
      total: codmQuestionsEn.length,
      percentage: Math.round((correct / codmQuestionsEn.length) * 100)
    };
  }, [progress.answers]);

  const restartQuiz = useCallback(() => {
    setQuizState('intro');
    setProgress({
      currentQuestionIndex: 0,
      selectedAnswer: null,
      answers: new Array(codmQuestionsEn.length).fill(null),
      showFeedback: false
    });
  }, []);

  return {
    quizState,
    progress,
    currentQuestion,
    totalQuestions: codmQuestionsEn.length,
    startQuiz,
    selectAnswer,
    confirmAnswer,
    calculateScore,
    restartQuiz
  };
};
