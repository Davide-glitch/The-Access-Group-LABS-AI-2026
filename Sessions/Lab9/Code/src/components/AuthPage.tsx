import { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../auth/authConfig';

function AuthPage() {
  const { instance } = useMsal();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setError(null);
    setSigningIn(true);
    try {
      await instance.loginPopup(loginRequest);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-brand">QuizMaster</h1>
        <p className="auth-tagline">Sign in to build, generate, and play quizzes.</p>
        <button className="btn-primary auth-signin" onClick={signIn} disabled={signingIn}>
          {signingIn ? 'Opening sign-in…' : 'Sign in with Microsoft'}
        </button>
        {error && <p className="status-message error">{error}</p>}
      </div>
    </div>
  );
}

export default AuthPage;