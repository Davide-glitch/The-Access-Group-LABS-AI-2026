import { useState } from 'react';
import { generateQuiz } from '../api/quizzes';
import type { ApiQuiz } from '../types/quiz';

type QuizGeneratorProps = {
  // NEW for Lab 9 — no more pasted token. See QuizBuilder.tsx for the same
  // pattern: `isAuthenticated` for the pre-flight check, `getToken` for a
  // fresh bearer token from MSAL right before the POST.
  isAuthenticated: boolean;
  getToken: () => Promise<string>;
  // Called with the freshly generated quiz, so the parent can jump straight
  // into playing it.
  onGenerated: (quiz: ApiQuiz) => void;
  onCancel: () => void;
};

// NEW for Lab 9 — the one screen with no local "build it yourself" state at
// all. You paste in source text, the backend asks a model to read it and
// write the quiz; this component's only job is the request lifecycle
// (idle → generating → done/error), the same three states as ExistingQuizzes,
// just for a POST instead of a GET.
function QuizGenerator({ isAuthenticated, getToken, onGenerated, onCancel }: QuizGeneratorProps) {
  const [sourceText, setSourceText] = useState('');
  const [title, setTitle] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  async function generate() {
    const cleanText = sourceText.trim();
    if (cleanText.length < 200) {
      setWarning(`Paste at least 200 characters of source text (currently ${cleanText.length}).`);
      return;
    }
    if (!isAuthenticated) {
      setWarning('Sign in with Microsoft — generating saves a quiz, so it needs sign-in like Create quiz does.');
      return;
    }

    setWarning(null);
    setGenerating(true);
    try {
      const token = await getToken();
      const quiz = await generateQuiz(token, {
        sourceText: cleanText,
        title: title.trim() || undefined,
        questionCount,
      });
      onGenerated(quiz);
    } catch (err) {
      setWarning((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="builder">
      <label className="field">
        <span>Source text</span>
        <textarea
          rows={10}
          value={sourceText}
          placeholder="Paste an article, lecture notes, a study guide — anything with enough substance to write a quiz about (at least 200 characters)."
          onChange={(e) => setSourceText(e.target.value)}
        />
        <small className="field-hint">{sourceText.trim().length} characters</small>
      </label>

      <label className="field">
        <span>Quiz title (optional)</span>
        <input
          type="text"
          value={title}
          placeholder="Leave blank to auto-generate one"
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <label className="field">
        <span>Number of questions</span>
        <input
          type="number"
          min={3}
          max={10}
          value={questionCount}
          onChange={(e) => setQuestionCount(Math.min(10, Math.max(3, Number(e.target.value) || 3)))}
        />
      </label>

      <p className="field-hint">
        {isAuthenticated
          ? "Signed in — generating is a write, same as Create quiz, so it'll use your sign-in too."
          : 'Sign in with Microsoft before generating — it saves a quiz, same as Create quiz.'}{' '}
        (The backend reads <code>GITHUB_TOKEN</code> separately, from its own environment, to talk
        to the model — that's not this.)
      </p>

      {warning && <p className="status-message error">{warning}</p>}

      <div className="builder-actions">
        <button className="btn-primary" onClick={generate} disabled={generating}>
          {generating ? 'Generating…' : 'Generate quiz'}
        </button>
        <button className="btn-ghost" onClick={onCancel} disabled={generating}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default QuizGenerator;
