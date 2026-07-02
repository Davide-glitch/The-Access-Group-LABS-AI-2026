import { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../auth/authConfig';

type AuthPageProps = {
  // Optional message to surface why the user landed here (e.g. a failed
  // sign-in). The gate in App.tsx decides when to show this page; this
  // component only knows how to start a sign-in.
  message?: string | null;
};

// NEW for Lab 9 — the front door. Until MSAL reports an authenticated
// account, App renders this instead of QuizMaster: a dedicated screen whose
// single job is to start the Microsoft sign-in popup. Once the popup
// succeeds, `useIsAuthenticated` flips in App and this page is replaced by
// the app itself — there's no manual navigation here, the gate re-renders
// on its own.
//
// This component owns *only* the "is a popup in flight / did it error" UI
// state. It never touches a token: acquiring one is `getAccessToken`'s job
// in App, and it only runs for the authorized writes that actually need it.
function AuthPage({ message }: AuthPageProps) {
  const { instance } = useMsal();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setError(null);
    setSigningIn(true);
    try {
      await instance.loginPopup(loginRequest);
      // On success we don't navigate by hand — App's useIsAuthenticated
      // notices the new account and swaps this page out for the app.
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
        <p className="auth-tagline">
          Sign in to build, generate, and play quizzes.
        </p>

        <button className="btn-primary auth-signin" onClick={signIn} disabled={signingIn}>
          {signingIn ? 'Opening sign-in…' : 'Sign in with Microsoft'}
        </button>

        {message && <p className="field-hint auth-note">{message}</p>}
        {error && <p className="status-message error">{error}</p>}

        <p className="field-hint auth-note">
          We use your Microsoft account only to authorize the quizzes you
          create — nothing is posted on your behalf.
        </p>
      </div>
    </div>
  );
}

export default AuthPage;
