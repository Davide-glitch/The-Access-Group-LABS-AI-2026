import { useState } from 'react';
import type { Question, Quiz } from '../types/quiz';

type QuizBuilderProps = {
  onCreate: (quiz: Quiz) => void;
  onCancel: () => void;
};

const newId = () => crypto.randomUUID();

// Build a quiz entirely in local React state: a title, a list of questions,
// and for each question a list of answer options. Every change is an
// *immutable* update — we never mutate the existing arrays, we build new ones
// and hand them to the setter, so React knows something changed and re-renders.
function QuizBuilder({ onCreate, onCancel }: QuizBuilderProps) {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [warning, setWarning] = useState<string | null>(null);

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

  function save() {
    if (title.trim() === '') {
      setWarning('Give your quiz a title first.');
      return;
    }
    if (questions.length === 0) {
      setWarning('Add at least one question.');
      return;
    }
    onCreate({ id: newId(), title: title.trim(), questions });
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

      {warning && <p className="status-message error">{warning}</p>}

      <div className="builder-actions">
        <button className="btn-primary" onClick={save}>
          Create quiz
        </button>
        <button className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default QuizBuilder;
