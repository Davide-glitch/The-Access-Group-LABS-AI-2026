import { useState } from 'react';
import type { Quiz } from '../types/quiz';

type QuizRunnerProps = {
  quiz: Quiz;
  onExit: () => void;
};

// Step through a built quiz one question at a time. We deliberately don't
// grade anything — there are no correct answers in this model. "Running" just
// means navigating the questions and recording which option you picked.
//
// State here: which question we're on, and a map of questionId -> answerId
// for the picks made so far. When `finished` is true we show a summary.
function QuizRunner({ quiz, onExit }: QuizRunnerProps) {
  const [current, setCurrent] = useState(0);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);

  const question = quiz.questions[current];
  const isLast = current === quiz.questions.length - 1;

  function pick(answerId: string) {
    setPicks((prev) => ({ ...prev, [question.id]: answerId }));
  }

  if (finished) {
    const answered = Object.keys(picks).length;
    return (
      <div className="runner">
        <h2>{quiz.title} — done</h2>
        <p className="status-message">
          You answered {answered} of {quiz.questions.length} question
          {quiz.questions.length === 1 ? '' : 's'}.
        </p>
        <ol className="summary">
          {quiz.questions.map((q) => {
            const picked = q.answers.find((a) => a.id === picks[q.id]);
            return (
              <li key={q.id}>
                <strong>{q.text || '(untitled question)'}</strong>
                <span className="summary-pick">
                  {picked ? picked.text || '(blank option)' : 'No answer selected'}
                </span>
              </li>
            );
          })}
        </ol>
        <button className="btn-primary" onClick={onExit}>
          Back to home
        </button>
      </div>
    );
  }

  return (
    <div className="runner">
      <div className="runner-progress">
        Question {current + 1} of {quiz.questions.length}
      </div>
      <h2>{question.text || '(untitled question)'}</h2>

      <div className="options">
        {question.answers.length === 0 && (
          <p className="status-message">This question has no answer options.</p>
        )}
        {question.answers.map((a) => (
          <button
            key={a.id}
            className={'option' + (picks[question.id] === a.id ? ' option-selected' : '')}
            onClick={() => pick(a.id)}
          >
            {a.text || '(blank option)'}
          </button>
        ))}
      </div>

      <div className="runner-actions">
        <button
          className="btn-ghost"
          disabled={current === 0}
          onClick={() => setCurrent((c) => c - 1)}
        >
          ← Previous
        </button>
        {isLast ? (
          <button className="btn-primary" onClick={() => setFinished(true)}>
            Finish
          </button>
        ) : (
          <button className="btn-primary" onClick={() => setCurrent((c) => c + 1)}>
            Next →
          </button>
        )}
      </div>

      <button className="btn-link" onClick={onExit}>
        Quit quiz
      </button>
    </div>
  );
}

export default QuizRunner;
