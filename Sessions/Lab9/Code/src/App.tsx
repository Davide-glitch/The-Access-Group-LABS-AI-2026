import { useState } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import AuthPage from './components/AuthPage';
import ExistingQuizzes from './components/ExistingQuizzes';
import QuizBuilder from './components/QuizBuilder';
import ServerQuizDetail from './components/ServerQuizDetail';
import QuizGenerator from './components/QuizGenerator';
import PlayQuiz from './components/PlayQuiz';
import { loginRequest } from './auth/authConfig';
import type { Quiz, ApiQuiz } from './types/quiz';

type View =
  | { name: 'home' }
  | { name: 'build' }
  | { name: 'generate' }
  | { name: 'view-server' }
  | { name: 'play'; quizId: string };

function App() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [view, setView] = useState<View>({ name: 'home' });
  const [serverQuiz, setServerQuiz] = useState<ApiQuiz | null>(null);
  const [serverReloadKey, setServerReloadKey] = useState(0);

  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  async function getAccessToken(): Promise<string> {
    const account = accounts[0];
    if (!account) throw new Error('Sign in with Microsoft first.');
    try {
      const result = await instance.acquireTokenSilent({ ...loginRequest, account });
      return result.accessToken;
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        const result = await instance.acquireTokenPopup(loginRequest);
        return result.accessToken;
      }
      throw err;
    }
  }

  function refreshServerQuizzes() {
    setServerReloadKey((k) => k + 1);
  }

  function addQuiz(quiz: Quiz) {
    setQuizzes((qs) => [...qs, quiz]);
    setView({ name: 'home' });
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1 onClick={() => setView({ name: 'home' })} style={{ cursor: 'pointer' }}>
            QuizMaster
          </h1>
          <p>Fetch quizzes from the API, then build and run your own.</p>
        </div>
        <div className="auth-status">
          <span className="field-hint">Signed in as {accounts[0]?.username}</span>
          <button className="btn-ghost" onClick={() => instance.logoutPopup()}>
            Sign out
          </button>
        </div>
      </header>
      <main>
        {view.name === 'home' && (
          <>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem' }}>
              <button className="btn-primary" onClick={() => setView({ name: 'build' })}>
                + New quiz
              </button>
              <button className="btn-secondary" onClick={() => setView({ name: 'generate' })}>
                ✨ Generate from text
              </button>
            </div>
            <ExistingQuizzes
              key={serverReloadKey}
              onView={(q) => {
                setServerQuiz(q);
                setView({ name: 'view-server' });
              }}
            />
          </>
        )}

        {view.name === 'build' && (
          <QuizBuilder
            onCreate={addQuiz}
            onCancel={() => setView({ name: 'home' })}
            onSaved={refreshServerQuizzes}
            isAuthenticated={isAuthenticated}
            getToken={getAccessToken}
          />
        )}

        {view.name === 'generate' && (
          <>
            <h2 className="section-title">Generate a quiz from text</h2>
            <QuizGenerator
              isAuthenticated={isAuthenticated}
              getToken={getAccessToken}
              onGenerated={(quiz) => {
                refreshServerQuizzes();
                setView({ name: 'play', quizId: quiz.id });
              }}
              onCancel={() => setView({ name: 'home' })}
            />
          </>
        )}

        {view.name === 'view-server' && serverQuiz && (
          <ServerQuizDetail
            quiz={serverQuiz}
            onRun={() => setView({ name: 'play', quizId: serverQuiz.id })}
            onBack={() => setView({ name: 'home' })}
          />
        )}

        {view.name === 'play' && (
          <PlayQuiz
            quizId={view.quizId}
            onExit={() => setView(serverQuiz ? { name: 'view-server' } : { name: 'home' })}
          />
        )}
      </main>
    </div>
  );
}

export default App;