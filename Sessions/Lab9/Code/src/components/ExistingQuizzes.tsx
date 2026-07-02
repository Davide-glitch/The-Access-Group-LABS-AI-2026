import { useEffect, useState } from 'react';
import { fetchQuizzes } from '../api/quizzes';
import QuizCard from './QuizCard';
import type { ApiQuiz } from '../types/quiz';

type Props = { onView: (quiz: ApiQuiz) => void; };

function ExistingQuizzes({ onView }: Props) {
  const [quizzes, setQuizzes] = useState<ApiQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes()
      .then(setQuizzes)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading quizzes from the API...</p>;
  if (error) return <p className="status-message error">{error}</p>;
  if (quizzes.length === 0) return <p>No quizzes on the server yet.</p>;

  return (
    <div className="existing-quizzes">
      <h2>On the server</h2>
      <div className="quiz-grid" style={{ marginTop: '10px' }}>
        {quizzes.map((q) => (
          <QuizCard
            key={q.id}
            title={q.title}
            subtitle={q.description}
            action={<button className="btn-secondary" onClick={() => onView(q)}>View</button>}
          />
        ))}
      </div>
    </div>
  );
}

export default ExistingQuizzes;