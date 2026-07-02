import { useState } from 'react';
import type { Quiz } from '../types/quiz';

const API_BASE = 'http://localhost:5023';

type Props = {
  isAuthenticated: boolean;
  getToken: () => Promise<string>;
  onGenerated: (quiz: Quiz) => void;
  onCancel: () => void;
};

function QuizGenerator({ isAuthenticated, getToken, onGenerated, onCancel }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!isAuthenticated) return setError('Sign in first.');
    if (text.length < 50) return setError('Please paste at least 50 characters.');

    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/quizzes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sourceText: text })
      });
      if (!res.ok) throw new Error(`Generation failed: HTTP ${res.status}`);
      const data = await res.json();
      onGenerated(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="builder">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste Wikipedia text or notes here to generate a quiz..."
        style={{ width: '100%', minHeight: '150px', padding: '10px' }}
      />
      {error && <p className="status-message error">{error}</p>}
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <button className="btn-primary" onClick={generate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Quiz'}
        </button>
        <button className="btn-ghost" onClick={onCancel} disabled={loading}>Cancel</button>
      </div>
    </div>
  );
}

export default QuizGenerator;