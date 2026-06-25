import { useState } from 'react';
import type { Question, Quiz } from '../types/quiz';
import { addQuestion as apiAddQuestion, createQuiz } from '../api/quizzes';

type QuizBuilderProps = {
  onCreate: (quiz: Quiz) => void;
  onCancel: () => void;
  // Called after the quiz is successfully persisted, so the parent can refresh
  // the "On the server" list.
  onSaved: () => void;
  // The bearer token for the authorized POST calls, owned by the parent.
  token: string;
  onTokenChange: (token: string) => void;
};

const newId = () => crypto.randomUUID();

// Build a quiz entirely in local React state: a title, a list of questions,
// and for each question a list of answer options. Every change is an
// *immutable* update — we never mutate the existing arrays, we build new ones
// and hand them to the setter, so React knows something changed and re-renders.
function QuizBuilder({ onCreate, onCancel, onSaved, token, onTokenChange }: QuizBuilderProps) {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function addQuestion() {
    setQuestions((qs) => [...qs, { id: newId(), text: '', answers: [] }]);
  }

  function removeQuestion(qid: string) {
    setQuestions((qs) => qs.filter((q) => q.id !== qid));
  }

  function updateQuestionText(qid: string, text: string) {
    setQuestions((qs) => qs.map((q) => (q.id === qid ? { ...q, text } : q)));
  }

  function addAnswer(qid: string) {
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === qid ? { ...q, answers: [...q.answers, { id: newId(), text: '' }] } : q,
      ),
    );
  }

  function removeAnswer(qid: string, aid: string) {
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === qid ? { ...q, answers: q.answers.filter((a) => a.id !== aid) } : q,
      ),
    );
  }

  function updateAnswerText(qid: string, aid: string, text: string) {
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === qid
          ? { ...q, answers: q.answers.map((a) => (a.id === aid ? { ...a, text } : a)) }
          : q,
      ),
    );
  }

  async function save() {
    const cleanTitle = title.trim();
    if (cleanTitle.length < 3) {
      setWarning('Give your quiz a title (at least 3 characters).');
      return;
    }
    if (questions.length === 0) {
      setWarning('Add at least one question.');
      return;
    }
    // The backend requires each question's text to be 3–500 chars.
    if (questions.some((q) => q.text.trim().length < 3)) {
      setWarning('Every question needs at least 3 characters of text to save.');
      return;
    }
    if (token.trim() === '') {
      setWarning('Paste an access token to save to the server.');
      return;
    }

    setWarning(null);
    setSaving(true);
    try {
      // 1. POST the quiz, then 2. POST each question against the id the server
      // hands back. Answer options aren't sent — the backend has no field for
      // them; they stay in the local copy below so this quiz is still runnable
      // with options under "Your quizzes".
      const created = await createQuiz(token.trim(), { title: cleanTitle });
      for (const q of questions) {
        await apiAddQuestion(token.trim(), created.id, q.text.trim());
      }
      // Keep the same server id locally so the two copies line up.
      onCreate({ id: created.id, title: cleanTitle, questions });
      onSaved();
    } catch (err) {
      setWarning((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="builder">
      <label className="field">
        <span>Quiz title</span>
        <input
          type="text"
          value={title}
          placeholder="e.g. JavaScript basics"
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      {questions.map((q, qi) => (
        <div className="question-editor" key={q.id}>
          <div className="question-editor-head">
            <span className="badge">Q{qi + 1}</span>
            <input
              type="text"
              value={q.text}
              placeholder="Question text"
              onChange={(e) => updateQuestionText(q.id, e.target.value)}
            />
            <button className="btn-ghost" onClick={() => removeQuestion(q.id)}>
              Remove
            </button>
          </div>

          <div className="answers">
            {q.answers.map((a) => (
              <div className="answer-row" key={a.id}>
                <input
                  type="text"
                  value={a.text}
                  placeholder="Answer option"
                  onChange={(e) => updateAnswerText(q.id, a.id, e.target.value)}
                />
                <button className="btn-ghost" onClick={() => removeAnswer(q.id, a.id)}>
                  ✕
                </button>
              </div>
            ))}
            <button className="btn-link" onClick={() => addAnswer(q.id)}>
              + Add answer
            </button>
          </div>
        </div>
      ))}

      <button className="btn-secondary" onClick={addQuestion}>
        + Add question
      </button>

      <label className="field">
        <span>Access token</span>
        <input
          type="password"
          value={token}
          placeholder="Bearer token for saving to the server"
          onChange={(e) => onTokenChange(e.target.value)}
        />
        <small className="field-hint">
          Saving POSTs to the API, which requires sign-in. Get a token from{' '}
          <code>http://localhost:5023/swagger</code> → <strong>Authorize</strong>.
          Answer options stay local — the backend only stores question text.
        </small>
      </label>

      {warning && <p className="status-message error">{warning}</p>}

      <div className="builder-actions">
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Create quiz'}
        </button>
        <button className="btn-ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default QuizBuilder;
