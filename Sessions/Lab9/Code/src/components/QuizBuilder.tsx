import { useState } from 'react';
import { createQuiz, addQuestion as apiAddQuestion } from '../api/quizzes';
import type { Question, Quiz } from '../types/quiz';

function newId() {
  return crypto.randomUUID();
}

type QuizBuilderProps = {
  onCreate: (quiz: Quiz) => void;
  onCancel: () => void;
  onSaved: () => void;
  isAuthenticated: boolean;
  getToken: () => Promise<string>;
};

function QuizBuilder({ onCreate, onCancel, onSaved, isAuthenticated, getToken }: QuizBuilderProps) {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  function addQuestion() {
    setQuestions((qs) => [...qs, { id: newId(), text: '', answers: [] }]);
  }

  function updateQuestionText(qid: string, text: string) {
    setQuestions((qs) => qs.map((q) => (q.id === qid ? { ...q, text } : q)));
  }

  function removeQuestion(qid: string) {
    setQuestions((qs) => qs.filter((q) => q.id !== qid));
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

  function updateAnswerText(qid: string, aid: string, text: string) {
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === qid
          ? { ...q, answers: q.answers.map((a) => (a.id === aid ? { ...a, text } : a)) }
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
    if (!cleanTitle) {
      setWarning('Quiz needs a title.');
      return;
    }

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
      const token = await getToken();
      const created = await createQuiz(token, { title: cleanTitle });
      for (const q of questions) {
        const options = q.answers.map((a) => ({ text: a.text.trim(), isCorrect: a.isCorrect }));
        await apiAddQuestion(token, created.id, q.text.trim(), options);
      }
      onSaved();
      onCreate({ id: created.id, title: created.title, questions });
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
          placeholder="e.g. C# fundamentals"
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <div className="builder-questions">
        {questions.map((q, i) => (
          <div key={q.id} className="builder-q">
            <div className="builder-q-header">
              <h4>Q{i + 1}</h4>
              <button className="btn-ghost" onClick={() => removeQuestion(q.id)}>
                Remove
              </button>
            </div>
            <input
              type="text"
              value={q.text}
              placeholder="Question text"
              onChange={(e) => updateQuestionText(q.id, e.target.value)}
            />

            <div className="builder-answers">
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
              <button className="btn-secondary" onClick={() => addAnswer(q.id)}>
                + Add answer
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="btn-secondary" onClick={addQuestion} style={{ marginTop: '1rem' }}>
        + Add question
      </button>

      <div className="builder-save">
        <p className="field-hint">
          {isAuthenticated
            ? 'Signed in — saving will POST this quiz to the API.'
            : 'Sign in with Microsoft before saving.'}
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
    </div>
  );
}

export default QuizBuilder;