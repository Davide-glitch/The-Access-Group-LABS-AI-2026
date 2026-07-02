import { useEffect, useState } from 'react';
import { fetchPlayQuiz, evaluateQuiz } from '../api/quizzes';
import type { PlayQuiz as PlayQuizType, QuizResult } from '../types/quiz';

type PlayQuizProps = { quizId: string; onExit: () => void; };

function PlayQuiz({ quizId, onExit }: PlayQuizProps) {
  const [quiz, setQuiz] = useState<PlayQuizType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [current, setCurrent] = useState(0);
  const [picks, setPicks] = useState<Record<string, string>>({});
  
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPlayQuiz(quizId)
      .then(setQuiz)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [quizId]); 

  if (loading) return <p className="status-message">Loading quiz…</p>;
  if (error) return <p className="status-message error">Couldn't load this quiz: {error}</p>;
  if (!quiz) return null;

  if (quiz.questions.length === 0) {
    return (
      <div className="runner">
        <h2>{quiz.title}</h2>
        <p className="status-message">This quiz has no questions to play yet.</p>
        <button className="btn-primary" onClick={onExit}>Back</button>
      </div>
    );
  }

  async function submit() {
    if (!quiz) return;
    setSubmitting(true);
    setError(null);
    try {
      const answers = quiz.questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: picks[q.id] ?? null,
      }));
      const graded = await evaluateQuiz(quiz.id, answers);
      setResult(graded);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="runner">
        <h2>{quiz.title} — graded</h2>
        <p className="score-banner">
          {result.correctCount} / {result.totalQuestions} correct ({result.scorePercentage}%)
        </p>
        <ol className="summary">
          {result.results.map((r) => (
            <li key={r.questionId}>
              <strong>{r.questionText || '(untitled question)'}</strong>
              <div className="options">
                {r.options.map((o) => {
                  const wasSelected = o.id === r.selectedOptionId;
                  const cls =
                    'option' +
                    (o.isCorrect ? ' option-correct' : '') +
                    (wasSelected && !o.isCorrect ? ' option-incorrect' : '') +
                    (wasSelected ? ' option-selected' : '');
                  return (
                    <div key={o.id} className={cls}>
                      {o.text || '(blank option)'}
                      {o.isCorrect && ' ✓'}
                      {wasSelected && !o.isCorrect && ' (your pick)'}
                    </div>
                  );
                })}
              </div>
            </li>
          ))}
        </ol>
        <button className="btn-primary" onClick={onExit}>Back to home</button>
      </div>
    );
  }

  function pick(questionId: string, optionId: string) {
    setPicks((prev) => ({ ...prev, [questionId]: optionId }));
  }

  const question = quiz.questions[current];
  const isLast = current === quiz.questions.length - 1;

  return (
    <div className="runner">
      <div className="runner-progress">
        Question {current + 1} of {quiz.questions.length}
      </div>
      <h2>{question.text || '(untitled question)'}</h2>

      <div className="options">
        {question.options.map((o) => (
          <button
            key={o.id}
            className={'option' + (picks[question.id] === o.id ? ' option-selected' : '')}
            onClick={() => pick(question.id, o.id)}
          >
            {o.text || '(blank option)'}
          </button>
        ))}
      </div>

      <div className="runner-actions">
        <button className="btn-ghost" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
          ← Previous
        </button>
        {isLast ? (
          <button className="btn-primary" onClick={submit} disabled={submitting}>
            {submitting ? 'Grading…' : 'Submit for grading'}
          </button>
        ) : (
          <button className="btn-primary" onClick={() => setCurrent((c) => c + 1)}>
            Next →
          </button>
        )}
      </div>

      <button className="btn-link" onClick={onExit}>Quit quiz</button>
    </div>
  );
}

export default PlayQuiz;