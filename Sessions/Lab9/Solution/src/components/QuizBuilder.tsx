import { useState } from 'react';
import type { Question, Quiz } from '../types/quiz';
import { addQuestion as apiAddQuestion, createQuiz } from '../api/quizzes';

type QuizBuilderProps = {
  onCreate: (quiz: Quiz) => void;
  onCancel: () => void;
  // Called after the quiz is successfully persisted, so the parent can refresh
  // the "On the server" list.
  onSaved: () => void;
  // NEW for Lab 9 — no more pasted token. `isAuthenticated` is just "is
  // someone signed in" for the pre-flight check below; `getToken` fetches a
  // fresh bearer token from MSAL right before each authorized call (App.tsx
  // owns *how* — acquireTokenSilent, falling back to a popup).
  isAuthenticated: boolean;
  getToken: () => Promise<string>;
};

const newId = () => crypto.randomUUID();

// Build a quiz entirely in local React state: a title, a list of questions,
// and for each question a list of answer options — now with one marked
// correct per question. Every change is an *immutable* update — we never
// mutate the existing arrays, we build new ones and hand them to the setter,
// so React knows something changed and re-renders.
function QuizBuilder({ onCreate, onCancel, onSaved, isAuthenticated, getToken }: QuizBuilderProps) {
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
        q.id === qid
          ? { ...q, answers: [...q.answers, { id: newId(), text: '', isCorrect: false }] }
          : q,
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

  // NEW for Lab 9 — radio-style "mark correct": setting one option's
  // isCorrect to true clears it on every other option in the *same*
  // question, so there's always at most one. This mirrors, in the
  // frontend, the exact rule the backend enforces on save.
  function markCorrect(qid: string, aid: string) {
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === qid
          ? { ...q, answers: q.answers.map((a) => ({ ...a, isCorrect: a.id === aid })) }
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
    // NEW for Lab 9 — mirror the backend's options rule client-side, so a
    // bad request never leaves the browser: a question is either text-only
    // (zero options) or a real gradable question (2+ options, exactly one
    // correct). Catching it here means a friendlier message than "HTTP 400".
    for (const q of questions) {
      if (q.answers.length === 0) continue;
      if (q.answers.length < 2) {
        setWarning(`"${q.text || '(untitled question)'}" needs at least two answer options, or none at all.`);
        return;
      }
      if (q.answers.filter((a) => a.isCorrect).length !== 1) {
        setWarning(`Mark exactly one correct answer for "${q.text || '(untitled question)'}".`);
        return;
      }
    }
    if (!isAuthenticated) {
      setWarning('Sign in with Microsoft to save to the server.');
      return;
    }

    setWarning(null);
    setSaving(true);
    try {
      // NEW for Lab 9 — fetch one token and reuse it for every call in this
      // save, rather than calling getToken() per request. acquireTokenSilent
      // is cheap (it's a cache read most of the time), but there's no reason
      // to risk a second popup mid-loop if a question add somehow raced a
      // token expiry.
      const token = await getToken();
      // 1. POST the quiz, then 2. POST each question — with its options —
      // against the id the server hands back.
      const created = await createQuiz(token, { title: cleanTitle });
      for (const q of questions) {
        const options = q.answers.map((a) => ({ text: a.text.trim(), isCorrect: a.isCorrect }));
        await apiAddQuestion(token, created.id, q.text.trim(), options);
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
                <label className="answer-correct-toggle" title="Mark as the correct answer">
                  <input
                    type="radio"
                    name={`correct-${q.id}`}
                    checked={a.isCorrect}
                    onChange={() => markCorrect(q.id, a.id)}
                  />
                </label>
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
            {q.answers.length > 0 && (
              <p className="field-hint">Pick the radio next to the correct answer.</p>
            )}
          </div>
        </div>
      ))}

      <button className="btn-secondary" onClick={addQuestion}>
        + Add question
      </button>

      <p className="field-hint">
        {isAuthenticated
          ? 'Signed in — saving will POST this quiz (and its options) to the API.'
          : 'Sign in with Microsoft before saving — Create quiz POSTs to the API.'}
      </p>

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
