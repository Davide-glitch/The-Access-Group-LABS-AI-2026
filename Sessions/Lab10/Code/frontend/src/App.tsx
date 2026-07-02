import { useState } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import ExistingQuizzes from './components/ExistingQuizzes';
import QuizBuilder from './components/QuizBuilder';
import QuizGenerator from './components/QuizGenerator';
import PlayQuiz from './components/PlayQuiz';
import ServerQuizDetail from './components/ServerQuizDetail';
import QuizCard from './components/QuizCard';
import AuthPage from './components/AuthPage';
import { loginRequest } from './auth/authConfig';
import type { ApiQuiz, Quiz } from './types/quiz';

// App owns the things the whole screen needs to agree on:
//   1. `quizzes` — the quizzes built in the browser. It lives here, not in
//      QuizBuilder, because both the builder (which adds to it) and the home
//      list need it. That's "lifting state up".
//   2. `view` — which screen we're on. A tiny hand-rolled router.
//   3. `serverQuiz` — the API quiz the user clicked "View" on, so the detail
//      screen can read it after we leave the home list.
//
// NEW for Lab 9 — `run` and `run-server` collapse into one `play` view.
// QuizBuilder's save() already POSTs every question (with options) to the
// API before calling onCreate, so a "local" quiz and a "server" quiz are the
// same row in the database by the time either one could be played — there's
// no separate offline runner to maintain anymore. PlayQuiz always fetches the
// no-peeking shape from `GET /quizzes/{id}/play`, whatever the quiz's origin.
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
  // Bumping this remounts <ExistingQuizzes>, which re-runs its fetch — that's
  // how the "On the server" list refreshes after we POST a new quiz.
  const [serverReloadKey, setServerReloadKey] = useState(0);

  // NEW for Lab 9 — real sign-in. `useMsal` reads the same cache `main.tsx`'s
  // MsalProvider owns; `useIsAuthenticated` is a one-line "is someone signed
  // in" boolean, no token involved. Neither line knows or cares what an
  // access token looks like — that's `getAccessToken`'s job, below.
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  // The bearer token for authorized write calls, fetched fresh right before
  // each one instead of being pasted once and stored. `acquireTokenSilent`
  // returns a cached token if one's still valid, and quietly renews it if
  // it's expired but the sign-in itself is still good — no popup, no
  // re-typing anything. It only throws `InteractionRequiredAuthError` when
  // MSAL genuinely needs the user's attention (first sign-in, revoked
  // consent, etc.), which is the one case worth falling back to a popup for.
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

  function addQuiz(quiz: Quiz) {
    setQuizzes((qs) => [...qs, quiz]);
    setView({ name: 'home' });
  }

  function refreshServerQuizzes() {
    setServerReloadKey((k) => k + 1);
  }

  function openServerQuiz(quiz: ApiQuiz) {
    setServerQuiz(quiz);
    setView({ name: 'view-server' });
  }

  // NEW for Lab 9 — the hard gate. Until MSAL reports an authenticated
  // account, the whole app is replaced by the dedicated AuthPage; there's no
  // "browse as a guest" path anymore. Once sign-in succeeds, isAuthenticated
  // flips and this early return stops firing, so the app below renders in its
  // place — that *is* the "navigate to the main page" step, no router needed.
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
          {/* Past the gate, the user is always signed in here — so this is
              just the signed-in status and a way back out. */}
          <span className="field-hint">Signed in as {accounts[0]?.username}</span>
          <button className="btn-ghost" onClick={() => instance.logoutPopup()}>
            Sign out
          </button>
        </div>
      </header>

      <main>
        {view.name === 'build' && (
          <>
            <h2 className="section-title">Create a quiz</h2>
            <QuizBuilder
              onCreate={addQuiz}
              onCancel={() => setView({ name: 'home' })}
              onSaved={refreshServerQuizzes}
              isAuthenticated={isAuthenticated}
              getToken={getAccessToken}
            />
          </>
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

        {view.name === 'home' && (
          <>
            <section>
              <div className="section-head">
                <h2 className="section-title">Your quizzes</h2>
                <div style={{ display: 'flex', gap: '.6rem' }}>
                  <button className="btn-secondary" onClick={() => setView({ name: 'generate' })}>
                    ✨ Generate from text
                  </button>
                  <button className="btn-primary" onClick={() => setView({ name: 'build' })}>
                    + New quiz
                  </button>
                </div>
              </div>
              {quizzes.length === 0 ? (
                <p className="status-message">
                  No quizzes yet — click <strong>New quiz</strong> to build one.
                </p>
              ) : (
                <div className="quiz-list">
                  {quizzes.map((quiz) => (
                    <QuizCard
                      key={quiz.id}
                      title={quiz.title}
                      subtitle={`${quiz.questions.length} question${
                        quiz.questions.length === 1 ? '' : 's'
                      }`}
                      action={
                        <button
                          className="btn-secondary"
                          onClick={() => setView({ name: 'play', quizId: quiz.id })}
                        >
                          Run
                        </button>
                      }
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="section-title">On the server</h2>
              <ExistingQuizzes key={serverReloadKey} onOpen={openServerQuiz} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
