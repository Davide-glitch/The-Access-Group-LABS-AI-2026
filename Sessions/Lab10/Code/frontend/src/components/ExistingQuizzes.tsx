import { useEffect, useState } from 'react';
import QuizCard from './QuizCard';
import { fetchQuizzes } from '../api/quizzes';
import type { ApiQuiz } from '../types/quiz';

type ExistingQuizzesProps = {
  // Called when the user opens a server quiz. The parent owns navigation and
  // the runner, so we just hand the picked quiz up.
  onOpen: (quiz: ApiQuiz) => void;
};

// The "fetch data from the API" half of the lab. This component owns three
// pieces of state — the data, plus whether we're still loading and whether
// the request failed — and renders each honestly instead of only the happy
// path.
function ExistingQuizzes({ onOpen }: ExistingQuizzesProps) {
  const [quizzes, setQuizzes] = useState<ApiQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes()
      .then(setQuizzes)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []); // empty array — run once, on mount

  if (loading) return <p className="status-message">Loading quizzes from the API...</p>;
  if (error) return <p className="status-message error">Couldn't load quizzes: {error}</p>;
  if (quizzes.length === 0) return <p className="status-message">No quizzes on the server yet.</p>;

  return (
    <div className="quiz-list">
      {quizzes.map((quiz) => (
        <QuizCard
          key={quiz.id}
          title={quiz.title}
          subtitle={quiz.description}
          action={
            <button className="btn-secondary" onClick={() => onOpen(quiz)}>
              View
            </button>
          }
        />
      ))}
    </div>
  );
}

export default ExistingQuizzes;
