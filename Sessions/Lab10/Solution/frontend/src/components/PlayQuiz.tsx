import { useEffect, useState } from 'react';
import { fetchPlayQuiz, evaluateQuiz } from '../api/quizzes';
import type { PlayQuiz as PlayQuizType, QuizResult } from '../types/quiz';

type PlayQuizProps = {
  quizId: string;
  onExit: () => void;
};

// NEW for Lab 9 — replaces QuizRunner for anything that lives on the server.
// Same three-part shape (step through questions → submit → show a result),
// but now there IS a correct answer, and the server is the one who knows
// it: this component fetches the no-peeking "play" shape, lets the student
// pick one option per question, then POSTs the picks to /evaluate and
// renders whatever comes back — including, finally, which answers were right.
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
  }, [quizId]); // re-fetch if we're ever pointed at a different quiz

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

  function pick(questionId: string, optionId: string) {
    setPicks((prev) => ({ ...prev, [questionId]: optionId }));
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

  // ---- graded view ------------------------------------------------------
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

  // ---- answering view -----------------------------------------------------
  const question = quiz.questions[current];
  const isLast = current === quiz.questions.length - 1;

  return (
    <div className="runner">
      <div className="runner-progress">
        Question {current + 1} of {quiz.questions.length}
      </div>
      <h2>{question.text || '(untitled question)'}</h2>

      <div className="options">
        {question.options.length === 0 && (
          <p className="status-message">This question has no answer options — nothing to grade here.</p>
        )}
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

      {error && <p className="status-message error">{error}</p>}

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
