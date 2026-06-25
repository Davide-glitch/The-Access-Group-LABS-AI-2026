import { useState, useEffect } from 'react';
import { fetchQuizzes } from './quizzes';
import type { ApiQuiz } from '../types/quiz';

export function useQuizzes() {
  const [quizzes, setQuizzes] = useState<ApiQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes()
      .then(setQuizzes)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { quizzes, loading, error, setQuizzes };
}