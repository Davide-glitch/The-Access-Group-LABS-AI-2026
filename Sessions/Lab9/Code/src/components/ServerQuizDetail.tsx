import type { ApiQuiz } from '../types/quiz';

type ServerQuizDetailProps = {
  quiz: ApiQuiz;
  onRun: () => void;
  onBack: () => void;
};

// Read-only view of a quiz fetched from the API. Server quizzes only carry a
// title, description and question text (no answer options), so this screen
// shows exactly that. "Run" steps through the questions; with no questions on
// the quiz there's nothing to run, so we disable it and say so.
function ServerQuizDetail({ quiz, onRun, onBack }: ServerQuizDetailProps) {
  const count = quiz.questions.length;

  return (
    <div className="runner">
      <h2>{quiz.title}</h2>
      {quiz.description && <p className="status-message">{quiz.description}</p>}

      <p className="runner-progress">
        {count} question{count === 1 ? '' : 's'}
      </p>

      {count === 0 ? (
        <p className="status-message">This quiz has no questions yet.</p>
      ) : (
        <ol className="summary">
          {quiz.questions.map((q) => (
            <li key={q.id}>
              <strong>{q.text || '(untitled question)'}</strong>
            </li>
          ))}
        </ol>
      )}

      <div className="runner-actions">
        <button className="btn-ghost" onClick={onBack}>
          ← Back
        </button>
        <button className="btn-primary" disabled={count === 0} onClick={onRun}>
          Run
        </button>
      </div>
    </div>
  );
}

export default ServerQuizDetail;
