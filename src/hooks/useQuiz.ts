import { useState, useCallback } from 'react';
import { Question, codmQuestions } from '@/data/questions';

export type QuizState = 'intro' | 'playing' | 'result';

export interface QuizProgress {
  currentQuestionIndex: number;
  selectedAnswer: number | null;
  answers: (number | null)[];
  showFeedback: boolean;
  isConfirmed: boolean;
}

export const useQuiz = () => {
  const [quizState, setQuizState] = useState<QuizState>('intro');
  const [progress, setProgress] = useState<QuizProgress>({
    currentQuestionIndex: 0,
    selectedAnswer: null,
    answers: new Array(codmQuestions.length).fill(null),
    showFeedback: false,
    isConfirmed: false
  });

  const currentQuestion: Question = codmQuestions[progress.currentQuestionIndex];

  const startQuiz = useCallback(() => {
    setQuizState('playing');
    setProgress({
      currentQuestionIndex: 0,
      selectedAnswer: null,
      answers: new Array(codmQuestions.length).fill(null),
      showFeedback: false,
      isConfirmed: false
    });
  }, []);

  const selectAnswer = useCallback((answerIndex: number) => {
    if (progress.isConfirmed) return;
    setProgress(prev => ({
      ...prev,
      selectedAnswer: answerIndex
    }));
  }, [progress.isConfirmed]);

  const confirmAnswer = useCallback(() => {
    if (progress.selectedAnswer === null) return;
    
    setProgress(prev => {
      const newAnswers = [...prev.answers];
      newAnswers[prev.currentQuestionIndex] = prev.selectedAnswer;
      return {
        ...prev,
        answers: newAnswers,
        showFeedback: true,
        isConfirmed: true
      };
    });
  }, [progress.selectedAnswer]);

  const nextQuestion = useCallback(() => {
    const isLastQuestion = progress.currentQuestionIndex === codmQuestions.length - 1;
    
    if (isLastQuestion) {
      setQuizState('result');
    } else {
      setProgress(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        selectedAnswer: null,
        showFeedback: false,
        isConfirmed: false
      }));
    }
  }, [progress.currentQuestionIndex]);

  const calculateScore = useCallback(() => {
    let correct = 0;
    progress.answers.forEach((answer, index) => {
      if (answer === codmQuestions[index].correctAnswer) {
        correct++;
      }
    });
    return {
      correct,
      total: codmQuestions.length,
      percentage: Math.round((correct / codmQuestions.length) * 100)
    };
  }, [progress.answers]);

  const restartQuiz = useCallback(() => {
    setQuizState('intro');
    setProgress({
      currentQuestionIndex: 0,
      selectedAnswer: null,
      answers: new Array(codmQuestions.length).fill(null),
      showFeedback: false,
      isConfirmed: false
    });
  }, []);

  return {
    quizState,
    progress,
    currentQuestion,
    totalQuestions: codmQuestions.length,
    startQuiz,
    selectAnswer,
    confirmAnswer,
    nextQuestion,
    calculateScore,
    restartQuiz
  };
};
