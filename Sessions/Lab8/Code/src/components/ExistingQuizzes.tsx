import { useEffect, useState } from 'react';
import QuizCard from './QuizCard';
import { fetchQuizzes } from '../api/quizzes';
import type { ApiQuiz } from '../types/quiz';

function ExistingQuizzes() {
  const [quizzes, setQuizzes] = useState<ApiQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes()
      .then(setQuizzes)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);  // empty array — run once, on mount

  if (loading) return <p className="status-message">Loading quizzes from the API...</p>;
  if (error) return <p className="status-message error">Couldn't load quizzes: {error}</p>;
  if (quizzes.length === 0) return <p className="status-message">No quizzes on the server yet.</p>;

  return (
    <div className="quiz-list">
      {quizzes.map((quiz) => (
        <QuizCard key={quiz.id} title={quiz.title} subtitle={quiz.description} />
      ))}
    </div>
  );
}

export default ExistingQuizzes;
